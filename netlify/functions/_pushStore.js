import { Buffer } from 'node:buffer';
import { connectLambda, getStore } from '@netlify/blobs';

export const PUSH_STORE_NAME = 'mindsync-push';

export function connectStore(event) {
  if (event?.blobs) {
    connectLambda(event);
  }
}

export function getPushStore() {
  return getStore(PUSH_STORE_NAME);
}

export function encodeKeyPart(value) {
  return Buffer.from(String(value || 'unknown')).toString('base64url');
}

export function subscriptionKey(deviceId) {
  return `subscriptions/${encodeKeyPart(deviceId)}.json`;
}

export function reminderPrefix(deviceId) {
  return `reminders/${encodeKeyPart(deviceId)}/`;
}

export function reminderKey(deviceId, reminderId) {
  return `${reminderPrefix(deviceId)}${encodeKeyPart(reminderId)}.json`;
}

export async function getAllJson(store, prefix) {
  const { blobs } = await store.list({ prefix });
  const entries = await Promise.all(
    blobs.map(async (blob) => {
      const data = await store.get(blob.key, { type: 'json' });
      return data ? { key: blob.key, data } : null;
    })
  );

  return entries.filter(Boolean);
}
