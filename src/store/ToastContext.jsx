import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, WifiOff, RefreshCw, Upload, Mic, Sparkles, X } from 'lucide-react';
import './toast.css';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Adiciona uma nova notificação toast ao ecossistema
  const addToast = useCallback((title, message, type = 'success', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newToast = { id, title, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Remove automaticamente após a duração
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    
    // Tempo para a animação de saída de 220ms terminar
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 250);
  }, []);

  // Mapear ícones para cada estado/tipo de notificação
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} className="toast-icon success" />;
      case 'error':
        return <AlertCircle size={18} className="toast-icon error" />;
      case 'offline':
        return <WifiOff size={18} className="toast-icon offline" />;
      case 'sync':
        return <RefreshCw size={18} className="toast-icon sync spin-animation" />;
      case 'upload':
        return <Upload size={18} className="toast-icon upload pulse-animation" />;
      case 'voice':
        return <Mic size={18} className="toast-icon voice pulse-animation" />;
      case 'ai':
        return <Sparkles size={18} className="toast-icon ai pulse-animation" />;
      default:
        return <CheckCircle size={18} className="toast-icon success" />;
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Container Flutuante das Notificações */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast-card glass-panel ${toast.type} ${toast.exiting ? 'exit-animation' : 'entry-animation'}`}
            onClick={() => removeToast(toast.id)}
          >
            <div className="toast-header-row">
              {getIcon(toast.type)}
              <div className="toast-text-container">
                <span className="toast-title">{toast.title}</span>
                {toast.message && <p className="toast-message">{toast.message}</p>}
              </div>
              <button 
                className="toast-close-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                title="Fechar"
              >
                <X size={12} />
              </button>
            </div>
            {toast.duration > 0 && (
              <div className="toast-progress-bar-container">
                <div 
                  className="toast-progress-bar-fill"
                  style={{ animationDuration: `${toast.duration}ms` }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado sob um ToastProvider');
  }
  return context;
}
