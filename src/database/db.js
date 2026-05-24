import Dexie from 'dexie';

export const db = new Dexie('IdeiasTarefasDB');

// Histórico de versões para compatibilidade de migrações
db.version(1).stores({
  ideas: 'id, title, type, createdAt, status, priority, *tags',
  tasks: 'id, associatedIdeaId, title, deadline, priority, status',
  settings: 'id'
});

// UPGRADE PARA A VERSÃO 2 — ETAPA 4 BACKEND E PERSISTÊNCIA
db.version(2).stores({
  users: 'id, name, email, createdAt',
  ideas: 'id, userId, title, type, status, priority, *tags, isArchived, isFavorite, createdAt, updatedAt',
  tasks: 'id, userId, ideaId, title, status, priority, deadline, reminderAt, isArchived, isFavorite, createdAt, updatedAt',
  checklists: 'id, taskId, title, isCompleted, order, createdAt',
  tags: 'id, userId, name, color, createdAt',
  notifications: 'id, userId, targetType, targetId, type, status, scheduledAt, sentAt, createdAt',
  daily_reviews: 'id, userId, date, createdAt',
  weekly_reviews: 'id, userId, weekStart, weekEnd, createdAt',
  idea_relations: 'id, userId, sourceIdeaId, relatedIdeaId, relationType, createdAt',
  sync_queue: 'id, action, entityType, entityId, status, createdAt',
  settings: 'id' // Armazena configurações globais de preferências e deviceId
});

// Inicialização de dados padrão na primeira execução do aplicativo
db.on('populate', () => {
  const now = Date.now();
  const deviceId = `device-${now}-${Math.floor(Math.random() * 1000000)}`;

  // 1. Injetar Usuário Padrão Constante para isolamento local
  db.users.add({
    id: 'user-default-123',
    name: 'Membro MindSync',
    email: 'membro@mindsync.app',
    avatarUrl: '',
    createdAt: now,
    updatedAt: now,
    preferences: {
      theme: 'dark',
      dailyReviewTime: '20:00',
      weeklyReviewEnabled: true,
      forgottenIdeasEnabled: true,
      forgottenIdeasTime: 4,
      pushNotificationsEnabled: true,
      voiceCaptureEnabled: true,
      language: 'pt-BR'
    }
  });

  // 2. Injetar Configurações Padrão de Dispositivo e Preferências Globais
  db.settings.add({
    id: 'default',
    deviceId,
    forgottenIdeasTime: 4,         // Lembrete de ideias inativas após 4h
    dailyReviewTime: '20:00',      // Horário da revisão diária padrão às 20:00
    weeklyReviewEnabled: true,     // Revisão semanal ativada por padrão
    weeklyReviewDay: 0,            // 0 = Domingo
    weeklyReviewTime: '18:00',     // Domingo às 18:00
    aiAutoCategorization: true,    // Classificação de IA instantânea ativada
    pushNotificationsEnabled: true, // Notificações push ativadas
    voiceCaptureEnabled: true,     // Captura de voz ativa
    language: 'pt-BR',
    theme: 'dark'
  });
});
