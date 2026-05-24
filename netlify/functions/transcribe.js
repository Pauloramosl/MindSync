const GROQ_TRANSCRIPTION_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_MODEL = 'whisper-large-v3-turbo';

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  };
}

function getHeader(headers, headerName) {
  const normalizedName = headerName.toLowerCase();
  const match = Object.entries(headers || {}).find(
    ([key]) => key.toLowerCase() === normalizedName
  );

  return match?.[1];
}

function getAudioExtension(mimeType) {
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'webm';
}

function getAudioBuffer(event) {
  if (!event.body) return Buffer.alloc(0);
  return Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'binary');
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {});
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      error: 'method_not_allowed',
      message: 'Use POST para transcrever audio.'
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return jsonResponse(500, {
      error: 'missing_server_api_key',
      message: 'A chave GROQ_API_KEY nao esta configurada no servidor Netlify.'
    });
  }

  const audioBuffer = getAudioBuffer(event);

  if (audioBuffer.byteLength === 0) {
    return jsonResponse(400, {
      error: 'empty_audio',
      message: 'Nenhum audio foi enviado para transcricao.'
    });
  }

  const contentType = getHeader(event.headers, 'content-type') || 'audio/webm';
  const extension = getAudioExtension(contentType);
  const audioBlob = new Blob([audioBuffer], { type: contentType });
  const formData = new FormData();

  formData.append('file', audioBlob, `audio.${extension}`);
  formData.append('model', GROQ_MODEL);
  formData.append('response_format', 'json');
  formData.append('language', 'pt');

  try {
    const response = await fetch(GROQ_TRANSCRIPTION_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return jsonResponse(response.status, {
        error: 'groq_transcription_failed',
        message: data.error?.message || 'A Groq nao conseguiu transcrever o audio.'
      });
    }

    return jsonResponse(200, {
      text: data.text || ''
    });
  } catch (error) {
    console.error('Erro ao chamar a Groq:', error);

    return jsonResponse(502, {
      error: 'groq_unavailable',
      message: 'Nao foi possivel conectar a Groq para transcrever o audio.'
    });
  }
}
