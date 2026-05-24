import { db } from '../database/db';

const VALID_TARGETS = ['idea', 'task', 'daily_review', 'weekly_review'];
const VALID_TYPES = ['idea_reminder', 'task_reminder', 'daily_review', 'weekly_review'];
const VALID_STATUSES = ['scheduled', 'sent', 'dismissed', 'failed'];

export const notificationRepository = {
  validate(notification) {
    if (!notification.scheduledAt) {
      throw new Error('Validação de Notificação: O carimbo de data/hora de agendamento (scheduledAt) é obrigatório.');
    }
    if (!notification.targetType || !VALID_TARGETS.includes(notification.targetType)) {
      throw new Error(`Validação de Notificação: Tipo de alvo inválido "${notification.targetType}". Permitidos: ${VALID_TARGETS.join(', ')}`);
    }
    if (!notification.targetId) {
      throw new Error('Validação de Notificação: O ID do elemento alvo (targetId) é obrigatório.');
    }
    if (notification.type && !VALID_TYPES.includes(notification.type)) {
      throw new Error(`Validação de Notificação: Tipo de notificação inválido "${notification.type}". Permitidos: ${VALID_TYPES.join(', ')}`);
    }
    if (notification.status && !VALID_STATUSES.includes(notification.status)) {
      throw new Error(`Validação de Notificação: Status inválido "${notification.status}". Permitidos: ${VALID_STATUSES.join(', ')}`);
    }
    return true;
  },

  async getAll(userId = 'user-default-123') {
    return await db.notifications
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');
  },

  async getById(id) {
    return await db.notifications.get(id);
  },

  async add(notification) {
    const record = {
      userId: 'user-default-123',
      status: 'scheduled',
      createdAt: Date.now(),
      ...notification
    };
    this.validate(record);
    await db.notifications.add(record);
    return record;
  },

  async update(id, updates) {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Notificação com ID "${id}" não encontrada.`);

    const record = {
      ...existing,
      ...updates
    };
    this.validate(record);
    await db.notifications.put(record);
    return record;
  },

  async delete(id) {
    await db.notifications.delete(id);
    return id;
  },

  async getPendingTrigger(now = Date.now()) {
    return await db.notifications
      .where('status')
      .equals('scheduled')
      .filter(n => n.scheduledAt <= now)
      .toArray();
  }
};
