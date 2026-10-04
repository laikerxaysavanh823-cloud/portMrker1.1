import { BuiltinCategoryKey, CustomCategory, MonthData } from '../types';

/**
 * Budget lines = the 7 built-in categories (any except food can be switched off)
 * plus the user's own categories. Everything that totals a month's plan goes through here.
 */

type AllocField = keyof MonthData['allocations'];
export type LineKey = 'food' | BuiltinCategoryKey;

export interface BuiltinLineDef {
  key: LineKey;
  pctField: AllocField;
  amountField: AllocField;
  currency: 'LAK' | 'USD';
  color: string;
  labelKey: string; // translation key
  assetType?: 'stock' | 'etf' | 'btc' | 'gold' | 'emergency';
}

export const BUILTIN_LINES: BuiltinLineDef[] = [
  { key: 'food', pctField: 'foodLivingPct', amountField: 'foodLivingLak', currency: 'LAK', color: 'blue', labelKey: 'foodLiving' },
  { key: 'stocks', pctField: 'usStocksPct', amountField: 'usStocksUsd', currency: 'USD', color: 'emerald', labelKey: 'usStocksInvest', assetType: 'stock' },
  { key: 'funds', pctField: 'fundsEtfsPct', amountField: 'fundsEtfsUsd', currency: 'USD', color: 'teal', labelKey: 'fundsInvest', assetType: 'etf' },
  { key: 'btc', pctField: 'bitcoinPct', amountField: 'bitcoinUsd', currency: 'USD', color: 'orange', labelKey: 'btcInvest', assetType: 'btc' },
  { key: 'gold', pctField: 'goldPct', amountField: 'goldUsd', currency: 'USD', color: 'amber', labelKey: 'goldInvest', assetType: 'gold' },
  { key: 'emergency', pctField: 'emergencyPct', amountField: 'emergencyLak', currency: 'LAK', color: 'purple', labelKey: 'emergencySavings', assetType: 'emergency' },
  { key: 'leisure', pctField: 'savingsLeisurePct', amountField: 'savingsLeisureLak', currency: 'LAK', color: 'indigo', labelKey: 'leisureSavings' },
];

/** Literal Tailwind class sets so the classes exist at build time. */
export const CATEGORY_COLORS: Record<string, { icon: string; badge: string; text: string; pill: string; dot: string }> = {
  blue: { icon: 'bg-blue-950/80 border-blue-800/50 text-blue-400', badge: 'bg-blue-950 text-blue-400 border-blue-800/40', text: 'text-blue-400', pill: 'bg-blue-950/80 border-blue-800/50 text-blue-300', dot: 'bg-blue-500' },
  emerald: { icon: 'bg-emerald-950/80 border-emerald-800/50 text-emerald-400', badge: 'bg-emerald-950 text-emerald-400 border-emerald-800/40', text: 'text-emerald-400', pill: 'bg-emerald-950/80 border-emerald-800/50 text-emerald-300', dot: 'bg-emerald-500' },
  teal: { icon: 'bg-teal-950/80 border-teal-800/50 text-teal-400', badge: 'bg-teal-950 text-teal-400 border-teal-800/40', text: 'text-teal-400', pill: 'bg-teal-950/80 border-teal-800/50 text-teal-300', dot: 'bg-teal-500' },
  orange: { icon: 'bg-orange-950/80 border-orange-800/50 text-orange-400', badge: 'bg-orange-950 text-orange-400 border-orange-800/40', text: 'text-orange-400', pill: 'bg-orange-950/80 border-orange-800/50 text-orange-300', dot: 'bg-orange-500' },
  amber: { icon: 'bg-amber-950/80 border-amber-800/50 text-amber-400', badge: 'bg-amber-950 text-amber-400 border-amber-800/40', text: 'text-amber-300', pill: 'bg-amber-950/80 border-amber-800/50 text-amber-300', dot: 'bg-amber-500' },
  purple: { icon: 'bg-purple-950/80 border-purple-800/50 text-purple-400', badge: 'bg-purple-950 text-purple-400 border-purple-800/40', text: 'text-purple-300', pill: 'bg-purple-950/80 border-purple-800/50 text-purple-300', dot: 'bg-purple-500' },
  indigo: { icon: 'bg-indigo-950/80 border-indigo-800/50 text-indigo-400', badge: 'bg-indigo-950 text-indigo-400 border-indigo-800/40', text: 'text-indigo-300', pill: 'bg-indigo-950/80 border-indigo-800/50 text-indigo-300', dot: 'bg-indigo-500' },
  rose: { icon: 'bg-rose-950/80 border-rose-800/50 text-rose-400', badge: 'bg-rose-950 text-rose-400 border-rose-800/40', text: 'text-rose-300', pill: 'bg-rose-950/80 border-rose-800/50 text-rose-300', dot: 'bg-rose-500' },
  sky: { icon: 'bg-sky-950/80 border-sky-800/50 text-sky-400', badge: 'bg-sky-950 text-sky-400 border-sky-800/40', text: 'text-sky-300', pill: 'bg-sky-950/80 border-sky-800/50 text-sky-300', dot: 'bg-sky-500' },
  lime: { icon: 'bg-lime-950/80 border-lime-800/50 text-lime-400', badge: 'bg-lime-950 text-lime-400 border-lime-800/40', text: 'text-lime-300', pill: 'bg-lime-950/80 border-lime-800/50 text-lime-300', dot: 'bg-lime-500' },
  pink: { icon: 'bg-pink-950/80 border-pink-800/50 text-pink-400', badge: 'bg-pink-950 text-pink-400 border-pink-800/40', text: 'text-pink-300', pill: 'bg-pink-950/80 border-pink-800/50 text-pink-300', dot: 'bg-pink-500' },
  cyan: { icon: 'bg-cyan-950/80 border-cyan-800/50 text-cyan-400', badge: 'bg-cyan-950 text-cyan-400 border-cyan-800/40', text: 'text-cyan-300', pill: 'bg-cyan-950/80 border-cyan-800/50 text-cyan-300', dot: 'bg-cyan-500' },
};

