import React, { useState } from 'react';
import { useIdeas } from '../store/IdeasContext';
import { useTasks } from '../store/TasksContext';
import IdeaCaptureInput from '../components/ideas/IdeaCaptureInput';
import IdeaCard from '../components/ideas/IdeaCard';
import AIPreviewModal from '../components/ideas/AIPreviewModal';
import GlassCard from '../components/common/GlassCard';
import { Lightbulb, CheckSquare, Sparkles, Bell, ArrowRight, BrainCircuit } from 'lucide-react';
import './views.css';

export default function Inbox({ setActiveView }) {
  const { ideas, addIdea, deleteIdea, updateIdea, rawIdeas } = useIdeas();
  const { tasks, convertIdeaToTask, updateTask, deleteTask } = useTasks();
  const [selectedIdeaForTask, setSelectedIdeaForTask] = useState(null);

  // Filtragem de ideias do Inbox (new ou review)
  const inboxIdeas = ideas.filter(idea => idea.status === 'new' || idea.status === 'review');
  const recentInbox = inboxIdeas.slice(0, 3); // Primeiras 3 ideias pendentes

  // Filtragem de tarefas pendentes
  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const activeTasksSlice = pendingTasks.slice(0, 3); // Primeiras 3 tarefas pendentes

  // Ideias inativas/esquecidas count (mais de 24h sem alteração)
  const now = Date.now();
  const idleCount = inboxIdeas.filter(idea => now - idea.updatedAt > 24 * 60 * 60 * 1000).length;

  const handleCapture = async (text, type) => {
    await addIdea(text, type);
  };

  const handleStatusChange = async (id, nextStatus) => {
    await updateIdea(id, { status: nextStatus });
  };

  const handleTransformClick = (idea) => {
    setSelectedIdeaForTask(idea);
  };

  const handleConfirmConversion = async (taskData) => {
    if (selectedIdeaForTask) {
      await convertIdeaToTask(selectedIdeaForTask.id, taskData);
      setSelectedIdeaForTask(null);
    }
  };

  // Toggle rápido de tarefas direto no widget do dashboard
  const handleToggleTaskItem = async (task, itemId) => {
    const updatedChecklist = task.checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await updateTask(task.id, { checklist: updatedChecklist });
  };

  return (
    <div className="view-container">
      {/* Glowes de Fundo */}
      <div className="ambient-glow glow-primary" style={{ opacity: 0.12 }}></div>
      <div className="ambient-glow glow-secondary" style={{ opacity: 0.08 }}></div>

      {/* Saudação de Entrada */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Olá, pronto para descarregar sua mente?
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Capture ideias rapidamente e deixe que a IA cuide do resto.
        </p>
      </div>

      {/* Dock de Captura Principal */}
      <IdeaCaptureInput onCapture={handleCapture} />

      {/* Grade de Widgets do Painel Central (Home) */}
      <div className="dashboard-widgets-grid">
        
        {/* WIDGET 1: INBOX (Capturas Pendentes) - Stagger 1 */}
        <GlassCard className="stagger-1" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={18} style={{ color: 'var(--status-new)' }} />
              Inbox ({inboxIdeas.length})
            </span>
            <button 
              className="btn-glass" 
              onClick={() => setActiveView('brainstorm')}
              style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 'var(--radius-mini)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Ver Tudo <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentInbox.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                Nenhuma ideia pendente no Inbox.
              </p>
            ) : (
              recentInbox.map((idea, index) => (
                <div 
                  key={idea.id} 
                  className={`stagger-${(index % 4) + 1}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-mini)' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '70%' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {idea.title}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Prioridade: {idea.priority === 'urgent' ? 'Urgente' : idea.priority === 'high' ? 'Alta' : 'Média'}
                    </span>
                  </div>
                  <button 
                    className="btn btn-sm btn-primary" 
                    onClick={() => handleTransformClick(idea)}
                    style={{ padding: '6px 12px', borderRadius: 'var(--radius-mini)', fontSize: '0.75rem' }}
                  >
                    Processar
                  </button>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* WIDGET 2: TAREFAS ATIVAS - Stagger 2 */}
        <GlassCard className="stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={18} style={{ color: 'var(--accent)' }} />
              Tarefas Ativas ({pendingTasks.length})
            </span>
            <button 
              className="btn-glass" 
              onClick={() => setActiveView('tasks')}
              style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 'var(--radius-mini)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Ver Quadro <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeTasksSlice.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                Nenhuma tarefa em andamento.
              </p>
            ) : (
              activeTasksSlice.map((task, index) => {
                const total = task.checklist ? task.checklist.length : 0;
                const completed = task.checklist ? task.checklist.filter(i => i.completed).length : 0;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <div 
                    key={task.id}
                    className={`stagger-${(index % 4) + 1}`}
                    style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-mini)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{task.title}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>{percent}%</span>
                    </div>

                    <div style={{ width: '100%', height: '3px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent)' }}></div>
                    </div>

                    {total > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                        {task.checklist.slice(0, 1).map(item => (
                          <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: item.completed ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                            <input 
                              type="checkbox" 
                              checked={item.completed} 
                              onChange={() => handleToggleTaskItem(task, item.id)}
                            />
                            <span style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>{item.text}</span>
                          </label>
                        ))}
                        {total > 1 && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '20px' }}>
                            + {total - 1} passos de ação restantes...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>

        {/* WIDGET 3: INSIGHTS DA IA & LEMBRETES - Stagger 3 */}
        <GlassCard className="stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--secondary)' }} />
                MindSync Insights
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {idleCount > 0 ? (
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 12px', borderRadius: 'var(--radius-mini)' }}>
                  <Bell size={16} style={{ color: 'var(--priority-urgent)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Você tem <strong>{idleCount} ideias inativas</strong> paradas no Inbox por mais de 24h. Alerte o scanner!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 12px', borderRadius: 'var(--radius-mini)' }}>
                  <Sparkles size={16} style={{ color: 'var(--status-done)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Sua mente está organizada! Não há ideias ociosas pendentes de triagem no momento.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '10px 12px', borderRadius: 'var(--radius-mini)' }}>
                <BrainCircuit size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  A IA categorizou todas as capturas ativas. Total acumulado: <strong>{rawIdeas.length} insights</strong>.
                </p>
              </div>
            </div>
          </div>

          <button 
            className="btn btn-primary"
            onClick={() => setActiveView('review')}
            style={{ width: '100%', marginTop: '16px', display: 'flex', justifySelf: 'flex-end', fontSize: '0.85rem' }}
          >
            Fazer Balanço Diário
          </button>
        </GlassCard>


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
