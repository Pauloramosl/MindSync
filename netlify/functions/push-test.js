import { handleOptions, jsonResponse, parseJsonBody } from './_http.js';
import { connectStore, getPushStore, subscriptionKey } from './_pushStore.js';
import { configureWebPush } from './_webPush.js';

export async function handler(event) {
  const optionsResponse = handleOptions(event);
  if (optionsResponse) return optionsResponse;

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      error: 'method_not_allowed',
      message: 'Use POST para enviar uma notificacao Web Push de teste.'
    });
  }

  const body = parseJsonBody(event);
  if (!body) {
    return jsonResponse(400, {
      error: 'invalid_json',
      message: 'Corpo JSON invalido.'
    });
  }

  const deviceId = String(body.deviceId || '').trim();
  if (!deviceId) {
    return jsonResponse(400, {
      error: 'missing_device_id',
      message: 'deviceId e obrigatorio.'
    });
  }

  connectStore(event);
  const store = getPushStore();
  const subscriptionRecord = await store.get(subscriptionKey(deviceId), { type: 'json' });

  if (!subscriptionRecord?.subscription) {
    return jsonResponse(404, {
      error: 'subscription_not_found',
      message: 'Nenhuma inscricao Web Push foi encontrada para este dispositivo.'
    });
  }

  const webPush = configureWebPush();
  const payload = JSON.stringify({
    title: 'Teste Web Push MindSync',
    body: 'Esta notificacao veio do servidor. Ela funciona mesmo com o app fechado.',
    tag: 'mindsync-web-push-test',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: {
      view: 'settings',
      url: '/?view=settings',
      targetType: 'settings',
      targetId: 'web-push-test'
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Depois' }
    ],
    renotify: true,
    vibrate: [160, 80, 160],
    timestamp: Date.now()
  });

  try {
    await webPush.sendNotification(subscriptionRecord.subscription, payload, {
      TTL: 60 * 60,
      urgency: 'normal'
    });

    return jsonResponse(200, { ok: true });
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      await store.delete(subscriptionKey(deviceId));
    }

    console.error('[push-test] Falha ao enviar Web Push:', error);

    return jsonResponse(502, {
      error: 'push_send_failed',
      message: 'Nao foi possivel enviar a notificacao Web Push.'
    });
  }
}
