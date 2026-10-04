import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, Plugin} from 'vite';
import {createAiAnalyzeHandler} from './server/aiAnalyze';

/** Serves POST /api/ai-analyze from the dev and preview servers (keeps the Gemini key server-side). */
function aiApiPlugin(apiKey: string | undefined, model: string): Plugin {
  const handler = createAiAnalyzeHandler(apiKey, model);
  return {
    name: 'portmrker-ai-api',
    configureServer(server) {
      server.middlewares.use('/api/ai-analyze', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/ai-analyze', handler);
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const model = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-flash-latest';

  return {
    plugins: [react(), tailwindcss(), aiApiPlugin(apiKey, model)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
