import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { formatCurrency, formatMonthLabel } from '../utils/formatters';
import { downloadCSVReport, printMonthlyReport } from '../utils/exportUtils';
import {
  BUILTIN_LINES,
  BudgetLine,
  CUSTOM_COLOR_CHOICES,
  LineKey,
  categoryOptionsOf,
  colorOf,
  getBudgetLines,
  lineLabel,
} from '../utils/categories';
import { askConfirm } from '../utils/platform';
import { BuiltinCategoryKey, MonthData } from '../types';
import {
  DollarSign,
  TrendingUp,
  Coins,
  ShieldCheck,
  Utensils,
  Trash2,
  Edit2,
  Save,
  PieChart,
  Sparkles,
  Layers,
  ShoppingBag,
  FileSpreadsheet,
  Printer,
  Download,
  PiggyBank,
  SlidersHorizontal,
  Plus,
  X,
} from 'lucide-react';

interface MonthlyBudgetManagerProps {
  onOpenExpenseModal: () => void;
  onOpenInvestmentModal: () => void;
  onOpenDataSync?: () => void;
}

type Allocations = MonthData['allocations'];
type CustomPlans = NonNullable<MonthData['customAllocations']>;

const LINE_ICONS: Record<LineKey, any> = {
  food: Utensils,
  stocks: TrendingUp,
  funds: Layers,
  btc: Coins,
  gold: Coins,
  emergency: ShieldCheck,
  leisure: ShoppingBag,
};

function lineSubtitle(key: LineKey, lang: string): string {
  switch (key) {
    case 'food':
      return lang === 'lo' ? 'ຄ່າອາຫານ, ຄ່ານ້ຳ-ໄຟ, ຄ່ານ້ຳມັນ' : lang === 'th' ? 'ค่าอาหาร, น้ำ-ไฟ, เดินทาง' : 'Food, utilities, transport';
    case 'stocks':
      return 'NVDA, AAPL, MSFT, TSLA, etc.';
    case 'funds':
      return 'VOO, QQQ, SPY, VT, etc.';
    case 'btc':
      return 'Bitcoin DCA Accumulation';
    case 'gold':
      return 'Physical Gold / Gold Grams';
    case 'emergency':
      return lang === 'lo' ? 'ເງິນສຳຮອງສຸກເສີນ (3-6 ເດືອນ)' : lang === 'th' ? 'เงินสำรองฉุกเฉิน (3-6 เดือน)' : 'Emergency reserve (3-6 months)';
    case 'leisure':
      return lang === 'lo' ? 'ເງິນອອມອິດສະຫຼະ, ທ່ອງທ່ຽວ, ຂອງຂວັນ' : lang === 'th' ? 'เงินออมอิสระ, ท่องเที่ยว, ของขวัญ' : 'Free savings, travel, gifts';
  }
}

