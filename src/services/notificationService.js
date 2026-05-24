import { db } from '../database/db';
import { ideaRepository } from '../repositories/ideaRepository';
import { taskRepository } from '../repositories/taskRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { reviewRepository } from '../repositories/reviewRepository';
import { userPreferenceService } from './userPreferenceService';
import { reminderService } from './reminderService';

class NotificationService {
  constructor() {
    this.scannerId = null;
  }

  /**
   * Inicializa o loop de checagem inteligente de lembretes e prazos (roda a cada 30 segundos)
   */
  startBackgroundScanner() {
    if (this.scannerId) clearInterval(this.scannerId);

    // Primeira varredura rápida após 2s
    setTimeout(() => this.runScannerTick(), 2000);

    this.scannerId = setInterval(() => {
      this.runScannerTick();
    }, 30000); // 30 segundos

    console.log('[Notification Service]: Scanner em segundo plano inicializado.');
  }

  stopBackgroundScanner() {
    if (this.scannerId) {
      clearInterval(this.scannerId);
      this.scannerId = null;
    }
  }

  async runScannerTick() {
    try {
      const preferences = await userPreferenceService.getPreferences();
      if (!preferences) return;

      const now = Date.now();

      // 1. Scanner de Ideias Esquecidas (padrão 4 horas)
      if (preferences.forgottenIdeasTime > 0) {
        await this.scanForgottenIdeas(preferences, now);
      }

      // 2. Scanner de Tarefas com Deadline ou ReminderAt
      await this.scanTaskDeadlines(now);

      // 3. Checagem de Lembretes de Revisão Diária (padrão 20:00)
      await this.checkDailyReviewTrigger(preferences, now);

      // 4. Checagem de Lembretes de Revisão Semanal (padrão Domingo às 18:00)
      if (preferences.weeklyReviewEnabled) {
        await this.checkWeeklyReviewTrigger(preferences, now);
      }

      // 5. Despachar notificações agendadas e pendentes que caíram no prazo
      await this.dispatchPendingNotifications(now);

    } catch (err) {
      console.error('[Notification Service]: Falha na execução do scanner tick:', err);
    }
  }

  /**
   * Varre por ideias inativas e gera alertas
   */
  async scanForgottenIdeas(preferences, now) {
    const thresholdHours = preferences.forgottenIdeasTime || 4;
    const thresholdMs = thresholdHours * 60 * 60 * 1000;

    // Busca todas as ideias pendentes no Inbox
    const allIdeas = await db.ideas
      .where('status')
      .anyOf(['new', 'review'])
      .toArray();

    const forgotten = allIdeas.filter(idea => {
      const timePassed = now - idea.updatedAt;
      return timePassed >= thresholdMs && !idea.isArchived;
    });

    for (const idea of forgotten) {
      // Evita duplicar notificações para a mesma ideia no mesmo dia
      const todayStr = new Date().toDateString();
      const existing = await db.notifications
        .where('targetId')
        .equals(idea.id)
        .filter(n => n.type === 'idea_reminder' && new Date(n.createdAt).toDateString() === todayStr)
        .first();

      if (!existing) {
        const title = 'Ideia Esquecida! 💡';
        const body = `Você capturou a ideia "${idea.title}" há mais de ${thresholdHours} horas e ela continua pendente de revisão.`;
        
        await notificationRepository.add({
          userId: 'user-default-123',
          targetType: 'idea',
          targetId: idea.id,
          title,
          body,
          type: 'idea_reminder',
          status: 'scheduled',
          scheduledAt: now,
          createdAt: now
        });
      }
    }
  }

  /**
   * Varre por prazos de tarefas iminentes
   */
  async scanTaskDeadlines(now) {
    const tasks = await db.tasks.toArray();
    
    // Filtra tarefas ativas com prazo ou lembrete nos próximos 15 minutos
    const limitAhead = 15 * 60 * 1000;

    const nearTasks = tasks.filter(task => {
      if (task.status === 'done' || task.isArchived) return false;
      
      const deadline = task.deadline;
      const reminderAt = task.reminderAt;

      // Alerta se o prazo está a menos de 15 minutos ou se o reminderAt já passou
      const matchesDeadline = deadline && (deadline - now > 0) && (deadline - now <= limitAhead);
      const matchesReminder = reminderAt && (reminderAt - now > 0) && (reminderAt - now <= limitAhead);

      return matchesDeadline || matchesReminder;
    });

    for (const task of nearTasks) {
      const todayStr = new Date().toDateString();
      const existing = await db.notifications
        .where('targetId')
        .equals(task.id)
        .filter(n => n.type === 'task_reminder' && new Date(n.createdAt).toDateString() === todayStr)
        .first();

      if (!existing) {
        const title = 'Prazo de Tarefa Iminente! 📅';
        const body = `A tarefa "${task.title}" está com prazo próximo. Não se esqueça de concluir!`;

        await notificationRepository.add({
          userId: 'user-default-123',
          targetType: 'task',
          targetId: task.id,
          title,
          body,
          type: 'task_reminder',
          status: 'scheduled',
          scheduledAt: now,
          createdAt: now
        });
      }
    }
  }

