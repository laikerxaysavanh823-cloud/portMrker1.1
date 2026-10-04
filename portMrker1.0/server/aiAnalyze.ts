import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';
import { buildAdvisorPrompt } from '../src/utils/aiPrompt';

/**
 * POST /api/ai-analyze
 * Body: { language: 'lo' | 'th' | 'en', focus: string, question?: string, snapshot: object }
 * Runs server-side so GEMINI_API_KEY never reaches the browser.
 */

const MAX_BODY_BYTES = 64 * 1024;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function createAiAnalyzeHandler(apiKey: string | undefined, model: string) {
  let client: GoogleGenAI | null = null;

  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      sendJson(res, 503, { error: 'NO_API_KEY' });
      return;
    }

    try {
      const body = JSON.parse(await readBody(req));
      const language = String(body.language || 'lo');
      const focus = String(body.focus || 'overall');
      const question = String(body.question || '').slice(0, 500);
      const snapshot = body.snapshot ?? {};

      client ??= new GoogleGenAI({ apiKey });
      const response = await client.models.generateContent({
        model,
        contents: buildAdvisorPrompt(language, focus, question, snapshot),
        config: { temperature: 0.6 },
      });

      const text = response.text?.trim();
      if (!text) {
        sendJson(res, 502, { error: 'Empty response from AI' });
        return;
      }
      sendJson(res, 200, { text, model });
    } catch (err: any) {
      console.error('[ai-analyze]', err);
      sendJson(res, 500, { error: err?.message || 'AI request failed' });
    }
  };
}
