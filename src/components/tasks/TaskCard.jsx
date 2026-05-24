import React, { useState } from 'react';
import { Trash2, Calendar, Sparkles, CheckSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useIdeas } from '../../store/IdeasContext';
import GlassCard from '../common/GlassCard';
import './tasks.css';

export default function TaskCard({ task, onDelete, onUpdateStatus, onUpdateChecklist }) {
  const { rawIdeas } = useIdeas();
  const [showChecklist, setShowChecklist] = useState(false);

  // Encontrar ideia de origem
  const associatedIdea = rawIdeas.find(i => i.id === task.associatedIdeaId);

  // Calcular progresso do checklist
  const totalItems = task.checklist ? task.checklist.length : 0;
  const completedItems = task.checklist ? task.checklist.filter(item => item.completed).length : 0;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Formatar deadline data
  const hasDeadline = !!task.deadline;
  const isOverdue = hasDeadline && task.deadline < Date.now() && task.status !== 'done';
  const deadlineLabel = hasDeadline 
    ? new Date(task.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : '';

  // Handler para checkbox interno
  const handleToggleItem = (itemId) => {
    const updatedChecklist = task.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateChecklist(task.id, updatedChecklist);
  };

  const handleStatusChange = (e) => {
    onUpdateStatus(task.id, e.target.value);
  };

  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente'
  };

  const statuses = [
    { value: 'todo', label: 'A Fazer' },
    { value: 'doing', label: 'Executando' },
    { value: 'waiting', label: 'Aguardando' },
    { value: 'review', label: 'Revisão' },
    { value: 'done', label: 'Concluído' }
  ];

  return (
    <GlassCard 
      className={`task-card priority-${task.priority} animate-fade-in`}
      interactive
    >
      <div className="task-card-header">
        <h4 className="task-card-title">{task.title}</h4>
        <span 
          className="badge"
          style={{ 
            fontSize: '0.6rem', 
            background: `var(--priority-${task.priority}-bg)`,
            color: `var(--priority-${task.priority})`
          }}
        >
          {priorityLabels[task.priority]}
        </span>
      </div>

      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      {/* Relacionamento com a Ideia de Origem */}
      {associatedIdea && (
        <div className="task-card-origin" title={`Originada da ideia: ${associatedIdea.title}`}>
          <Sparkles size={10} style={{ marginRight: '2px' }} />
          <span>Origem: {associatedIdea.title}</span>
        </div>
      )}

      {/* Indicador de Progresso de Checklist */}
      {totalItems > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div className="task-checklist-header">
            <button 
              type="button" 
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontStyle: 'normal', color: 'var(--text-secondary)' }}
              onClick={() => setShowChecklist(!showChecklist)}
            >
              <CheckSquare size={12} />
              <span>Ações ({completedItems}/{totalItems})</span>
              {showChecklist ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <span>{progressPercent}%</span>
          </div>

          <div className="task-progress-bar-bg">
            <div className="task-progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>

          {/* Lista de Checklist Detalhada com Toggle */}
          {showChecklist && (
            <div className="task-checklist-detail animate-fade-in">
              {task.checklist.map(item => (
                <label 
                  key={item.id} 
                  className={`task-checklist-detail-row ${item.completed ? 'completed' : ''}`}
                >
                  <input 
                    type="checkbox" 
                    checked={item.completed} 
                    onChange={() => handleToggleItem(item.id)}
                  />
                  <span>{item.text}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer com Deadline, Seletor de Coluna e Lixeira */}
      <div className="task-card-footer">
        {hasDeadline ? (
          <div className={`task-card-deadline ${isOverdue ? 'alert' : ''}`}>
            <Calendar size={12} />
            <span>{deadlineLabel} {isOverdue && '(Atrasado)'}</span>
          </div>
        ) : (
          <div></div>
        )}

        <div className="task-card-actions">
          {/* Seletor Rápido de Coluna */}
          <select 
            className="column-shift-select" 
            value={task.status} 
            onChange={handleStatusChange}
          >
            {statuses.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            className="btn btn-sm btn-danger btn-circle"
            onClick={() => onDelete(task.id)}
            title="Excluir Tarefa"
            style={{ width: '26px', height: '26px' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
