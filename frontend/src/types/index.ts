// Vector types
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Scene object types
export type ObjectType =
  | 'conveyor'
  | 'robot_arm'
  | 'box'
  | 'safety_zone'
  | 'cylinder'
  | 'sphere'
  | 'custom';

export interface SceneObject {
  id: string;
  type: ObjectType;
  name: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  color: string;
  material?: string;
  properties?: Record<string, unknown>;
  visible: boolean;
  highlighted?: boolean;
  animating?: boolean;
}

// Camera state
export interface CameraState {
  position: Vector3;
  target: Vector3;
  zoom: number;
}

// Lighting configuration
export interface LightingConfig {
  ambient_intensity: number;
  directional_intensity: number;
  directional_position: Vector3;
}

// Environment settings
export interface EnvironmentConfig {
  grid_visible: boolean;
  grid_size: number;
  background_color: string;
}

// Complete scene data
export interface SceneData {
  objects: SceneObject[];
  camera: CameraState;
  lighting: LightingConfig;
  environment: EnvironmentConfig;
}

// Action types for prompt parsing
export type ActionType =
  | 'add_object'
  | 'remove_object'
  | 'move_object'
  | 'rotate_object'
  | 'scale_object'
  | 'set_color'
  | 'set_visibility'
  | 'set_property'
  | 'camera_move'
  | 'camera_zoom'
  | 'camera_focus'
  | 'add_safety_zone'
  | 'set_lighting'
  | 'highlight_object'
  | 'animate_object'
  | 'reset_scene';

export interface SceneAction {
  action: ActionType;
  target: string | null;
  params: Record<string, unknown>;
}

// API response types
export interface ActionResponse {
  success: boolean;
  actions: SceneAction[];
  message: string;
  original_prompt: string;
}

export interface PromptRequest {
  prompt: string;
  context?: {
    objects: SceneObject[];
  };
}

// Prompt history entry
export interface PromptHistoryEntry {
  id: string;
  prompt: string;
  response: ActionResponse;
  timestamp: Date;
}

// User types
export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

// Scene save/load types
export interface SavedScene {
  id: number;
  name: string;
  description: string | null;
  scene_data: SceneData;
  owner_id: number;
  created_at: string;
  updated_at: string | null;
}

export interface SavedSceneListItem {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}
