from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class Vector3(BaseModel):
    x: float
    y: float
    z: float


class SceneObject(BaseModel):
    id: str
    type: str  # 'conveyor', 'robot_arm', 'box', 'safety_zone', 'custom'
    name: str
    position: Vector3
    rotation: Vector3
    scale: Vector3
    color: Optional[str] = "#888888"
    material: Optional[str] = "standard"
    properties: Optional[Dict[str, Any]] = {}
    visible: bool = True


class CameraState(BaseModel):
    position: Vector3
    target: Vector3
    zoom: float = 1.0


class LightingConfig(BaseModel):
    ambient_intensity: float = 0.4
    directional_intensity: float = 0.8
    directional_position: Vector3 = Vector3(x=10, y=20, z=10)


class SceneData(BaseModel):
    objects: List[SceneObject]
    camera: CameraState
    lighting: LightingConfig
    environment: Dict[str, Any] = {
        "grid_visible": True,
        "grid_size": 50,
        "background_color": "#1a1a2e"
    }


class SceneCreate(BaseModel):
    name: str
    description: Optional[str] = None
    scene_data: SceneData


class SceneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    scene_data: Optional[SceneData] = None


class SceneResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    scene_data: Dict[str, Any]
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SceneListResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
