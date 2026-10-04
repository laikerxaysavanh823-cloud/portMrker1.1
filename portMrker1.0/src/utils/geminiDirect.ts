/**
 * Gemini called straight from the browser, for the static website version (no server).
 * The user's own API key is kept only in this browser's localStorage.
 */

const KEY_STORAGE = 'portmrker_gemini_key';
const MODEL = 'gemini-flash-latest';

export function getSavedGeminiKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function saveGeminiKey(key: string) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* storage unavailable */
  }
}

export async function askGeminiDirect(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((p: { text?: string }) => p.text || '')
    .join('')
    .trim();
  if (!text) throw new Error('Empty response from AI');
  return text;
}
