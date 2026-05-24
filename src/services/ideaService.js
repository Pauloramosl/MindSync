import { ideaRepository } from '../repositories/ideaRepository';
import { syncService } from './syncService';
import { analyzeIdeaText } from './aiService';
import { db } from '../database/db';

export const ideaService = {
  async getAllIdeas(userId = 'user-default-123') {
    return await ideaRepository.getAll(userId);
  },

  async getIdeaById(id) {
    return await ideaRepository.getById(id);
  },

  /**
   * Adiciona uma nova ideia rápida, aciona a IA em background e enfileira na sincronização
   */
  async addIdea(text, type = 'text', mediaUrl = '') {
    const id = `idea-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const settings = await db.settings.get('default');

    const newIdea = {
      id,
      userId: 'user-default-123',
      title: 'Analisando ideia...',
      description: text,
      type,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'new', // Nova
      priority: 'medium',
      tags: [],
      mediaUrl,
      isArchived: 0,
      isFavorite: 0,
      syncStatus: 'pending' // Fila local
    };

    // 1. Salva localmente via Repositório (Validações internas aplicadas)
    const saved = await ideaRepository.add(newIdea);

    // 2. Enfileira na Sincronização offline-first
    await syncService.addToQueue('create', 'ideas', id, saved);

    // 3. Processamento de IA assíncrono em background se ativado
    if (settings?.aiAutoCategorization) {
      // Executa sem travar o retorno instantâneo do offline-first
      (async () => {
        try {
          const aiAnalysis = await analyzeIdeaText(text);
          
          const updated = {
            title: aiAnalysis.title,
            tags: aiAnalysis.tags,
            priority: aiAnalysis.priority,
            aiSummary: aiAnalysis.aiSummary,
            status: 'review', // Passa para revisar
            updatedAt: Date.now()
          };

          // Salva atualizações locais
          const savedUpdated = await ideaRepository.update(id, updated);
          
          // Registra na fila de sincronização
          await syncService.addToQueue('update', 'ideas', id, savedUpdated);
        } catch (err) {
          console.error('[Idea Service]: Erro ao processar categorização inteligente da IA:', err);
          // Em caso de falha, atualiza para título básico
          const simpleTitle = text.substring(0, 20) + (text.length > 20 ? '...' : '');
          const fallback = await ideaRepository.update(id, {
            title: simpleTitle,
            status: 'review',
            updatedAt: Date.now()
          });
          await syncService.addToQueue('update', 'ideas', id, fallback);
        }
      })();
    } else {
      // Sem IA: Título estático simples
      const simpleTitle = text.substring(0, 20) + (text.length > 20 ? '...' : '');
      (async () => {
        const fallback = await ideaRepository.update(id, {
          title: simpleTitle,
          status: 'review',
          updatedAt: Date.now()
        });
        await syncService.addToQueue('update', 'ideas', id, fallback);
      })();
    }

    return saved;
  },

  async updateIdea(id, updates) {
    const updated = await ideaRepository.update(id, updates);
    // Enfileira sincronização de atualização
    await syncService.addToQueue('update', 'ideas', id, updated);
    return updated;
  },

  async deleteIdea(id) {
    await ideaRepository.delete(id);
    // Enfileira sincronização de deleção
    await syncService.addToQueue('delete', 'ideas', id, null);
    return id;
  }
};
export default ideaService;
