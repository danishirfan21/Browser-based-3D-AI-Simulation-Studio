import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type {
  SceneObject,
  SceneData,
  CameraState,
  LightingConfig,
  EnvironmentConfig,
  SceneAction,
  PromptHistoryEntry,
  Vector3,
} from '../types';

// Default scene configuration
const defaultCamera: CameraState = {
  position: { x: 15, y: 12, z: 15 },
  target: { x: 0, y: 1, z: 0 },
  zoom: 1,
};

const defaultLighting: LightingConfig = {
  ambient_intensity: 0.4,
  directional_intensity: 0.8,
  directional_position: { x: 10, y: 20, z: 10 },
};

const defaultEnvironment: EnvironmentConfig = {
  grid_visible: true,
  grid_size: 50,
  background_color: '#1a1a2e',
};

// Initial scene with default industrial elements
const createInitialScene = (): SceneData => ({
  objects: [
    {
      id: 'conveyor_1',
      type: 'conveyor',
      name: 'Main Conveyor Belt',
      position: { x: 0, y: 0.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#4a5568',
      visible: true,
    },
    {
      id: 'robot_arm_1',
      type: 'robot_arm',
      name: 'Industrial Robot Arm',
      position: { x: -5, y: 0, z: 0 },
      rotation: { x: 0, y: 45, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#f59e0b',
      visible: true,
    },
  ],
  camera: defaultCamera,
  lighting: defaultLighting,
  environment: defaultEnvironment,
});

// State interface
interface SceneState {
  sceneData: SceneData;
  selectedObjectId: string | null;
  promptHistory: PromptHistoryEntry[];
  isLoading: boolean;
  cameraTransition: {
    active: boolean;
    targetPosition?: Vector3;
    targetLookAt?: Vector3;
  };
}

// Action types
type SceneContextAction =
  | { type: 'SET_SCENE_DATA'; payload: SceneData }
  | { type: 'ADD_OBJECT'; payload: SceneObject }
  | { type: 'REMOVE_OBJECT'; payload: string }
  | { type: 'UPDATE_OBJECT'; payload: { id: string; updates: Partial<SceneObject> } }
  | { type: 'SELECT_OBJECT'; payload: string | null }
  | { type: 'SET_CAMERA'; payload: Partial<CameraState> }
  | { type: 'SET_LIGHTING'; payload: Partial<LightingConfig> }
  | { type: 'SET_ENVIRONMENT'; payload: Partial<EnvironmentConfig> }
  | { type: 'ADD_PROMPT_HISTORY'; payload: PromptHistoryEntry }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CAMERA_TRANSITION'; payload: SceneState['cameraTransition'] }
  | { type: 'RESET_SCENE'; payload?: { keepDefaults: boolean } };

// Reducer
function sceneReducer(state: SceneState, action: SceneContextAction): SceneState {
  switch (action.type) {
    case 'SET_SCENE_DATA':
      return { ...state, sceneData: action.payload };

    case 'ADD_OBJECT':
      return {
        ...state,
        sceneData: {
          ...state.sceneData,
          objects: [...state.sceneData.objects, action.payload],
        },
      };

    case 'REMOVE_OBJECT':
      return {
        ...state,
        sceneData: {
          ...state.sceneData,
          objects: state.sceneData.objects.filter((obj) => obj.id !== action.payload),
        },
        selectedObjectId:
          state.selectedObjectId === action.payload ? null : state.selectedObjectId,
      };

    case 'UPDATE_OBJECT':
      return {
        ...state,
        sceneData: {
          ...state.sceneData,
          objects: state.sceneData.objects.map((obj) =>
            obj.id === action.payload.id ? { ...obj, ...action.payload.updates } : obj
          ),
        },
      };

    case 'SELECT_OBJECT':
      return { ...state, selectedObjectId: action.payload };

    case 'SET_CAMERA':
      return {
        ...state,
        sceneData: {
          ...state.sceneData,
          camera: { ...state.sceneData.camera, ...action.payload },
        },
      };

    case 'SET_LIGHTING':
      return {
        ...state,
        sceneData: {
          ...state.sceneData,
          lighting: { ...state.sceneData.lighting, ...action.payload },
        },
      };

    case 'SET_ENVIRONMENT':
      return {
        ...state,
        sceneData: {
          ...state.sceneData,
          environment: { ...state.sceneData.environment, ...action.payload },
        },
      };

    case 'ADD_PROMPT_HISTORY':
      return {
        ...state,
        promptHistory: [action.payload, ...state.promptHistory].slice(0, 50),
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_CAMERA_TRANSITION':
      return { ...state, cameraTransition: action.payload };

    case 'RESET_SCENE':
      return {
        ...state,
        sceneData: action.payload?.keepDefaults
          ? createInitialScene()
          : {
              objects: [],
              camera: defaultCamera,
              lighting: defaultLighting,
              environment: defaultEnvironment,
            },
        selectedObjectId: null,
      };

    default:
      return state;
  }
}

// Context interface
interface SceneContextValue {
  state: SceneState;
  dispatch: React.Dispatch<SceneContextAction>;
  applyAction: (action: SceneAction) => void;
  applyActions: (actions: SceneAction[]) => void;
}

// Create context
const SceneContext = createContext<SceneContextValue | null>(null);

// Provider component
export function SceneProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sceneReducer, {
    sceneData: createInitialScene(),
    selectedObjectId: null,
    promptHistory: [],
    isLoading: false,
    cameraTransition: { active: false },
  });

  // Apply a single action to the scene
  const applyAction = useCallback(
    (action: SceneAction) => {
      const { action: actionType, target, params } = action;

      switch (actionType) {
        case 'add_object': {
          const newObject: SceneObject = {
            id: target || `obj_${Date.now()}`,
            type: (params.type as SceneObject['type']) || 'box',
            name: (params.name as string) || 'New Object',
            position: (params.position as Vector3) || { x: 0, y: 0, z: 0 },
            rotation: (params.rotation as Vector3) || { x: 0, y: 0, z: 0 },
            scale: (params.scale as Vector3) || { x: 1, y: 1, z: 1 },
            color: (params.color as string) || '#888888',
            visible: true,
          };
          dispatch({ type: 'ADD_OBJECT', payload: newObject });
          break;
        }

        case 'remove_object':
          if (target) {
            dispatch({ type: 'REMOVE_OBJECT', payload: target });
          }
          break;

        case 'move_object':
          if (target) {
            const absolute = params.absolute as boolean;

            if (absolute) {
              dispatch({
                type: 'UPDATE_OBJECT',
                payload: {
                  id: target,
                  updates: { position: params.position as Vector3 },
                },
              });
            } else {
              const targetObj = state.sceneData.objects.find((obj) => obj.id === target);

              if (targetObj) {
                const delta = params.delta as Vector3;
                dispatch({
                  type: 'UPDATE_OBJECT',
                  payload: {
                    id: target,
                    updates: {
                      position: {
                        x: targetObj.position.x + (delta.x || 0),
                        y: targetObj.position.y + (delta.y || 0),
                        z: targetObj.position.z + (delta.z || 0),
                      },
                    },
                  },
                });
              }
            }
          }
          break;

        case 'rotate_object':
          if (target) {
            const axis = params.axis as string;
            const degrees = params.degrees as number;

            const targetObj = state.sceneData.objects.find((obj) => obj.id === target);

            if (targetObj) {
              dispatch({
                type: 'UPDATE_OBJECT',
                payload: {
                  id: target,
                  updates: {
                    rotation: {
                      x:
                        axis === 'x'
                          ? targetObj.rotation.x + degrees
                          : targetObj.rotation.x,
                      y:
                        axis === 'y'
                          ? targetObj.rotation.y + degrees
                          : targetObj.rotation.y,
                      z:
                        axis === 'z'
                          ? targetObj.rotation.z + degrees
                          : targetObj.rotation.z,
                    },
                  },
                },
              });
            }
          }
          break;

        case 'scale_object':
          if (target) {
            const factor = params.factor as number;
            dispatch({
              type: 'UPDATE_OBJECT',
              payload: {
                id: target,
                updates: {
                  scale: { x: factor, y: factor, z: factor },
                },
              },
            });
          }
          break;

        case 'set_color':
          if (target) {
            dispatch({
              type: 'UPDATE_OBJECT',
              payload: {
                id: target,
                updates: { color: params.color as string },
              },
            });
          }
          break;

        case 'set_visibility':
          if (target) {
            dispatch({
              type: 'UPDATE_OBJECT',
              payload: {
                id: target,
                updates: { visible: params.visible as boolean },
              },
            });
          }
          break;

        case 'highlight_object':
          if (target) {
            dispatch({
              type: 'UPDATE_OBJECT',
              payload: {
                id: target,
                updates: { highlighted: true },
              },
            });
            // Auto-remove highlight after duration
            const duration = (params.duration as number) || 3000;
            setTimeout(() => {
              dispatch({
                type: 'UPDATE_OBJECT',
                payload: {
                  id: target,
                  updates: { highlighted: false },
                },
              });
            }, duration);
          }
          break;

        case 'camera_focus':
        case 'camera_move':
          dispatch({
            type: 'SET_CAMERA_TRANSITION',
            payload: {
              active: true,
              targetPosition: params.position as Vector3,
              targetLookAt: params.target as Vector3,
            },
          });
          break;

        case 'camera_zoom': {
          const direction = params.direction as string;
          const amount = (params.amount as number) || 0.5;
          const zoomMultiplier = direction === 'in' ? 1 + amount : 1 / (1 + amount);
          dispatch({
            type: 'SET_CAMERA',
            payload: { zoom: zoomMultiplier },
          });
          break;
        }

        case 'add_safety_zone': {
          const safetyZone: SceneObject = {
            id: target || `safety_zone_${Date.now()}`,
            type: 'safety_zone',
            name: 'Safety Zone',
            position: (params.position as Vector3) || { x: 0, y: 0.05, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: (params.size as Vector3) || { x: 5, y: 0.1, z: 5 },
            color: (params.color as string) || '#ff4444',
            visible: true,
          };
          dispatch({ type: 'ADD_OBJECT', payload: safetyZone });
          break;
        }

        case 'animate_object':
          if (target) {
            dispatch({
              type: 'UPDATE_OBJECT',
              payload: {
                id: target,
                updates: { animating: params.animate as boolean },
              },
            });
          }
          break;

        case 'reset_scene':
          dispatch({
            type: 'RESET_SCENE',
            payload: { keepDefaults: params.keep_defaults as boolean },
          });
          break;

        case 'set_lighting':
          dispatch({
            type: 'SET_LIGHTING',
            payload: params as Partial<LightingConfig>,
          });
          break;

        default:
          console.warn(`Unknown action type: ${actionType}`);
      }
    },
    [dispatch, state.sceneData.objects]
  );

  // Apply multiple actions
  const applyActions = useCallback(
    (actions: SceneAction[]) => {
      actions.forEach(applyAction);
    },
    [applyAction]
  );

  return (
    <SceneContext.Provider value={{ state, dispatch, applyAction, applyActions }}>
      {children}
    </SceneContext.Provider>
  );
}

// Hook to use scene context
export function useScene() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within a SceneProvider');
  }
  return context;
}
