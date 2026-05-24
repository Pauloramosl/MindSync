import { tagRepository } from '../repositories/tagRepository';

export const tagService = {
  async getAllTags(userId = 'user-default-123') {
    return await tagRepository.getAll(userId);
  },

  async addTag(name, color) {
    return await tagRepository.add({ name, color });
  },

  async deleteTag(id) {
    return await tagRepository.delete(id);
  }
};
export default tagService;
