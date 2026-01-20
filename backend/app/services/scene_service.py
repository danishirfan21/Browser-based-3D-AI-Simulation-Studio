from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.scene import Scene
from ..schemas.scene import SceneCreate, SceneUpdate


class SceneService:
    """Service for managing scene persistence."""

    @staticmethod
    def create_scene(db: Session, scene_data: SceneCreate, user_id: int) -> Scene:
        """Create a new scene."""
        db_scene = Scene(
            name=scene_data.name,
            description=scene_data.description,
            scene_data=scene_data.scene_data.model_dump(),
            owner_id=user_id
        )
        db.add(db_scene)
        db.commit()
        db.refresh(db_scene)
        return db_scene

    @staticmethod
    def get_scene(db: Session, scene_id: int, user_id: int) -> Optional[Scene]:
        """Get a scene by ID."""
        return db.query(Scene).filter(
            Scene.id == scene_id,
            Scene.owner_id == user_id
        ).first()

    @staticmethod
    def get_scenes(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Scene]:
        """Get all scenes for a user."""
        return db.query(Scene).filter(
            Scene.owner_id == user_id
        ).offset(skip).limit(limit).all()

    @staticmethod
    def update_scene(db: Session, scene_id: int, user_id: int, scene_data: SceneUpdate) -> Optional[Scene]:
        """Update a scene."""
        db_scene = SceneService.get_scene(db, scene_id, user_id)
        if not db_scene:
            return None

        update_data = scene_data.model_dump(exclude_unset=True)
        if "scene_data" in update_data and update_data["scene_data"]:
            update_data["scene_data"] = update_data["scene_data"]

        for field, value in update_data.items():
            setattr(db_scene, field, value)

        db.commit()
        db.refresh(db_scene)
        return db_scene

    @staticmethod
    def delete_scene(db: Session, scene_id: int, user_id: int) -> bool:
        """Delete a scene."""
        db_scene = SceneService.get_scene(db, scene_id, user_id)
        if not db_scene:
            return False

        db.delete(db_scene)
        db.commit()
        return True
