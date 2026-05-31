import { db } from '../database/db';
import { notificationRepository } from '../repositories/notificationRepository';
import { reviewRepository } from '../repositories/reviewRepository';
import { userPreferenceService } from './userPreferenceService';
import { reminderService } from './reminderService';
import { pushService } from './pushService';

const USER_ID = 'user-default-123';
const DEFAULT_FORGOTTEN_HOURS = 4;
const SCANNER_INTERVAL_MS = 30000;
const INITIAL_SCAN_DELAY_MS = 2000;
const DEADLINE_LOOKAHEAD_MS = 15 * 60 * 1000;
const PUSH_SYNC_DEBOUNCE_MS = 1200;

const TARGET_VIEW = {
  idea: 'brainstorm',
  task: 'tasks',
  daily_review: 'review',
  weekly_review: 'review'
};

function normalizeForgottenHours(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_FORGOTTEN_HOURS;
}

function formatHours(hours) {
  return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
}

function getLastActivityAt(item) {
  return Number(item.updatedAt || item.createdAt || 0);
}

function getNotificationUrl(notification) {
  const view = TARGET_VIEW[notification.targetType] || 'inbox';
  const params = new URLSearchParams({
    view,
    targetType: notification.targetType,
    targetId: notification.targetId
  });

  return `/?${params.toString()}`;
}

class NotificationService {
  constructor() {
    this.scannerId = null;
    this.initialScanTimerId = null;
    this.pushSyncTimerId = null;
    this.lastPushSyncSignature = '';
  }

  /**
   * Inicializa o scanner local que cria e despacha notificacoes enquanto o app/PWA esta ativo.
   */
  startBackgroundScanner() {
    this.stopBackgroundScanner();

    this.initialScanTimerId = window.setTimeout(() => {
      this.initialScanTimerId = null;
      this.runScannerTick();
    }, INITIAL_SCAN_DELAY_MS);

    this.scannerId = window.setInterval(() => {
      this.runScannerTick();
    }, SCANNER_INTERVAL_MS);

    console.log('[Notification Service]: Scanner em segundo plano inicializado.');
  }

  stopBackgroundScanner() {
    if (this.initialScanTimerId) {
      window.clearTimeout(this.initialScanTimerId);
      this.initialScanTimerId = null;
    }

    if (this.scannerId) {
      window.clearInterval(this.scannerId);
      this.scannerId = null;
    }

    if (this.pushSyncTimerId) {
      window.clearTimeout(this.pushSyncTimerId);
      this.pushSyncTimerId = null;
    }
  }

  async runScannerTick() {
    try {
      const preferences = await userPreferenceService.getPreferences();
      if (!preferences) return;

      const now = Date.now();
      const forgottenHours = normalizeForgottenHours(preferences.forgottenIdeasTime);

      if (preferences.forgottenIdeasEnabled !== false && forgottenHours > 0) {
        await this.scanForgottenIdeas(preferences, now);
        await this.scanForgottenTasks(preferences, now);
      }

      await this.scanTaskDeadlines(now);
      await this.checkDailyReviewTrigger(preferences, now);

      if (preferences.weeklyReviewEnabled) {
        await this.checkWeeklyReviewTrigger(preferences, now);
      }

      await this.dispatchPendingNotifications(now, preferences);
      await this.syncRemotePushSchedules(preferences, Date.now());
    } catch (err) {
      console.error('[Notification Service]: Falha na execucao do scanner tick:', err);
    }
  }

