import { handleOptions, jsonResponse, parseJsonBody } from './_http.js';
import {
  connectStore,
  getAllJson,
  getPushStore,
  reminderKey,
  reminderPrefix
} from './_pushStore.js';
import { getVapidConfig } from './_webPush.js';

const MAX_REMINDERS_PER_DEVICE = 250;
const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 240;

function truncate(value, maxLength) {
  return String(value || '').slice(0, maxLength);
}

function sanitizeReminder(deviceId, reminder, existingReminder) {
  const id = truncate(reminder.id, 180);
  const targetType = truncate(reminder.targetType, 40);
  const targetId = truncate(reminder.targetId, 180);
  const dueAt = Number(reminder.dueAt);
  const repeatIntervalMs = Math.max(0, Number(reminder.repeatIntervalMs || 0));
  const lastActivityAt = Number(reminder.lastActivityAt || 0);

  if (!id || !targetType || !targetId || !Number.isFinite(dueAt)) {
    return null;
  }

  let finalDueAt = dueAt;
  const sameActivity = existingReminder?.lastActivityAt === lastActivityAt;
  const sameInterval = existingReminder?.repeatIntervalMs === repeatIntervalMs;

  if (sameActivity && sameInterval && Number(existingReminder?.dueAt) > dueAt) {
    finalDueAt = Number(existingReminder.dueAt);
  }

  return {
    id,
    deviceId,
    targetType,
    targetId,
    type: truncate(reminder.type, 60),
    reason: truncate(reminder.reason || 'forgotten', 60),
    title: truncate(reminder.title || 'MindSync', MAX_TITLE_LENGTH),
    body: truncate(reminder.body || 'Voce tem um item pendente para verificar.', MAX_BODY_LENGTH),
    tag: truncate(reminder.tag || `mindsync-${id}`, 180),
    view: truncate(reminder.view || 'inbox', 40),
    url: truncate(reminder.url || '/?view=inbox', 300),
    dueAt: finalDueAt,
    repeatIntervalMs,
    lastActivityAt,
    sentCount: Number(existingReminder?.sentCount || 0),
    lastSentAt: existingReminder?.lastSentAt || null,
    createdAt: existingReminder?.createdAt || Date.now(),
    updatedAt: Date.now()
  };
}

export async function handler(event) {
  const optionsResponse = handleOptions(event);
  if (optionsResponse) return optionsResponse;

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      error: 'method_not_allowed',
      message: 'Use POST para sincronizar lembretes Web Push.'
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
  const reminders = Array.isArray(body.reminders) ? body.reminders.slice(0, MAX_REMINDERS_PER_DEVICE) : [];

  if (!deviceId) {
    return jsonResponse(400, {
      error: 'missing_device_id',
      message: 'deviceId e obrigatorio.'
    });
  }

  connectStore(event);
  const store = getPushStore();
  const prefix = reminderPrefix(deviceId);
  const existingEntries = await getAllJson(store, prefix);
  const existingById = new Map(existingEntries.map((entry) => [entry.data.id, entry]));
  const keysToKeep = new Set();

  for (const rawReminder of reminders) {
    const existing = existingById.get(rawReminder.id)?.data;
    const reminder = sanitizeReminder(deviceId, rawReminder, existing);
    if (!reminder) continue;

    const key = reminderKey(deviceId, reminder.id);
    keysToKeep.add(key);
    await store.setJSON(key, reminder);
  }

  for (const entry of existingEntries) {
    if (!keysToKeep.has(entry.key)) {
      await store.delete(entry.key);
    }
  }

  return jsonResponse(200, {
    ok: true,
    synced: keysToKeep.size,
    removed: existingEntries.length - keysToKeep.size
  });
}
