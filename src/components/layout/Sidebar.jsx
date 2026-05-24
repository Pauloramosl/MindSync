import React from 'react';
import { Lightbulb, CheckSquare, BrainCircuit, Sliders, Calendar } from 'lucide-react';
import './layout.css';

export default function Sidebar({ activeView, setActiveView }) {
  const menuItems = [
    { id: 'inbox', label: 'Inbox', icon: Lightbulb },
    { id: 'brainstorm', label: 'Quadro de Ideias', icon: BrainCircuit },
    { id: 'tasks', label: 'Minhas Tarefas', icon: CheckSquare },
    { id: 'review', label: 'Revisões Diárias', icon: Calendar },
    { id: 'settings', label: 'Ajustes', icon: Sliders },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <BrainCircuit className="sidebar-logo-icon" size={28} />
        <span className="sidebar-logo-text">MindSync</span>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <Icon className="sidebar-item-icon" size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p>© 2026 MindSync</p>
        <p>Offline-First Enabled</p>
      </div>
    </aside>
  );
}