  async getLastNotification(targetId, type, reason) {
    const notifications = await db.notifications
      .where('targetId')
      .equals(targetId)
      .filter((notification) => {
        if (notification.type !== type) return false;
        if (reason && notification.reason !== reason) return false;
        return true;
      })
      .toArray();

    return notifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0] || null;
  }

  async countNotifications(targetId, type, reason) {
    return db.notifications
      .where('targetId')
      .equals(targetId)
      .filter((notification) => {
        if (notification.type !== type) return false;
        if (reason && notification.reason !== reason) return false;
        return true;
      })
      .count();
  }

  async shouldCreateIntervalReminder(targetId, type, reason, intervalMs, now) {
    const lastNotification = await this.getLastNotification(targetId, type, reason);
    if (!lastNotification) return true;

    const lastAt = Number(lastNotification.sentAt || lastNotification.createdAt || 0);
    return now - lastAt >= intervalMs;
  }

  async getNextIntervalReminderAt(targetId, type, reason, intervalMs, lastActivityAt) {
    const lastNotification = await this.getLastNotification(targetId, type, reason);
    const lastNotificationAt = Number(lastNotification?.sentAt || lastNotification?.createdAt || 0);
    return Math.max(Number(lastActivityAt || 0), lastNotificationAt) + intervalMs;
  }

  async scanForgottenIdeas(preferences, now) {
    const thresholdHours = normalizeForgottenHours(preferences.forgottenIdeasTime);
    const thresholdMs = thresholdHours * 60 * 60 * 1000;

    const allIdeas = await db.ideas
      .where('status')
      .anyOf(['new', 'review'])
      .toArray();

    const forgotten = allIdeas.filter((idea) => {
      if (idea.isArchived) return false;
      return now - getLastActivityAt(idea) >= thresholdMs;
    });

    for (const idea of forgotten) {
      const shouldNotify = await this.shouldCreateIntervalReminder(
        idea.id,
        'idea_reminder',
        'forgotten',
        thresholdMs,
        now
      );

      if (!shouldNotify) continue;

      const totalSent = await this.countNotifications(idea.id, 'idea_reminder', 'forgotten');
      const suffix = totalSent > 0 ? ` #${totalSent + 1}` : '';
      const safeTitle = idea.title || 'Ideia sem titulo';

      await notificationRepository.add({
        userId: USER_ID,
        targetType: 'idea',
        targetId: idea.id,
        title: `Ideia pendente para revisar${suffix}`,
        body: `Voce deixou "${safeTitle}" pendente ha mais de ${formatHours(thresholdHours)}. Toque para verificar.`,
        type: 'idea_reminder',
        reason: 'forgotten',
        status: 'scheduled',
        scheduledAt: now,
        createdAt: now
      });
    }
  }

  async scanForgottenTasks(preferences, now) {
    const thresholdHours = normalizeForgottenHours(preferences.forgottenIdeasTime);
    const thresholdMs = thresholdHours * 60 * 60 * 1000;

    const allTasks = await db.tasks.toArray();
    const forgotten = allTasks.filter((task) => {
      if (task.status === 'done' || task.isArchived) return false;
      return now - getLastActivityAt(task) >= thresholdMs;
    });

    for (const task of forgotten) {
      const shouldNotify = await this.shouldCreateIntervalReminder(
        task.id,
        'task_reminder',
        'forgotten',
        thresholdMs,
        now
      );

      if (!shouldNotify) continue;

      const totalSent = await this.countNotifications(task.id, 'task_reminder', 'forgotten');
      const suffix = totalSent > 0 ? ` #${totalSent + 1}` : '';
      const safeTitle = task.title || 'Tarefa sem titulo';

      await notificationRepository.add({
        userId: USER_ID,
        targetType: 'task',
        targetId: task.id,
        title: `Tarefa pendente para verificar${suffix}`,
        body: `A tarefa "${safeTitle}" esta parada ha mais de ${formatHours(thresholdHours)}. Toque para retomar.`,
        type: 'task_reminder',
        reason: 'forgotten',
        status: 'scheduled',
        scheduledAt: now,
        createdAt: now
      });
    }
  }

  async scanTaskDeadlines(now) {
    const tasks = await db.tasks.toArray();

    const nearTasks = tasks.filter((task) => {
      if (task.status === 'done' || task.isArchived) return false;

      const deadline = Number(task.deadline || 0);
      const reminderAt = Number(task.reminderAt || 0);
      const matchesDeadline = deadline > now && deadline - now <= DEADLINE_LOOKAHEAD_MS;
      const matchesReminder = reminderAt > 0 && reminderAt <= now;

      return matchesDeadline || matchesReminder;
    });

    for (const task of nearTasks) {
      const existing = await this.getLastNotification(task.id, 'task_reminder', 'deadline');
      if (existing) continue;

      const safeTitle = task.title || 'Tarefa sem titulo';

      await notificationRepository.add({
        userId: USER_ID,
        targetType: 'task',
        targetId: task.id,
        title: 'Prazo de tarefa chegando',
        body: `A tarefa "${safeTitle}" precisa da sua atencao agora.`,
        type: 'task_reminder',
        reason: 'deadline',
        status: 'scheduled',
        scheduledAt: now,
        createdAt: now
      });
    }
  }

  async checkDailyReviewTrigger(preferences, now) {
    const nowDate = new Date(now);
    const dailyReviewTimeStr = preferences.dailyReviewTime || '20:00';
    const currentHourMin = `${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`;

    if (currentHourMin !== dailyReviewTimeStr) return;

    const lastTrigger = localStorage.getItem('last_daily_review_trigger');
    const todayStr = nowDate.toDateString();
    if (lastTrigger === todayStr) return;

    localStorage.setItem('last_daily_review_trigger', todayStr);

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const startMs = todayStart.getTime();

    const allIdeas = await db.ideas.toArray();
    const allTasks = await db.tasks.toArray();

    const newIdeasCount = allIdeas.filter((idea) => idea.createdAt >= startMs).length;
    const completedIdeasCount = allIdeas.filter((idea) => idea.status === 'completed' && idea.updatedAt >= startMs).length;
    const openTasksCount = allTasks.filter((task) => task.status !== 'done').length;
    const completedTasksCount = allTasks.filter((task) => task.status === 'done' && task.updatedAt >= startMs).length;

    const reviewRecord = await reviewRepository.addDailyReview({
      userId: USER_ID,
      date: todayStr,
      totalIdeas: newIdeasCount,
      completedIdeas: completedIdeasCount,
      openTasks: openTasksCount,
      completedTasks: completedTasksCount,
      pendingReminders: 0
    });

    await notificationRepository.add({
      userId: USER_ID,
      targetType: 'daily_review',
      targetId: reviewRecord.id || `review-${Date.now()}`,
      title: 'Revisao diaria pronta',
      body: `Voce capturou ${newIdeasCount} ideias e concluiu ${completedTasksCount} tarefas hoje. Toque para revisar.`,
      type: 'daily_review',
      status: 'scheduled',
      scheduledAt: now,
      createdAt: now
    });
  }

  async checkWeeklyReviewTrigger(preferences, now) {
    const nowDate = new Date(now);
    const weeklyReviewDay = preferences.weeklyReviewDay ?? 0;
    const weeklyReviewTimeStr = preferences.weeklyReviewTime || '18:00';
    const currentHourMin = `${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`;

    if (nowDate.getDay() !== weeklyReviewDay || currentHourMin !== weeklyReviewTimeStr) return;

    const lastTriggerWeekly = localStorage.getItem('last_weekly_review_trigger');
    const todayStr = nowDate.toDateString();
    if (lastTriggerWeekly === todayStr) return;

    localStorage.setItem('last_weekly_review_trigger', todayStr);

    const weekStartMs = now - 7 * 24 * 60 * 60 * 1000;
    const allIdeas = await db.ideas.toArray();
    const allTasks = await db.tasks.toArray();

    const weeklyNewIdeas = allIdeas.filter((idea) => idea.createdAt >= weekStartMs).length;
    const weeklyCompletedIdeas = allIdeas.filter((idea) => idea.status === 'completed' && idea.updatedAt >= weekStartMs).length;
    const weeklyOpenTasks = allTasks.filter((task) => task.status !== 'done').length;
    const weeklyCompletedTasks = allTasks.filter((task) => task.status === 'done' && task.updatedAt >= weekStartMs).length;

    const reviewRecord = await reviewRepository.addWeeklyReview({
      userId: USER_ID,
      weekStart: weekStartMs,
      weekEnd: now,
      totalIdeas: weeklyNewIdeas,
      completedIdeas: weeklyCompletedIdeas,
      openTasks: weeklyOpenTasks,
      completedTasks: weeklyCompletedTasks,
      remindersTriggered: 0
    });

    await notificationRepository.add({
      userId: USER_ID,
      targetType: 'weekly_review',
      targetId: reviewRecord.id || `weekly-${Date.now()}`,
      title: 'Balanco semanal disponivel',
      body: `Voce gerou ${weeklyNewIdeas} ideias e completou ${weeklyCompletedTasks} tarefas. Toque para planejar a semana.`,
      type: 'weekly_review',
      status: 'scheduled',
      scheduledAt: now,
      createdAt: now
    });
  }

  getNativeNotificationOptions(notification) {
    const view = TARGET_VIEW[notification.targetType] || 'inbox';
    const url = getNotificationUrl(notification);

    return {
      body: notification.body,
      tag: `mindsync-${notification.type}-${notification.reason || 'general'}-${notification.targetId}`,
      data: {
        notificationId: notification.id,
        targetType: notification.targetType,
        targetId: notification.targetId,
        view,
        url
      },
      actions: [
        { action: 'open', title: 'Verificar' },
        { action: 'dismiss', title: 'Depois' }
      ]
    };
  }

  async dismissPendingNotifications(pending, now) {
    for (const notification of pending) {
      await notificationRepository.update(notification.id, {
        status: 'dismissed',
        dismissedAt: now
      });
    }
  }

  async dispatchPendingNotifications(now, preferences) {
    const pending = await notificationRepository.getPendingTrigger(now);
    if (pending.length === 0) return;

    if (preferences.pushNotificationsEnabled === false) {
      await this.dismissPendingNotifications(pending, now);
      return;
    }

    if (!reminderService.hasPermission()) {
      console.log('[Notification Service]: Permissao de notificacao ainda nao concedida. Alertas permanecem agendados.');
      return;
    }

    for (const notification of pending) {
      try {
        const sent = await reminderService.sendNotification(
          notification.title,
          this.getNativeNotificationOptions(notification)
        );

        if (!sent) return;

        await notificationRepository.update(notification.id, {
          status: 'sent',
          sentAt: Date.now()
        });

        console.log(`[Notification Service]: Alerta enviado: "${notification.title}"`);
      } catch (err) {
        console.error('[Notification Service]: Falha ao despachar notificacao:', err);
        await notificationRepository.update(notification.id, {
          status: 'failed'
        });
      }
    }
  }

  queuePushScheduleSync(delay = PUSH_SYNC_DEBOUNCE_MS) {
    if (this.pushSyncTimerId) {
      window.clearTimeout(this.pushSyncTimerId);
    }

    this.pushSyncTimerId = window.setTimeout(() => {
      this.pushSyncTimerId = null;
      this.syncRemotePushSchedules().catch((err) => {
        console.warn('[Notification Service]: Falha ao sincronizar agenda Web Push:', err);
      });
    }, delay);
  }

  async buildRemoteForgottenReminders(preferences, now) {
    if (
      preferences.pushNotificationsEnabled === false ||
      preferences.forgottenIdeasEnabled === false
    ) {
      return [];
    }

    const thresholdHours = normalizeForgottenHours(preferences.forgottenIdeasTime);
    const thresholdMs = thresholdHours * 60 * 60 * 1000;
    const [ideas, tasks] = await Promise.all([
      db.ideas.where('status').anyOf(['new', 'review']).toArray(),
      db.tasks.toArray()
    ]);
    const reminders = [];

    for (const idea of ideas) {
      if (idea.isArchived) continue;

      const lastActivityAt = getLastActivityAt(idea);
      const dueAt = await this.getNextIntervalReminderAt(
        idea.id,
        'idea_reminder',
        'forgotten',
        thresholdMs,
        lastActivityAt
      );
      const target = {
        targetType: 'idea',
        targetId: idea.id
      };
      const safeTitle = idea.title || 'Ideia sem titulo';

      reminders.push({
        id: `idea:${idea.id}:forgotten`,
        targetType: target.targetType,
        targetId: target.targetId,
        type: 'idea_reminder',
        reason: 'forgotten',
        title: 'Ideia pendente para revisar',
        body: `Voce deixou "${safeTitle}" pendente ha mais de ${formatHours(thresholdHours)}. Toque para verificar.`,
        tag: `mindsync-idea-forgotten-${idea.id}`,
        view: TARGET_VIEW.idea,
        url: getNotificationUrl(target),
        dueAt: Math.max(dueAt, now),
        repeatIntervalMs: thresholdMs,
        lastActivityAt
      });
    }

    for (const task of tasks) {
      if (task.status === 'done' || task.isArchived) continue;

      const lastActivityAt = getLastActivityAt(task);
      const dueAt = await this.getNextIntervalReminderAt(
        task.id,
        'task_reminder',
        'forgotten',
        thresholdMs,
        lastActivityAt
      );
      const target = {
        targetType: 'task',
        targetId: task.id
      };
      const safeTitle = task.title || 'Tarefa sem titulo';

      reminders.push({
        id: `task:${task.id}:forgotten`,
        targetType: target.targetType,
        targetId: target.targetId,
        type: 'task_reminder',
        reason: 'forgotten',
        title: 'Tarefa pendente para verificar',
        body: `A tarefa "${safeTitle}" esta parada ha mais de ${formatHours(thresholdHours)}. Toque para retomar.`,
        tag: `mindsync-task-forgotten-${task.id}`,
        view: TARGET_VIEW.task,
        url: getNotificationUrl(target),
        dueAt: Math.max(dueAt, now),
        repeatIntervalMs: thresholdMs,
        lastActivityAt
      });
    }

    return reminders;
  }

  async syncRemotePushSchedules(preferences = null, now = Date.now(), force = false) {
    const appPreferences = preferences || await userPreferenceService.getPreferences();
    const deviceId = appPreferences?.deviceId;
    if (!deviceId) return;

    const reminders = await this.buildRemoteForgottenReminders(appPreferences, now);
    const signature = JSON.stringify({
      deviceId,
      enabled: appPreferences.pushNotificationsEnabled !== false,
      reminders: reminders.map((reminder) => ({
        id: reminder.id,
        dueAt: reminder.dueAt,
        repeatIntervalMs: reminder.repeatIntervalMs,
        lastActivityAt: reminder.lastActivityAt,
        title: reminder.title,
        body: reminder.body
      }))
    });

    if (!force && signature === this.lastPushSyncSignature) return;

    const result = await pushService.syncReminderSchedules(deviceId, reminders);
    if (result.ok) {
      this.lastPushSyncSignature = signature;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
