/**
 * Serviço de Lembretes Nativos do Sistema Operacional (Notification API Bridge)
 */
class ReminderService {
  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Solicita permissão para exibir notificações nativas
   */
  async requestPermission() {
    if (!this.isSupported) return false;
    if (Notification.permission === 'granted') return true;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Verifica se a permissão já foi concedida
   */
  hasPermission() {
    return this.isSupported && Notification.permission === 'granted';
  }

  /**
   * Envia uma notificação nativa para o sistema operacional
   */
  sendNotification(title, options = {}) {
    if (!this.hasPermission()) {
      console.log(`[Notification Mocked]: ${title}`, options);
      return;
    }

    const notificationOptions = {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      ...options
    };

    // Tenta enviar via Service Worker (obrigatório para iOS PWA e Android Chrome mobile)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.showNotification(title, notificationOptions);
        })
        .catch((err) => {
          console.warn('[ReminderService] Falha ao enviar via Service Worker, usando fallback legado:', err);
          this.sendLegacyNotification(title, notificationOptions);
        });
    } else {
      this.sendLegacyNotification(title, notificationOptions);
    }
  }

  /**
   * Método de fallback herdado para navegadores desktop antigos
   */
  sendLegacyNotification(title, options) {
    try {
      new Notification(title, options);
    } catch (err) {
      console.error('[ReminderService] Falha no disparo de notificação legado:', err);
    }
  }

  /**
   * Disparador manual para fins de simulação imediata de alertas (conectado a botões do dashboard)
   */
  async triggerDemoNotification(type) {
    if (type === 'forgotten') {
      this.sendNotification('Ideia Inativa (Simulação) 💡', {
        body: 'Uma ideia criada anteriormente precisa de atenção no seu Inbox (sem revisões há mais de 4h).',
        tag: 'demo-forgotten'
      });
    } else if (type === 'daily') {
      this.sendNotification('Revisão Diária (Simulação) 📅', {
        body: 'Seu balanço diário consolidado está pronto. Clique para revisar suas metas!',
        tag: 'demo-daily'
      });
    }
  }
}

export const reminderService = new ReminderService();
export default reminderService;