  /**
   * Consolida estatísticas e dispara a Revisão Diária agendada
   */
  async checkDailyReviewTrigger(preferences, now) {
    const nowDate = new Date(now);
    const dailyReviewTimeStr = preferences.dailyReviewTime || '20:00';
    const currentHourMin = `${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`;

    if (currentHourMin === dailyReviewTimeStr) {
      const lastTrigger = localStorage.getItem('last_daily_review_trigger');
      const todayStr = nowDate.toDateString();

      if (lastTrigger !== todayStr) {
        localStorage.setItem('last_daily_review_trigger', todayStr);

        // Consolidação de estatísticas locais de hoje
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const startMs = todayStart.getTime();

        const allIdeas = await db.ideas.toArray();
        const allTasks = await db.tasks.toArray();

        const newIdeasCount = allIdeas.filter(i => i.createdAt >= startMs).length;
        const completedIdeasCount = allIdeas.filter(i => i.status === 'completed' && i.updatedAt >= startMs).length;
        const openTasksCount = allTasks.filter(t => t.status !== 'done').length;
        const completedTasksCount = allTasks.filter(t => t.status === 'done' && t.createdAt >= startMs).length;
        
        // Criar registro na tabela daily_reviews
        const reviewRecord = await reviewRepository.addDailyReview({
          userId: 'user-default-123',
          date: todayStr,
          totalIdeas: newIdeasCount,
          completedIdeas: completedIdeasCount,
          openTasks: openTasksCount,
          completedTasks: completedTasksCount,
          pendingReminders: 0
        });

        // Adicionar notificação para despacho
        await notificationRepository.add({
          userId: 'user-default-123',
          targetType: 'daily_review',
          targetId: reviewRecord.id || `review-${Date.now()}`,
          title: 'Sua Revisão Diária está pronta! 📊',
          body: `Você capturou ${newIdeasCount} ideias e concluiu ${completedTasksCount} tarefas hoje. Clique para fazer seu balanço diário.`,
          type: 'daily_review',
          status: 'scheduled',
          scheduledAt: now,
          createdAt: now
        });
      }
    }
  }

  /**
   * Consolida estatísticas e dispara a Revisão Semanal agendada
   */
  async checkWeeklyReviewTrigger(preferences, now) {
    const nowDate = new Date(now);
    const weeklyReviewDay = preferences.weeklyReviewDay ?? 0; // 0 = Domingo
    const weeklyReviewTimeStr = preferences.weeklyReviewTime || '18:00';
    const currentHourMin = `${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`;

    if (nowDate.getDay() === weeklyReviewDay && currentHourMin === weeklyReviewTimeStr) {
      const lastTriggerWeekly = localStorage.getItem('last_weekly_review_trigger');
      const todayStr = nowDate.toDateString();

      if (lastTriggerWeekly !== todayStr) {
        localStorage.setItem('last_weekly_review_trigger', todayStr);

        // Consolidação de estatísticas da semana (últimos 7 dias)
        const weekStartMs = now - 7 * 24 * 60 * 60 * 1000;

        const allIdeas = await db.ideas.toArray();
        const allTasks = await db.tasks.toArray();

        const weeklyNewIdeas = allIdeas.filter(i => i.createdAt >= weekStartMs).length;
        const weeklyCompletedIdeas = allIdeas.filter(i => i.status === 'completed' && i.updatedAt >= weekStartMs).length;
        const weeklyOpenTasks = allTasks.filter(t => t.status !== 'done').length;
        const weeklyCompletedTasks = allTasks.filter(t => t.status === 'done' && t.createdAt >= weekStartMs).length;

        // Criar registro na tabela weekly_reviews
        const reviewRecord = await reviewRepository.addWeeklyReview({
          userId: 'user-default-123',
          weekStart: weekStartMs,
          weekEnd: now,
          totalIdeas: weeklyNewIdeas,
          completedIdeas: weeklyCompletedIdeas,
          openTasks: weeklyOpenTasks,
          completedTasks: weeklyCompletedTasks,
          remindersTriggered: 0
        });

        // Adicionar notificação para despacho
        await notificationRepository.add({
          userId: 'user-default-123',
          targetType: 'weekly_review',
          targetId: reviewRecord.id || `weekly-${Date.now()}`,
          title: 'Balanço Semanal Disponível! 📈',
          body: `Uma semana produtiva se encerrou. Você gerou ${weeklyNewIdeas} ideias e completou ${weeklyCompletedTasks} tarefas. Vamos revisar?`,
          type: 'weekly_review',
          status: 'scheduled',
          scheduledAt: now,
          createdAt: now
        });
      }
    }
  }

  /**
   * Despacha todas as notificações locais agendadas que caíram na janela de disparo
   */
  async dispatchPendingNotifications(now) {
    const pending = await notificationRepository.getPendingTrigger(now);
    
    for (const notification of pending) {
      try {
        // Envia notificação real de sistema via reminderService
        reminderService.sendNotification(notification.title, {
          body: notification.body,
          tag: notification.targetId
        });

        // Atualiza status no banco local
        await notificationRepository.update(notification.id, {
          status: 'sent',
          sentAt: Date.now()
        });
        
        console.log(`[Notification Service]: Alerta enviado: "${notification.title}"`);
      } catch (err) {
        console.error('[Notification Service]: Falha ao despachar notificação:', err);
        await notificationRepository.update(notification.id, {
          status: 'failed'
        });
      }
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
