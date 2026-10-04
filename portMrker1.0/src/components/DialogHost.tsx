import React, { useEffect, useReducer } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { answerConfirm, getActiveConfirm, getToasts, subscribeDialogs } from '../utils/platform';
import { AlertTriangle } from 'lucide-react';

/** Renders toasts and the confirm dialog requested through notify() / askConfirm(). */
export const DialogHost: React.FC = () => {
  const { state } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const [, rerender] = useReducer((x: number) => x + 1, 0);

  useEffect(() => subscribeDialogs(rerender), []);

  const toasts = getToasts();
  const confirmReq = getActiveConfirm();

  return (
    <>
      {toasts.length > 0 && (
        <div className="fixed left-0 right-0 bottom-20 md:bottom-6 z-[70] flex flex-col items-center gap-2 px-4 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              className="max-w-sm w-full bg-slate-800 border border-slate-600 text-slate-100 text-sm rounded-xl px-4 py-3 shadow-2xl"
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}

      {confirmReq && (
        <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div role="alertdialog" className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-100 leading-relaxed">{confirmReq.message}</p>
            </div>
            <div className="flex justify-end space-x-2 mt-5">
              <button
                autoFocus
                onClick={() => answerConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => answerConfirm(true)}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white transition"
              >
                {t.confirmOk}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
