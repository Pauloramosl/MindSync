import React, { useState, useEffect } from 'react';
import { useIdeas } from '../store/IdeasContext';
import { reminderService } from '../services/reminderService';
import GlassCard from '../components/common/GlassCard';
import { Sliders, Bell, BrainCircuit, ShieldAlert } from 'lucide-react';
import './views.css';

export default function Settings() {
  const { settings, updateSettings } = useIdeas();
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Tratamento da permissão de notificação nativa
  const handleRequestPermission = async () => {
    const perm = await reminderService.requestPermission();
    if (typeof Notification !== 'undefined') {
      setNotificationPermission(Notification.permission);
    }
  };

  const handleToggleIA = () => {
    if (!settings) return;
    updateSettings({ aiAutoCategorization: !settings.aiAutoCategorization });
  };

  const handleTimeChange = (e) => {
    if (!settings) return;
    updateSettings({ dailyReviewTime: e.target.value });
  };

  const handleForgottenHoursChange = (e) => {
    if (!settings) return;
    updateSettings({ forgottenIdeasTime: parseInt(e.target.value, 10) });
  };

  const handleWeeklyDayChange = (e) => {
    if (!settings) return;
    updateSettings({ weeklyReviewDay: parseInt(e.target.value, 10) });
  };

  if (!settings) {
    return (
      <div className="view-container">
        <p>Carregando preferências locais...</p>
      </div>
    );
  }

  const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' }
  ];

  return (
    <div className="view-container">
      <div className="ambient-glow glow-secondary" style={{ opacity: 0.08 }}></div>

      <div className="settings-grid">
        
        {/* GRUPO 1: INTELIGÊNCIA ARTIFICIAL */}
        <GlassCard className="settings-group">
          <h3 className="settings-title">
            <BrainCircuit size={18} style={{ color: 'var(--primary)', marginRight: '8px', verticalAlign: 'middle' }} />
            Motor de Inteligência Artificial
          </h3>

          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Classificação Automática de Ideias</span>
              <p className="settings-desc">
                Quando ativado, a IA interpreta suas ideias brutas assim que salvas, sugerindo títulos resumidos, níveis de prioridade e tags de contexto automaticamente.
              </p>
            </div>
            <div className="settings-control">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.aiAutoCategorization}
                  onChange={handleToggleIA}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </GlassCard>

        {/* GRUPO 2: LEMBRETES DO SISTEMA */}
        <GlassCard className="settings-group">
          <h3 className="settings-title">
            <Bell size={18} style={{ color: 'var(--secondary)', marginRight: '8px', verticalAlign: 'middle' }} />
            Agendamentos & Lembretes
          </h3>

          {/* Notificação no SO */}
          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Notificações do Navegador / SO</span>
              <p className="settings-desc">
                Status atual: <strong style={{ color: notificationPermission === 'granted' ? 'var(--status-done)' : 'var(--priority-high)' }}>
                  {notificationPermission === 'granted' ? 'Permitido' : 'Bloqueado/Pendente'}
                </strong>. Habilite para receber os lembretes do scanner em background.
              </p>
            </div>
            <div className="settings-control">
              {notificationPermission !== 'granted' ? (
                <button className="btn btn-sm btn-primary" onClick={handleRequestPermission}>
                  Permitir
                </button>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ativo ✔</span>
              )}
            </div>
          </div>

          {/* Ideias Esquecidas */}
          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Intervalo de Alerta para Ideias Esquecidas</span>
              <p className="settings-desc">
                Tempo limite de inatividade (sem edições) para a IA notificar que uma ideia nova precisa ser revisada no Inbox.
              </p>
            </div>
            <div className="settings-control">
              <select
                className="settings-input"
                value={settings.forgottenIdeasTime}
                onChange={handleForgottenHoursChange}
              >
                <option value={1}>1 hora</option>
                <option value={2}>2 horas</option>
                <option value={4}>4 horas</option>
                <option value={8}>8 horas</option>
                <option value={12}>12 horas</option>
                <option value={24}>24 horas</option>
                <option value={48}>48 horas</option>
                <option value={72}>72 horas</option>
              </select>
            </div>
          </div>

          {/* Horário da Revisão Diária */}
          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Horário de Revisão Diária</span>
              <p className="settings-desc">
                Dispara um resumo detalhado de ideias criadas, tarefas concluídas e pendências do dia.
              </p>
            </div>
            <div className="settings-control">
              <input
                type="time"
                className="settings-input"
                value={settings.dailyReviewTime}
                onChange={handleTimeChange}
              />
            </div>
          </div>

          {/* Dia da Revisão Semanal */}
          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Dia da Revisão Semanal</span>
              <p className="settings-desc">
                Dia programado para consolidação geral das suas atividades e planejamento semanal.
              </p>
            </div>
            <div className="settings-control">
              <select
                className="settings-input"
                value={settings.weeklyReviewDay}
                onChange={handleWeeklyDayChange}
              >
                {daysOfWeek.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Revisão Semanal Ativada */}
          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Revisão Semanal Habilitada</span>
              <p className="settings-desc">
                Quando ativado, a IA consolidará suas conquistas e metas semanais todos os domingos.
              </p>
            </div>
            <div className="settings-control">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.weeklyReviewEnabled !== false}
                  onChange={() => updateSettings({ weeklyReviewEnabled: !settings.weeklyReviewEnabled })}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Habilitar Scanner de Ideias Esquecidas */}
          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Alertar Lembretes de Ideias</span>
              <p className="settings-desc">
                Ativa o scanner que avisa quando há capturas abandonadas no Inbox sem revisão.
              </p>
            </div>
            <div className="settings-control">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.forgottenIdeasEnabled !== false}
                  onChange={() => updateSettings({ forgottenIdeasEnabled: !settings.forgottenIdeasEnabled })}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Notificações Push Ativadas */}
          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Notificações Push do Sistema</span>
              <p className="settings-desc">
                Permite enviar resumos de IA e prazos em segundo plano para o seu SO.
              </p>
            </div>
            <div className="settings-control">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.pushNotificationsEnabled !== false}
                  onChange={() => updateSettings({ pushNotificationsEnabled: !settings.pushNotificationsEnabled })}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Captura de voz Habilitada */}
          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Captura por Voz Ativada</span>
              <p className="settings-desc">
                Habilita a simulação física de microfone na barra de captura do Inbox.
              </p>
            </div>
            <div className="settings-control">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.voiceCaptureEnabled !== false}
                  onChange={() => updateSettings({ voiceCaptureEnabled: !settings.voiceCaptureEnabled })}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Idioma da Interface */}
          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Idioma do Sistema</span>
              <p className="settings-desc">
                Altera o idioma da interface de captura e das análises semânticas da IA.
              </p>
            </div>
            <div className="settings-control">
              <select
                className="settings-input"
                value={settings.language || 'pt-BR'}
                onChange={(e) => updateSettings({ language: e.target.value })}
              >
                <option value="pt-BR">Português (pt-BR)</option>
                <option value="en-US">English (en-US)</option>
                <option value="es-ES">Español (es-ES)</option>
              </select>
            </div>
          </div>

        </GlassCard>
 
         {/* NOTA DE PRIVACIDADE */}
         <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
           <ShieldAlert size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
           <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
             <strong>Nota de Privacidade:</strong> MindSync funciona sob arquitetura Offline-First. Toda inteligência, metadados e conteúdos de ideias são persistidos de forma segura no IndexedDB no seu navegador local. Seus dados nunca saem do seu dispositivo sem a sua autorização.
           </p>
         </div>


      </div>
    </div>
  );
}
