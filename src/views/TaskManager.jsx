import React, { useState } from 'react';
import { useTasks } from '../store/TasksContext';
import TaskCard from '../components/tasks/TaskCard';
import GlassCard from '../components/common/GlassCard';
import { 
  Calendar, CheckSquare, Plus, Clock, AlertCircle, CheckCircle, Sparkles, ChevronDown 
} from 'lucide-react';
import './views.css';
import '../components/tasks/tasks.css';

export default function TaskManager() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [quickTitle, setQuickTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Controle de abas temporais da Etapa 2
  const [activeTab, setActiveTab] = useState('hoje'); // 'hoje' | 'proximas' | 'atrasadas' | 'concluidas'

  const handleQuickAdd = (e) => {
    if (e) e.preventDefault();
    if (!quickTitle.trim()) return;

    addTask(quickTitle.trim());
    setQuickTitle('');
    setShowAddForm(false);
    setActiveTab('hoje'); // Redireciona para Hoje
  };

  const handleUpdateStatus = async (taskId, nextStatus) => {
    await updateTask(taskId, { status: nextStatus });
  };

  const handleUpdateChecklist = async (taskId, nextChecklist) => {
    await updateTask(taskId, { checklist: nextChecklist });
  };

  // Lógica de Separação Temporal das Tarefas
  const nowMs = Date.now();
  
  // Início e fim do dia de hoje para checagem de datas
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const endOfTodayMs = endOfToday.getTime();

  // 1. Concluídas
  const completedTasks = tasks.filter(t => t.status === 'done');
  
  // 2. Atrasadas (pendentes e com data inferior ao início de hoje)
  const overdueTasks = tasks.filter(t => 
    t.status !== 'done' && t.deadline && t.deadline < startOfTodayMs
  );

  // 3. Hoje (pendentes sem data ou com data caindo nas fronteiras de hoje)
  const todayTasks = tasks.filter(t => 
    t.status !== 'done' && 
    (!t.deadline || (t.deadline >= startOfTodayMs && t.deadline <= endOfTodayMs))
  );

  // 4. Próximas (pendentes com data no futuro posterior ao final de hoje)
  const upcomingTasks = tasks.filter(t => 
    t.status !== 'done' && t.deadline && t.deadline > endOfTodayMs
  );

  // Mapeamento das listas por aba
  const taskGroups = {
    hoje: { label: 'Hoje', list: todayTasks, icon: Clock, color: 'var(--accent)' },
    proximas: { label: 'Próximas', list: upcomingTasks, icon: Calendar, color: 'var(--priority-low)' },
    atrasadas: { label: 'Atrasadas', list: overdueTasks, icon: AlertCircle, color: 'var(--priority-urgent)' },
    concluidas: { label: 'Concluídas', list: completedTasks, icon: CheckCircle, color: 'var(--status-done)' }
  };

  const currentGroup = taskGroups[activeTab];

  return (
    <div className="view-container">
      {/* Glowes Ambientais */}
      <div className="ambient-glow glow-primary" style={{ opacity: 0.08 }}></div>

      {/* Título & Botão de Inserção */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckSquare size={20} style={{ color: 'var(--accent)' }} />
          Lista de Atividades
        </h2>
        
        <button 
          className="btn btn-sm btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={16} />
          Nova Tarefa
        </button>
      </div>

      {/* Formulário Flutuante */}
      {showAddForm && (
        <form onSubmit={handleQuickAdd} className="glass-panel quick-add-form" style={{ animation: 'fadeIn var(--transition-fast)' }}>
          <input
            type="text"
            className="settings-input"
            style={{ flexGrow: 1, maxWidth: 'none', borderRadius: 'var(--radius-input)' }}
            placeholder="Digite o título da tarefa de hoje..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary" disabled={!quickTitle.trim()}>
            Criar
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
            Cancelar
          </button>
        </form>
      )}

      {/* Segmented Control - Abas de Escopo Temporal */}
      <div className="segmented-control">
        {Object.entries(taskGroups).map(([id, group]) => {
          const Icon = group.icon;
          return (
            <button
              key={id}
              className={`segmented-btn ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
              style={{ color: activeTab === id ? '' : 'var(--text-secondary)' }}
            >
              <Icon size={14} style={{ color: activeTab === id ? '' : group.color }} />
              <span>{group.label}</span>
              <span 
                className="badge" 
                style={{ 
                  fontSize: '0.6rem', 
                  padding: '1px 6px',
                  background: activeTab === id ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                  color: activeTab === id ? '#FFFFFF' : 'var(--text-muted)'
                }}
              >
                {group.list.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Listagem Ativa com Transição Suave */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {currentGroup.list.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <CheckSquare className="empty-state-icon" size={48} style={{ color: currentGroup.color }} />
            <h3 className="empty-state-title">Aba vazia</h3>
            <p className="empty-state-desc">
              Não há tarefas na seção de "{currentGroup.label}". Suas pendências estão organizadas!
            </p>
          </div>
        ) : (
          <div className="ideas-grid">
            {currentGroup.list.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={deleteTask}
                onUpdateStatus={handleUpdateStatus}
                onUpdateChecklist={handleUpdateChecklist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
