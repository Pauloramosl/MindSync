import { db } from '../database/db';

const VALID_TYPES = ['text', 'voice', 'image', 'link', 'file'];
const VALID_STATUSES = ['nova', 'revisar', 'transformada', 'em_andamento', 'concluida', 'arquivada', 'new', 'review', 'completed', 'archived', 'transformed'];
const VALID_PRIORITIES = ['baixa', 'media', 'alta', 'urgente', 'low', 'medium', 'high', 'urgent'];

export const ideaRepository = {
  /**
   * Valida um objeto de ideia antes da gravação
   */
  validate(idea) {
    if (!idea.title && !idea.description) {
      throw new Error('Validação de Ideia: Título ou descrição devem ser preenchidos.');
    }
    if (idea.type && !VALID_TYPES.includes(idea.type)) {
      throw new Error(`Validação de Ideia: Tipo inválido "${idea.type}". Permitidos: ${VALID_TYPES.join(', ')}`);
    }
    if (idea.status && !VALID_STATUSES.includes(idea.status)) {
      throw new Error(`Validação de Ideia: Status inválido "${idea.status}". Permitidos: ${VALID_STATUSES.join(', ')}`);
    }
    if (idea.priority && !VALID_PRIORITIES.includes(idea.priority)) {
      throw new Error(`Validação de Ideia: Prioridade inválida "${idea.priority}". Permitidos: ${VALID_PRIORITIES.join(', ')}`);
    }
    return true;
  },

  async getAll(userId = 'user-default-123') {
    return await db.ideas
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');
  },

  async getById(id) {
    return await db.ideas.get(id);
  },

  async add(idea) {
    const record = {
      userId: 'user-default-123',
      isArchived: 0,
      isFavorite: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...idea
    };
    this.validate(record);
    await db.ideas.add(record);
    return record;
  },

  async update(id, updates) {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Ideia com ID "${id}" não encontrada.`);
    
    const record = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };
    this.validate(record);
    await db.ideas.put(record);
    return record;
  },

  async delete(id) {
    await db.ideas.delete(id);
    return id;
  },

  async getPendingSync() {
    return await db.ideas.where('syncStatus').equals('pending').toArray();
  }
};
