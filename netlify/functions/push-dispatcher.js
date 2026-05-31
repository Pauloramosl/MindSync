import { jsonResponse } from './_http.js';
import {
  connectStore,
  getAllJson,
  getPushStore,
  reminderKey,
  reminderPrefix,
  subscriptionKey
} from './_pushStore.js';
import { configureWebPush, createPushPayload, getVapidConfig } from './_webPush.js';

const REMINDER_PREFIX = 'reminders/';
const MAX_DISPATCH_PER_RUN = 100;

export const config = {
  schedule: '*/5 * * * *'
};

async function deleteDeviceReminders(store, deviceId) {
  const entries = await getAllJson(store, reminderPrefix(deviceId));

  await Promise.all(entries.map((entry) => store.delete(entry.key)));
}

export async function handler(event = {}) {
  if (event.httpMethod && !['GET', 'POST'].includes(event.httpMethod)) {
    return jsonResponse(405, {
      error: 'method_not_allowed',
      message: 'Use GET/POST ou o agendamento Netlify para despachar Web Push.'
    });
  }

  const vapid = getVapidConfig();
  if (!vapid.configured) {
    return jsonResponse(503, {
      error: 'web_push_not_configured',
      message: 'Configure VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no ambiente Netlify.'
    });
  }

  connectStore(event);
  const store = getPushStore();
  const webPush = configureWebPush();
  const now = Date.now();
  const entries = await getAllJson(store, REMINDER_PREFIX);
  const dueEntries = entries
    .filter((entry) => Number(entry.data?.dueAt || 0) <= now)
    .slice(0, MAX_DISPATCH_PER_RUN);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const entry of dueEntries) {
    const reminder = entry.data;
    const subscriptionRecord = await store.get(subscriptionKey(reminder.deviceId), { type: 'json' });

    if (!subscriptionRecord?.subscription) {
      skipped += 1;
      await store.delete(entry.key);
      continue;
    }

    try {
      await webPush.sendNotification(subscriptionRecord.subscription, createPushPayload(reminder), {
        TTL: 60 * 60 * 24,
        urgency: 'normal'
      });

      sent += 1;

      if (reminder.repeatIntervalMs > 0) {
        await store.setJSON(reminderKey(reminder.deviceId, reminder.id), {
          ...reminder,
          dueAt: now + reminder.repeatIntervalMs,
          sentCount: Number(reminder.sentCount || 0) + 1,
          lastSentAt: now,
          updatedAt: now
        });
      } else {
        await store.delete(entry.key);
      }
    } catch (error) {
      failed += 1;

      if (error.statusCode === 404 || error.statusCode === 410) {
        await store.delete(subscriptionKey(reminder.deviceId));
        await deleteDeviceReminders(store, reminder.deviceId);
      } else {
        console.error('[push-dispatcher] Falha ao enviar Web Push:', error);
      }
    }
  }

  return jsonResponse(200, {
    ok: true,
    checked: entries.length,
    due: dueEntries.length,
    sent,
    failed,
    skipped
  });
}
