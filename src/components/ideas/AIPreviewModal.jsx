import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, X, Calendar, CheckSquare, BrainCircuit } from 'lucide-react';
import { generateTasksFromIdea } from '../../services/aiService';
import '../common/common.css';
import './ideas.css';

export default function AIPreviewModal({ idea, onClose, onConfirm }) {
  const [loading, setLoading] = useState(true);
  const [aiState, setAiState] = useState('analisando'); // 'analisando' | 'classificando' | 'relacionando' | 'convertendo'
  const [taskDraft, setTaskDraft] = useState({
    title: '',
    description: '',
    priority: 'medium',
    deadline: '',
    checklist: []
  });
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Carrega a decomposição inteligente da IA ao montar o modal com os estados dinâmicos
  useEffect(() => {
    async function fetchAIDecomposition() {
      try {
        setLoading(true);
        setAiState('analisando');
        
        // Simulação suave e premium dos estados da IA para wow-factor
        await new Promise(r => setTimeout(r, 700));
        setAiState('classificando');
        
        await new Promise(r => setTimeout(r, 700));
        setAiState('relacionando');
        
        await new Promise(r => setTimeout(r, 700));
        setAiState('convertendo');
        
        await new Promise(r => setTimeout(r, 600));

        const aiSuggestedTask = await generateTasksFromIdea(idea.title, idea.description);
        
        setTaskDraft({
          title: aiSuggestedTask.title,
          description: aiSuggestedTask.description,
          priority: aiSuggestedTask.priority,
          deadline: '',
          checklist: aiSuggestedTask.checklist
        });
      } catch (err) {
        console.error('Erro na decomposição da IA:', err);
      } finally {
        setLoading(false);
      }
    }

    if (idea) {
      fetchAIDecomposition();
    }
  }, [idea]);

  // Manipulação do rascunho
  const handleChange = (field, value) => {
    setTaskDraft(prev => ({ ...prev, [field]: value }));
  };

  // Toggle de itens do checklist
  const handleToggleCheckItem = (itemId) => {
    setTaskDraft(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  // Remoção de itens do checklist
  const handleRemoveCheckItem = (itemId) => {
    setTaskDraft(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== itemId)
    }));
  };

  // Adição manual de novos itens ao checklist
  const handleAddCheckItem = (e) => {
    if (e) e.preventDefault();
    if (!newChecklistItem.trim()) return;

    const newItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: newChecklistItem.trim(),
      completed: false
    };

    setTaskDraft(prev => ({
      ...prev,
      checklist: [...prev.checklist, newItem]
    }));
    setNewChecklistItem('');
  };

  // Envio final para salvamento
  const handleApprove = () => {
    if (!taskDraft.title.trim()) return;

    // Converter deadline string para timestamp se existir
    const deadlineTimestamp = taskDraft.deadline ? new Date(taskDraft.deadline).getTime() : null;

    onConfirm({
      title: taskDraft.title,
      description: taskDraft.description,
      priority: taskDraft.priority,
      deadline: deadlineTimestamp,
      checklist: taskDraft.checklist
    });
  };

  // Mapear labels legíveis para o estado da IA
  const getAiStateLabel = () => {
    switch (aiState) {
      case 'analisando':
        return 'Analisando ideia capturada';
      case 'classificando':
        return 'Classificando nível de prioridade';
      case 'relacionando':
        return 'Relacionando termos & categorias';
      case 'convertendo':
        return 'Convertendo em plano de ação';
      default:
        return 'Pensando';
    }
  };

  return (
    <div className="modal-overlay">
      <div className={`modal-content glass-panel ai-energy-panel ${loading ? 'ai-processing-active' : ''}`}>
        <button className="modal-close-btn" onClick={onClose} title="Fechar">
          <X size={18} />
        </button>

        <div className="modal-header">
          <BrainCircuit className="sidebar-logo-icon" size={24} style={{ color: 'var(--secondary)' }} />
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Triagem IA MindSync
            {loading && <span className="ai-beam-glow"></span>}
          </h2>
        </div>

        <div className="modal-body">
          {loading ? (
            // Interface de Processamento da IA Premium
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '32px 0' }}>
              <div className="ai-dots-glow-container">
                <div className="ai-dots-pulse"></div>
                <BrainCircuit size={48} className="ai-pulse-logo" />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {getAiStateLabel()}
                </p>
                <div className="thinking-dots-row">
                  <span className="dot-thinking"></span>
                  <span className="dot-thinking"></span>
                  <span className="dot-thinking"></span>
                </div>
              </div>

              <div className="ai-progress-bar-container">
                <div className={`ai-progress-bar-fill ${aiState}`}></div>
              </div>
            </div>
          ) : (
            // Editor da Tarefa Gerada pela IA com Entradas Staggered
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="preview-field-group animate-fade-in stagger-1">
                <label className="preview-label">Título da Tarefa</label>
                <input 
                  type="text" 
                  className="preview-value-title"
                  value={taskDraft.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                />
              </div>

              <div className="preview-field-group animate-fade-in stagger-2">
                <label className="preview-label">Descrição / Contexto de IA</label>
                <textarea 
                  className="preview-value-desc"
                  value={taskDraft.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>

              <div className="preview-field-group animate-fade-in stagger-3">
                <label className="preview-label">Prioridade da Tarefa</label>
                <div className="priority-select-row">
                  {['low', 'medium', 'high', 'urgent'].map(p => {
                    const labels = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' };
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`priority-select-btn ${p} ${taskDraft.priority === p ? 'active' : ''}`}
                        onClick={() => handleChange('priority', p)}
                      >
                        {labels[p]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="preview-field-group animate-fade-in stagger-4">
                <label className="preview-label">Prazo de Entrega (Opcional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="date"
                    style={{ background: 'transparent', border: 'none', width: '100%', fontSize: '0.85rem' }}
                    value={taskDraft.deadline}
                    onChange={(e) => handleChange('deadline', e.target.value)}
                  />
                </div>
              </div>

              <div className="preview-field-group animate-fade-in stagger-5">
                <label className="preview-label">Plano de Ações Sugerido (Checklist)</label>
                
                <div className="ai-modal-checklist">
                  {taskDraft.checklist.map((item, idx) => (
                    <div 
                      key={item.id} 
                      className="animate-fade-in"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        padding: '6px 8px', 
                        background: 'var(--bg-primary)', 
                        border: '1px solid var(--glass-border)', 
                        borderRadius: 'var(--radius-sm)',
                        animationDelay: `${idx * 60}ms`
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={item.completed} 
                        onChange={() => handleToggleCheckItem(item.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span 
                        style={{ 
                          fontSize: '0.85rem', 
                          flexGrow: 1, 
                          textDecoration: item.completed ? 'line-through' : 'none', 
                          color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)' 
                        }}
                      >
                        {item.text}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCheckItem(item.id)}
                        style={{ color: 'var(--priority-urgent)', opacity: 0.7 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="checklist-input-row">
                  <input 
                    type="text" 
                    placeholder="Adicionar passo de ação..." 
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCheckItem(e); }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-sm btn-primary"
                    onClick={handleAddCheckItem}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleApprove}
            disabled={loading || !taskDraft.title.trim()}
          >
            Aprovar e Criar Tarefa
          </button>
        </div>
      </div>
    </div>
  );
}
