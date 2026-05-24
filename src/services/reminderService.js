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

    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    } catch (err) {
      console.error('Falha ao disparar notificação:', err);
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
