import { useEffect, useState } from 'react';
import { ThemeProvider } from './store/ThemeContext';
import { ToastProvider } from './store/ToastContext';
import { IdeasProvider, useIdeas } from './store/IdeasContext';
import { TasksProvider } from './store/TasksContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNav from './components/layout/MobileNav';
import MobileVoiceCapture from './components/layout/MobileVoiceCapture';

// Telas (Views)
import Inbox from './views/Inbox';
import Brainstorm from './views/Brainstorm';
import TaskManager from './views/TaskManager';
import DailyReview from './views/DailyReview';
import Settings from './views/Settings';

import './App.css';

const VALID_VIEWS = new Set(['inbox', 'brainstorm', 'tasks', 'review', 'settings']);

function normalizeView(view) {
  return VALID_VIEWS.has(view) ? view : 'inbox';
}

function getInitialView() {
  if (typeof window === 'undefined') return 'inbox';
  const params = new URLSearchParams(window.location.search);
  return normalizeView(params.get('view'));
}

function MainApp() {
  const [activeView, setActiveView] = useState(getInitialView);
  const [showMobileVoiceCapture, setShowMobileVoiceCapture] = useState(false);
  const { addIdea } = useIdeas();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type !== 'OPEN_NOTIFICATION_TARGET') return;
      setActiveView(normalizeView(event.data.view));
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  const renderActiveView = () => {
    switch (activeView) {
      case 'inbox':
        return <Inbox setActiveView={setActiveView} />;
      case 'brainstorm':
        return <Brainstorm />;
      case 'tasks':
        return <TaskManager />;
      case 'review':
        return <DailyReview />;
      case 'settings':
        return <Settings />;
      default:
        return <Inbox />;
    }
  };

  // Callback de clique rápido no mobile - abre o Bottom Sheet de voz
  const handleQuickCaptureMobileClick = () => {
    setShowMobileVoiceCapture(true);
  };

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      
      {/* Sidebar - Fixa no Desktop */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Container Principal */}
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, position: 'relative', minWidth: 0 }}>
        
        {/* Header Superior Glassmorphic */}
        <Header activeView={activeView} />

        {/* View Ativa */}
        <main style={{ flexGrow: 1, minWidth: 0 }}>
          {renderActiveView()}
        </main>
        
      </div>

      {/* Barra de Navegação Inferior - Apenas Mobile */}
      <MobileNav 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onQuickCaptureClick={handleQuickCaptureMobileClick}
      />

      {/* MOBILE VOICE BOTTOM SHEET DRAWER */}
      {showMobileVoiceCapture && (
        <MobileVoiceCapture 
          onClose={() => setShowMobileVoiceCapture(false)}
          onCapture={addIdea}
        />
      )}
      
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <IdeasProvider>
          <TasksProvider>
            <MainApp />
          </TasksProvider>
        </IdeasProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
