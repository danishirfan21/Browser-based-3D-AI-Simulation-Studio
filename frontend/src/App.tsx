import { SceneProvider } from './context/SceneContext';
import { AuthProvider } from './context/AuthContext';
import { Toolbar } from './components/ui/Toolbar';
import { PromptPanel } from './components/panels/PromptPanel';
import { InspectorPanel } from './components/panels/InspectorPanel';
import { SceneCanvas } from './components/scene/SceneCanvas';

function AppContent() {
  return (
    <div className="h-screen flex flex-col bg-industrial-900 overflow-hidden">
      {/* Top toolbar */}
      <Toolbar />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Prompt */}
        <div className="w-80 flex-shrink-0">
          <PromptPanel />
        </div>

        {/* Center - 3D Canvas */}
        <div className="flex-1 relative">
          <SceneCanvas />
        </div>

        {/* Right panel - Inspector */}
        <div className="w-80 flex-shrink-0">
          <InspectorPanel />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SceneProvider>
        <AppContent />
      </SceneProvider>
    </AuthProvider>
  );
}

export default App;
