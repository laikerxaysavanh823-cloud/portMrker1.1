/**
 * Runtime environment helpers.
 * The app runs either as a normal Vite web app, or published as a claude.ai web page
 * (an "artifact"), where `window.claude` gives access to cloud storage, Claude AI and file saving,
 * and where outside network requests, pop-up windows and plain <a download> links are blocked.
 */

declare global {
  interface Window {
    claude?: { use: (name: string) => Promise<any> };
  }
  /** Set to true by web/build-web.ps1 (esbuild --define) for the prebuilt single-page versions. */
  const __STATIC_SITE__: boolean | undefined;
}

export const isClaudeArtifact = typeof window !== 'undefined' && !!window.claude;

/** Prebuilt page without the Vite dev server behind it (claude.ai page or any static web host). */
export const isStaticSite = typeof __STATIC_SITE__ !== 'undefined' && !!__STATIC_SITE__;

/** Resolve a claude.ai runtime capability, or null when unavailable (always null outside claude.ai). */
export async function useCapability<T = any>(name: string): Promise<T | null> {
  if (!window.claude) return null;
  try {
    return (await window.claude.use(name)) ?? null;
  } catch {
    return null;
  }
}

/** Offer a generated file to the user. Returns false if it could not be saved. */
export async function saveFile(filename: string, content: string, mime: string): Promise<boolean> {
  if (isClaudeArtifact) {
    const downloads = await useCapability('downloads');
    if (!downloads) {
      notify('ບໍ່ສາມາດບັນທຶກໄຟລ໌ໃນໜ້ານີ້ / Saving files is not available here');
      return false;
    }
    try {
      await downloads.save({ filename, data: content });
      return true;
    } catch (e: any) {
      if (e?.code !== 'declined') notify(`Save failed: ${e?.code || e}`);
      return false;
    }
  }

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

// ---------- Toasts & confirm dialog (native alert/confirm don't work inside claude.ai) ----------

export interface ToastItem {
  id: number;
  message: string;
}

export interface ConfirmRequest {
  message: string;
  resolve: (ok: boolean) => void;
}

type Listener = () => void;

let toasts: ToastItem[] = [];
let confirmQueue: ConfirmRequest[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

const emit = () => listeners.forEach((l) => l());

export function subscribeDialogs(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const getToasts = () => toasts;
export const getActiveConfirm = (): ConfirmRequest | undefined => confirmQueue[0];

/** Show a short message at the bottom of the screen (replacement for alert). */
export function notify(message: string, durationMs = 3500) {
  const id = nextId++;
  toasts = [...toasts, { id, message }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, durationMs);
}

/** Ask the user to confirm (replacement for confirm). */
export function askConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    confirmQueue = [...confirmQueue, { message, resolve }];
    emit();
  });
}

export function answerConfirm(ok: boolean) {
  const [first, ...rest] = confirmQueue;
  if (!first) return;
  confirmQueue = rest;
  emit();
  first.resolve(ok);
}
