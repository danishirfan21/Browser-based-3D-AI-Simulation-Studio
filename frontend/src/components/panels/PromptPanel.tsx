import { useState, useCallback, useRef, useEffect } from 'react';
import { useScene } from '../../context/SceneContext';
import { apiService } from '../../services/api';
import type { PromptHistoryEntry } from '../../types';

export function PromptPanel() {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const { state, dispatch, applyActions } = useScene();

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await apiService.parsePrompt({
        prompt: prompt.trim(),
        context: {
          objects: state.sceneData.objects,
        },
      });

      // Add to history
      const historyEntry: PromptHistoryEntry = {
        id: `prompt_${Date.now()}`,
        prompt: prompt.trim(),
        response,
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_PROMPT_HISTORY', payload: historyEntry });

      // Apply actions if successful
      if (response.success && response.actions.length > 0) {
        applyActions(response.actions);
      } else if (!response.success) {
        setError(response.message);
      }

      setPrompt('');
    } catch (err) {
      const errorMessage = apiService.constructor.name === 'ApiService'
        ? 'Failed to process prompt. Check if the backend is running.'
        : String(err);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [prompt, isSubmitting, state.sceneData.objects, dispatch, applyActions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-scroll history
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = 0;
    }
  }, [state.promptHistory.length]);

  // Example prompts
  const examplePrompts = [
    'Add a robotic arm next to the conveyor',
    'Rotate the robot arm 45 degrees',
    'Highlight safety zone in red',
    'Zoom camera to inspection area',
    'Add a blue box on the conveyor',
    'Scale the conveyor to 1.5',
  ];

  return (
    <div className="h-full flex flex-col bg-industrial-800 border-r border-industrial-700">
      {/* Header */}
      <div className="p-4 border-b border-industrial-700">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Prompt Input
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Describe what you want to do with the scene
        </p>
      </div>

      {/* Input area */}
      <div className="p-4 border-b border-industrial-700">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Add a robotic arm next to the conveyor..."
            className="w-full h-24 bg-industrial-900 border border-industrial-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary resize-none font-mono text-sm"
            disabled={isSubmitting}
          />
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isSubmitting}
            className="absolute bottom-3 right-3 bg-accent-primary hover:bg-accent-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Execute
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Example prompts */}
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.slice(0, 3).map((example, i) => (
              <button
                key={i}
                onClick={() => setPrompt(example)}
                className="text-xs bg-industrial-700 hover:bg-industrial-600 text-gray-300 px-2 py-1 rounded transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt history */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-industrial-700">
          <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History ({state.promptHistory.length})
          </h3>
        </div>

        <div ref={historyRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {state.promptHistory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No prompts yet. Try typing a command above!
            </p>
          ) : (
            state.promptHistory.map((entry) => (
              <div
                key={entry.id}
                className="bg-industrial-900 rounded-lg p-3 border border-industrial-700"
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      entry.response.success ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-mono break-words">
                      {entry.prompt}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {entry.response.message}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {entry.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
