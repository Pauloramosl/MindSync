import React from 'react';
import { Lightbulb, CheckSquare, BrainCircuit, Sliders, Plus, Calendar } from 'lucide-react';
import './layout.css';

export default function MobileNav({ activeView, setActiveView, onQuickCaptureClick }) {
  return (
    <nav className="mobile-nav">
      <button 
        className={`mobile-nav-item ${activeView === 'inbox' ? 'active' : ''}`}
        onClick={() => setActiveView('inbox')}
      >
        <Lightbulb className="mobile-nav-item-icon" size={20} />
        <span>Inbox</span>
      </button>

      <button 
        className={`mobile-nav-item ${activeView === 'brainstorm' ? 'active' : ''}`}
        onClick={() => setActiveView('brainstorm')}
      >
        <BrainCircuit className="mobile-nav-item-icon" size={20} />
        <span>Ideias</span>
      </button>

      {/* Botão Central de Captura Rápida */}
      <button 
        className="mobile-capture-btn"
        onClick={onQuickCaptureClick}
        title="Captura Rápida"
      >
        <Plus size={28} />
      </button>

      <button 
        className={`mobile-nav-item ${activeView === 'tasks' ? 'active' : ''}`}
        onClick={() => setActiveView('tasks')}
      >
        <CheckSquare className="mobile-nav-item-icon" size={20} />
        <span>Tarefas</span>
      </button>

      <button 
        className={`mobile-nav-item ${activeView === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveView('settings')}
      >
        <Sliders className="mobile-nav-item-icon" size={20} />
        <span>Ajustes</span>
      </button>
    </nav>
  );
}
