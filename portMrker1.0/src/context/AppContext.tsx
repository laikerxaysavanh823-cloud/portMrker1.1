import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  AppState,
  AppSettings,
  Currency,
  Language,
  MarketRates,
  MonthData,
  MonthlyExpense,
  MonthlyInvestment,
  StockHolding,
  FundHolding,
  BtcTransaction,
  SavingsGoal,
  GoalContribution,
  BuiltinCategoryKey,
  CustomCategory,
} from '../types';
import { DEFAULT_APP_STATE, DEFAULT_SETTINGS, INITIAL_MONTH_DATA } from '../data/defaultData';
import { generateId, getCurrentMonthKey } from '../utils/formatters';
import { AUTO_REFRESH_MINUTES, FetchedRates, fetchLiveRates, toRatesUpdate } from '../utils/marketData';
import { isClaudeArtifact } from '../utils/platform';
import { SyncStatus, useCloudSync } from './useCloudSync';
import { categoryOptionsOf, getBudgetLines } from '../utils/categories';

const STORAGE_KEY = 'portmrker_app_state_v1';

/** Fill in fields added in newer versions so older saved/imported data keeps working. */
function withDefaults(s: AppState): AppState {
  return {
    ...s,
    settings: { ...DEFAULT_SETTINGS, ...(s.settings || {}) },
    goals: s.goals || [],
    customCategories: s.customCategories || [],
  };
}

export interface RateRefreshStatus {
  status: 'idle' | 'loading' | 'ok' | 'partial' | 'error';
  errors: string[];
  at?: string;
}

interface PortfolioTotals {
  stocksValueUsd: number;
  stocksCostUsd: number;
  stocksValueLak: number;
  stocksCostLak: number;

  etfsValueUsd: number;
  etfsCostUsd: number;
  etfsValueLak: number;
  etfsCostLak: number;

  btcValueUsd: number;
  btcCostUsd: number;
  btcValueLak: number;
  btcCostLak: number;

  goldValueUsd: number;
  goldCostUsd: number;
  goldValueLak: number;
  goldCostLak: number;

  totalInvestmentsUsd: number;
  totalInvestmentsLak: number;
  totalInvestmentsCostUsd: number;
  totalInvestmentsCostLak: number;
  unrealizedPlUsd: number;
  unrealizedPlLak: number;
  unrealizedPlPct: number;

  emergencyFundLak: number;
  emergencyFundUsd: number;

  cashLak: number;
  cashUsd: number;
  totalCashInLak: number;
  totalCashInUsd: number;

  netWorthLak: number;
  netWorthUsd: number;
  netWorthThb: number;
}

interface MonthlySummary {
  incomeLak: number;
  incomeUsd: number;
  plannedExpensesLak: number;
  plannedInvestmentsLak: number;
  plannedInvestmentsUsd: number;
  actualExpensesLak: number;
  actualInvestmentsLak: number;
  actualInvestmentsUsd: number;
  totalActualSpentAndInvestedLak: number;
  remainingBudgetLak: number;
  savingsRatePct: number;
}

interface AppContextType {
  state: AppState;
  totals: PortfolioTotals;
  currentMonthData: MonthData;
  monthlySummary: MonthlySummary;
  setLanguage: (lang: Language) => void;
  setPrimaryCurrency: (curr: Currency) => void;
  updateRates: (rates: Partial<MarketRates>) => void;
  setSelectedMonth: (monthKey: string) => void;
  createNewMonth: (monthKey: string, copyFromPrevious?: boolean) => void;
  updateMonthIncome: (monthKey: string, incomeLak: number) => void;
  updateMonthAllocations: (monthKey: string, allocations: MonthData['allocations']) => void;
  addExpense: (monthKey: string, expense: Omit<MonthlyExpense, 'id'>) => void;
  deleteExpense: (monthKey: string, expenseId: string) => void;
  addInvestment: (
    monthKey: string,
    investment: Omit<MonthlyInvestment, 'id' | 'amountLak'>,
    options?: { syncToPortfolio?: boolean }
  ) => void;
  deleteInvestment: (monthKey: string, investmentId: string) => void;
  addStock: (stock: Omit<StockHolding, 'id'>) => void;
  updateStockPrice: (id: string, newPriceUsd: number) => void;
  removeStock: (id: string) => void;
  addEtf: (etf: Omit<FundHolding, 'id'>) => void;
  updateEtfPrice: (id: string, newPriceUsd: number) => void;
  removeEtf: (id: string) => void;
  recordBtcTransaction: (
    tx: Omit<BtcTransaction, 'id' | 'totalLak'>,
    syncToMonthlyBudget?: boolean
  ) => void;
  updateGoldHoldings: (grams: number, avgCostUsdPerGram?: number) => void;
  updateEmergencyFund: (balanceLak: number, targetMonths?: number, monthlyExpenseLak?: number) => void;
  updateCashBalances: (balanceLak: number, balanceUsd: number) => void;
  exportData: () => string;
  importData: (jsonStr: string) => boolean;
  resetToDefaults: () => void;