export const MonthlyBudgetManager: React.FC<MonthlyBudgetManagerProps> = ({
  onOpenExpenseModal,
  onOpenInvestmentModal,
  onOpenDataSync,
}) => {
  const {
    state,
    currentMonthData,
    monthlySummary,
    updateMonthIncome,
    updateMonthAllocations,
    updateMonthCustomAllocations,
    deleteExpense,
    deleteInvestment,
    settings,
    customCategories,
  } = useApp();

  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const rateUsdLak = state.rates.usdLak;
  const catOpts = categoryOptionsOf(state);

  // Editing state for monthly income and allocation percentages
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editIncome, setEditIncome] = useState(currentMonthData.incomeLak.toString());
  const [allocState, setAllocState] = useState<Allocations>({ ...currentMonthData.allocations });
  const [customState, setCustomState] = useState<CustomPlans>({ ...(currentMonthData.customAllocations || {}) });

  // Sync edit states when selected month changes
  React.useEffect(() => {
    setEditIncome(currentMonthData.incomeLak.toString());
    setAllocState({ ...currentMonthData.allocations });
    setCustomState({ ...(currentMonthData.customAllocations || {}) });
    setIsEditingBudget(false);
  }, [currentMonthData]);

  // Lines shown: from the draft while editing, from saved data otherwise
  const viewMonth: MonthData = isEditingBudget
    ? { ...currentMonthData, incomeLak: parseFloat(editIncome) || 0, allocations: allocState, customAllocations: customState }
    : currentMonthData;
  const lines = getBudgetLines(viewMonth, rateUsdLak, catOpts);

  const totalPct = lines.reduce((acc, l) => acc + (l.pct || 0), 0);

  // ---------- Editing helpers ----------
  const lakToNative = (lak: number, currency: 'LAK' | 'USD') => (currency === 'USD' ? lak / rateUsdLak : lak);
  const nativeToLak = (amt: number, currency: 'LAK' | 'USD') => (currency === 'USD' ? amt * rateUsdLak : amt);

  /** Set one line's plan from a percentage (pct given) or an amount (amount given). */
  const setLinePlan = (
    line: BudgetLine,
    input: { pct?: number; amount?: number },
    income = parseFloat(editIncome) || 0
  ) => {
    let pct: number;
    let amount: number;
    if (input.pct !== undefined) {
      pct = input.pct;
      amount = lakToNative(income * (pct / 100), line.currency);
    } else {
      amount = input.amount || 0;
      pct = income > 0 ? (nativeToLak(amount, line.currency) / income) * 100 : 0;
    }
    if (line.builtin) {
      const def = line.builtin;
      setAllocState((prev) => ({ ...prev, [def.pctField]: pct, [def.amountField]: amount }));
    } else {
      setCustomState((prev) => ({ ...prev, [line.id]: { pct, amount } }));
    }
  };

  /** Apply a full set of percentages ({lineId: pct}); lines not listed get 0. */
  const applyPercentages = (pcts: Record<string, number>) => {
    const income = parseFloat(editIncome) || currentMonthData.incomeLak || 0;
    const nextAlloc = { ...allocState };
    const nextCustom: CustomPlans = { ...customState };
    for (const def of BUILTIN_LINES) {
      const visible = lines.some((l) => l.id === def.key);
      const pct = visible ? pcts[def.key] || 0 : 0;
      (nextAlloc as any)[def.pctField] = pct;
      (nextAlloc as any)[def.amountField] = lakToNative(income * (pct / 100), def.currency);
    }
    for (const cat of customCategories) {
      const pct = pcts[cat.id] || 0;
      nextCustom[cat.id] = { pct, amount: lakToNative(income * (pct / 100), cat.currency) };
    }
    setAllocState(nextAlloc);
    setCustomState(nextCustom);
  };

  const handleIncomeChange = (valStr: string) => {
    setEditIncome(valStr);
    const income = parseFloat(valStr) || 0;
    // Keep percentages, recalculate amounts
    const nextAlloc = { ...allocState };
    for (const def of BUILTIN_LINES) {
      const pct = (allocState[def.pctField] as number) || 0;
      (nextAlloc as any)[def.amountField] = lakToNative(income * (pct / 100), def.currency);
    }
    const nextCustom: CustomPlans = {};
    for (const cat of customCategories) {
      const pct = customState[cat.id]?.pct || 0;
      nextCustom[cat.id] = { pct, amount: lakToNative(income * (pct / 100), cat.currency) };
    }
    setAllocState(nextAlloc);
    setCustomState({ ...customState, ...nextCustom });
  };

  const presetClassic = () =>
    applyPercentages({ food: 15, stocks: 15, funds: 20, btc: 15, gold: 25, emergency: 10, leisure: 0 });
  const preset503020 = () =>
    applyPercentages({ food: 50, stocks: 10, funds: 10, btc: 5, gold: 5, emergency: 10, leisure: 10 });
  /** Keep food & living, split the rest evenly over every other visible line. */
  const presetEven = () => {
    const food = lines.find((l) => l.id === 'food')?.pct || 0;
    const others = lines.filter((l) => l.id !== 'food');
    if (others.length === 0) return;
    const rest = Math.max(0, 100 - food);
    const each = Math.floor((rest / others.length) * 10) / 10;
    const pcts: Record<string, number> = { food };
    others.forEach((l) => (pcts[l.id] = each));
    // Rounding remainder goes to the last line so the total is exactly 100%
    pcts[others[others.length - 1].id] = Math.round((rest - each * (others.length - 1)) * 10) / 10;
    applyPercentages(pcts);
  };

  /** Put whatever is left (or over) into free savings, or food & living if savings is switched off. */
  const autoFill100 = () => {
    const target = lines.find((l) => l.id === 'leisure') || lines.find((l) => l.id === 'food');
    if (!target) return;
    const next = Math.max(0, (target.pct || 0) + (100 - totalPct));
    setLinePlan(target, { pct: Math.round(next * 10) / 10 });
  };

  const saveBudgetChanges = () => {
    const inc = parseFloat(editIncome) || 0;
    updateMonthIncome(currentMonthData.monthKey, inc);
    updateMonthAllocations(currentMonthData.monthKey, allocState);
    updateMonthCustomAllocations(currentMonthData.monthKey, customState);
    setIsEditingBudget(false);
  };

  const pctOk = Math.abs(totalPct - 100) < 0.1;

  return (
    <div className="space-y-6">

      {/* Month Header & Income Control Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-100">
                {formatMonthLabel(currentMonthData.monthKey, state.language)}
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {t.budgetAllocation}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {state.language === 'lo'
                ? 'ກຳນົດລາຍຮັບເປັນເງິນກີບ (₭) ແລະ ຈັດສັນລົງທຶນຮຸ້ນ, ກອງທຶນ, ບິດຄອຍເປັນດອນລ່າ ($)'
                : 'กำหนดรายรับเป็นเงินกีบ (₭) และจัดสรรลงทุนหุ้น, กองทุน, บิตคอยน์เป็นดอลลาร์ ($)'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Export / Print Actions */}
            <button
              onClick={() => downloadCSVReport(state)}
              title="ດາວໂຫຼດ Excel / CSV"
              className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-800/40 hover:border-emerald-500 px-3 py-2 rounded-xl text-xs font-semibold transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel/CSV</span>
            </button>

            <button
              onClick={() => printMonthlyReport(currentMonthData.monthKey, state)}
              title="ພິມ / ບັນທຶກເປັນ PDF"
              className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-800 text-blue-400 border border-blue-800/40 hover:border-blue-500 px-3 py-2 rounded-xl text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            {onOpenDataSync && (
              <button
                onClick={onOpenDataSync}
                title="ບັນທຶກຟາຍ & ໃຊ້ຮ່ວມກັນ (PC + ມືຖື)"
                className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-800/40 hover:border-amber-500 px-3 py-2 rounded-xl text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>{state.language === 'lo' ? 'Sync/ແບ່ງປັນ' : 'Sync/แชร์'}</span>
              </button>
            )}

            <button
              onClick={() => setShowCategoryManager((s) => !s)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                showCategoryManager
                  ? 'bg-sky-500/20 text-sky-200 border-sky-500/60'
                  : 'bg-slate-950 hover:bg-slate-800 text-sky-300 border-sky-800/40 hover:border-sky-500'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t.manageCategories}</span>
            </button>

            {!isEditingBudget ? (
              <button
                onClick={() => setIsEditingBudget(true)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-amber-300 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{state.language === 'lo' ? 'ປັບແຕ່ງງົບປະມານ' : state.language === 'th' ? 'ปรับแต่งงบประมาณ' : 'Edit budget'}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditIncome(currentMonthData.incomeLak.toString());
                    setAllocState({ ...currentMonthData.allocations });
                    setCustomState({ ...(currentMonthData.customAllocations || {}) });
                    setIsEditingBudget(false);
                  }}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 transition"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={saveBudgetChanges}
                  className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.save}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {showCategoryManager && <CategoryManager onClose={() => setShowCategoryManager(false)} />}

        {/* Monthly Income Card & Progress Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">

          {/* Income Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {t.incomeInKip}
            </div>
            {isEditingBudget ? (
              <div className="space-y-1.5">
                <input
                  type="number"
                  value={editIncome}
                  onChange={(e) => handleIncomeChange(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-500/60 rounded-lg px-3 py-1.5 text-lg font-mono font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="25000000"
                />
                <div className="text-[11px] font-mono text-slate-400">
                  ≈ ${((parseFloat(editIncome) || 0) / rateUsdLak).toFixed(2)} USD (@ ₭{rateUsdLak.toLocaleString()})
                </div>
              </div>
            ) : (
              <div>
                <div className="text-2xl font-bold font-mono text-amber-300">
                  {formatCurrency(currentMonthData.incomeLak, 'LAK')}
                </div>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  ≈ ${(currentMonthData.incomeLak / rateUsdLak).toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  USD
                </div>
              </div>
            )}
          </div>

          {/* Planned vs Actual Investment */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>{t.totalInvestPlanned}</span>
              <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded">USD → LAK</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {formatCurrency(monthlySummary.actualInvestmentsLak, 'LAK')}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              / {formatCurrency(monthlySummary.plannedInvestmentsLak, 'LAK')} ({t.planned})
            </div>
          </div>

          {/* Budget Remaining */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {state.language === 'lo' ? 'ຍັງເຫຼືອໃຊ້ຈ່າຍ & ອອມ' : 'คงเหลือใช้จ่าย & ออม'}
            </div>
            <div
              className={`text-2xl font-bold font-mono ${
                monthlySummary.remainingBudgetLak >= 0 ? 'text-blue-300' : 'text-red-400'
              }`}
            >
              {formatCurrency(monthlySummary.remainingBudgetLak, 'LAK')}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <span>
                {state.language === 'lo' ? 'ອັດຕາການອອມ & ລົງທຶນ:' : 'อัตราออม & ลงทุน:'}
              </span>
              <strong className="text-emerald-400 font-mono">
                {monthlySummary.savingsRatePct.toFixed(1)}%
              </strong>
            </div>
          </div>

        </div>

        {/* Preset strategy buttons & 100% check during editing */}
        {isEditingBudget ? (
          <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono text-slate-400">
                {state.language === 'lo' ? 'ເລືອກສູດສັດສ່ວນດ່ວນ:' : state.language === 'th' ? 'เลือกสูตรสัดส่วนด่วน:' : 'Quick presets:'}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={presetClassic}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition"
                >
                  ⭐ 15/35/15/10/25
                </button>
                <button
                  type="button"
                  onClick={preset503020}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
                >
                  50/30/20
                </button>
                <button
                  type="button"
                  onClick={presetEven}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
                >
                  ⚖️ {t.splitEvenly}
                </button>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
                pctOk
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                  : 'bg-amber-950/40 border-amber-800 text-amber-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  {t.totalAllocated}: <strong>{totalPct.toFixed(1)}%</strong> ({t.shouldBe100})
                  {!pctOk && totalPct < 100 && ` · ${t.unallocated} ${(100 - totalPct).toFixed(1)}%`}
                </span>
              </div>
              {!pctOk && (
                <button
                  onClick={autoFill100}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700"
                >
                  {t.autoFill100}
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500">{t.editPercentHint}</p>
          </div>
        ) : (
          /* Active Formula Summary Pill Bar */
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center space-x-2 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{state.language === 'lo' ? 'ສັດສ່ວນແຜນປັດຈຸບັນ:' : state.language === 'th' ? 'สัดส่วนแผนปัจจุบัน:' : 'Current split:'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {lines
                .filter((l) => l.pct > 0)
                .map((l) => (
                  <span key={l.id} className={`px-2 py-0.5 rounded border ${colorOf(l.color).pill}`}>
                    {lineLabel(l, t).replace(/\s*\(.*\)$/, '')} {l.pct.toFixed(0)}%
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Allocation Breakdown: one row per budget line */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              <span>{t.budgetAllocation}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {t.investInUsdBadge}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenExpenseModal}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 font-medium transition"
            >
              <Utensils className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.addExpense}</span>
            </button>

            <button
              onClick={onOpenInvestmentModal}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs px-3.5 py-1.5 rounded-xl font-bold shadow-md shadow-amber-500/20 transition"
            >
              <DollarSign className="w-3.5 h-3.5 text-slate-950" />
              <span>{t.addInvestment}</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {lines.map((line) => (
            <BudgetLineRow
              key={line.id}
              line={line}
              editing={isEditingBudget}
              rateUsdLak={rateUsdLak}
              onPct={(pct) => setLinePlan(line, { pct })}
              onAmount={(amount) => setLinePlan(line, { amount })}
            />
          ))}
        </div>
      </div>

      {/* Monthly Activity Log: Expenses & Investments Recorded this Month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Living Expenses Recorded (LAK) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-blue-400" />
              <span>
                {state.language === 'lo' ? 'ລາຍຈ່າຍທີ່ບັນທຶກເດືອນນີ້' : 'รายจ่ายที่บันทึกเดือนนี้'}
              </span>
            </h3>
            <button
              onClick={onOpenExpenseModal}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
            >
              + {state.language === 'lo' ? 'ບັນທຶກລາຍຈ່າຍ' : 'บันทึกรายจ่าย'}
            </button>
          </div>

          {(currentMonthData.expenses || []).length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              {state.language === 'lo'
                ? 'ຍັງບໍ່ມີລາຍຈ່າຍທີ່ບັນທຶກໃນເດືອນນີ້'
                : 'ยังไม่มีรายจ่ายที่บันทึกในเดือนนี้'}
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {currentMonthData.expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-medium text-slate-200">{exp.category}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{exp.date}</span>
                      {exp.note && <span>• {exp.note}</span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-slate-200">
                      -₭{exp.amountLak.toLocaleString()}
                    </span>
                    <button
                      onClick={() => deleteExpense(currentMonthData.monthKey, exp.id)}
                      className="text-slate-600 hover:text-red-400 transition"
                      title="Delete expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Investment Purchases Recorded (USD -> LAK) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>
                {state.language === 'lo' ? 'ການລົງທຶນທີ່ບັນທຶກເດືອນນີ້' : 'การลงทุนที่บันทึกเดือนนี้'}
              </span>
            </h3>
            <button
              onClick={onOpenInvestmentModal}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              + {state.language === 'lo' ? 'ບັນທຶກການລົງທຶນ' : 'บันทึกการลงทุน'}
            </button>
          </div>

          {(currentMonthData.investments || []).length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              {state.language === 'lo'
                ? 'ຍັງບໍ່ມີການລົງທຶນທີ່ບັນທຶກໃນເດືອນນີ້'
                : 'ยังไม่มีการลงทุนที่บันทึกในเดือนนี้'}
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {currentMonthData.investments.map((inv) => {
                const customName =
                  inv.assetType === 'custom'
                    ? customCategories.find((c) => c.id === inv.customCategoryId)?.name || t.customCategory
                    : null;
                return (
                  <div
                    key={inv.id}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-200 flex items-center gap-1.5">
                        <span className="truncate">{inv.assetName}</span>
                        <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-amber-400 shrink-0">
                          {customName || inv.assetType.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{inv.date}</span>
                        {inv.sharesOrUnits && (
                          <span>• {inv.sharesOrUnits} units @ ${inv.unitPriceUsd}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <div>
                        <div className="font-mono font-bold text-emerald-400">
                          ${inv.amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          ≈ ₭{Math.round(inv.amountLak).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteInvestment(currentMonthData.monthKey, inv.id)}
                        className="text-slate-600 hover:text-red-400 transition ml-2"
                        title="Delete investment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

// ---------- One budget line ----------

const BudgetLineRow: React.FC<{
  line: BudgetLine;
  editing: boolean;
  rateUsdLak: number;
  onPct: (pct: number) => void;
  onAmount: (amount: number) => void;
}> = ({ line, editing, rateUsdLak, onPct, onAmount }) => {
  const { state } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const c = colorOf(line.color);
  const Icon = line.builtin ? LINE_ICONS[line.builtin.key] : PiggyBank;
  const isUsd = line.currency === 'USD';
  const fmtNative = (n: number) => (isUsd ? `$${n.toFixed(2)} USD` : formatCurrency(n, 'LAK'));
  const remaining = line.plannedNative - line.actualNative;
  const showActual = line.id !== 'leisure' || line.actualNative > 0;

  return (
    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 transition hover:border-slate-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${c.icon}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-slate-200 flex flex-wrap items-center gap-1.5">
              <span>{lineLabel(line, t)}</span>
              <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${c.badge}`}>
                {isUsd ? 'USD $ → LAK ₭' : 'LAK ₭'}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono truncate">
              {line.builtin ? lineSubtitle(line.builtin.key, state.language) : t.customCategory}
            </div>
          </div>
        </div>

        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              step="any"
              min="0"
              aria-label="%"
              value={Number.isFinite(line.pct) ? Math.round(line.pct * 10) / 10 : 0}
              onChange={(e) => onPct(parseFloat(e.target.value) || 0)}
              className="w-20 bg-slate-900 border border-amber-600/50 rounded-lg px-2 py-1.5 text-sm font-mono font-bold text-right text-amber-300 focus:outline-none focus:border-amber-400"
            />
            <span className="text-xs text-slate-400 font-mono">%</span>
            <input
              type="number"
              step="any"
              min="0"
              aria-label={isUsd ? 'USD' : 'LAK'}
              value={isUsd ? Math.round(line.plannedNative * 100) / 100 : Math.round(line.plannedNative)}
              onChange={(e) => onAmount(parseFloat(e.target.value) || 0)}
              className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-right text-slate-200 focus:outline-none focus:border-slate-500"
            />
            <span className={`text-xs font-mono ${isUsd ? c.text : 'text-slate-400'}`}>{isUsd ? '$' : '₭'}</span>
            {isUsd && (
              <span className="text-[11px] text-slate-400 font-mono">
                (≈ ₭{Math.round(line.plannedNative * rateUsdLak).toLocaleString()})
              </span>
            )}
          </div>
        ) : (
          <div className="text-left sm:text-right font-mono">
            <div className={`text-sm font-bold ${isUsd ? c.text : 'text-slate-100'}`}>{fmtNative(line.plannedNative)}</div>
            <div className="text-xs text-slate-400">
              {isUsd && `≈ ₭${Math.round(line.plannedLak).toLocaleString()} · `}
              {line.pct.toFixed(1)}% {t.pctOfIncome}
            </div>
          </div>
        )}
      </div>

      {showActual && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400">
            {t.actual}: <strong className={`font-mono ${c.text}`}>{fmtNative(line.actualNative)}</strong>
          </span>
          <span className="text-slate-400">
            {t.remaining}:{' '}
            <strong className={`font-mono ${remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {fmtNative(remaining)}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
};

// ---------- Category manager: switch built-ins on/off, add / remove your own ----------

const CategoryManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { state, settings, customCategories, setCategoryHidden, addCustomCategory, deleteCustomCategory } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const hidden = settings.hiddenCategories || [];

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'LAK' | 'USD'>('LAK');
  const [color, setColor] = useState(CUSTOM_COLOR_CHOICES[0]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCustomCategory({ name: name.trim(), currency, color });
    setName('');
    // Next colour for the next category
    const idx = CUSTOM_COLOR_CHOICES.indexOf(color);
    setColor(CUSTOM_COLOR_CHOICES[(idx + 1) % CUSTOM_COLOR_CHOICES.length]);
  };

  return (
    <div className="mt-5 bg-slate-950/70 border border-sky-800/50 rounded-xl p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-sky-200 flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4" />
            {t.manageCategories}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">{t.manageCategoriesHint}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition" aria-label={t.cancel}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Built-in categories with on/off switches */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-mono mb-2">{t.builtinCategories}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BUILTIN_LINES.filter((d) => d.key !== 'food').map((def) => {
            const key = def.key as BuiltinCategoryKey;
            const on = !hidden.includes(key);
            const Icon = LINE_ICONS[def.key];
            return (
              <button
                key={def.key}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => setCategoryHidden(key, on)}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left text-xs transition ${
                  on ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${on ? colorOf(def.color).text : 'text-slate-600'}`} />
                  <span className={`truncate ${on ? '' : 'line-through'}`}>{t[def.labelKey]}</span>
                </span>
                <span className={`relative w-9 h-5 rounded-full shrink-0 transition ${on ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* User's own categories */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-mono mb-2">{t.myCategories}</div>
        {customCategories.length === 0 ? (
          <p className="text-xs text-slate-500 mb-2">{t.noCustomCategories}</p>
        ) : (
          <div className="space-y-1.5 mb-3">
            {customCategories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs">
                <span className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorOf(cat.color).dot}`} />
                  <span className="text-slate-200 truncate">{cat.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">{cat.currency === 'USD' ? '$ USD' : '₭ LAK'}</span>
                </span>
                <button
                  onClick={async () => (await askConfirm(t.deleteCategoryConfirm)) && deleteCustomCategory(cat.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition shrink-0"
                  title={t.delete}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 text-xs">
          <div className="flex-1 min-w-[160px]">
            <label htmlFor="new-cat-name" className="block text-slate-400 mb-1">{t.categoryName}</label>
            <input
              id="new-cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.categoryNamePlaceholder}
              maxLength={40}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <span className="block text-slate-400 mb-1">{t.categoryCurrency}</span>
            <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5 font-mono">
              {(['LAK', 'USD'] as const).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setCurrency(cur)}
                  className={`px-3 py-1.5 rounded-md transition ${currency === cur ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`}
                >
                  {cur === 'LAK' ? '₭' : '$'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 pb-2">
            {CUSTOM_COLOR_CHOICES.map((col) => (
              <button
                key={col}
                type="button"
                aria-label={col}
                onClick={() => setColor(col)}
                className={`w-5 h-5 rounded-full ${colorOf(col).dot} ${color === col ? 'ring-2 ring-offset-2 ring-offset-slate-950 ring-white' : 'opacity-50 hover:opacity-100'}`}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex items-center gap-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold px-3.5 py-2 rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.addCategory}
          </button>
        </form>
      </div>
    </div>
  );
};
