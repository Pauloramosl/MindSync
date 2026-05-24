import { db } from '../database/db';

export const checklistRepository = {
  validate(item) {
    if (!item.taskId) {
      throw new Error('Validação de Checklist: O ID da tarefa associada (taskId) é obrigatório.');
    }
    if (!item.title || !item.title.trim()) {
      throw new Error('Validação de Checklist: O título do item é obrigatório.');
    }
    return true;
  },

  async getByTaskId(taskId) {
    return await db.checklists
      .where('taskId')
      .equals(taskId)
      .sortBy('order');
  },

  async add(item) {
    const count = await db.checklists.where('taskId').equals(item.taskId).count();
    const record = {
      isCompleted: 0,
      order: count + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...item
    };
    this.validate(record);
    await db.checklists.add(record);
    return record;
  },

  async update(id, updates) {
    const existing = await db.checklists.get(id);
    if (!existing) throw new Error(`Item do checklist com ID "${id}" não encontrado.`);

    const record = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };
    this.validate(record);
    await db.checklists.put(record);
    return record;
  },

  async delete(id) {
    await db.checklists.delete(id);
    return id;
  }
};
