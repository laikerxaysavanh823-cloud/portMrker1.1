import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { formatCurrency, formatMonthLabel, getCurrentMonthKey } from '../utils/formatters';
import { SavingsGoal } from '../types';
import {
  Target,
  Plus,
  Trash2,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Trophy,
  CalendarClock,
} from 'lucide-react';
import { askConfirm } from '../utils/platform';

// Full class names so Tailwind can see them at build time
const GOAL_COLORS: Record<string, { bar: string; text: string; ring: string; dot: string }> = {
  emerald: { bar: 'bg-emerald-500', text: 'text-emerald-400', ring: 'border-emerald-700/50', dot: 'bg-emerald-500' },
  amber: { bar: 'bg-amber-500', text: 'text-amber-400', ring: 'border-amber-700/50', dot: 'bg-amber-500' },
  blue: { bar: 'bg-blue-500', text: 'text-blue-400', ring: 'border-blue-700/50', dot: 'bg-blue-500' },
  purple: { bar: 'bg-purple-500', text: 'text-purple-400', ring: 'border-purple-700/50', dot: 'bg-purple-500' },
  rose: { bar: 'bg-rose-500', text: 'text-rose-400', ring: 'border-rose-700/50', dot: 'bg-rose-500' },
  teal: { bar: 'bg-teal-500', text: 'text-teal-400', ring: 'border-teal-700/50', dot: 'bg-teal-500' },
};

/** Whole months from the current month until (and including) the deadline month. */
function monthsUntil(deadline: string): number {
  const [cy, cm] = getCurrentMonthKey().split('-').map(Number);
  const [dy, dm] = deadline.split('-').map(Number);
  return (dy - cy) * 12 + (dm - cm) + 1;
}

export function goalSavedLak(goal: SavingsGoal): number {
  return goal.contributions.reduce((acc, c) => acc + c.amountLak, 0);
}

