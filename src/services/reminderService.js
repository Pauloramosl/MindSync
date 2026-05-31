/**
 * Servico de lembretes nativos do sistema operacional.
 * O disparo real acontece pela Notification API e, quando disponivel,
 * pelo Service Worker para comportamento consistente em desktop e PWA mobile.
 */
class ReminderService {
  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermissionStatus() {
    if (!this.isSupported) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Solicita permissao para exibir notificacoes nativas.
   * Navegadores modernos exigem que isto seja chamado por uma acao do usuario.
   */
  async requestPermission() {
    if (!this.isSupported) return false;
    if (Notification.permission === 'granted') return true;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.warn('[ReminderService] Permissao de notificacao nao pode ser solicitada agora:', err);
      return false;
    }
  }

  hasPermission() {
    return this.isSupported && Notification.permission === 'granted';
  }

  /**
   * Envia uma notificacao nativa com visual e comportamento proximo a apps de mensagem:
   * tag para agrupar, renotify, vibracao no mobile, icone do app e dados para abrir a tela certa.
   */
  async sendNotification(title, options = {}) {
    if (!this.hasPermission()) {
      console.log(`[Notification Mocked]: ${title}`, options);
      return false;
    }

    const notificationOptions = {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      dir: 'auto',
      lang: 'pt-BR',
      renotify: true,
      requireInteraction: false,
      silent: false,
      timestamp: Date.now(),
      vibrate: [160, 80, 160],
      ...options
    };

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, notificationOptions);
        return true;
      } catch (err) {
        console.warn('[ReminderService] Falha ao enviar via Service Worker, usando fallback legado:', err);
        return this.sendLegacyNotification(title, notificationOptions);
      }
    }

    return this.sendLegacyNotification(title, notificationOptions);
  }

  sendLegacyNotification(title, options) {
    try {
      const notification = new Notification(title, options);
      notification.onclick = () => {
        const targetUrl = options.data?.url || '/';
        window.focus();
        window.location.assign(targetUrl);
        notification.close();
      };
      return true;
    } catch (err) {
      console.error('[ReminderService] Falha no disparo de notificacao legado:', err);
      return false;
    }
  }

  /**
   * Disparador manual para simulacao imediata de alertas.
   */
  async triggerDemoNotification(type) {
    if (type === 'forgotten') {
      return this.sendNotification('Ideia inativa no MindSync', {
        body: 'Uma ideia capturada precisa de atencao no Inbox. Toque para verificar.',
        tag: 'mindsync-demo-forgotten',
        data: {
          view: 'brainstorm',
          targetType: 'idea',
          targetId: 'demo-forgotten',
          url: '/?view=brainstorm'
        }
      });
    }

    if (type === 'daily') {
      return this.sendNotification('Revisao diaria pronta', {
        body: 'Seu balanco diario esta pronto. Toque para revisar ideias, tarefas e pendencias.',
        tag: 'mindsync-demo-daily',
        data: {
          view: 'review',
          targetType: 'daily_review',
          targetId: 'demo-daily',
          url: '/?view=review'
        }
      });
    }

    return false;
  }
}

export const reminderService = new ReminderService();
export default reminderService;
