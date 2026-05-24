import React, { useState, useEffect } from 'react';
import { useIdeas } from '../../store/IdeasContext';
import { useTasks } from '../../store/TasksContext';
import { useTheme } from '../../store/ThemeContext';
import { useToast } from '../../store/ToastContext';
import { Sparkles, CheckSquare, Sun, Moon, Search, X, Command, RefreshCw, WifiOff, BrainCircuit } from 'lucide-react';
import './layout.css';

// Ticker de Contagem com Animação (Count Animation - Etapa 3 Motion)
function AnimatedCounter({ value }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = parseInt(value, 10) || 0;
    if (start === end) return;

    const duration = 400; // 400ms duration
    const range = end - start;
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Easing easeOutQuad
      const easedProgress = progress * (2 - progress);
      const current = Math.round(start + range * easedProgress);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(step);
  }, [value]);

  return <span>{displayValue}</span>;
}

export default function Header({ activeView }) {
  const { rawIdeas } = useIdeas();
  const { tasks } = useTasks();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Escuta conexão de internet e lança Toasters
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast("Conexão Restaurada", "O MindSync sincronizou localmente com sucesso ✔", "success");
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast("Você está Offline", "O MindSync opera offline-first, guardando tudo no IndexedDB local.", "offline");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  // Efeito Visual de Sincronização Local (IndexedDB)
  useEffect(() => {
    setIsSyncing(true);
    const timer = setTimeout(() => {
      setIsSyncing(false);
    }, 800); // spins for 800ms
    return () => clearTimeout(timer);
  }, [rawIdeas.length, tasks.length]);

  // Estados do Spotlight Search (Raycast Style)
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calcular estatísticas rápidas
  const activeIdeasCount = rawIdeas.filter(i => i.status !== 'archived').length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'done').length;

  const viewTitles = {
    inbox: {
      title: 'Meu Inbox',
      subtitle: 'Capture pensamentos e organize-os rapidamente'
    },
    brainstorm: {
      title: 'Quadro de Ideias',
      subtitle: 'Conecte, filtre e refine suas capturas inteligentes'
    },
    tasks: {
      title: 'Fluxo de Execução',
      subtitle: 'Acompanhe e execute suas tarefas em checklists'
    },
    review: {
      title: 'Revisão e Balanço',
      subtitle: 'Consolidação de atividades diárias e semanais'
    },
    settings: {
      title: 'Configurações',
      subtitle: 'Personalize os lembretes do scanner e a IA'
    }
  };

  const currentHeader = viewTitles[activeView] || { title: 'MindSync', subtitle: 'Captura & Execução' };

  // Filtragem em tempo real para o Spotlight
  const filteredIdeas = searchQuery.trim() === '' ? [] : rawIdeas.filter(idea => 
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    idea.description.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 3);

  const filteredTasks = searchQuery.trim() === '' ? [] : tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 3);

  return (
    <>
      <header className="header animate-fade-in">
        <div className="header-title-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit className="header-logo-mobile" size={20} />
            <span className="header-logo-text-mobile">MindSync</span>
            <span className="header-logo-divider-mobile">|</span>
            <h1 className="header-title">{currentHeader.title}</h1>
          </div>
          <p className="header-subtitle">{currentHeader.subtitle}</p>
        </div>

        <div className="header-actions">
          {/* Campo de Busca Spotlight */}
          <div className="header-search-container" onClick={() => setShowSpotlight(true)}>
            <Search className="header-search-icon" size={14} />
            <input 
              type="text" 
              className="header-search-input" 
              placeholder="Buscar..." 
              readOnly 
              title="Ativar busca inteligente"
            />
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Command size={10} /> K
            </span>
          </div>

          {/* Botão de Busca Spotlight para Mobile */}
          <button
            onClick={() => setShowSpotlight(true)}
            className="btn btn-sm btn-glass btn-circle mobile-search-btn"
            style={{ width: '38px', height: '38px' }}
            title="Ativar busca inteligente"
          >
            <Search size={15} />
          </button>

          {/* Ticker de Estatísticas Animadas (Métricas - Count Animation) */}
          <div className="header-stat-tag" title="Ideias ativas no Inbox e Quadro">
            <Sparkles size={14} />
            <span>Ideias: <strong className="header-stat-val"><AnimatedCounter value={activeIdeasCount} /></strong></span>
          </div>

          <div className="header-stat-tag" title="Tarefas pendentes">
            <CheckSquare size={14} />
            <span>Tarefas: <strong className="header-stat-val"><AnimatedCounter value={pendingTasksCount} /></strong></span>
          </div>

          {/* Indicador de Sincronização Local (IndexedDB) */}
          <div 
            className={`btn btn-sm btn-glass btn-circle ${isSyncing ? 'spin-animation' : ''}`}
            style={{ width: '38px', height: '38px', color: isOnline ? 'var(--accent)' : 'var(--priority-high)', pointerEvents: 'auto' }}
            title={isOnline ? (isSyncing ? "Sincronizando IndexedDB..." : "Banco local sincronizado ✔") : "Modo Offline (Salvo localmente)"}
          >
            {isOnline ? <RefreshCw size={15} /> : <WifiOff size={15} />}
          </div>

          {/* Alternador Manual de Temas (Sun/Moon) */}
          <button
            onClick={toggleTheme}
            className="btn btn-sm btn-glass btn-circle"
            style={{ width: '38px', height: '38px' }}
            title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
          >
            {theme === 'dark' ? <Sun size={16} style={{ color: '#F59E0B' }} /> : <Moon size={16} style={{ color: '#3B82F6' }} />}
          </button>

          {/* Perfil Simulado */}
          <div className="header-profile-mock" title="Meu Perfil">
            MS
          </div>
        </div>
      </header>

      {/* SPOTLIGHT SEARCH DRAWER (Raycast Style) */}
      {showSpotlight && (
        <div className="spotlight-overlay" onClick={() => setShowSpotlight(false)}>
          <div className="spotlight-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            
            <div className="spotlight-header">
              <Search size={18} style={{ color: 'var(--accent)' }} />
              <input
                type="text"
                className="spotlight-input"
                placeholder="Busque por ideias, tarefas, prioridades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button onClick={() => { setShowSpotlight(false); setSearchQuery(''); }} title="Fechar busca">
                <X size={16} />
              </button>
            </div>

            <div className="spotlight-results custom-scroll">
              {searchQuery.trim() === '' ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '24px 0' }}>
                  Digite palavras-chave para pesquisar no MindSync local...
                </div>
              ) : filteredIdeas.length === 0 && filteredTasks.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '24px 0' }}>
                  Nenhum registro correspondente encontrado.
                </div>
              ) : (
                <>
                  {/* Seção Ideias */}
                  {filteredIdeas.length > 0 && (
                    <div className="spotlight-section">
                      <span className="spotlight-section-title">Ideias Correspondentes ({filteredIdeas.length})</span>
                      {filteredIdeas.map(idea => (
                        <div key={idea.id} className="spotlight-row" onClick={() => setShowSpotlight(false)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                            <span>{idea.title}</span>
                          </div>
                          <span className="badge" style={{ fontSize: '0.6rem', background: 'var(--bg-primary)' }}>{idea.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Seção Tarefas */}
                  {filteredTasks.length > 0 && (
                    <div className="spotlight-section" style={{ marginTop: '8px' }}>
                      <span className="spotlight-section-title">Tarefas Correspondentes ({filteredTasks.length})</span>
                      {filteredTasks.map(task => (
                        <div key={task.id} className="spotlight-row" onClick={() => setShowSpotlight(false)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckSquare size={14} style={{ color: 'var(--secondary)' }} />
                            <span>{task.title}</span>
                          </div>
                          <span className="badge" style={{ fontSize: '0.6rem', background: 'var(--bg-primary)' }}>{task.priority}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