export const GoalsManager: React.FC = () => {
  const { state, goals, addGoal, deleteGoal } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [initial, setInitial] = useState('');
  const [color, setColor] = useState('emerald');

  const [txGoal, setTxGoal] = useState<{ goal: SavingsGoal; mode: 'deposit' | 'withdraw' } | null>(null);
  const [historyGoalId, setHistoryGoalId] = useState<string | null>(null);

  const totalSaved = goals.reduce((acc, g) => acc + goalSavedLak(g), 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetLak, 0);

  const resetForm = () => {
    setName('');
    setTarget('');
    setDeadline('');
    setInitial('');
    setColor('emerald');
    setShowForm(false);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const targetLak = parseFloat(target) || 0;
    if (!name.trim() || targetLak <= 0) return;
    addGoal(
      { name: name.trim(), targetLak, deadline: deadline || undefined, color },
      parseFloat(initial) || 0
    );
    resetForm();
  };

  return (
    <div className="space-y-5">
      {/* Header / summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-700/40 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{t.goals}</h2>
              <p className="text-xs text-slate-400 font-mono">
                {t.totalGoalsSaved}: {formatCurrency(totalSaved, 'LAK')}
                {totalTarget > 0 && ` / ${formatCurrency(totalTarget, 'LAK')}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addGoal.replace('+ ', '')}</span>
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-5 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">{t.goalName}*</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={state.language === 'en' ? 'e.g. New car' : state.language === 'th' ? 'เช่น ซื้อรถใหม่' : 'ເຊັ່ນ: ຊື້ລົດໃໝ່'}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t.goalTarget}*</label>
              <input
                required
                type="number"
                min="1"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-slate-950 border border-emerald-600/60 rounded-xl px-3 py-2 text-emerald-300 font-bold font-mono focus:outline-none focus:border-emerald-500"
              />
              {parseFloat(target) > 0 && (
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  ≈ ${(parseFloat(target) / state.rates.usdLak).toFixed(2)}
                </div>
              )}
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t.goalDeadline}</label>
              <input
                type="month"
                value={deadline}
                min={getCurrentMonthKey()}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t.goalInitial}</label>
              <input
                type="number"
                min="0"
                step="any"
                value={initial}
                onChange={(e) => setInitial(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Color</label>
              <div className="flex items-center space-x-2 py-1.5">
                {Object.keys(GOAL_COLORS).map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={c}
                    className={`w-6 h-6 rounded-full ${GOAL_COLORS[c].dot} ${
                      color === c ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white' : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="sm:col-span-2 flex justify-end space-x-2 pt-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition">
                {t.cancel}
              </button>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl transition">
                {t.save}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Goal cards */}
      {goals.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-700 rounded-2xl p-10 text-center text-sm text-slate-400">
          <Target className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          {t.goalEmpty}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const c = GOAL_COLORS[goal.color] || GOAL_COLORS.emerald;
            const saved = goalSavedLak(goal);
            const remaining = Math.max(0, goal.targetLak - saved);
            const pct = goal.targetLak > 0 ? Math.min(100, (saved / goal.targetLak) * 100) : 0;
            const reached = saved >= goal.targetLak;
            const monthsLeft = goal.deadline ? monthsUntil(goal.deadline) : null;
            const overdue = monthsLeft !== null && monthsLeft <= 0 && !reached;
            const perMonth = monthsLeft && monthsLeft > 0 ? remaining / monthsLeft : null;
            const showHistory = historyGoalId === goal.id;

            return (
              <div key={goal.id} className={`bg-slate-900 border ${c.ring} rounded-2xl p-5 shadow-lg`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      {reached ? <Trophy className={`w-4 h-4 ${c.text}`} /> : <Target className={`w-4 h-4 ${c.text}`} />}
                      <h3 className="font-bold text-slate-100 truncate">{goal.name}</h3>
                    </div>
                    {goal.deadline && (
                      <div className={`flex items-center space-x-1 mt-1 text-[11px] ${overdue ? 'text-rose-400' : 'text-slate-400'}`}>
                        <CalendarClock className="w-3 h-3" />
                        <span>
                          {formatMonthLabel(goal.deadline, state.language)}
                          {overdue ? ` · ${t.goalOverdue}` : monthsLeft !== null && !reached ? ` · ${monthsLeft} ${t.goalMonthsLeft}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={async () => (await askConfirm(t.goalDeleteConfirm)) && deleteGoal(goal.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition shrink-0"
                    title={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex items-end justify-between">
                    <span className={`text-2xl font-black font-mono ${c.text}`}>{pct.toFixed(0)}%</span>
                    <span className="text-xs font-mono text-slate-400">
                      {formatCurrency(saved, 'LAK')} / {formatCurrency(goal.targetLak, 'LAK')}
                    </span>
                  </div>
                  <div className="mt-2 h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${c.bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  {reached ? (
                    <div className={`col-span-2 font-bold ${c.text}`}>{t.goalReached}</div>
                  ) : (
                    <>
                      <div className="bg-slate-950 rounded-lg p-2 border border-slate-800">
                        <div className="text-slate-500">{t.goalRemaining}</div>
                        <div className="font-mono font-bold text-slate-200">{formatCurrency(remaining, 'LAK')}</div>
                      </div>
                      <div className="bg-slate-950 rounded-lg p-2 border border-slate-800">
                        <div className="text-slate-500">{t.goalPerMonth}</div>
                        <div className="font-mono font-bold text-slate-200">
                          {perMonth !== null ? formatCurrency(perMonth, 'LAK') : '—'}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setTxGoal({ goal, mode: 'deposit' })}
                    className="flex items-center space-x-1 bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    <span>{t.goalDeposit}</span>
                  </button>
                  <button
                    onClick={() => setTxGoal({ goal, mode: 'withdraw' })}
                    disabled={saved <= 0}
                    className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs border border-slate-700 transition"
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    <span>{t.goalWithdraw}</span>
                  </button>
                  <button
                    onClick={() => setHistoryGoalId(showHistory ? null : goal.id)}
                    className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-lg text-xs transition ml-auto"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>
                      {t.goalHistory} ({goal.contributions.length})
                    </span>
                  </button>
                </div>

                {showHistory && <GoalHistory goal={goal} />}
              </div>
            );
          })}
        </div>
      )}

      {txGoal && <GoalTransactionModal goal={txGoal.goal} mode={txGoal.mode} onClose={() => setTxGoal(null)} />}
    </div>
  );
};

const GoalHistory: React.FC<{ goal: SavingsGoal }> = ({ goal }) => {
  const { state, deleteGoalContribution } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;

  if (goal.contributions.length === 0) {
    return <div className="mt-3 text-[11px] text-slate-500">—</div>;
  }

  return (
    <div className="mt-3 border-t border-slate-800 pt-3 space-y-1.5 max-h-56 overflow-y-auto">
      {goal.contributions.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-2 text-[11px] bg-slate-950/60 rounded-lg px-2.5 py-1.5">
          <div className="min-w-0">
            <span className="font-mono text-slate-500 mr-2">{c.date}</span>
            <span className="text-slate-300 truncate">{c.note || ''}</span>
            {c.monthKey && <span className="ml-1.5 text-[9px] px-1 rounded bg-slate-800 text-slate-400">{c.monthKey}</span>}
          </div>
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className={`font-mono font-bold ${c.amountLak >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {c.amountLak >= 0 ? '+' : ''}
              {formatCurrency(c.amountLak, 'LAK')}
            </span>
            <button
              onClick={async () => (await askConfirm(t.confirmDelete)) && deleteGoalContribution(goal.id, c.id)}
              className="p-0.5 text-slate-600 hover:text-rose-400 transition"
              title={t.delete}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const GoalTransactionModal: React.FC<{
  goal: SavingsGoal;
  mode: 'deposit' | 'withdraw';
  onClose: () => void;
}> = ({ goal, mode, onClose }) => {
  const { state, addGoalContribution } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const saved = goalSavedLak(goal);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [countAsSavings, setCountAsSavings] = useState(true);

  const isDeposit = mode === 'deposit';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let amt = parseFloat(amount) || 0;
    if (amt <= 0) return;
    if (!isDeposit) amt = -Math.min(amt, saved);
    addGoalContribution(goal.id, { amountLak: amt, date, note: note.trim() }, isDeposit && countAsSavings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl relative my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2 min-w-0">
            {isDeposit ? (
              <ArrowDownCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <ArrowUpCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <h3 className="text-lg font-bold text-slate-100 truncate">
              {isDeposit ? t.goalDeposit : t.goalWithdraw} · {goal.name}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold font-mono mb-1">Amount (₭ LAK)*</label>
            <input
              type="number"
              required
              min="1"
              step="any"
              max={isDeposit ? undefined : saved}
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-base font-bold font-mono focus:outline-none focus:ring-2 ${
                isDeposit
                  ? 'border-emerald-500/60 text-emerald-300 focus:ring-emerald-500'
                  : 'border-rose-500/60 text-rose-300 focus:ring-rose-500'
              }`}
            />
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              {t.goalSaved}: {formatCurrency(saved, 'LAK')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono mb-1">{t.date}</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-mono mb-1">{t.notes}</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          {isDeposit && (
            <label className="flex items-start space-x-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={countAsSavings}
                onChange={(e) => setCountAsSavings(e.target.checked)}
                className="accent-emerald-500 mt-0.5"
              />
              <span>
                {t.goalCountAsSavings} ({formatMonthLabel(state.selectedMonth, state.language)})
              </span>
            </label>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition">
              {t.cancel}
            </button>
            <button
              type="submit"
              className={`font-bold px-5 py-2 rounded-xl shadow-lg transition text-white ${
                isDeposit ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
