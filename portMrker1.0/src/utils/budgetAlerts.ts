import { MonthData } from '../types';
import { BudgetLine, CategoryOptions, getBudgetLines } from './categories';

export type AlertLevel = 'warning' | 'over';

export interface BudgetAlert {
  id: string; // budget line id, or 'total'
  line?: BudgetLine; // undefined for the 'total' alert
  level: AlertLevel;
  plannedLak: number;
  actualLak: number;
  pctUsed: number; // actual / planned * 100
}

/** Show a warning once a budget line reaches this share of its plan. */
export const WARNING_THRESHOLD_PCT = 80;

function evaluate(
  id: string,
  plannedLak: number,
  actualLak: number,
  warnEarly: boolean,
  line?: BudgetLine
): BudgetAlert | null {
  if (plannedLak <= 0) {
    // No plan set but money already spent on living costs → treat as over budget
    return actualLak > 0 && id === 'food'
      ? { id, line, level: 'over', plannedLak, actualLak, pctUsed: Infinity }
      : null;
  }
  const pctUsed = (actualLak / plannedLak) * 100;
  if (pctUsed > 100) return { id, line, level: 'over', plannedLak, actualLak, pctUsed };
  if (warnEarly && pctUsed >= WARNING_THRESHOLD_PCT)
    return { id, line, level: 'warning', plannedLak, actualLak, pctUsed };
  return null;
}

/**
 * Compute budget alerts for a month.
 * - Living expenses and total outflow get an early warning at 80% and an alert when over 100%.
 * - Investment / saving lines only alert when they exceed the plan (investing early is not a problem).
 * - Categories the user switched off are ignored.
 */
export function computeBudgetAlerts(month: MonthData, usdLak: number, opts: CategoryOptions): BudgetAlert[] {
  const lines = getBudgetLines(month, usdLak, opts);
  const alerts: (BudgetAlert | null)[] = [];

  for (const line of lines) {
    if (line.id === 'leisure') continue; // free savings: saving more than planned is fine
    alerts.push(evaluate(line.id, line.plannedLak, line.actualLak, line.id === 'food', line));
  }

  if (month.incomeLak > 0) {
    const livingActual = (month.expenses || []).reduce((acc, e) => acc + e.amountLak, 0);
    const investLak = (month.investments || []).reduce((acc, i) => acc + i.amountLak, 0);
    const totalOut = livingActual + investLak + (month.savingsDepositedLak || 0);
    alerts.push(evaluate('total', month.incomeLak, totalOut, true));
  }

  return alerts
    .filter((x): x is BudgetAlert => x !== null)
    .sort((x, y) => (x.level === y.level ? 0 : x.level === 'over' ? -1 : 1));
}

/** Living-expense usage after adding a hypothetical new expense (for the expense form preview). */
export function previewLivingBudget(month: MonthData, extraLak: number) {
  const planned = month.allocations.foodLivingLak;
  const actual = (month.expenses || []).reduce((acc, e) => acc + e.amountLak, 0) + extraLak;
  const pctUsed = planned > 0 ? (actual / planned) * 100 : actual > 0 ? Infinity : 0;
  return { planned, actual, pctUsed, remaining: planned - actual };
}