  syncStatus: SyncStatus;

  // Budget categories
  customCategories: CustomCategory[];
  addCustomCategory: (cat: Omit<CustomCategory, 'id'>) => string;
  updateCustomCategory: (id: string, patch: Partial<Omit<CustomCategory, 'id'>>) => void;
  deleteCustomCategory: (id: string) => void;
  setCategoryHidden: (key: BuiltinCategoryKey, hidden: boolean) => void;
  updateMonthCustomAllocations: (
    monthKey: string,
    customAllocations: NonNullable<MonthData['customAllocations']>
  ) => void;

  // Settings & live prices
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  rateRefresh: RateRefreshStatus;
  refreshMarketRates: (opts?: { includeFx?: boolean; apply?: boolean }) => Promise<FetchedRates>;

  // Savings goals
  goals: SavingsGoal[];
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'contributions' | 'createdAt'>, initialLak?: number) => void;
  updateGoal: (id: string, patch: Partial<Omit<SavingsGoal, 'id' | 'contributions'>>) => void;
  deleteGoal: (id: string) => void;
  addGoalContribution: (
    goalId: string,
    contribution: Omit<GoalContribution, 'id' | 'monthKey'>,
    countAsMonthlySavings?: boolean
  ) => void;
  deleteGoalContribution: (goalId: string, contributionId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Basic schema verification
        if (parsed.rates && parsed.holdings && parsed.months) {
          return withDefaults(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
    return withDefaults(DEFAULT_APP_STATE);
  });

  const settings = state.settings || DEFAULT_SETTINGS;
  const goals = state.goals || [];

  // ---------- Live market prices ----------
  const [rateRefresh, setRateRefresh] = useState<RateRefreshStatus>({ status: 'idle', errors: [] });
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const refreshMarketRates = useCallback(
    async (opts?: { includeFx?: boolean; apply?: boolean }): Promise<FetchedRates> => {
      setRateRefresh((prev) => ({ ...prev, status: 'loading' }));
      const fetched = await fetchLiveRates();
      const includeFx = opts?.includeFx ?? settingsRef.current.autoRefreshFx;
      const update = toRatesUpdate(fetched, includeFx);
      const gotAnything = !!(fetched.btcUsd || fetched.goldUsdPerGram || fetched.usdLak || fetched.usdThb);

      if (opts?.apply !== false && Object.keys(update).length > 0) {
        setState((prev) => ({
          ...prev,
          rates: {
            ...prev.rates,
            ...update,
            ...(includeFx && update.usdLak ? { sourceName: 'open.er-api.com (auto)' } : {}),
            lastUpdated: new Date().toISOString(),
          },
        }));
      }

      setRateRefresh({
        status: !gotAnything ? 'error' : fetched.errors.length ? 'partial' : 'ok',
        errors: fetched.errors,
        at: new Date().toISOString(),
      });
      return fetched;
    },
    []
  );

  // Auto refresh when the app opens and every AUTO_REFRESH_MINUTES while it stays open.
  // Not on claude.ai: the page cannot reach outside price APIs there.
  useEffect(() => {
    if (!settings.autoRefreshRates || isClaudeArtifact) return;
    refreshMarketRates();
    const timer = setInterval(() => refreshMarketRates(), AUTO_REFRESH_MINUTES * 60 * 1000);
    return () => clearInterval(timer);
  }, [settings.autoRefreshRates, refreshMarketRates]);

  // Cloud sync (claude.ai web version only)
  const syncStatus = useCloudSync(state, setState, withDefaults);

  // Save on change (local cache on this device)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error persisting state:', e);
    }
  }, [state]);

  const currentMonthData: MonthData = useMemo(() => {
    const existing = state.months[state.selectedMonth];
    if (existing) return existing;

    // Fallback if not found: create a placeholder with custom 15/35/15/10/25 rule
    return {
      monthKey: state.selectedMonth,
      incomeLak: 0,
      allocations: {
        foodLivingLak: 0,
        foodLivingPct: 15,
        usStocksUsd: 0,
        usStocksPct: 15,
        fundsEtfsUsd: 0,
        fundsEtfsPct: 20,
        bitcoinUsd: 0,
        bitcoinPct: 15,
        goldUsd: 0,
        goldPct: 25,
        emergencyLak: 0,
        emergencyPct: 10,
        savingsLeisureLak: 0,
        savingsLeisurePct: 0,
      },
      expenses: [],
      investments: [],
      savingsDepositedLak: 0,
    };
  }, [state.months, state.selectedMonth]);

  // Derived Portfolio Totals
  const totals: PortfolioTotals = useMemo(() => {
    const rateUsdLak = state.rates.usdLak;
    const rateUsdThb = state.rates.usdThb;
    const h = state.holdings;

    // Stocks
    const stocksValueUsd = h.stocks.reduce((acc, s) => acc + s.shares * s.currentPriceUsd, 0);
    const stocksCostUsd = h.stocks.reduce((acc, s) => acc + s.shares * s.avgCostUsd, 0);
    const stocksValueLak = stocksValueUsd * rateUsdLak;
    const stocksCostLak = stocksCostUsd * rateUsdLak;

    // ETFs
    const etfsValueUsd = h.etfs.reduce((acc, e) => acc + e.units * e.currentPriceUsd, 0);
    const etfsCostUsd = h.etfs.reduce((acc, e) => acc + e.units * e.avgCostUsd, 0);
    const etfsValueLak = etfsValueUsd * rateUsdLak;
    const etfsCostLak = etfsCostUsd * rateUsdLak;

    // Bitcoin
    const btcValueUsd = h.btc.amountBtc * state.rates.btcUsd;
    const btcCostUsd = h.btc.amountBtc * h.btc.avgCostUsd;
    const btcValueLak = btcValueUsd * rateUsdLak;
    const btcCostLak = btcCostUsd * rateUsdLak;

    // Gold
    const goldValueUsd = h.gold.grams * state.rates.goldUsdPerGram;
    const goldCostUsd = h.gold.grams * h.gold.avgCostUsdPerGram;
    const goldValueLak = goldValueUsd * rateUsdLak;
    const goldCostLak = goldCostUsd * rateUsdLak;

    // Total Investments
    const totalInvestmentsUsd = stocksValueUsd + etfsValueUsd + btcValueUsd + goldValueUsd;
    const totalInvestmentsCostUsd = stocksCostUsd + etfsCostUsd + btcCostUsd + goldCostUsd;
    const totalInvestmentsLak = totalInvestmentsUsd * rateUsdLak;
    const totalInvestmentsCostLak = totalInvestmentsCostUsd * rateUsdLak;

    const unrealizedPlUsd = totalInvestmentsUsd - totalInvestmentsCostUsd;
    const unrealizedPlLak = unrealizedPlUsd * rateUsdLak;
    const unrealizedPlPct =
      totalInvestmentsCostUsd > 0 ? (unrealizedPlUsd / totalInvestmentsCostUsd) * 100 : 0;

    // Emergency Fund
    const emergencyFundLak = h.emergency.balanceLak;
    const emergencyFundUsd = emergencyFundLak / rateUsdLak;

    // Cash
    const cashLak = h.cash.balanceLak;
    const cashUsd = h.cash.balanceUsd;
    const totalCashInLak = cashLak + cashUsd * rateUsdLak;
    const totalCashInUsd = cashUsd + cashLak / rateUsdLak;

    // Overall Net Worth
    const netWorthLak = totalInvestmentsLak + emergencyFundLak + totalCashInLak;
    const netWorthUsd = netWorthLak / rateUsdLak;
    const netWorthThb = netWorthUsd * rateUsdThb;

    return {
      stocksValueUsd,
      stocksCostUsd,
      stocksValueLak,
      stocksCostLak,
      etfsValueUsd,
      etfsCostUsd,
      etfsValueLak,
      etfsCostLak,
      btcValueUsd,
      btcCostUsd,
      btcValueLak,
      btcCostLak,
      goldValueUsd,
      goldCostUsd,
      goldValueLak,
      goldCostLak,
      totalInvestmentsUsd,
      totalInvestmentsLak,
      totalInvestmentsCostUsd,
      totalInvestmentsCostLak,
      unrealizedPlUsd,
      unrealizedPlLak,
      unrealizedPlPct,
      emergencyFundLak,
      emergencyFundUsd,
      cashLak,
      cashUsd,
      totalCashInLak,
      totalCashInUsd,
      netWorthLak,
      netWorthUsd,
      netWorthThb,
    };
  }, [state.holdings, state.rates]);

  // Derived Monthly Summary
  const monthlySummary: MonthlySummary = useMemo(() => {
    const rateUsdLak = state.rates.usdLak;
    const m = currentMonthData;
    const incomeLak = m.incomeLak || 0;
    const incomeUsd = incomeLak / rateUsdLak;

    const lines = getBudgetLines(m, rateUsdLak, categoryOptionsOf(state));
    const plannedExpensesLak = m.allocations.foodLivingLak;

    // Everything except food & living and free savings counts as planned investing
    const investLines = lines.filter((l) => l.id !== 'food' && l.id !== 'leisure');
    const plannedInvestmentsUsd = investLines
      .filter((l) => l.currency === 'USD')
      .reduce((acc, l) => acc + l.plannedNative, 0);
    const plannedInvestmentsLak = investLines.reduce((acc, l) => acc + l.plannedLak, 0);

    const actualExpensesLak = (m.expenses || []).reduce((acc, e) => acc + e.amountLak, 0);

    const actualInvestmentsLak = (m.investments || []).reduce((acc, i) => acc + i.amountLak, 0);
    const actualInvestmentsUsd = (m.investments || []).reduce((acc, i) => acc + i.amountUsd, 0);

    const totalActualSpentAndInvestedLak =
      actualExpensesLak + actualInvestmentsLak + (m.savingsDepositedLak || 0);

    const remainingBudgetLak = incomeLak - totalActualSpentAndInvestedLak;

    const savingsRatePct =
      incomeLak > 0 ? ((actualInvestmentsLak + (m.savingsDepositedLak || 0)) / incomeLak) * 100 : 0;

    return {
      incomeLak,
      incomeUsd,
      plannedExpensesLak,
      plannedInvestmentsLak,
      plannedInvestmentsUsd,
      actualExpensesLak,
      actualInvestmentsLak,
      actualInvestmentsUsd,
      totalActualSpentAndInvestedLak,
      remainingBudgetLak,
      savingsRatePct,
    };
  }, [currentMonthData, state.rates.usdLak, state.settings, state.customCategories]);

  // Actions
  const setLanguage = (lang: Language) => {
    setState((prev) => ({ ...prev, language: lang }));
  };

  const setPrimaryCurrency = (curr: Currency) => {
    setState((prev) => ({ ...prev, primaryCurrency: curr }));
  };

  const updateRates = (newRates: Partial<MarketRates>) => {
    setState((prev) => ({
      ...prev,
      rates: {
        ...prev.rates,
        ...newRates,
        lastUpdated: new Date().toISOString(),
      },
    }));
  };

  const setSelectedMonth = (monthKey: string) => {
    setState((prev) => ({ ...prev, selectedMonth: monthKey }));
  };

  const createNewMonth = (monthKey: string, copyFromPrevious = true) => {
    setState((prev) => {
      if (prev.months[monthKey]) {
        return { ...prev, selectedMonth: monthKey };
      }

      let newMonth: MonthData;
      if (copyFromPrevious && prev.months[prev.selectedMonth]) {
        const prevMonth = prev.months[prev.selectedMonth];
        newMonth = {
          monthKey,
          title: `ແຜນປະຈຳເດືອນ ${monthKey}`,
          incomeLak: prevMonth.incomeLak,
          allocations: { ...prevMonth.allocations },
          customAllocations: { ...(prevMonth.customAllocations || {}) },
          expenses: [],
          investments: [],
          savingsDepositedLak: 0,
          notes: '',
        };
      } else {
        newMonth = {
          monthKey,
          title: `ແຜນປະຈຳເດືອນ ${monthKey}`,
          incomeLak: 0,
          allocations: { ...INITIAL_MONTH_DATA.allocations },
          expenses: [],
          investments: [],
          savingsDepositedLak: 0,
          notes: '',
        };
      }

      return {
        ...prev,
        selectedMonth: monthKey,
        months: {
          ...prev.months,
          [monthKey]: newMonth,
        },
      };
    });
  };

  const updateMonthIncome = (monthKey: string, incomeLak: number) => {
    setState((prev) => {
      const month = prev.months[monthKey] || { ...INITIAL_MONTH_DATA, monthKey };
      return {
        ...prev,
        months: {
          ...prev.months,
          [monthKey]: {
            ...month,
            incomeLak,
          },
        },
      };
    });
  };

  const updateMonthAllocations = (
    monthKey: string,
    allocations: MonthData['allocations']
  ) => {
    setState((prev) => {
      const month = prev.months[monthKey] || { ...INITIAL_MONTH_DATA, monthKey };
      return {
        ...prev,
        months: {
          ...prev.months,
          [monthKey]: {
            ...month,
            allocations,
          },
        },
      };
    });
  };

  const addExpense = (monthKey: string, expense: Omit<MonthlyExpense, 'id'>) => {
    const newExp: MonthlyExpense = {
      ...expense,
      id: generateId(),
    };
    setState((prev) => {
      const month = prev.months[monthKey] || { ...INITIAL_MONTH_DATA, monthKey };
      return {
        ...prev,
        months: {
          ...prev.months,
          [monthKey]: {
            ...month,
            expenses: [newExp, ...(month.expenses || [])],
          },
        },
      };
    });
  };

  const deleteExpense = (monthKey: string, expenseId: string) => {
    setState((prev) => {
      const month = prev.months[monthKey];
      if (!month) return prev;
      return {
        ...prev,
        months: {
          ...prev.months,
          [monthKey]: {
            ...month,
            expenses: (month.expenses || []).filter((e) => e.id !== expenseId),
          },
        },
      };
    });
  };

  const addInvestment = (
    monthKey: string,
    investment: Omit<MonthlyInvestment, 'id' | 'amountLak'>,
    options?: { syncToPortfolio?: boolean }
  ) => {
    const rateUsed = investment.rateUsed || state.rates.usdLak;
    const amountLak = investment.amountUsd * rateUsed;
    const newInv: MonthlyInvestment = {
      ...investment,
      id: generateId(),
      amountLak,
      rateUsed,
    };

    setState((prev) => {
      const month = prev.months[monthKey] || { ...INITIAL_MONTH_DATA, monthKey };
      const updatedMonths = {
        ...prev.months,
        [monthKey]: {
          ...month,
          investments: [newInv, ...(month.investments || [])],
        },
      };

      let updatedHoldings = { ...prev.holdings };

      // Optionally sync to portfolio holding
      if (options?.syncToPortfolio) {
        if (investment.assetType === 'stock' && investment.sharesOrUnits && investment.unitPriceUsd) {
          const ticker = investment.assetName.split(' ')[0].toUpperCase();
          const existingIdx = updatedHoldings.stocks.findIndex((s) => s.ticker === ticker);
          if (existingIdx >= 0) {
            const old = updatedHoldings.stocks[existingIdx];
            const totalShares = old.shares + investment.sharesOrUnits;
            const totalCost = old.shares * old.avgCostUsd + investment.amountUsd;
            const newAvg = totalCost / totalShares;
            const updatedStockList = [...updatedHoldings.stocks];
            updatedStockList[existingIdx] = {
              ...old,
              shares: totalShares,
              avgCostUsd: newAvg,
              currentPriceUsd: investment.unitPriceUsd,
            };
            updatedHoldings.stocks = updatedStockList;
          } else {
            updatedHoldings.stocks = [
              ...updatedHoldings.stocks,
              {
                id: generateId(),
                ticker,
                name: investment.assetName,
                shares: investment.sharesOrUnits,
                avgCostUsd: investment.unitPriceUsd,
                currentPriceUsd: investment.unitPriceUsd,
              },
            ];
          }
        } else if (investment.assetType === 'btc' && investment.sharesOrUnits) {
          const btcAmount = investment.sharesOrUnits;
          const oldBtc = updatedHoldings.btc;
          const totalAmount = oldBtc.amountBtc + btcAmount;
          const totalCost = oldBtc.amountBtc * oldBtc.avgCostUsd + investment.amountUsd;
          const newAvg = totalAmount > 0 ? totalCost / totalAmount : investment.unitPriceUsd || 0;

          const btx: BtcTransaction = {
            id: generateId(),
            date: investment.date,
            type: 'buy',
            btcAmount,
            priceUsd: investment.unitPriceUsd || (investment.amountUsd / btcAmount),
            totalUsd: investment.amountUsd,
            totalLak: amountLak,
            fundingSource: 'monthly_budget',
            note: investment.note,
          };

          updatedHoldings.btc = {
            amountBtc: totalAmount,
            avgCostUsd: newAvg,
            transactions: [btx, ...oldBtc.transactions],
          };
        }
      }

      return {
        ...prev,
        months: updatedMonths,
        holdings: updatedHoldings,
      };
    });
  };

  const deleteInvestment = (monthKey: string, investmentId: string) => {
    setState((prev) => {
      const month = prev.months[monthKey];
      if (!month) return prev;
      return {
        ...prev,
        months: {
          ...prev.months,
          [monthKey]: {
            ...month,
            investments: (month.investments || []).filter((i) => i.id !== investmentId),
          },
        },
      };
    });
  };

  // Portfolio Handlers
  const addStock = (stock: Omit<StockHolding, 'id'>) => {
    setState((prev) => ({
      ...prev,
      holdings: {
        ...prev.holdings,
        stocks: [...prev.holdings.stocks, { ...stock, id: generateId() }],
      },
    }));
  };

  const updateStockPrice = (id: string, newPriceUsd: number) => {
    setState((prev) => ({
      ...prev,
      holdings: {
        ...prev.holdings,
        stocks: prev.holdings.stocks.map((s) =>
          s.id === id ? { ...s, currentPriceUsd: newPriceUsd, lastUpdated: new Date().toISOString() } : s
        ),
      },
    }));
  };

  const removeStock = (id: string) => {
    setState((prev) => ({
      ...prev,
      holdings: {
        ...prev.holdings,
        stocks: prev.holdings.stocks.filter((s) => s.id !== id),
      },
    }));
  };

  const addEtf = (etf: Omit<FundHolding, 'id'>) => {
    setState((prev) => ({
      ...prev,
      holdings: {
        ...prev.holdings,
        etfs: [...prev.holdings.etfs, { ...etf, id: generateId() }],
      },
    }));
  };

  const updateEtfPrice = (id: string, newPriceUsd: number) => {
    setState((prev) => ({
      ...prev,
      holdings: {
        ...prev.holdings,
        etfs: prev.holdings.etfs.map((e) =>
          e.id === id ? { ...e, currentPriceUsd: newPriceUsd } : e
        ),
      },
    }));
  };

  const removeEtf = (id: string) => {
    setState((prev) => ({
      ...prev,
      holdings: {
        ...prev.holdings,
        etfs: prev.holdings.etfs.filter((e) => e.id !== id),
      },
    }));
  };

  const recordBtcTransaction = (
    tx: Omit<BtcTransaction, 'id' | 'totalLak'>,
    syncToMonthlyBudget = false
  ) => {
    const rateUsed = state.rates.usdLak;
    const totalLak = tx.totalUsd * rateUsed;
    const newTx: BtcTransaction = { ...tx, id: generateId(), totalLak };

    setState((prev) => {
      const btc = prev.holdings.btc;
      let newAmount = btc.amountBtc;
      let newAvgCost = btc.avgCostUsd;

      if (tx.type === 'buy') {
        const totalOldCost = btc.amountBtc * btc.avgCostUsd;
        newAmount = btc.amountBtc + tx.btcAmount;
        newAvgCost = newAmount > 0 ? (totalOldCost + tx.totalUsd) / newAmount : 0;
      } else {
        newAmount = Math.max(0, btc.amountBtc - tx.btcAmount);
      }

      let updatedMonths = { ...prev.months };
      if (syncToMonthlyBudget && tx.type === 'buy') {
        const curM = prev.months[prev.selectedMonth];
        if (curM) {
          const inv: MonthlyInvestment = {
            id: generateId(),
            date: tx.date,
            assetType: 'btc',
            assetName: 'Bitcoin (BTC)',
            amountUsd: tx.totalUsd,
            amountLak: totalLak,
            rateUsed,
            sharesOrUnits: tx.btcAmount,
            unitPriceUsd: tx.priceUsd,
            note: tx.note || 'Bitcoin DCA',
          };
          updatedMonths[prev.selectedMonth] = {
            ...curM,
            investments: [inv, ...(curM.investments || [])],
          };
        }
      }

      return {
        ...prev,
        months: updatedMonths,
        holdings: {
          ...prev.holdings,
          btc: {
            amountBtc: newAmount,
            avgCostUsd: newAvgCost,
            transactions: [newTx, ...btc.transactions],
          },
        },
      };
    });
  };

  const updateGoldHoldings = (grams: number, avgCostUsdPerGram?: number) => {
    setState((prev) => ({
      ...prev,
      holdings: {
        ...prev.holdings,
        gold: {
          grams,
          avgCostUsdPerGram:
            avgCostUsdPerGram !== undefined
              ? avgCostUsdPerGram
              : prev.holdings.gold.avgCostUsdPerGram,
        },
      },
    }));
  };

  const updateEmergencyFund = (
    balanceLak: number,
    targetMonths?: number,
    monthlyExpenseLak?: number
  ) => {
    setState((prev) => ({
      ...prev,
      holdings: {
        ...prev.holdings,
        emergency: {
          balanceLak,
          targetMonths: targetMonths ?? prev.holdings.emergency.targetMonths,
          monthlyExpenseLak:
            monthlyExpenseLak ?? prev.holdings.emergency.monthlyExpenseLak,
        },
      },
    }));
  };

  const updateCashBalances = (balanceLak: number, balanceUsd: number) => {
    setState((prev) => ({
      ...prev,
      holdings: {
        ...prev.holdings,
        cash: { balanceLak, balanceUsd },
      },
    }));
  };

  const exportData = (): string => {
    return JSON.stringify(state, null, 2);
  };

  const importData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.rates && parsed.holdings && parsed.months) {
        setState(withDefaults(parsed));
        return true;
      }
    } catch (e) {
      console.error('Import error:', e);
    }
    return false;
  };

  const resetToDefaults = () => {
    setState(withDefaults(DEFAULT_APP_STATE));
  };

  // ---------- Settings ----------
  const updateSettings = (patch: Partial<AppSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...DEFAULT_SETTINGS, ...(prev.settings || {}), ...patch },
    }));
  };

  // ---------- Budget categories ----------
  const customCategories = state.customCategories || [];

  const addCustomCategory = (cat: Omit<CustomCategory, 'id'>): string => {
    const id = 'c' + generateId();
    setState((prev) => ({ ...prev, customCategories: [...(prev.customCategories || []), { ...cat, id }] }));
    return id;
  };

  const updateCustomCategory = (id: string, patch: Partial<Omit<CustomCategory, 'id'>>) => {
    setState((prev) => ({
      ...prev,
      customCategories: (prev.customCategories || []).map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  /** Removes the category and its monthly plans. Recorded investments stay in the history. */
  const deleteCustomCategory = (id: string) => {
    setState((prev) => {
      const months: AppState['months'] = {};
      for (const [key, m] of Object.entries(prev.months)) {
        if (m.customAllocations && id in m.customAllocations) {
          const { [id]: _removed, ...rest } = m.customAllocations;
          months[key] = { ...m, customAllocations: rest };
        } else {
          months[key] = m;
        }
      }
      return {
        ...prev,
        months,
        customCategories: (prev.customCategories || []).filter((c) => c.id !== id),
      };
    });
  };

  const setCategoryHidden = (key: BuiltinCategoryKey, hidden: boolean) => {
    setState((prev) => {
      const current = { ...DEFAULT_SETTINGS, ...(prev.settings || {}) };
      const set = new Set(current.hiddenCategories);
      if (hidden) set.add(key);
      else set.delete(key);
      return { ...prev, settings: { ...current, hiddenCategories: [...set] } };
    });
  };

  const updateMonthCustomAllocations = (
    monthKey: string,
    customAllocations: NonNullable<MonthData['customAllocations']>
  ) => {
    setState((prev) => {
      const month = prev.months[monthKey] || { ...INITIAL_MONTH_DATA, monthKey };
      return {
        ...prev,
        months: { ...prev.months, [monthKey]: { ...month, customAllocations } },
      };
    });
  };

  // ---------- Savings goals ----------
  const setGoals = (fn: (goals: SavingsGoal[]) => SavingsGoal[]) => {
    setState((prev) => ({ ...prev, goals: fn(prev.goals || []) }));
  };

  const addGoal = (
    goal: Omit<SavingsGoal, 'id' | 'contributions' | 'createdAt'>,
    initialLak = 0
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const newGoal: SavingsGoal = {
      ...goal,
      id: generateId(),
      createdAt: new Date().toISOString(),
      contributions:
        initialLak > 0
          ? [{ id: generateId(), date: today, amountLak: initialLak, note: 'Initial balance' }]
          : [],
    };
    setGoals((gs) => [...gs, newGoal]);
  };

  const updateGoal = (id: string, patch: Partial<Omit<SavingsGoal, 'id' | 'contributions'>>) => {
    setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const deleteGoal = (id: string) => {
    setGoals((gs) => gs.filter((g) => g.id !== id));
  };

  /** Adjust a month's savingsDepositedLak (used when goal deposits count as monthly savings). */
  const adjustMonthSavings = (
    months: AppState['months'],
    monthKey: string,
    deltaLak: number
  ): AppState['months'] => {
    const month = months[monthKey] || { ...INITIAL_MONTH_DATA, monthKey };
    return {
      ...months,
      [monthKey]: {
        ...month,
        savingsDepositedLak: Math.max(0, (month.savingsDepositedLak || 0) + deltaLak),
      },
    };
  };

  const addGoalContribution = (
    goalId: string,
    contribution: Omit<GoalContribution, 'id' | 'monthKey'>,
    countAsMonthlySavings = false
  ) => {
    setState((prev) => {
      // A withdrawal (negative amount) is never counted as monthly savings
      const counted = countAsMonthlySavings && contribution.amountLak > 0;
      const monthKey = counted ? prev.selectedMonth : undefined;
      const newContrib: GoalContribution = { ...contribution, id: generateId(), monthKey };
      return {
        ...prev,
        goals: (prev.goals || []).map((g) =>
          g.id === goalId ? { ...g, contributions: [newContrib, ...g.contributions] } : g
        ),
        months: monthKey
          ? adjustMonthSavings(prev.months, monthKey, contribution.amountLak)
          : prev.months,
      };
    });
  };

  const deleteGoalContribution = (goalId: string, contributionId: string) => {
    setState((prev) => {
      const goal = (prev.goals || []).find((g) => g.id === goalId);
      const contrib = goal?.contributions.find((c) => c.id === contributionId);
      if (!goal || !contrib) return prev;
      return {
        ...prev,
        goals: (prev.goals || []).map((g) =>
          g.id === goalId
            ? { ...g, contributions: g.contributions.filter((c) => c.id !== contributionId) }
            : g
        ),
        months: contrib.monthKey
          ? adjustMonthSavings(prev.months, contrib.monthKey, -contrib.amountLak)
          : prev.months,
      };
    });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        totals,
        currentMonthData,
        monthlySummary,
        setLanguage,
        setPrimaryCurrency,
        updateRates,
        setSelectedMonth,
        createNewMonth,
        updateMonthIncome,
        updateMonthAllocations,
        addExpense,
        deleteExpense,
        addInvestment,
        deleteInvestment,
        addStock,
        updateStockPrice,
        removeStock,
        addEtf,
        updateEtfPrice,
        removeEtf,
        recordBtcTransaction,
        updateGoldHoldings,
        updateEmergencyFund,
        updateCashBalances,
        exportData,
        importData,
        resetToDefaults,
        syncStatus,
        customCategories,
        addCustomCategory,
        updateCustomCategory,
        deleteCustomCategory,
        setCategoryHidden,
        updateMonthCustomAllocations,
        settings,
        updateSettings,
        rateRefresh,
        refreshMarketRates,
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        addGoalContribution,
        deleteGoalContribution,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
