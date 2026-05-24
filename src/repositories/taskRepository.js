import { db } from '../database/db';

const VALID_STATUSES = ['a_fazer', 'em_execucao', 'aguardando', 'revisao', 'concluido', 'todo', 'doing', 'waiting', 'review', 'done'];
const VALID_PRIORITIES = ['baixa', 'media', 'alta', 'urgente', 'low', 'medium', 'high', 'urgent'];

export const taskRepository = {
  /**
   * Valida um objeto de tarefa antes de gravar
   */
  validate(task) {
    if (!task.title || !task.title.trim()) {
      throw new Error('Validação de Tarefa: O título da tarefa é obrigatório.');
    }
    if (task.status && !VALID_STATUSES.includes(task.status)) {
      throw new Error(`Validação de Tarefa: Status inválido "${task.status}". Permitidos: ${VALID_STATUSES.join(', ')}`);
    }
    if (task.priority && !VALID_PRIORITIES.includes(task.priority)) {
      throw new Error(`Validação de Tarefa: Prioridade inválida "${task.priority}". Permitidos: ${VALID_PRIORITIES.join(', ')}`);
    }
    return true;
  },

  async getAll(userId = 'user-default-123') {
    return await db.tasks
      .where('userId')
      .equals(userId)
      .toArray();
  },

  async getById(id) {
    return await db.tasks.get(id);
  },

  async add(task) {
    const record = {
      userId: 'user-default-123',
      isArchived: 0,
      isFavorite: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      checklist: [],
      ...task
    };
    this.validate(record);
    await db.tasks.add(record);
    return record;
  },

  async update(id, updates) {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Tarefa com ID "${id}" não encontrada.`);

    const record = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };
    this.validate(record);
    await db.tasks.put(record);
    return record;
  },

  async delete(id) {
    await db.tasks.delete(id);
    // Exclui sub-checklists atrelados a esta tarefa
    const associatedChecklists = await db.checklists.where('taskId').equals(id).toArray();
    for (const item of associatedChecklists) {
      await db.checklists.delete(item.id);
    }
    return id;
  },

  async getPendingSync() {
    return await db.tasks.where('syncStatus').equals('pending').toArray();
  }
};
