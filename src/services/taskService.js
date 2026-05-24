import { taskRepository } from '../repositories/taskRepository';
import { ideaRepository } from '../repositories/ideaRepository';
import { syncService } from './syncService';

export const taskService = {
  async getAllTasks(userId = 'user-default-123') {
    return await taskRepository.getAll(userId);
  },

  async getTaskById(id) {
    return await taskRepository.getById(id);
  },

  async addTask(title, description = '', deadline = null, priority = 'medium') {
    const id = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTask = {
      id,
      userId: 'user-default-123',
      title,
      description,
      deadline,
      priority,
      status: 'todo', // 'A Fazer' padrão
      isArchived: 0,
      isFavorite: 0,
      checklist: [],
      syncStatus: 'pending'
    };

    const saved = await taskRepository.add(newTask);
    await syncService.addToQueue('create', 'tasks', id, saved);
    return saved;
  },

  async updateTask(id, updates) {
    const updated = await taskRepository.update(id, updates);
    await syncService.addToQueue('update', 'tasks', id, updated);
    return updated;
  },

  async deleteTask(id) {
    await taskRepository.delete(id);
    await syncService.addToQueue('delete', 'tasks', id, null);
    return id;
  },

  /**
   * FLUXO CRÍTICO: Conversão de Ideia em Tarefa
   * Cria uma tarefa vinculada e marca a ideia original como 'transformed'
   */
  async convertIdeaToTask(ideaId, taskData) {
    const id = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 1. Cria a tarefa vinculada à ideia original
    const newTask = {
      id,
      userId: 'user-default-123',
      associatedIdeaId: ideaId,
      title: taskData.title,
      description: taskData.description,
      deadline: taskData.deadline || null,
      priority: taskData.priority || 'medium',
      status: 'todo', // A Fazer
      checklist: taskData.checklist || [],
      isArchived: 0,
      isFavorite: 0,
      syncStatus: 'pending'
    };

    const savedTask = await taskRepository.add(newTask);
    await syncService.addToQueue('create', 'tasks', id, savedTask);

    // 2. Atualiza status da ideia de origem para 'transformed'
    const updatedIdea = await ideaRepository.update(ideaId, {
      status: 'transformed',
      updatedAt: Date.now()
    });
    await syncService.addToQueue('update', 'ideas', ideaId, updatedIdea);

    return savedTask;
  }
};
export default taskService;
