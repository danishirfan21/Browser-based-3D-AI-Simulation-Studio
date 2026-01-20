import { useScene } from '../../context/SceneContext';
import type { SceneObject, Vector3 } from '../../types';

interface Vector3InputProps {
  label: string;
  value: Vector3;
  onChange: (value: Vector3) => void;
  step?: number;
}

function Vector3Input({ label, value, onChange, step = 0.1 }: Vector3InputProps) {
  const handleChange = (axis: 'x' | 'y' | 'z', newValue: string) => {
    const numValue = parseFloat(newValue) || 0;
    onChange({ ...value, [axis]: numValue });
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-400 uppercase tracking-wide">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis} className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 uppercase">
              {axis}
            </span>
            <input
              type="number"
              value={value[axis]}
              onChange={(e) => handleChange(axis, e.target.value)}
              step={step}
              className="w-full bg-industrial-900 border border-industrial-600 rounded px-2 py-1.5 pl-6 text-white text-sm font-mono focus:outline-none focus:border-accent-primary"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-400 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-industrial-900 border border-industrial-600 rounded px-3 py-1.5 text-white text-sm font-mono focus:outline-none focus:border-accent-primary"
        />
      </div>
    </div>
  );
}

export function InspectorPanel() {
  const { state, dispatch } = useScene();

  const selectedObject = state.selectedObjectId
    ? state.sceneData.objects.find((obj) => obj.id === state.selectedObjectId)
    : null;

  const updateObject = (updates: Partial<SceneObject>) => {
    if (!state.selectedObjectId) return;
    dispatch({
      type: 'UPDATE_OBJECT',
      payload: { id: state.selectedObjectId, updates },
    });
  };

  const deleteObject = () => {
    if (!state.selectedObjectId) return;
    dispatch({ type: 'REMOVE_OBJECT', payload: state.selectedObjectId });
  };

  const duplicateObject = () => {
    if (!selectedObject) return;
    const newObject: SceneObject = {
      ...selectedObject,
      id: `${selectedObject.type}_${Date.now()}`,
      name: `${selectedObject.name} (Copy)`,
      position: {
        x: selectedObject.position.x + 2,
        y: selectedObject.position.y,
        z: selectedObject.position.z,
      },
    };
    dispatch({ type: 'ADD_OBJECT', payload: newObject });
  };

  return (
    <div className="h-full flex flex-col bg-industrial-800 border-l border-industrial-700">
      {/* Header */}
      <div className="p-4 border-b border-industrial-700">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Inspector
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {selectedObject ? 'Edit selected object' : 'Select an object to inspect'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedObject ? (
          <div className="p-4 space-y-6">
            {/* Object info */}
            <div className="bg-industrial-900 rounded-lg p-4 border border-industrial-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Object</span>
                <span className="text-xs bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded">
                  {selectedObject.type.replace('_', ' ')}
                </span>
              </div>
              <input
                type="text"
                value={selectedObject.name}
                onChange={(e) => updateObject({ name: e.target.value })}
                className="w-full bg-industrial-800 border border-industrial-600 rounded px-3 py-2 text-white font-medium focus:outline-none focus:border-accent-primary"
              />
              <p className="text-xs text-gray-500 mt-2 font-mono">{selectedObject.id}</p>
            </div>

            {/* Transform */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Transform
              </h3>

              <Vector3Input
                label="Position"
                value={selectedObject.position}
                onChange={(position) => updateObject({ position })}
              />

              <Vector3Input
                label="Rotation (degrees)"
                value={selectedObject.rotation}
                onChange={(rotation) => updateObject({ rotation })}
                step={5}
              />

              <Vector3Input
                label="Scale"
                value={selectedObject.scale}
                onChange={(scale) => updateObject({ scale })}
              />
            </div>

            {/* Appearance */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Appearance
              </h3>

              <ColorInput
                label="Color"
                value={selectedObject.color}
                onChange={(color) => updateObject({ color })}
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Visible</span>
                <button
                  onClick={() => updateObject({ visible: !selectedObject.visible })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    selectedObject.visible ? 'bg-accent-primary' : 'bg-industrial-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      selectedObject.visible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Animating</span>
                <button
                  onClick={() => updateObject({ animating: !selectedObject.animating })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    selectedObject.animating ? 'bg-accent-success' : 'bg-industrial-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      selectedObject.animating ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-industrial-700">
              <button
                onClick={duplicateObject}
                className="w-full bg-industrial-700 hover:bg-industrial-600 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplicate
              </button>

              <button
                onClick={deleteObject}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {/* Scene objects list */}
            <h3 className="text-sm font-medium text-gray-300 mb-3">Scene Objects</h3>
            <div className="space-y-2">
              {state.sceneData.objects.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  No objects in scene
                </p>
              ) : (
                state.sceneData.objects.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => dispatch({ type: 'SELECT_OBJECT', payload: obj.id })}
                    className="w-full bg-industrial-900 hover:bg-industrial-700 border border-industrial-700 rounded-lg p-3 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: obj.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {obj.name}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {obj.type.replace('_', ' ')}
                        </p>
                      </div>
                      {!obj.visible && (
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
