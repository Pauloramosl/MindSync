import React, { createContext, useContext, useState, useEffect } from 'react';
import { ideaService } from '../services/ideaService';
import { userPreferenceService } from '../services/userPreferenceService';
import { notificationService } from '../services/notificationService';

const IdeasContext = createContext();

export function IdeasProvider({ children }) {
  const [ideas, setIdeas] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({
    tag: '',
    priority: '',
    status: ''
  });

  // Carrega ideias e configurações ao montar
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const allIdeas = await ideaService.getAllIdeas();
        setIdeas(allIdeas);

        const appSettings = await userPreferenceService.getPreferences();
        setSettings(appSettings);
      } catch (err) {
        console.error('Erro ao inicializar dados:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Inicializa varredura em segundo plano para ideias esquecidas e prazos
  useEffect(() => {
    if (settings) {
      // Inicia varredor inteligente em background (Etapa 4)
      notificationService.startBackgroundScanner();
    }

    return () => {
      notificationService.stopBackgroundScanner();
    };
  }, [settings]);

  /**
   * Atualiza a lista de ideias do estado sincronizando com o IndexedDB
   */
  async function refreshIdeas() {
    const allIdeas = await ideaService.getAllIdeas();
    setIdeas(allIdeas);
  }

  /**
   * Adiciona uma nova ideia (fluxo de Captura Rápida)
   */
  async function addIdea(text, type = 'text', mediaUrl = '') {
    try {
      const saved = await ideaService.addIdea(text, type, mediaUrl);
      // Insere provisoriamente no estado para resposta instantânea
      setIdeas(prev => [saved, ...prev]);
      notificationService.queuePushScheduleSync();
      
      // Agenda um refresh curto para carregar o título gerado pela IA
      setTimeout(async () => {
        await refreshIdeas();
        notificationService.queuePushScheduleSync();
      }, 3500);

      return saved;
    } catch (err) {
      console.error('Erro ao salvar ideia:', err);
    }
  }

  /**
   * Atualiza propriedades de uma ideia específica
   */
  async function updateIdea(id, updates) {
    try {
      const updated = await ideaService.updateIdea(id, updates);
      setIdeas(prev => prev.map(item => item.id === id ? updated : item));
      notificationService.queuePushScheduleSync();
    } catch (err) {
      console.error('Erro ao atualizar ideia:', err);
    }
  }

  /**
   * Deleta uma ideia do banco local
   */
  async function deleteIdea(id) {
    try {
      await ideaService.deleteIdea(id);
      setIdeas(prev => prev.filter(item => item.id !== id));
      notificationService.queuePushScheduleSync();
    } catch (err) {
      console.error('Erro ao excluir ideia:', err);
    }
  }

  /**
   * Atualiza as configurações de notificações e IA
   */
  async function updateSettings(updates) {
    try {
      const updatedSettings = await userPreferenceService.updatePreferences(updates);
      setSettings(updatedSettings);
      notificationService.queuePushScheduleSync(0);
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err);
    }
  }

  // Filtragem de ideias dinâmica baseada nos filtros ativos
  const filteredIdeas = ideas.filter(idea => {
    const matchTag = activeFilters.tag ? idea.tags.includes(activeFilters.tag) : true;
    const matchPriority = activeFilters.priority ? idea.priority === activeFilters.priority : true;
    const matchStatus = activeFilters.status ? idea.status === activeFilters.status : true;
    return matchTag && matchPriority && matchStatus;
  });

  return (
    <IdeasContext.Provider value={{
      ideas: filteredIdeas,
      rawIdeas: ideas, // Todas sem filtros
      loading,
      settings,
      activeFilters,
      setActiveFilters,
      addIdea,
      updateIdea,
      deleteIdea,
      updateSettings,
      refreshIdeas
    }}>
      {children}
    </IdeasContext.Provider>
  );
}


export function useIdeas() {
  const context = useContext(IdeasContext);
  if (!context) {
    throw new Error('useIdeas deve ser utilizado sob um IdeasProvider');
  }
  return context;
}
