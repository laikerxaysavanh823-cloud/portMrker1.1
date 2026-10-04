import React from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Activity, ArrowUpRight } from 'lucide-react';

export const AnalyticsCharts: React.FC = () => {
  const { state, totals } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const rateUsdLak = state.rates.usdLak;

  // Monthly Comparison Data
  const monthlyChartData = Object.keys(state.months)
    .sort((a, b) => a.localeCompare(b))
    .map((mKey) => {
      const m = state.months[mKey];
      const incomeLak = m.incomeLak || 0;
      const expensesLak = (m.expenses || []).reduce((acc, e) => acc + e.amountLak, 0);
      const investmentsLak = (m.investments || []).reduce((acc, i) => acc + i.amountLak, 0);
      const savedLak = Math.max(0, incomeLak - expensesLak - investmentsLak);

      return {
        month: mKey,
        income: incomeLak / 1000000, // in Millions of Kip (M LAK)
        expenses: expensesLak / 1000000,
        investments: investmentsLak / 1000000,
        saved: savedLak / 1000000,
        investmentsUsd: (m.investments || []).reduce((acc, i) => acc + i.amountUsd, 0),
      };
    });

  // Asset Class PL Breakdown
  const plData = [
    {
      name: 'US Stocks',
      cost: totals.stocksCostUsd,
      value: totals.stocksValueUsd,
      pl: totals.stocksValueUsd - totals.stocksCostUsd,
      color: '#10b981',
    },
    {
      name: 'ETFs & Funds',
      cost: totals.etfsCostUsd,
      value: totals.etfsValueUsd,
      pl: totals.etfsValueUsd - totals.etfsCostUsd,
      color: '#14b8a6',
    },
    {
      name: 'Bitcoin (BTC)',
      cost: totals.btcCostUsd,
      value: totals.btcValueUsd,
      pl: totals.btcValueUsd - totals.btcCostUsd,
      color: '#f97316',
    },
    {
      name: 'Gold Bullion',
      cost: totals.goldCostUsd,
      value: totals.goldValueUsd,
      pl: totals.goldValueUsd - totals.goldCostUsd,
      color: '#f59e0b',
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
          <Activity className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-xl font-bold text-slate-100">{t.analytics}</h2>
            <p className="text-xs text-slate-400">
              {state.language === 'lo'
                ? 'ສະຖິຕິການເງິນ, ກະແສເງິນສົດລາຍເດືອນ ແລະ ຜົນຕອບແທນພອດການລົງທຶນ'
                : 'สถิติการเงิน, กระแสเงินสดรายเดือน และผลตอบแทนพอร์ตการลงทุน'}
            </p>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-5">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Net Worth (₭ LAK)
            </span>
            <div className="text-xl font-bold font-mono text-amber-300">
              {formatCurrency(totals.netWorthLak, 'LAK')}
            </div>
            <span className="text-xs font-mono text-slate-400">
              ≈ ${totals.netWorthUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Investments ($ USD)
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              ${totals.totalInvestmentsUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs font-mono text-slate-400">
              ≈ ₭{totals.totalInvestmentsLak.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Total Unrealized P/L
            </span>
            <div className={`text-xl font-bold font-mono ${totals.unrealizedPlUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totals.unrealizedPlUsd >= 0 ? '+' : ''}${totals.unrealizedPlUsd.toFixed(2)}
            </div>
            <span className="text-xs font-mono text-slate-400">
              ({formatPercent(totals.unrealizedPlPct, true)})
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Safety Reserve (Emergency)
            </span>
            <div className="text-xl font-bold font-mono text-purple-300">
              {formatCurrency(totals.emergencyFundLak, 'LAK')}
            </div>
            <span className="text-xs font-mono text-slate-400">
              {(totals.emergencyFundLak / state.holdings.emergency.monthlyExpenseLak).toFixed(1)} Months Runway
            </span>
          </div>
        </div>
      </div>

      {/* Chart 1: Monthly Cashflow (Income vs Expenses vs Investments in M LAK) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>
                {state.language === 'lo'
                  ? 'ກະແສເງິນສົດລາຍເດືອນ: ລາຍຮັບ vs ລາຍຈ່າຍ vs ເງິນລົງທຶນ (ລ້ານກີບ)'
                  : 'กระแสเงินสดรายเดือน: รายรับ vs รายจ่าย vs เงินลงทุน (ล้านกีบ)'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {state.language === 'lo'
                ? 'ປຽບທຽບລາຍຮັບ, ລາຍຈ່າຍກິນຢູ່ ແລະ ການລົງທຶນແຕ່ລະເດືອນ'
                : 'เปรียบเทียบรายรับ, รายจ่ายกินอยู่ และการลงทุนแต่ละเดือน'}
            </p>
          </div>
          <span className="text-xs font-mono text-amber-400 bg-amber-950/60 px-2 py-1 rounded border border-amber-800/40">
            Unit: Million LAK (ລ້ານກີບ ₭)
          </span>
        </div>

        <div className="h-72 w-full mt-4 font-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" unit="M" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
                formatter={(val: any) => [`₭${(Number(val) * 1000000).toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="income" name="ລາຍຮັບ (Income)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="ລາຍຈ່າຍ (Living Expenses)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="investments" name="ລົງທຶນ (Investments)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Profit/Loss and Cost Comparison per Asset Class ($ USD) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>
              {state.language === 'lo'
                ? 'ຕົ້ນທຶນ vs ມູນຄ່າປັດຈຸບັນແຍກຕາມປະເພດຊັບສິນ ($ USD)'
                : 'ต้นทุน vs มูลค่าปัจจุบันแยกตามประเภทสินทรัพย์ ($ USD)'}
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            {state.language === 'lo'
              ? 'ປຽບທຽບຕົ້ນທຶນຊື້ (Cost Basis) ກັບມູນຄ່າຕະຫຼາດປັດຈຸບັນ (Market Value)'
              : 'เปรียบเทียบต้นทุนซื้อ (Cost Basis) กับมูลค่าตลาดปัจจุบัน (Market Value)'}
          </p>
        </div>

        <div className="h-72 w-full mt-4 font-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={plData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" unit="$" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
                formatter={(val: any) => [
                  `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD (≈ ₭${(Number(val) * rateUsdLak).toLocaleString('en-US', { maximumFractionDigits: 0 })})`,
                  '',
                ]}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="cost" name="ຕົ້ນທຶນ (Total Cost Basis)" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="value" name="ມູນຄ່າປັດຈຸບັນ (Market Value)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
