from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.user import User
from ...schemas.action import PromptRequest, ActionResponse
from ...services.prompt_parser import PromptParser

router = APIRouter(prefix="/prompt", tags=["prompts"])

# Initialize the prompt parser
prompt_parser = PromptParser()


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

        return ActionResponse(
            success=True,
            actions=actions,
            message=f"Parsed {len(actions)} action(s): {', '.join(action_descriptions)}",
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

        return ActionResponse(
            success=True,
            actions=actions,
            message=f"Parsed {len(actions)} action(s): {', '.join(action_descriptions)}",
            original_prompt=request.prompt
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing prompt: {str(e)}"
        )
