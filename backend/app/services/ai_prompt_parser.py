import json
import logging
from typing import List, Dict, Any, Optional
import httpx

from ..core.config import settings
from ..schemas.action import SceneAction, ActionType, ObjectType

logger = logging.getLogger(__name__)

class AIPromptParser:
    """
    AI-powered prompt parser that uses an LLM to convert natural language
    into structured scene actions, taking the current scene context into account.
    """

    SYSTEM_PROMPT = """
You are an expert assistant for a 3D Industrial Simulation Studio.
Your task is to convert user natural language prompts into a list of structured JSON actions that modify the 3D scene.

AVAILABLE ACTIONS:
- add_object: Add a new object. Params: {type, name, position, rotation, scale, color}
- remove_object: Remove an object by ID.
- move_object: Move an object. Params: {position, delta, absolute: bool}
- rotate_object: Rotate an object. Params: {axis, degrees}
- scale_object: Scale an object. Params: {factor}
- set_color: Change object color. Params: {color}
- set_visibility: Show/hide object. Params: {visible: bool}
- highlight_object: Highlight an object. Params: {color, duration}
- camera_focus: Focus camera on an object or area. Params: {position, target}
- add_safety_zone: Add a safety zone. Params: {position, color, size}
- animate_object: Start/stop animation. Params: {animate: bool}
- reset_scene: Reset the scene. Params: {keep_defaults: bool}

OBJECT TYPES:
conveyor, robot_arm, box, safety_zone, cylinder, sphere, custom

OUTPUT FORMAT:
Return ONLY a JSON list of actions. Each action must follow this structure:
{
    "action": "action_type",
    "target": "object_id_or_none",
    "params": { ... }
}

CONTEXT:
You will be provided with the current scene objects and their properties. Use this to identify target objects by name, type, or position.
If the user wants to add an object, generate a unique ID based on the type (e.g., 'robot_arm_3').
If the user's intent is ambiguous, try your best to infer the most logical action based on the context.
"""

    async def parse(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> List[SceneAction]:
        """
        Parse a natural language prompt using an LLM.
        """
        if not settings.AI_API_KEY:
            logger.warning("AI_API_KEY not configured, AI parser cannot be used.")
            return []

        # Prepare context description
        context_str = "Current Scene Objects:\n"
        if context and "objects" in context:
            for obj in context["objects"]:
                context_str += f"- ID: {obj['id']}, Type: {obj['type']}, Name: {obj.get('name')}, Position: {obj['position']}, Color: {obj.get('color')}\n"
        else:
            context_str += "No objects in scene.\n"

        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": f"Context:\n{context_str}\n\nPrompt: {prompt}"}
        ]

        payload = {
            "model": settings.AI_MODEL_NAME,
            "messages": messages,
            "response_format": {"type": "json_object"} if "gpt-4" in settings.AI_MODEL_NAME else None,
            "temperature": 0.2
        }

        headers = {
            "Authorization": f"Bearer {settings.AI_API_KEY}",
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    settings.AI_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()

                content = result['choices'][0]['message']['content']
                # Try to parse the content as JSON
                try:
                    data = json.loads(content)
                    # If the LLM returned a dict with an 'actions' key, use that
                    if isinstance(data, dict) and 'actions' in data:
                        actions_data = data['actions']
                    elif isinstance(data, list):
                        actions_data = data
                    else:
                        # Maybe it returned a single action object
                        actions_data = [data]

                    actions = []
                    for action_dict in actions_data:
                        try:
                            actions.append(SceneAction(**action_dict))
                        except Exception as e:
                            logger.error(f"Error validating action: {e}. Action data: {action_dict}")

                    return actions
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse LLM response as JSON: {content}")
                    return []

        except Exception as e:
            logger.error(f"Error calling AI API: {str(e)}")
            return []