export const CUSTOM_COLOR_CHOICES = ['rose', 'sky', 'lime', 'pink', 'cyan', 'emerald', 'amber', 'purple'];

export const colorOf = (c: string) => CATEGORY_COLORS[c] || CATEGORY_COLORS.sky;

export interface BudgetLine {
  id: string; // builtin key or custom category id
  builtin?: BuiltinLineDef;
  custom?: CustomCategory;
  currency: 'LAK' | 'USD';
  color: string;
  pct: number;
  plannedNative: number;
  plannedLak: number;
  actualNative: number;
  actualLak: number;
}

export interface CategoryOptions {
  hidden: BuiltinCategoryKey[];
  customCategories: CustomCategory[];
}

/** Every visible budget line of a month, with plan and actual amounts. */
export function getBudgetLines(month: MonthData, usdLak: number, opts: CategoryOptions): BudgetLine[] {
  const inv = month.investments || [];
  const lines: BudgetLine[] = [];

  for (const def of BUILTIN_LINES) {
    if (def.key !== 'food' && opts.hidden.includes(def.key as BuiltinCategoryKey)) continue;
    const plannedNative = (month.allocations[def.amountField] as number) || 0;
    let actualNative = 0;
    let actualLak = 0;
    if (def.key === 'food') {
      actualLak = actualNative = (month.expenses || []).reduce((a, e) => a + e.amountLak, 0);
    } else if (def.key === 'leisure') {
      actualLak = actualNative = month.savingsDepositedLak || 0;
    } else if (def.assetType) {
      const matches = inv.filter((i) => i.assetType === def.assetType);
      actualLak = matches.reduce((a, i) => a + i.amountLak, 0);
      actualNative = def.currency === 'USD' ? matches.reduce((a, i) => a + i.amountUsd, 0) : actualLak;
    }
    lines.push({
      id: def.key,
      builtin: def,
      currency: def.currency,
      color: def.color,
      pct: (month.allocations[def.pctField] as number) || 0,
      plannedNative,
      plannedLak: def.currency === 'USD' ? plannedNative * usdLak : plannedNative,
      actualNative,
      actualLak,
    });
  }

  for (const cat of opts.customCategories) {
    const plan = month.customAllocations?.[cat.id] || { pct: 0, amount: 0 };
    const matches = inv.filter((i) => i.assetType === 'custom' && i.customCategoryId === cat.id);
    const actualLak = matches.reduce((a, i) => a + i.amountLak, 0);
    lines.push({
      id: cat.id,
      custom: cat,
      currency: cat.currency,
      color: cat.color,
      pct: plan.pct || 0,
      plannedNative: plan.amount || 0,
      plannedLak: cat.currency === 'USD' ? (plan.amount || 0) * usdLak : plan.amount || 0,
      actualNative: cat.currency === 'USD' ? matches.reduce((a, i) => a + i.amountUsd, 0) : actualLak,
      actualLak,
    });
  }

  return lines;
}

export const lineLabel = (line: BudgetLine, t: Record<string, string>) =>
  line.custom ? line.custom.name : t[line.builtin!.labelKey];

/** Holdings tabs that belong to a built-in category; hidden with it. */
const TAB_CATEGORY: Record<string, BuiltinCategoryKey> = {
  stocks: 'stocks',
  funds: 'funds',
  crypto: 'btc',
  gold: 'gold',
  emergency: 'emergency',
};

export function isTabHidden(tabId: string, hidden: BuiltinCategoryKey[]): boolean {
  const cat = TAB_CATEGORY[tabId];
  return !!cat && hidden.includes(cat);
}

export function categoryOptionsOf(state: { settings?: { hiddenCategories?: BuiltinCategoryKey[] }; customCategories?: CustomCategory[] }): CategoryOptions {
  return {
    hidden: state.settings?.hiddenCategories || [],
    customCategories: state.customCategories || [],
  };
}
