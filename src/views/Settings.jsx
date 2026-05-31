import { useEffect, useState } from 'react';
import { useIdeas } from '../store/IdeasContext';
import { reminderService } from '../services/reminderService';
import { notificationService } from '../services/notificationService';
import { pushService } from '../services/pushService';
import GlassCard from '../components/common/GlassCard';
import { Bell, BellRing, BrainCircuit, ShieldAlert } from 'lucide-react';
import './views.css';

const permissionLabels = {
  granted: 'Permitido',
  denied: 'Bloqueado',
  default: 'Pendente',
  unsupported: 'Indisponivel'
};

const webPushLabels = {
  unsupported: 'Indisponivel',
  missingServer: 'Servidor pendente',
  subscribed: 'Web Push ativo',
  ready: 'Pronto para ativar'
};

export default function Settings() {
  const { settings, updateSettings } = useIdeas();
  const [notificationPermission, setNotificationPermission] = useState(() => reminderService.getPermissionStatus());
  const [webPushStatus, setWebPushStatus] = useState({
    supported: pushService.isSupported(),
    endpointAvailable: false,
    configured: false,
    subscribed: false
  });
  const [webPushBusy, setWebPushBusy] = useState(false);

  const syncPermissionStatus = () => {
    setNotificationPermission(reminderService.getPermissionStatus());
  };

  const refreshWebPushStatus = async () => {
    const status = await pushService.getStatus();
    setWebPushStatus(status);
    return status;
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) syncPermissionStatus();
    };

    window.addEventListener('focus', syncPermissionStatus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', syncPermissionStatus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!settings?.deviceId) return undefined;

    let isActive = true;

    pushService.getStatus().then((status) => {
      if (isActive) {
        setWebPushStatus(status);
      }
    });

    return () => {
      isActive = false;
    };
  }, [settings?.deviceId]);

  const activateWebPush = async () => {
    if (!settings?.deviceId) return false;

    setWebPushBusy(true);

    try {
      const hasPermission = await reminderService.requestPermission();
      syncPermissionStatus();

      if (!hasPermission) {
        window.alert('Permissao de notificacao negada. Libere as notificacoes do MindSync nas configuracoes do navegador.');
        return false;
      }

      const result = await pushService.subscribeDevice(settings.deviceId);
      await refreshWebPushStatus();

      if (!result.ok) {
        const message = result.reason === 'missing_vapid'
          ? 'Web Push ainda nao esta configurado no servidor. Configure as chaves VAPID na Netlify.'
          : 'Nao foi possivel registrar este dispositivo para Web Push agora.';
        window.alert(message);
        return false;
      }

      await updateSettings({ pushNotificationsEnabled: true });
      notificationService.queuePushScheduleSync(0);
      return true;
    } finally {
      setWebPushBusy(false);
    }
  };

  const handleRequestPermission = async () => {
    await activateWebPush();
  };

  const handleTestNotification = async () => {
    const active = await activateWebPush();
    if (!active || !settings?.deviceId) return;

    const serverTest = await pushService.sendTestPush(settings.deviceId);
    if (serverTest.ok) return;

    await reminderService.triggerDemoNotification('forgotten');
    window.alert('O teste local funcionou, mas o teste Web Push do servidor ainda nao foi concluido. Verifique as chaves VAPID e o ambiente Netlify.');
  };

  const handleTogglePushNotifications = async () => {
    if (!settings) return;

    const shouldEnable = settings.pushNotificationsEnabled === false;
    if (!shouldEnable) {
      await updateSettings({ pushNotificationsEnabled: false });
      await pushService.syncReminderSchedules(settings.deviceId, []);
      await pushService.unsubscribeDevice(settings.deviceId);
      await refreshWebPushStatus();
      return;
    }

    await activateWebPush();
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
        <p>Carregando preferencias locais...</p>
      </div>
    );
  }

  const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terca-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sabado' }
  ];

  const permissionLabel = permissionLabels[notificationPermission] || permissionLabels.default;
  const permissionColor = notificationPermission === 'granted' ? 'var(--status-done)' : 'var(--priority-high)';
  const pushEnabled = settings.pushNotificationsEnabled !== false;
  const webPushLabel = !webPushStatus.supported
    ? webPushLabels.unsupported
    : !webPushStatus.configured
      ? webPushLabels.missingServer
      : webPushStatus.subscribed
        ? webPushLabels.subscribed
        : webPushLabels.ready;
  const webPushColor = webPushStatus.subscribed ? 'var(--status-done)' : 'var(--text-muted)';

  return (
    <div className="view-container">
      <div className="ambient-glow glow-secondary" style={{ opacity: 0.08 }}></div>

      <div className="settings-grid">
        <GlassCard className="settings-group">
          <h3 className="settings-title">
            <BrainCircuit size={18} style={{ color: 'var(--primary)', marginRight: '8px', verticalAlign: 'middle' }} />
            Motor de Inteligencia Artificial
          </h3>

          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Classificacao Automatica de Ideias</span>
              <p className="settings-desc">
                Quando ativado, a IA interpreta suas ideias brutas assim que salvas, sugerindo titulos resumidos, niveis de prioridade e tags de contexto automaticamente.
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

        <GlassCard className="settings-group">
          <h3 className="settings-title">
            <Bell size={18} style={{ color: 'var(--secondary)', marginRight: '8px', verticalAlign: 'middle' }} />
            Agendamentos & Lembretes
          </h3>

          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Notificacoes do Navegador / SO</span>
              <p className="settings-desc">
                Status atual: <strong style={{ color: permissionColor }}>{permissionLabel}</strong>. Push servidor: <strong style={{ color: webPushColor }}>{webPushLabel}</strong>.
              </p>
            </div>
            <div className="settings-control">
              {notificationPermission === 'granted' ? (
                <button
                  className="btn btn-sm btn-secondary notification-action-btn"
                  onClick={handleTestNotification}
                  disabled={webPushBusy}
                >
                  <BellRing size={14} />
                  Testar
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-primary notification-action-btn"
                  onClick={handleRequestPermission}
                  disabled={notificationPermission === 'unsupported' || webPushBusy}
                >
                  <Bell size={14} />
                  Permitir
                </button>
              )}
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Intervalo de Alerta para Itens Esquecidos</span>
              <p className="settings-desc">
                Tempo limite de inatividade para avisar que uma ideia ou tarefa pendente precisa ser verificada.
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

          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Horario de Revisao Diaria</span>
              <p className="settings-desc">
                Dispara um resumo de ideias criadas, tarefas concluidas e pendencias do dia.
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

          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Dia da Revisao Semanal</span>
              <p className="settings-desc">
                Dia programado para consolidacao geral das suas atividades e planejamento semanal.
              </p>
            </div>
            <div className="settings-control">
              <select
                className="settings-input"
                value={settings.weeklyReviewDay}
                onChange={handleWeeklyDayChange}
              >
                {daysOfWeek.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Revisao Semanal Habilitada</span>
              <p className="settings-desc">
                Quando ativado, o MindSync consolida conquistas e metas no dia configurado.
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

          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Alertar Lembretes de Itens Esquecidos</span>
              <p className="settings-desc">
                Ativa o scanner que identifica ideias ou tarefas abandonadas sem alteracao.
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

          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Notificacoes Push do Sistema</span>
              <p className="settings-desc">
                Permite que os lembretes agendados aparecam como alertas nativos no dispositivo.
              </p>
            </div>
            <div className="settings-control">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={handleTogglePushNotifications}
                  disabled={webPushBusy}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Captura por Voz Ativada</span>
              <p className="settings-desc">
                Habilita a simulacao fisica de microfone na barra de captura do Inbox.
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

          <div className="settings-row">
            <div className="settings-info">
              <span className="settings-label">Idioma do Sistema</span>
              <p className="settings-desc">
                Altera o idioma da interface de captura e das analises semanticas da IA.
              </p>
            </div>
            <div className="settings-control">
              <select
                className="settings-input"
                value={settings.language || 'pt-BR'}
                onChange={(e) => updateSettings({ language: e.target.value })}
              >
                <option value="pt-BR">Portugues (pt-BR)</option>
                <option value="en-US">English (en-US)</option>
                <option value="es-ES">Espanol (es-ES)</option>
              </select>
            </div>
          </div>
        </GlassCard>

        <div className="privacy-note">
          <ShieldAlert size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
          <p>
            <strong>Nota de Privacidade:</strong> MindSync funciona Offline-First. Ao ativar Web Push, o servidor guarda apenas a inscricao do dispositivo e metadados minimos dos lembretes necessarios para disparar alertas com o app fechado.
          </p>
        </div>
      </div>
    </div>
  );
}
