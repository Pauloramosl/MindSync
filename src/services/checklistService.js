import { checklistRepository } from '../repositories/checklistRepository';

export const checklistService = {
  async getByTaskId(taskId) {
    return await checklistRepository.getByTaskId(taskId);
  },

  async addItem(taskId, title) {
    return await checklistRepository.add({ 
      taskId, 
      title, 
      isCompleted: 0 
    });
  },

  async updateItem(id, updates) {
    return await checklistRepository.update(id, updates);
  },

  async deleteItem(id) {
    return await checklistRepository.delete(id);
  }
};
export default checklistService;
