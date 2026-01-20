from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.user import User
from ...schemas.scene import SceneCreate, SceneResponse, SceneUpdate, SceneListResponse
from ...services.scene_service import SceneService

router = APIRouter(prefix="/scene", tags=["scenes"])


@router.post("/save", response_model=SceneResponse, status_code=status.HTTP_201_CREATED)
async def save_scene(
    scene_data: SceneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save a new scene."""
    scene = SceneService.create_scene(db, scene_data, current_user.id)
    return scene


@router.get("/load/{scene_id}", response_model=SceneResponse)
async def load_scene(
    scene_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Load a scene by ID."""
    scene = SceneService.get_scene(db, scene_id, current_user.id)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found"
        )
    return scene


@router.get("/list", response_model=List[SceneListResponse])
async def list_scenes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all scenes for the current user."""
    scenes = SceneService.get_scenes(db, current_user.id, skip, limit)
    return scenes


@router.put("/update/{scene_id}", response_model=SceneResponse)
async def update_scene(
    scene_id: int,
    scene_data: SceneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing scene."""
    scene = SceneService.update_scene(db, scene_id, current_user.id, scene_data)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found"
        )
    return scene


@router.delete("/delete/{scene_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scene(
    scene_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a scene."""
    success = SceneService.delete_scene(db, scene_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found"
        )
