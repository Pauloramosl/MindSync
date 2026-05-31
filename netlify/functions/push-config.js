import { handleOptions, jsonResponse } from './_http.js';
import { getVapidConfig } from './_webPush.js';

export async function handler(event) {
  const optionsResponse = handleOptions(event);
  if (optionsResponse) return optionsResponse;

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, {
      error: 'method_not_allowed',
      message: 'Use GET para consultar a configuracao de Web Push.'
    });
  }

  const vapid = getVapidConfig();

  return jsonResponse(200, {
    enabled: vapid.configured,
    publicKey: vapid.publicKey || ''
  });
}
