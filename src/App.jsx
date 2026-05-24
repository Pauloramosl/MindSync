import React, { useState } from 'react';
import { ThemeProvider } from './store/ThemeContext';
import { ToastProvider } from './store/ToastContext';
import { IdeasProvider, useIdeas } from './store/IdeasContext';
import { TasksProvider } from './store/TasksContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNav from './components/layout/MobileNav';
import { Mic, X } from 'lucide-react';

// Telas (Views)
import Inbox from './views/Inbox';
import Brainstorm from './views/Brainstorm';
import TaskManager from './views/TaskManager';
import DailyReview from './views/DailyReview';
import Settings from './views/Settings';

import './App.css';

function MainApp() {
  const [activeView, setActiveView] = useState('inbox');
  const [showMobileVoiceCapture, setShowMobileVoiceCapture] = useState(false);
  const { addIdea } = useIdeas();

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

      {/* MOBILE VOICE BOTTOM SHEET DRAWER (Etapa 2 Componente) */}
      {showMobileVoiceCapture && (
        <div className="bottom-sheet-overlay" onClick={() => setShowMobileVoiceCapture(false)}>
          <div className="bottom-sheet-panel glass-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <Mic size={16} style={{ color: 'var(--accent)' }} />
                Gravação de Voz Inteligente
              </span>
              <button 
                onClick={() => setShowMobileVoiceCapture(false)}
                className="btn btn-sm btn-glass btn-circle"
                style={{ width: '28px', height: '28px' }}
                title="Fechar"
              >
                <X size={14} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '8px 0' }}>
              {/* Waveform animado */}
              <div className="voice-wave-container" style={{ height: '32px' }}>
                <div className="voice-wave-bar" style={{ width: '3px', background: 'var(--accent)', animationDuration: '0.7s' }}></div>
                <div className="voice-wave-bar" style={{ width: '3px', background: 'var(--accent)', animationDuration: '0.9s' }}></div>
                <div className="voice-wave-bar" style={{ width: '3px', background: 'var(--accent)', animationDuration: '1.2s' }}></div>
                <div className="voice-wave-bar" style={{ width: '3px', background: 'var(--accent)', animationDuration: '0.8s' }}></div>
                <div className="voice-wave-bar" style={{ width: '3px', background: 'var(--accent)', animationDuration: '1.1s' }}></div>
              </div>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
                "Estudar curso de inglês e fazer exercícios práticos amanhã cedo..."
              </p>
              
              <button 
                className="btn btn-primary"
                onClick={async () => {
                  await addIdea("Estudar curso de inglês e fazer exercícios práticos amanhã cedo");
                  setShowMobileVoiceCapture(false);
                }}
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                Concluir e Salvar no Inbox
              </button>
            </div>
          </div>
        </div>
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
