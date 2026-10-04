export type NavTab =
  | 'budget'
  | 'portfolio'
  | 'stocks'
  | 'funds'
  | 'crypto'
  | 'gold'
  | 'emergency'
  | 'goals'
  | 'analytics'
  | 'advisor';

export type Currency = 'LAK' | 'USD' | 'THB';
export type Language = 'lo' | 'th' | 'en';

export interface MarketRates {
  usdLak: number; // 1 USD in LAK (e.g., 22500)
  usdThb: number; // 1 USD in THB (e.g., 34.5)
  btcUsd: number; // 1 BTC in USD (e.g., 78000)
  goldUsdPerGram: number; // Gold per gram in USD (e.g., 85.5)
  lastUpdated: string;
  sourceName?: string;
}

export interface StockHolding {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  avgCostUsd: number;
  currentPriceUsd: number;
  lastUpdated?: string;
  notes?: string;
}

export interface FundHolding {
  id: string;
  ticker: string;
  name: string;
  units: number;
  avgCostUsd: number;
  currentPriceUsd: number;
  category?: 'index_etf' | 'tech_etf' | 'dividend' | 'bond' | 'other';
  notes?: string;
}

export interface BtcTransaction {
  id: string;
  date: string;
  type: 'buy' | 'sell';
  btcAmount: number;
  priceUsd: number;
  totalUsd: number;
  totalLak: number;
  fundingSource: 'monthly_budget' | 'lak_cash' | 'usd_cash' | 'external';
  note?: string;
}

export interface BtcHolding {
  amountBtc: number;
  avgCostUsd: number;
  transactions: BtcTransaction[];
}

export interface GoldHolding {
  grams: number;
  avgCostUsdPerGram: number;
  notes?: string;
}

export interface EmergencyFund {
  balanceLak: number;
  targetMonths: number;
  monthlyExpenseLak: number;
}

export interface CashHolding {
  balanceLak: number;
  balanceUsd: number;
}

export interface MonthlyAllocation {
  categoryKey: string;
  nameLo: string;
  nameTh: string;
  nameEn: string;
  currency: 'LAK' | 'USD';
  plannedAmount: number; // in its native currency (e.g., USD for stocks/funds/btc, LAK for food/emergency)
  percentageOfIncome: number; // % of total monthly income
  color: string;
  iconName: string;
}

export interface MonthlyExpense {
  id: string;
  date: string;
  category: string;
  amountLak: number;
  note?: string;
}

export interface MonthlyInvestment {
  id: string;
  date: string;
  assetType: 'stock' | 'etf' | 'btc' | 'gold' | 'emergency' | 'custom';
  customCategoryId?: string; // set when assetType is 'custom'
  assetName: string;
  amountUsd: number; // recorded in USD for stocks, etfs, btc
  amountLak: number; // auto-converted to LAK
  rateUsed: number; // USD to LAK exchange rate at transaction time
  sharesOrUnits?: number;
  unitPriceUsd?: number;
  note?: string;
}

export interface MonthData {
  monthKey: string; // 'YYYY-MM', e.g., '2026-08'
  title?: string;
  incomeLak: number; // Monthly income in Lao Kip
  incomeUsdEquivalent?: number;
  allocations: {
    foodLivingLak: number; // LAK
    foodLivingPct: number;
    usStocksUsd: number; // USD
    usStocksPct: number;
    fundsEtfsUsd: number; // USD
    fundsEtfsPct: number;
    bitcoinUsd: number; // USD
    bitcoinPct: number;
    goldUsd: number; // USD (or LAK equivalent)
    goldPct: number;
    emergencyLak: number; // LAK
    emergencyPct: number;
    savingsLeisureLak: number; // LAK
    savingsLeisurePct: number;
  };
  /** Plan for user-defined categories this month, keyed by CustomCategory.id. Amount is in the category's currency. */
  customAllocations?: Record<string, { pct: number; amount: number }>;
  expenses: MonthlyExpense[];
  investments: MonthlyInvestment[];
  savingsDepositedLak: number;
  notes?: string;
}

/** Built-in budget lines that can be switched off (food & living is always on). */
export type BuiltinCategoryKey = 'stocks' | 'funds' | 'btc' | 'gold' | 'emergency' | 'leisure';

/** A user-defined investment / saving category, e.g. "Thai stocks", "Land", "Life insurance". */
export interface CustomCategory {
  id: string;
  name: string;
  currency: 'LAK' | 'USD';
  color: string; // key of the shared colour palette
}

export interface GoalContribution {
  id: string;
  date: string;
  amountLak: number;
  note?: string;
  monthKey?: string; // set when the contribution was also counted as that month's savings
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetLak: number;
  deadline?: string; // 'YYYY-MM'
  color: string; // tailwind color name, e.g. 'emerald'
  contributions: GoalContribution[];
  createdAt: string;
}

export interface AppSettings {
  autoRefreshRates: boolean; // fetch BTC & gold prices automatically on app open
  autoRefreshFx: boolean; // also overwrite USD→LAK / USD→THB with the online reference rate
  hiddenCategories: BuiltinCategoryKey[]; // built-in budget lines the user does not use
}

export interface AppState {
  version: number;
  language: Language;
  primaryCurrency: Currency;
  rates: MarketRates;
  settings?: AppSettings;
  goals?: SavingsGoal[];
  customCategories?: CustomCategory[];
  selectedMonth: string; // '2026-08'
  months: Record<string, MonthData>;
  holdings: {
    stocks: StockHolding[];
    etfs: FundHolding[];
    btc: BtcHolding;
    gold: GoldHolding;
    emergency: EmergencyFund;
    cash: CashHolding;
  };
}
