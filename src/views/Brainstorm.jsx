import React, { useState, useEffect, useRef } from 'react';
import { useIdeas } from '../store/IdeasContext';
import { useTasks } from '../store/TasksContext';
import IdeaCard from '../components/ideas/IdeaCard';
import AIPreviewModal from '../components/ideas/AIPreviewModal';
import { 
  BrainCircuit, Filter, LayoutGrid, AlignJustify, GitCommit, Columns, Network, 
  Trash2, ClipboardCopy, Archive, CheckCircle, Sparkles 
} from 'lucide-react';
import './views.css';
import '../components/ideas/ideas.css';

// Componente Wrapper para Nós de Linha do Tempo com IntersectionObserver (Etapa 3 Motion)
function TimelineNode({ idea, onDelete, onTransform, onStatusChange }) {
  const [active, setActive] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting);
      },
      { threshold: 0.25, rootMargin: '-10% 0px -10% 0px' }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const fullDateStr = new Date(idea.createdAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      ref={elementRef} 
      className={`timeline-node ${active ? 'timeline-active' : ''}`}
    >
      <div className="timeline-marker">
        <div className="timeline-marker-dot"></div>
      </div>
      
      <div className="timeline-node-card">
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px', paddingLeft: '8px' }}>
          {fullDateStr}
        </div>
        <IdeaCard
          idea={idea}
          onDelete={onDelete}
          onTransform={onTransform}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
}

