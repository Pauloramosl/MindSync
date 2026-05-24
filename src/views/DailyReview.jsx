import React, { useState, useEffect } from 'react';
import { useIdeas } from '../store/IdeasContext';
import { useTasks } from '../store/TasksContext';
import { reminderService } from '../services/reminderService';
import GlassCard from '../components/common/GlassCard';
import { Calendar, Bell, Sparkles, CheckSquare, Award } from 'lucide-react';
import './views.css';

export default function DailyReview() {
  const { rawIdeas } = useIdeas();
  const { tasks } = useTasks();
  const [stats, setStats] = useState({
    newIdeas: 0,
    completedIdeas: 0,
    openTasks: 0,
    doneTasks: 0
  });

  // Calcular estatísticas com base na data de hoje
  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startMs = todayStart.getTime();

    const newIdeasToday = rawIdeas.filter(i => i.createdAt >= startMs);
    const completedIdeasToday = rawIdeas.filter(i => i.status === 'completed' && i.updatedAt >= startMs);
    const openTasksToday = tasks.filter(t => t.status !== 'done');
    const doneTasksToday = tasks.filter(t => t.status === 'done' && t.createdAt >= startMs); // simplificado

    setStats({
      newIdeas: newIdeasToday.length,
      completedIdeas: completedIdeasToday.length,
      openTasks: openTasksToday.length,
      doneTasks: doneTasksToday.length,
      newIdeasItems: newIdeasToday,
      openTasksItems: openTasksToday
    });
  }, [rawIdeas, tasks]);

  // Gatilho de notificação nativa simulada (para testar na hora)
  const triggerDemoAlert = async (type) => {
    const hasPerm = await reminderService.requestPermission();
    if (hasPerm) {
      await reminderService.triggerDemoNotification(type);
    } else {
      alert("Permissão de notificação do navegador negada. Habilite-a para ver o lembrete disparar!");
    }
  };

  return (
    <div className="view-container">
      {/* Glowes Ambientais */}
      <div className="ambient-glow glow-primary" style={{ opacity: 0.1 }}></div>

      {/* Painel do Dashboard com Stats (Staggered Entry) */}
      <div className="review-stats-grid">
        <GlassCard className="stat-card highlight stagger-1">
          <span className="stat-card-label">Novas Ideias de Hoje</span>
          <span className="stat-card-value">{stats.newIdeas}</span>
        </GlassCard>

        <GlassCard className="stat-card stagger-2">
          <span className="stat-card-label">Tarefas Concluídas</span>
          <span className="stat-card-value">{stats.doneTasks}</span>
        </GlassCard>

        <GlassCard className="stat-card highlight stagger-3">
          <span className="stat-card-label">Tarefas Pendentes</span>
          <span className="stat-card-value">{stats.openTasks}</span>
        </GlassCard>

        <GlassCard className="stat-card stagger-4">
          <span className="stat-card-label">Ideias Concluídas</span>
          <span className="stat-card-value">{stats.completedIdeas}</span>
        </GlassCard>
      </div>

      {/* Simulador de Lembretes do Sistema Operacional (Stagger-5) */}
      <GlassCard className="stagger-5" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} style={{ color: 'var(--primary)' }} />
          Simulador de Lembretes & Notificações de IA
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Como os alertas de inatividade e revisões dependem do relógio biológico do SO, você pode forçar o disparo imediato das notificações nativas usando os botões abaixo para ver o sistema rodando na prática:
        </p>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => triggerDemoAlert('forgotten')}
          >
            Disparar: Ideia Esquecida (48h)
          </button>
          
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => triggerDemoAlert('daily')}
          >
            Disparar: Revisão Diária Agendada
          </button>
        </div>
      </GlassCard>

      {/* Relatório Detalhado das Atividades (Stagger-6) */}
      <GlassCard className="review-report-panel stagger-6">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} style={{ color: 'var(--secondary)' }} />
          Balanço Diário Resumido
        </h3>

        {/* 1. Ideias Capturadas Hoje */}
        <div className="review-report-section">
          <h4 className="review-report-section-title">
            <Sparkles size={16} style={{ color: 'var(--primary)' }} />
            Ideias Capturadas Hoje ({stats.newIdeas})
          </h4>
          
          {!stats.newIdeasItems || stats.newIdeasItems.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhuma ideia capturada hoje.</p>
          ) : (
            stats.newIdeasItems.map((item, index) => (
              <div key={item.id} className={`review-item-row stagger-${(index % 4) + 1}`}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>{item.title}</span>
                <span className="badge" style={{ fontSize: '0.65rem', background: 'var(--bg-primary)', flexShrink: 0 }}>
                  {item.type}
                </span>
              </div>
            ))
          )}
        </div>

        {/* 2. Tarefas Ativas no Kanban */}
        <div className="review-report-section">
          <h4 className="review-report-section-title">
            <CheckSquare size={16} style={{ color: 'var(--secondary)' }} />
            Tarefas Pendentes no Fluxo ({stats.openTasks})
          </h4>
          
          {!stats.openTasksItems || stats.openTasksItems.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhuma tarefa pendente no Kanban.</p>
          ) : (
            stats.openTasksItems.map((item, index) => (
              <div key={item.id} className={`review-item-row stagger-${(index % 4) + 1}`}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>{item.title}</span>
                <span className="badge" style={{ fontSize: '0.65rem', background: `var(--priority-${item.priority}-bg)`, color: `var(--priority-${item.priority})`, flexShrink: 0 }}>
                  {item.priority}
                </span>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>

  );
}
