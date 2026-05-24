import React, { createContext, useContext, useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { useIdeas } from './IdeasContext';

const TasksContext = createContext();

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshIdeas } = useIdeas(); // Importa refresh do IdeasContext para atualizar o status ao converter

  // Carrega as tarefas locais ao montar o provedor
  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);
        const allTasks = await taskService.getAllTasks();
        setTasks(allTasks);
      } catch (err) {
        console.error('Erro ao carregar tarefas do IndexedDB:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  /**
   * Força o recarregamento de tarefas do IndexedDB
   */
  async function refreshTasks() {
    const allTasks = await taskService.getAllTasks();
    setTasks(allTasks);
  }

  /**
   * Adiciona uma tarefa padrão
   */
  async function addTask(title, description = '', deadline = null, priority = 'medium') {
    try {
      const saved = await taskService.addTask(title, description, deadline, priority);
      setTasks(prev => [...prev, saved]);
      return saved;
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
    }
  }

  /**
   * Atualiza propriedades de uma tarefa (ex: status, checklist)
   */
  async function updateTask(id, updates) {
    try {
      const updated = await taskService.updateTask(id, updates);
      setTasks(prev => prev.map(item => item.id === id ? updated : item));
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
    }
  }

  /**
   * Deleta uma tarefa
   */
  async function deleteTask(id) {
    try {
      await taskService.deleteTask(id);
      setTasks(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err);
    }
  }

  /**
   * Fluxo Crítico: Conversão de Ideia em Tarefa
   * Cria uma tarefa atrelada à ideia de origem e atualiza o status da ideia
   */
  async function convertIdeaToTask(ideaId, taskData) {
    try {
      const savedTask = await taskService.convertIdeaToTask(ideaId, taskData);
      
      // Sincroniza estados em memória
      setTasks(prev => [...prev, savedTask]);
      await refreshIdeas(); // Força o IdeasContext a carregar as mudanças de status das ideias

      return savedTask;
    } catch (err) {
      console.error('Erro na transação de conversão de ideia para tarefa:', err);
      throw err;
    }
  }


  return (
    <TasksContext.Provider value={{
      tasks,
      loading,
      addTask,
      updateTask,
      deleteTask,
      convertIdeaToTask,
      refreshTasks
    }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks deve ser utilizado sob um TasksProvider');
  }
  return context;
}
