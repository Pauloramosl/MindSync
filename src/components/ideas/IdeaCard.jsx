import React, { useState } from 'react';
import { Trash2, Sparkles, ClipboardCopy, Archive, CheckCircle, Loader2 } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import './ideas.css';

export default function IdeaCard({ idea, onDelete, onTransform, onStatusChange }) {
  const [cardState, setCardState] = useState('idle'); // 'idle' | 'completing' | 'archived' | 'deleting'

  // Formatar data local de criação
  const formattedDate = new Date(idea.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Tradução amigável dos termos
  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente'
  };

  const [isDragging, setIsDragging] = useState(false);

  // Interceptadores para Animações Premium
  const handleComplete = () => {
    setCardState('completing');
    setTimeout(() => {
      onStatusChange(idea.id, 'completed');
    }, 400); // 400ms matching transition spec
  };

  const handleArchive = () => {
    setCardState('archived');
    setTimeout(() => {
      onStatusChange(idea.id, 'archived');
    }, 400);
  };

  const handleDelete = () => {
    setCardState('deleting');
    setTimeout(() => {
      onDelete(idea.id);
    }, 400);
  };

  // Drag and Drop Handlers locais
  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', idea.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const isAnimating = cardState !== 'idle';

  return (
    <GlassCard 
      className={`idea-card priority-${idea.priority} status-${idea.status} card-state-${cardState} ${isDragging ? 'dragging' : ''} animate-fade-in`}
      interactive={!isAnimating}
      draggable={!isAnimating}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >

      {/* Overlay de Conclusão / Salvamento com Glow */}
      {cardState === 'completing' && (
        <div className="card-animation-overlay success">
          <CheckCircle size={28} className="pulse-animation" style={{ color: 'var(--status-done)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--status-done)' }}>Processado!</span>
        </div>
      )}

      {cardState === 'deleting' && (
        <div className="card-animation-overlay delete">
          <Trash2 size={24} className="pulse-animation" style={{ color: 'var(--priority-urgent)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--priority-urgent)' }}>Excluindo...</span>
        </div>
      )}

      {cardState === 'archived' && (
        <div className="card-animation-overlay archive">
          <Archive size={24} className="pulse-animation" style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Arquivando...</span>
        </div>
      )}

      <div className="idea-card-header" style={{ opacity: isAnimating ? 0.15 : 1, transition: 'opacity 0.25s' }}>
        <h3 className="idea-card-title">{idea.title}</h3>
        <span 
          className={`badge`} 
          style={{ 
            fontSize: '0.65rem', 
            background: `var(--priority-${idea.priority}-bg)`,
            color: `var(--priority-${idea.priority})`
          }}
        >
          {priorityLabels[idea.priority]}
        </span>
      </div>

      <p className="idea-card-description" style={{ opacity: isAnimating ? 0.15 : 1, transition: 'opacity 0.25s' }}>
        {idea.description}
      </p>

      {/* Exibir Resumo Inteligente se Processado */}
      {idea.aiSummary && idea.status !== 'transformed' && (
        <div className="idea-card-ai-bubble" style={{ opacity: isAnimating ? 0.15 : 1, transition: 'opacity 0.25s' }}>
          <span className="idea-card-ai-badge">
            <Sparkles size={8} style={{ marginRight: '2px', display: 'inline' }} />
            IA Resumo
          </span>
          <p style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>"{idea.aiSummary}"</p>
        </div>
      )}

      {/* Tags de Categoria */}
      {idea.tags && idea.tags.length > 0 && (
        <div className="idea-card-tags" style={{ opacity: isAnimating ? 0.15 : 1, transition: 'opacity 0.25s' }}>
          {idea.tags.map(tag => {
            const normalized = tag.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const tagClass = `tag-${normalized}`;
            return (
              <span key={tag} className={`tag-pill ${tagClass}`}>
                {tag}
              </span>
            );
          })}
        </div>
      )}

      {/* Footer com Ações */}
      <div className="idea-card-footer" style={{ opacity: isAnimating ? 0.15 : 1, transition: 'opacity 0.25s' }}>
        <span className="idea-card-date">{formattedDate}</span>
        
        <div className="idea-card-actions">
          {idea.status !== 'transformed' && idea.status !== 'completed' && (
            <button
              className="btn btn-sm btn-primary btn-circle"
              onClick={() => onTransform(idea)}
              title="Transformar em Tarefa Executável"
              disabled={isAnimating}
            >
              <ClipboardCopy size={14} />
            </button>
          )}

          {idea.status !== 'completed' && idea.status !== 'transformed' && (
            <button
              className="btn btn-sm btn-glass btn-circle"
              onClick={handleComplete}
              title="Marcar como Concluída"
              style={{ color: 'var(--status-done)' }}
              disabled={isAnimating}
            >
              <CheckCircle size={14} />
            </button>
          )}

          {idea.status !== 'archived' && (
            <button
              className="btn btn-sm btn-glass btn-circle"
              onClick={handleArchive}
              title="Arquivar Ideia"
              disabled={isAnimating}
            >
              <Archive size={14} />
            </button>
          )}

          <button
            className="btn btn-sm btn-danger btn-circle"
            onClick={handleDelete}
            title="Excluir Permanentemente"
            disabled={isAnimating}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
