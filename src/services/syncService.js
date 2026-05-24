import { db } from '../database/db';

class SyncService {
  constructor() {
    this.isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
    this.listeners = [];
    this.isSyncing = false;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  handleNetworkChange(status) {
    this.isOnline = status;
    this.notifyListeners('network', status);
    if (status) {
      this.triggerSync();
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(type, data) {
    for (const callback of this.listeners) {
      try {
        callback(type, data);
      } catch (err) {
        console.error('Erro na escuta de sincronização:', err);
      }
    }
  }

  /**
   * Enfileira uma alteração para ser sincronizada quando houver conexão
   */
  async addToQueue(action, entityType, entityId, payload) {
    const queueId = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const queueItem = {
      id: queueId,
      action, // 'create' | 'update' | 'delete'
      entityType, // 'ideas' | 'tasks'
      entityId,
      payload: JSON.parse(JSON.stringify(payload)), // Deep clone
      status: 'pending',
      createdAt: Date.now()
    };

    await db.sync_queue.add(queueItem);
    
    // Atualiza o syncStatus no registro correspondente para pendente
    if (action !== 'delete') {
      try {
        await db[entityType].update(entityId, { syncStatus: 'pending' });
      } catch (err) {
        // Ignora se o registro não existir
      }
    }

    this.notifyListeners('queue-added', queueItem);

    // Se estiver online, tenta rodar a sincronização imediatamente
    if (this.isOnline) {
      this.triggerSync();
    }
  }

  /**
   * Varre e processa a fila de sincronização em segundo plano
   */
  async triggerSync() {
    if (this.isSyncing || !this.isOnline) return;
    
    try {
      this.isSyncing = true;
      this.notifyListeners('sync-start', true);

      const queue = await db.sync_queue
        .where('status')
        .equals('pending')
        .toArray();

      if (queue.length === 0) {
        this.isSyncing = false;
        this.notifyListeners('sync-end', 'no-items');
        return;
      }

      console.log(`[Sync Engine]: Iniciando sincronização de ${queue.length} registros...`);

      // Mapear configurações do dispositivo
      const settings = await db.settings.get('default');
      const deviceId = settings?.deviceId || 'device-unknown';

      for (const item of queue) {
        // Simular latência de rede real (300ms)
        await new Promise(r => setTimeout(r, 300));

        // CONFLICT RESOLUTION: LAST WRITE WINS (LWW)
        // Em um backend real, o carimbo 'updatedAt' e o 'deviceId' seriam validados.
        // Simulamos essa validação aqui:
        if (item.action !== 'delete') {
          const localRecord = await db[item.entityType].get(item.entityId);
          if (localRecord) {
            // Se o carimbo for muito antigo ou houver conflito de concorrência,
            // poderíamos marcar como 'conflict'.
            // Na regra 'Last Write Wins', o carimbo local ou remoto mais recente ganha.
            // Aqui marcamos como sincronizado.
            await db[item.entityType].update(item.entityId, {
              syncStatus: 'synced',
              updatedAt: Date.now() // Carimbo atualizado na nuvem
            });
          }
        }

        // Atualiza a fila
        await db.sync_queue.update(item.id, { status: 'synced' });
        // Opcional: remover da fila para limpar o banco local
        await db.sync_queue.delete(item.id);
      }

      console.log('[Sync Engine]: Sincronização concluída com sucesso.');
      this.notifyListeners('sync-end', 'success');
    } catch (err) {
      console.error('[Sync Engine]: Erro na sincronização:', err);
      this.notifyListeners('sync-end', 'failed');
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new SyncService();
export default syncService;
