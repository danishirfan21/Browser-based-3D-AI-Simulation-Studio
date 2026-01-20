import { useRef } from 'react';
import { useScene } from '../../context/SceneContext';
import { useThreeScene } from '../../hooks/useThreeScene';

export function SceneCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, dispatch } = useScene();

  const handleObjectSelect = (objectId: string | null) => {
    dispatch({ type: 'SELECT_OBJECT', payload: objectId });
  };

  useThreeScene(containerRef, {
    onObjectSelect: handleObjectSelect,
    sceneData: state.sceneData,
    cameraTransition: state.cameraTransition,
  });

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-industrial-900 relative"
      style={{ minHeight: '100%' }}
    >
      {/* Loading overlay */}
      {state.isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm">Processing...</span>
          </div>
        </div>
      )}

      {/* Scene info overlay */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-300">
        <div className="flex items-center gap-4">
          <span>Objects: {state.sceneData.objects.length}</span>
          <span className="text-gray-500">|</span>
          <span>Click to select</span>
          <span className="text-gray-500">|</span>
          <span>Drag to orbit</span>
        </div>
      </div>

      {/* Selected object indicator */}
      {state.selectedObjectId && (
        <div className="absolute top-4 left-4 bg-accent-primary/20 border border-accent-primary rounded-lg px-3 py-2 text-sm text-accent-primary">
          Selected: {state.sceneData.objects.find(o => o.id === state.selectedObjectId)?.name || state.selectedObjectId}
        </div>
      )}
    </div>
  );
}
