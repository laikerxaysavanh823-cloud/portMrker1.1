import { AppSettings, AppState, MonthData } from '../types';
import { getCurrentMonthKey } from '../utils/formatters';

const curMonth = getCurrentMonthKey(); // e.g. '2026-08'

export const INITIAL_MONTH_DATA: MonthData = {
  monthKey: curMonth,
  title: 'ແຜນປະຈຳເດືອນປັດຈຸບັນ',
  incomeLak: 0,
  allocations: {
    foodLivingLak: 0, // 15% - ຄ່າກິນຢູ່/ຄ່າຄອງຊີບ
    foodLivingPct: 15,
    usStocksUsd: 0, // 15% - ຮຸ້ນ US
    usStocksPct: 15,
    fundsEtfsUsd: 0, // 20% - ກອງທຶນ ETFs (ຮຸ້ນ + ກອງທຶນ = 35%)
    fundsEtfsPct: 20,
    bitcoinUsd: 0, // 15% - ບິດຄອຍ BTC DCA
    bitcoinPct: 15,
    goldUsd: 0, // 25% - ຄຳແທ່ງ Gold
    goldPct: 25,
    emergencyLak: 0, // 10% - ເງິນສຳຮອງສຸກເສີນ
    emergencyPct: 10,
    savingsLeisureLak: 0, // 0% - ເງິນອອມອື່ນໆ
    savingsLeisurePct: 0,
  },
  expenses: [],
  investments: [],
  savingsDepositedLak: 0,
  notes: '',
};

export const DEFAULT_SETTINGS: AppSettings = {
  autoRefreshRates: true, // BTC & gold prices update automatically
  autoRefreshFx: false, // keep the user's own USD→LAK rate unless they opt in
  hiddenCategories: [],
};

export const DEFAULT_APP_STATE: AppState = {
  version: 1,
  language: 'lo', // default to Lao
  primaryCurrency: 'LAK',
  rates: {
    usdLak: 22500, // 1 USD = 22,500 Kip (Standard Reference Rate)
    usdThb: 34.5,  // 1 USD = 34.50 THB
    btcUsd: 78500, // 1 BTC = $78,500
    goldUsdPerGram: 86.5, // 1 gram of gold = $86.50
    lastUpdated: new Date().toISOString(),
    sourceName: 'BCEL / Market Reference Rates',
  },
  settings: DEFAULT_SETTINGS,
  goals: [],
  customCategories: [],
  selectedMonth: curMonth,
  months: {
    [curMonth]: INITIAL_MONTH_DATA,
  },
  holdings: {
    stocks: [],
    etfs: [],
    btc: {
      amountBtc: 0,
      avgCostUsd: 0,
      transactions: [],
    },
    gold: {
      grams: 0,
      avgCostUsdPerGram: 0,
      notes: '',
    },
    emergency: {
      balanceLak: 0,
      targetMonths: 6,
      monthlyExpenseLak: 0,
    },
    cash: {
      balanceLak: 0,
      balanceUsd: 0,
    },
  },
};

