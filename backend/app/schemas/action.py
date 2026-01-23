from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Literal
from enum import Enum


class ActionType(str, Enum):
    ADD_OBJECT = "add_object"
    REMOVE_OBJECT = "remove_object"
    MOVE_OBJECT = "move_object"
    ROTATE_OBJECT = "rotate_object"
    SCALE_OBJECT = "scale_object"
    SET_COLOR = "set_color"
    SET_VISIBILITY = "set_visibility"
    SET_PROPERTY = "set_property"
    CAMERA_MOVE = "camera_move"
    CAMERA_ZOOM = "camera_zoom"
    CAMERA_FOCUS = "camera_focus"
    ADD_SAFETY_ZONE = "add_safety_zone"
    SET_LIGHTING = "set_lighting"
    HIGHLIGHT_OBJECT = "highlight_object"
    ANIMATE_OBJECT = "animate_object"
    RESET_SCENE = "reset_scene"


class ObjectType(str, Enum):
    CONVEYOR = "conveyor"
    ROBOT_ARM = "robot_arm"
    BOX = "box"
    SAFETY_ZONE = "safety_zone"
    CYLINDER = "cylinder"
    SPHERE = "sphere"
    CUSTOM = "custom"


class SceneAction(BaseModel):
    action: ActionType
    target: Optional[str] = None  # Object ID or 'camera' or 'scene'
    params: Dict[str, Any] = {}


class PromptRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None  # Current scene state for context
    use_ai: bool = False


class ActionResponse(BaseModel):
    success: bool
    actions: List[SceneAction]
    message: str
    original_prompt: str
