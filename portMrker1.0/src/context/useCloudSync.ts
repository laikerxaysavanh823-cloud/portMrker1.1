import { useEffect, useRef, useState } from 'react';
import { AppState } from '../types';
import { isClaudeArtifact, notify, useCapability } from '../utils/platform';

/**
 * Cloud sync for the claude.ai web version.
 * The state is stored in the viewer's private db space (data/users/<id>/...), split into
 * one document for settings/holdings/goals ("core") and one document per month, so the
 * 256 KiB per-document limit is never reached. Phone and PC see the same data live.
 * Outside claude.ai this hook does nothing and the app keeps using localStorage only.
 */

export type SyncStatus = 'local' | 'connecting' | 'synced' | 'saving' | 'error';

const CORE_ID = 'core';
const MONTH_PREFIX = 'month-';
const WRITE_DELAY_MS = 1200;

/** Serialize state into {docId: json}. selectedMonth stays per device. */
function splitState(s: AppState): Record<string, string> {
  const { months, selectedMonth: _selected, ...core } = s;
  const out: Record<string, string> = { [CORE_ID]: JSON.stringify(core) };
  for (const [key, month] of Object.entries(months)) {
    out[MONTH_PREFIX + key] = JSON.stringify(month);
  }
  return out;
}

function assemble(
  docs: Record<string, string>,
  local: AppState,
  normalize: (s: AppState) => AppState
): AppState | null {
  if (!docs[CORE_ID]) return null;
  try {
    const core = JSON.parse(docs[CORE_ID]);
    const months: AppState['months'] = {};
    for (const [id, json] of Object.entries(docs)) {
      if (id.startsWith(MONTH_PREFIX)) months[id.slice(MONTH_PREFIX.length)] = JSON.parse(json);
    }
    const keys = Object.keys(months).sort();
    const selectedMonth = months[local.selectedMonth] ? local.selectedMonth : keys[keys.length - 1] || local.selectedMonth;
    return normalize({ ...core, months, selectedMonth });
  } catch (e) {
    console.error('Cloud data could not be read:', e);
    return null;
  }
}

export function useCloudSync(
  state: AppState,
  setState: (s: AppState) => void,
  normalize: (s: AppState) => AppState
): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(isClaudeArtifact ? 'connecting' : 'local');
  const [flushTick, setFlushTick] = useState(0);

  const colRef = useRef<any>(null);
  const remoteRef = useRef<Record<string, string>>({}); // what the server holds, per doc
  const readyRef = useRef(false);
  const writingRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Connect and subscribe once
  useEffect(() => {
    if (!isClaudeArtifact) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const [db, user] = await Promise.all([useCapability('db'), useCapability('user')]);
      const uid: string | null = user ? await user.id().catch(() => null) : null;
      if (cancelled) return;
      if (!db || !uid) {
        setStatus('local');
        return;
      }

      const col = db.collection(`data/users/${uid}`);
      colRef.current = col;

      unsubscribe = col.onSnapshot(
        (snap: any) => {
          const docs: Record<string, string> = {};
          for (const d of snap.docs) {
            const v = d.data()?.v;
            if (typeof v === 'string') docs[d.id] = v;
          }
          const localDocs = splitState(stateRef.current);
          const hasUnsavedLocal =
            readyRef.current && Object.keys(localDocs).some((id) => localDocs[id] !== remoteRef.current[id]);
          remoteRef.current = docs;

          if (!readyRef.current) {
            // First load: cloud wins when it has data; otherwise this device's data is uploaded
            readyRef.current = true;
            const remoteState = assemble(docs, stateRef.current, normalize);
            if (remoteState) setState(remoteState);
            setStatus('synced');
            setFlushTick((x) => x + 1);
            return;
          }

          // Local edits waiting to be written win; otherwise apply changes from the other device
          if (hasUnsavedLocal) return;
          const ids = new Set([...Object.keys(docs), ...Object.keys(localDocs)]);
          const changed = [...ids].some((id) => docs[id] !== localDocs[id]);
          if (changed) {
            const remoteState = assemble(docs, stateRef.current, normalize);
            if (remoteState) setState(remoteState);
          }
        },
        (err: any) => {
          console.error('Cloud sync stopped:', err);
          setStatus('error');
        }
      );
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write changed documents shortly after each change
  useEffect(() => {
    if (!readyRef.current || !colRef.current) return;
    const timer = setTimeout(async () => {
      if (writingRef.current) return; // the running write re-triggers this when done

      const local = splitState(stateRef.current);
      const dirty = Object.keys(local).filter((id) => local[id] !== remoteRef.current[id]);
      // Months removed locally (reset / restore from backup) are removed in the cloud too
      const removed = Object.keys(remoteRef.current).filter((id) => !(id in local));
      if (dirty.length === 0 && removed.length === 0) {
        setStatus('synced');
        return;
      }

      writingRef.current = true;
      setStatus('saving');
      try {
        for (const id of dirty) {
          await colRef.current.doc(id).set({ v: local[id], updatedAt: new Date().toISOString() });
          remoteRef.current = { ...remoteRef.current, [id]: local[id] };
        }
        for (const id of removed) {
          await colRef.current.doc(id).delete();
          const { [id]: _gone, ...rest } = remoteRef.current;
          remoteRef.current = rest;
        }
        setStatus('synced');
        setFlushTick((x) => x + 1); // pick up edits made while writing
      } catch (e: any) {
        console.error('Cloud save failed:', e);
        setStatus('error');
        notify(
          e?.code === 'quota_exceeded'
            ? 'ພື້ນທີ່ຄລາວເຕັມ / Cloud storage is full'
            : 'ບັນທຶກຂຶ້ນຄລາວບໍ່ສຳເລັດ — ຂໍ້ມູນຍັງຢູ່ໃນເຄື່ອງນີ້ / Cloud save failed — data is kept on this device'
        );
      } finally {
        writingRef.current = false;
      }
    }, WRITE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state, flushTick]);

  return status;
}
