import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { formatCurrency } from '../utils/formatters';
import { computeBudgetAlerts } from '../utils/budgetAlerts';
import { categoryOptionsOf, lineLabel } from '../utils/categories';
import { AlertTriangle, BellRing, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export const BudgetAlerts: React.FC = () => {
  const { state, currentMonthData } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const [collapsed, setCollapsed] = useState(false);

  const alerts = useMemo(
    () => computeBudgetAlerts(currentMonthData, state.rates.usdLak, categoryOptionsOf(state)),
    [currentMonthData, state.rates.usdLak, state.settings, state.customCategories]
  );

  const overCount = alerts.filter((a) => a.level === 'over').length;
  const hasData =
    currentMonthData.incomeLak > 0 ||
    (currentMonthData.expenses || []).length > 0 ||
    (currentMonthData.investments || []).length > 0;

  if (!hasData) return null;

  if (alerts.length === 0) {
    return (
      <div className="flex items-center space-x-2 bg-emerald-950/30 border border-emerald-800/50 rounded-2xl px-4 py-3 text-xs text-emerald-300">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span className="font-semibold">{t.alertAllGood}</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border shadow-lg ${
        overCount > 0 ? 'bg-rose-950/30 border-rose-800/60' : 'bg-amber-950/20 border-amber-800/50'
      }`}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center space-x-2">
          <BellRing className={`w-4 h-4 ${overCount > 0 ? 'text-rose-400' : 'text-amber-400'}`} />
          <span className="text-sm font-bold text-slate-100">{t.budgetAlerts}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              overCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
            }`}
          >
            {alerts.length}
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2.5">
          {alerts.map((a) => {
            const isOver = a.level === 'over';
            const pctShown = isFinite(a.pctUsed) ? Math.round(a.pctUsed) : null;
            const barPct = isFinite(a.pctUsed) ? Math.min(100, a.pctUsed) : 100;
            const diff = a.actualLak - a.plannedLak;
            return (
              <div key={a.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <AlertTriangle
                      className={`w-3.5 h-3.5 shrink-0 ${isOver ? 'text-rose-400' : 'text-amber-400'}`}
                    />
                    <span className="font-semibold text-slate-200 truncate">
                      {a.line ? lineLabel(a.line, t) : t.alertTotal}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isOver ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {isOver ? t.alertOver : t.alertWarning}
                    {pctShown !== null && ` · ${pctShown}%`}
                  </span>
                </div>

                <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isOver ? 'bg-rose-500' : 'bg-amber-400'}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>

                <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-[11px] font-mono text-slate-400">
                  <span>
                    {formatCurrency(a.actualLak, 'LAK')} /{' '}
                    {a.plannedLak > 0 ? formatCurrency(a.plannedLak, 'LAK') : t.alertNoPlan}
                  </span>
                  {isOver && a.plannedLak > 0 && (
                    <span className="text-rose-300 font-bold">+{formatCurrency(diff, 'LAK')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
