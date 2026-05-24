import { db } from '../database/db';

export const userPreferenceService = {
  /**
   * Recupera todas as preferências e configurações
   */
  async getPreferences() {
    let settings = await db.settings.get('default');
    if (!settings) {
      // Cria configurações padrão se ausente
      settings = {
        id: 'default',
        deviceId: `device-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        forgottenIdeasTime: 4,
        dailyReviewTime: '20:00',
        weeklyReviewEnabled: true,
        weeklyReviewDay: 0, // Domingo
        weeklyReviewTime: '18:00',
        aiAutoCategorization: true,
        pushNotificationsEnabled: true,
        voiceCaptureEnabled: true,
        language: 'pt-BR',
        theme: 'dark'
      };
      await db.settings.add(settings);
    }
    return settings;
  },

  /**
   * Atualiza uma preferência de forma persistente
   */
  async updatePreference(key, value) {
    const settings = await this.getPreferences();
    settings[key] = value;
    await db.settings.put(settings);

    // Também atualiza no cadastro do usuário constante
    const user = await db.users.get('user-default-123');
    if (user) {
      user.preferences = {
        ...user.preferences,
        [key]: value
      };
      user.updatedAt = Date.now();
      await db.users.put(user);
    }

    return settings;
  },

  /**
   * Atualiza múltiplas preferências em lote
   */
  async updatePreferences(updates) {
    const settings = await this.getPreferences();
    const updated = {
      ...settings,
      ...updates
    };
    await db.settings.put(updated);

    const user = await db.users.get('user-default-123');
    if (user) {
      user.preferences = {
        ...user.preferences,
        ...updates
      };
      user.updatedAt = Date.now();
      await db.users.put(user);
    }

    return updated;
  }
};
