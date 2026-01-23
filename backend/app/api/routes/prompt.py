from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.security import get_current_user
from ...core.config import settings
from ...models.user import User
from ...schemas.action import PromptRequest, ActionResponse
from ...services.prompt_parser import PromptParser
from ...services.ai_prompt_parser import AIPromptParser

router = APIRouter(prefix="/prompt", tags=["prompts"])

# Initialize the prompt parsers
prompt_parser = PromptParser()
ai_prompt_parser = AIPromptParser()


@router.post("", response_model=ActionResponse)
async def parse_prompt(
    request: PromptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Parse a natural language prompt and return structured scene actions.

    Examples:
    - "Add a robotic arm next to the conveyor"
    - "Rotate the arm 30 degrees"
    - "Highlight safety zone in red"
    - "Zoom camera to inspection area"
    """
    try:
        actions = []
        used_ai = False

        # Try AI parser if configured
        if settings.AI_API_KEY:
            actions = await ai_prompt_parser.parse(request.prompt, request.context)
            if actions:
                used_ai = True

        # Fallback to rule-based parser if AI didn't return actions or isn't configured
        if not actions:
            actions = prompt_parser.parse(request.prompt, request.context)

        if not actions:
            return ActionResponse(
                success=False,
                actions=[],
                message="Could not understand the prompt. Try commands like 'add robot arm', 'rotate conveyor 45 degrees', or 'zoom to inspection area'.",
                original_prompt=request.prompt
            )

        action_descriptions = []
        for action in actions:
            desc = f"{action.action.value}"
            if action.target:
                desc += f" on {action.target}"
            action_descriptions.append(desc)

        message = f"Parsed {len(actions)} action(s): {', '.join(action_descriptions)}"
        if used_ai:
            message += " (AI-powered)"

        return ActionResponse(
            success=True,
            actions=actions,
            message=message,
            original_prompt=request.prompt
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing prompt: {str(e)}"
        )


@router.post("/demo", response_model=ActionResponse)
async def parse_prompt_demo(request: PromptRequest):
    """
    Demo endpoint for parsing prompts without authentication.
    Useful for testing and development.
    """
    try:
        actions = []
        used_ai = False

        # Try AI parser if configured
        if settings.AI_API_KEY:
            actions = await ai_prompt_parser.parse(request.prompt, request.context)
            if actions:
                used_ai = True

        # Fallback to rule-based parser
        if not actions:
            actions = prompt_parser.parse(request.prompt, request.context)

        if not actions:
            return ActionResponse(
                success=False,
                actions=[],
                message="Could not understand the prompt. Try commands like 'add robot arm', 'rotate conveyor 45 degrees', or 'zoom to inspection area'.",
                original_prompt=request.prompt
            )

        action_descriptions = []
        for action in actions:
            desc = f"{action.action.value}"
            if action.target:
                desc += f" on {action.target}"
            action_descriptions.append(desc)

        message = f"Parsed {len(actions)} action(s): {', '.join(action_descriptions)}"
        if used_ai:
            message += " (AI-powered)"

        return ActionResponse(
            success=True,
            actions=actions,
            message=message,
            original_prompt=request.prompt
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing prompt: {str(e)}"
        )
