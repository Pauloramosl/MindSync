import { handleOptions, jsonResponse, parseJsonBody } from './_http.js';
import { connectStore, getPushStore, subscriptionKey } from './_pushStore.js';
import { getVapidConfig } from './_webPush.js';

function isValidSubscription(subscription) {
  return Boolean(
    subscription &&
    typeof subscription.endpoint === 'string' &&
    subscription.keys &&
    typeof subscription.keys.p256dh === 'string' &&
    typeof subscription.keys.auth === 'string'
  );
}

export async function handler(event) {
  const optionsResponse = handleOptions(event);
  if (optionsResponse) return optionsResponse;

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      error: 'method_not_allowed',
      message: 'Use POST para registrar ou remover uma inscricao Web Push.'
    });
  }

  const vapid = getVapidConfig();
  if (!vapid.configured) {
    return jsonResponse(503, {
      error: 'web_push_not_configured',
      message: 'Configure VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no ambiente Netlify.'
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
  const key = subscriptionKey(deviceId);

  if (body.action === 'unsubscribe') {
    await store.delete(key);
    return jsonResponse(200, { ok: true, subscribed: false });
  }

  if (!isValidSubscription(body.subscription)) {
    return jsonResponse(400, {
      error: 'invalid_subscription',
      message: 'A inscricao enviada pelo navegador e invalida.'
    });
  }

  await store.setJSON(key, {
    deviceId,
    subscription: body.subscription,
    createdAt: body.createdAt || Date.now(),
    updatedAt: Date.now()
  });

  return jsonResponse(200, { ok: true, subscribed: true });
}
