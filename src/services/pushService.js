const PUSH_CONFIG_URL = '/api/push-config';
const PUSH_SUBSCRIPTION_URL = '/api/push-subscription';
const PUSH_REMINDERS_URL = '/api/push-reminders';
const PUSH_TEST_URL = '/api/push-test';
const CONFIG_CACHE_MS = 5 * 60 * 1000;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}

class PushService {
  constructor() {
    this.config = null;
    this.configLoadedAt = 0;
  }

  isSupported() {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  async getConfig(force = false) {
    const now = Date.now();
    if (!force && this.config && now - this.configLoadedAt < CONFIG_CACHE_MS) {
      return this.config;
    }

    try {
      const response = await fetch(PUSH_CONFIG_URL, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      });
      const data = await parseJsonResponse(response);

      this.config = {
        endpointAvailable: response.ok && Boolean(data),
        enabled: Boolean(response.ok && data?.enabled && data?.publicKey),
        publicKey: data?.publicKey || ''
      };
    } catch (err) {
      console.warn('[PushService] Web Push config indisponivel:', err);
      this.config = {
        endpointAvailable: false,
        enabled: false,
        publicKey: ''
      };
    }

    this.configLoadedAt = now;
    return this.config;
  }

  async getRegistration() {
    if (!this.isSupported()) return null;
    return navigator.serviceWorker.ready;
  }

  async getBrowserSubscription() {
    const registration = await this.getRegistration();
    if (!registration) return null;
    return registration.pushManager.getSubscription();
  }

  async getStatus() {
    const supported = this.isSupported();
    const config = supported
      ? await this.getConfig()
      : { endpointAvailable: false, enabled: false, publicKey: '' };
    const subscription = supported ? await this.getBrowserSubscription() : null;

    return {
      supported,
      endpointAvailable: config.endpointAvailable,
      configured: config.enabled,
      subscribed: Boolean(subscription)
    };
  }

  async subscribeDevice(deviceId) {
    if (!deviceId || !this.isSupported()) {
      return { ok: false, reason: 'unsupported' };
    }

    const config = await this.getConfig(true);
    if (!config.enabled) {
      return {
        ok: false,
        reason: config.endpointAvailable ? 'missing_vapid' : 'endpoint_unavailable'
      };
    }

    const registration = await this.getRegistration();
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey)
      });
    }

    const response = await fetch(PUSH_SUBSCRIPTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        deviceId,
        subscription: subscription.toJSON(),
        createdAt: Date.now()
      })
    });
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return {
        ok: false,
        reason: data?.error || 'subscription_failed'
      };
    }

    return { ok: true, subscription };
  }

  async unsubscribeDevice(deviceId) {
    const subscription = await this.getBrowserSubscription();

    if (subscription) {
      await subscription.unsubscribe();
    }

    if (!deviceId) return { ok: true };

    try {
      await fetch(PUSH_SUBSCRIPTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          action: 'unsubscribe',
          deviceId
        })
      });
    } catch (err) {
      console.warn('[PushService] Falha ao remover inscricao Web Push no servidor:', err);
    }

    return { ok: true };
  }

  async syncReminderSchedules(deviceId, reminders) {
    if (!deviceId || !this.isSupported()) {
      return { ok: false, reason: 'unsupported' };
    }

    const config = await this.getConfig();
    if (!config.enabled) {
      return {
        ok: false,
        reason: config.endpointAvailable ? 'missing_vapid' : 'endpoint_unavailable'
      };
    }

    const subscription = await this.getBrowserSubscription();
    if (!subscription) {
      return { ok: false, reason: 'not_subscribed' };
    }

    try {
      const response = await fetch(PUSH_REMINDERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ deviceId, reminders })
      });
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        return { ok: false, reason: data?.error || 'sync_failed' };
      }

      return { ok: true, data };
    } catch (err) {
      console.warn('[PushService] Falha ao sincronizar lembretes Web Push:', err);
      return { ok: false, reason: 'network_error' };
    }
  }

  async sendTestPush(deviceId) {
    if (!deviceId) return { ok: false, reason: 'missing_device_id' };

    try {
      const response = await fetch(PUSH_TEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ deviceId })
      });
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        return { ok: false, reason: data?.error || 'test_failed' };
      }

      return { ok: true };
    } catch (err) {
      console.warn('[PushService] Falha ao disparar teste Web Push:', err);
      return { ok: false, reason: 'network_error' };
    }
  }
}

export const pushService = new PushService();
export default pushService;