export default function Brainstorm() {
  const { ideas, rawIdeas, activeFilters, setActiveFilters, deleteIdea, updateIdea } = useIdeas();
  const { convertIdeaToTask } = useTasks();
  const [selectedIdeaForTask, setSelectedIdeaForTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null); // null | status string
  
  // Controle das 5 visualizações de layout
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'lista' | 'timeline' | 'kanban' | 'mapa_mental'

  useEffect(() => {
    return () => {
      setActiveFilters({ tag: '', priority: '', status: '' });
    };
  }, [setActiveFilters]);

  const allTags = ['Trabalho', 'Estudos', 'Pessoal', 'Negócios', 'Produtividade'];

  const handleFilterChange = (field, value) => {
    setActiveFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({ tag: '', priority: '', status: '' });
  };

  const handleStatusChange = async (id, nextStatus) => {
    await updateIdea(id, { status: nextStatus });
  };

  const handleConfirmConversion = async (taskData) => {
    if (selectedIdeaForTask) {
      await convertIdeaToTask(selectedIdeaForTask.id, taskData);
      setSelectedIdeaForTask(null);
    }
  };

  // Renderizadores específicos de cada Layout
  
  // 1. LIST VIEW RENDERER (Notion-style)
  const renderListView = () => (
    <div className="list-view-container">
      {/* Cabeçalho da Tabela */}
      <div className="list-row" style={{ background: 'var(--bg-secondary)', fontWeight: 700, borderBottom: '2px solid var(--glass-border)' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TÍTULO DA IDEIA</span>
        <span className="list-cell-hide-mobile" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>MEIO</span>
        <span className="list-cell-hide-mobile" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PRIORIDADE</span>
        <span className="list-cell-hide-mobile" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>STATUS</span>
        <span className="list-cell-hide-mobile" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CATEGORIAS</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>AÇÕES</span>
      </div>
      
      {ideas.map((idea, index) => {
        const dateStr = new Date(idea.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        return (
          <div key={idea.id} className={`list-row stagger-${(index % 8) + 1} animate-fade-in`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <span className="list-cell-title">{idea.title}</span>
              <span className="list-cell-desc">{idea.description}</span>
            </div>
            
            <span className="list-cell-hide-mobile badge" style={{ fontSize: '0.65rem', background: 'var(--bg-secondary)', color: 'var(--text-muted)', display: 'inline-flex', width: 'fit-content' }}>
              {idea.type}
            </span>

            <span className="list-cell-hide-mobile badge" style={{ fontSize: '0.65rem', background: `var(--priority-${idea.priority}-bg)`, color: `var(--priority-${idea.priority})`, display: 'inline-flex', width: 'fit-content' }}>
              {idea.priority}
            </span>

            <span className="list-cell-hide-mobile badge" style={{ fontSize: '0.65rem', background: 'var(--bg-secondary)', color: 'var(--text-muted)', display: 'inline-flex', width: 'fit-content' }}>
              {idea.status}
            </span>

            <div className="list-cell-hide-mobile" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {idea.tags.slice(0, 1).map(tag => (
                <span key={tag} className="badge" style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                  {tag}
                </span>
              ))}
              {idea.tags.length > 1 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{idea.tags.length - 1}</span>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              {idea.status !== 'transformed' && (
                <button className="btn btn-sm btn-glass btn-circle" onClick={() => setSelectedIdeaForTask(idea)} title="Converter">
                  <ClipboardCopy size={12} />
                </button>
              )}
              <button className="btn btn-sm btn-danger btn-circle" onClick={() => deleteIdea(idea.id)} title="Excluir">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  // 2. TIMELINE VIEW RENDERER (Linear-style)
  const renderTimelineView = () => (
    <div className="timeline-view-container">
      {ideas.map(idea => (
        <TimelineNode
          key={idea.id}
          idea={idea}
          onDelete={deleteIdea}
          onTransform={setSelectedIdeaForTask}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );

  // 3. KANBAN VIEW RENDERER (Triagem de Ideias)
  const renderKanbanView = () => {
    const kanbanStates = [
      { id: 'new', label: 'Nova' },
      { id: 'review', label: 'Revisar' },
      { id: 'transformed', label: 'Convertida' },
      { id: 'completed', label: 'Concluída' }
    ];

    return (
      <div className="ideas-kanban-board custom-scroll">
        {kanbanStates.map(state => {
          const stateIdeas = ideas.filter(i => i.status === state.id);
          return (
            <div 
              key={state.id} 
              className={`ideas-kanban-column ${dragOverCol === state.id ? 'drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(state.id);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={async (e) => {
                setDragOverCol(null);
                const ideaId = e.dataTransfer.getData('text/plain');
                if (ideaId) {
                  await handleStatusChange(ideaId, state.id);
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{state.label}</span>
                <span className="badge" style={{ background: 'var(--bg-secondary)', fontSize: '0.7rem' }}>{stateIdeas.length}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
                {stateIdeas.map(idea => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onDelete={deleteIdea}
                    onTransform={setSelectedIdeaForTask}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };


  // 4. MAPA MENTAL VIEW RENDERER (Radial-style)
  const renderMindMapView = () => {
    // Agrupa ideias por tag principal
    const mapNodes = {
      Trabalho: rawIdeas.filter(i => i.tags.includes('Trabalho')),
      Estudos: rawIdeas.filter(i => i.tags.includes('Estudos')),
      Pessoal: rawIdeas.filter(i => i.tags.includes('Pessoal')),
      Negócios: rawIdeas.filter(i => i.tags.includes('Negócios')),
      Produtividade: rawIdeas.filter(i => i.tags.includes('Produtividade'))
    };

    // Coordenadas absolutas simulando conexões radiais de ideias
    const branchCoords = {
      Trabalho: { top: '20%', left: '20%' },
      Estudos: { top: '20%', left: '80%' },
      Pessoal: { top: '80%', left: '20%' },
      Negócios: { top: '80%', left: '80%' },
      Produtividade: { top: '50%', left: '80%' }
    };

    return (
      <div className="mindmap-canvas">
        {/* SVG Conectores */}
        <svg className="mindmap-svg-lines">
          {/* Linhas conectando o centro MindSync para cada Branch */}
          <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="var(--glass-border)" strokeWidth="2" strokeDasharray="4" />
          <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="var(--glass-border)" strokeWidth="2" strokeDasharray="4" />
          <line x1="50%" y1="50%" x2="20%" y2="80%" stroke="var(--glass-border)" strokeWidth="2" strokeDasharray="4" />
          <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="var(--glass-border)" strokeWidth="2" strokeDasharray="4" />
          <line x1="50%" y1="50%" x2="80%" y2="50%" stroke="var(--glass-border)" strokeWidth="2" strokeDasharray="4" />
        </svg>

        {/* Central Mind Node */}
        <div className="mindmap-root-node">
          <BrainCircuit size={28} style={{ marginBottom: '4px' }} />
          <span>MindSync</span>
        </div>

        {/* Orbitais por categoria */}
        {Object.entries(mapNodes).map(([category, items]) => {
          const style = branchCoords[category] || { top: '50%', left: '50%' };
          return (
            <div 
              key={category} 
              className="mindmap-branch-node" 
              style={style}
              title={`Ver ${items.length} ideias sobre ${category}`}
              onClick={() => handleFilterChange('tag', category)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontWeight: 800 }}>{category}</span>
                <span className="badge" style={{ fontSize: '0.6rem', padding: '1px 6px', background: 'var(--bg-primary)' }}>{items.length}</span>
              </div>
            </div>
          );
        })}

        <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          💡 Dica: Clique em um orbital de categoria para filtrar a listagem!
        </div>
      </div>
    );
  };

  return (
    <div className="view-container">
      {/* Barra de Visualização Segmented Control */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        
        <div className="segmented-control">
          <button 
            className={`segmented-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            title="Modo Grid Cards"
          >
            <LayoutGrid size={14} />
            <span>Cards</span>
          </button>
          
          <button 
            className={`segmented-btn ${viewMode === 'lista' ? 'active' : ''}`}
            onClick={() => setViewMode('lista')}
            title="Modo Tabela Notion"
          >
            <AlignJustify size={14} />
            <span>Lista</span>
          </button>

          <button 
            className={`segmented-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
            title="Modo Cronológico"
          >
            <GitCommit size={14} />
            <span>Linha do Tempo</span>
          </button>

          <button 
            className={`segmented-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
            title="Modo Triagem Kanban"
          >
            <Columns size={14} />
            <span>Kanban</span>
          </button>

          <button 
            className={`segmented-btn ${viewMode === 'mapa_mental' ? 'active' : ''}`}
            onClick={() => setViewMode('mapa_mental')}
            title="Modo Mapa Mental IA"
          >
            <Network size={14} />
            <span>Mapa Mental</span>
          </button>
        </div>

        {/* Limpar Filtros Se Ativos */}
        {(activeFilters.tag || activeFilters.priority || activeFilters.status) && (
          <button 
            className="btn btn-sm btn-secondary"
            onClick={handleClearFilters}
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            Filtrado: {activeFilters.tag || activeFilters.priority || activeFilters.status} (Limpar)
          </button>
        )}
      </div>

      {/* Renderização Condicional da Tela baseada no viewMode */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {ideas.length === 0 && viewMode !== 'mapa_mental' ? (
          <div className="empty-state">
            <BrainCircuit className="empty-state-icon" size={48} />
            <h3 className="empty-state-title">Nenhuma ideia encontrada</h3>
            <p className="empty-state-desc">
              Não há capturas correspondentes aos filtros ativos. Tente limpar ou capture novas ideias no seu Inbox!
            </p>
          </div>
        ) : (
          (() => {
            switch (viewMode) {
              case 'cards':
                return (
                  <div className="ideas-grid">
                    {ideas.map(idea => (
                      <IdeaCard
                        key={idea.id}
                        idea={idea}
                        onDelete={deleteIdea}
                        onTransform={setSelectedIdeaForTask}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                );
              case 'lista':
                return renderListView();
              case 'timeline':
                return renderTimelineView();
              case 'kanban':
                return renderKanbanView();
              case 'mapa_mental':
                return renderMindMapView();
              default:
                return (
                  <div className="ideas-grid">
                    {ideas.map(idea => (
                      <IdeaCard
                        key={idea.id}
                        idea={idea}
                        onDelete={deleteIdea}
                        onTransform={setSelectedIdeaForTask}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                );
            }
          })()
        )}
      </div>

      {/* Modal de Confirmação da IA (Aprovação) */}
      {selectedIdeaForTask && (
        <AIPreviewModal
          idea={selectedIdeaForTask}
          onClose={() => setSelectedIdeaForTask(null)}
          onConfirm={handleConfirmConversion}
        />
      )}
    </div>
  );
}
