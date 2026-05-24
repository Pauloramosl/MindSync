import { db } from '../database/db';

export const tagRepository = {
  validate(tag) {
    if (!tag.name || !tag.name.trim()) {
      throw new Error('Validação de Tag: O nome da tag é obrigatório.');
    }
    if (!tag.color || !tag.color.trim()) {
      throw new Error('Validação de Tag: A cor da tag é obrigatória.');
    }
    return true;
  },

  async getAll(userId = 'user-default-123') {
    return await db.tags
      .where('userId')
      .equals(userId)
      .toArray();
  },

  async add(tag) {
    const record = {
      userId: 'user-default-123',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...tag
    };
    this.validate(record);
    await db.tags.add(record);
    return record;
  },

  async delete(id) {
    await db.tags.delete(id);
    return id;
  }
};
