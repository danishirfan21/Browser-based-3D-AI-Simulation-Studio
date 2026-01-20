import { useState } from 'react';
import { useScene } from '../../context/SceneContext';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import type { SavedSceneListItem } from '../../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-industrial-800 rounded-xl border border-industrial-700 shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-industrial-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Toolbar() {
  const { state, dispatch } = useScene();
  const { user, isAuthenticated, logout } = useAuth();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [sceneName, setSceneName] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [savedScenes, setSavedScenes] = useState<SavedSceneListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const { login, register } = useAuth();

  const handleSave = async () => {
    if (!sceneName.trim()) {
      setError('Please enter a scene name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiService.saveScene(sceneName, state.sceneData, sceneDescription);
      setShowSaveModal(false);
      setSceneName('');
      setSceneDescription('');
    } catch (err) {
      setError(apiService.constructor.name === 'ApiService' ? 'Failed to save scene' : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (sceneId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const scene = await apiService.loadScene(sceneId);
      dispatch({ type: 'SET_SCENE_DATA', payload: scene.scene_data });
      setShowLoadModal(false);
    } catch (err) {
      setError(apiService.constructor.name === 'ApiService' ? 'Failed to load scene' : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const openLoadModal = async () => {
    setShowLoadModal(true);
    setIsLoading(true);
    setError(null);

    try {
      const scenes = await apiService.listScenes();
      setSavedScenes(scenes);
    } catch (err) {
      setError(apiService.constructor.name === 'ApiService' ? 'Failed to fetch scenes' : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (authMode === 'login') {
        await login(authUsername, authPassword);
      } else {
        await register(authEmail, authUsername, authPassword);
      }
      setShowAuthModal(false);
      setAuthUsername('');
      setAuthEmail('');
      setAuthPassword('');
    } catch (err) {
      setError(apiService.constructor.name === 'ApiService' ? 'Authentication failed' : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetScene = () => {
    dispatch({ type: 'RESET_SCENE', payload: { keepDefaults: true } });
  };

  const handleExportScene = () => {
    const dataStr = JSON.stringify(state.sceneData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="h-14 bg-industrial-900 border-b border-industrial-700 flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">3D Industrial Simulation</h1>
            <p className="text-gray-500 text-xs">Prompt-Driven Studio</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Reset Scene */}
          <button
            onClick={handleResetScene}
            className="bg-industrial-800 hover:bg-industrial-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>

          {/* Export */}
          <button
            onClick={handleExportScene}
            className="bg-industrial-800 hover:bg-industrial-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>

          {isAuthenticated ? (
            <>
              {/* Save */}
              <button
                onClick={() => setShowSaveModal(true)}
                className="bg-accent-primary hover:bg-accent-primary/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save
              </button>

              {/* Load */}
              <button
                onClick={openLoadModal}
                className="bg-industrial-800 hover:bg-industrial-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Load
              </button>

              {/* User menu */}
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-industrial-700">
                <span className="text-gray-400 text-sm">{user?.username}</span>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-accent-primary hover:bg-accent-primary/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Save Modal */}
      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} title="Save Scene">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Scene Name</label>
            <input
              type="text"
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              placeholder="My Industrial Scene"
              className="w-full bg-industrial-900 border border-industrial-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Description (optional)</label>
            <textarea
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              placeholder="Describe your scene..."
              rows={3}
              className="w-full bg-industrial-900 border border-industrial-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary resize-none"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-accent-primary hover:bg-accent-primary/80 disabled:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Scene'}
          </button>
        </div>
      </Modal>

      {/* Load Modal */}
      <Modal isOpen={showLoadModal} onClose={() => setShowLoadModal(false)} title="Load Scene">
        <div className="space-y-4">
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : savedScenes.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No saved scenes found</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {savedScenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => handleLoad(scene.id)}
                  className="w-full bg-industrial-900 hover:bg-industrial-700 border border-industrial-700 rounded-lg p-3 text-left transition-colors"
                >
                  <p className="text-white font-medium">{scene.name}</p>
                  {scene.description && (
                    <p className="text-gray-500 text-sm mt-1 truncate">{scene.description}</p>
                  )}
                  <p className="text-gray-600 text-xs mt-1">
                    {new Date(scene.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Auth Modal */}
      <Modal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} title={authMode === 'login' ? 'Sign In' : 'Create Account'}>
        <div className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-industrial-900 border border-industrial-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Username</label>
            <input
              type="text"
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              placeholder="username"
              className="w-full bg-industrial-900 border border-industrial-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="********"
              className="w-full bg-industrial-900 border border-industrial-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <button
            onClick={handleAuth}
            disabled={isLoading}
            className="w-full bg-accent-primary hover:bg-accent-primary/80 disabled:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="w-full text-gray-400 hover:text-white text-sm transition-colors"
          >
            {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </Modal>
    </>
  );
}
