import React from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { NavTab } from '../types';
import {
  TrendingUp,
  PieChart as PieIcon,
  DollarSign,
  Coins,
  ShieldCheck,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const PortfolioOverview: React.FC<{
  onSelectTab?: (tab: NavTab) => void;
}> = ({ onSelectTab }) => {
  const { state, totals } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const rateUsdLak = state.rates.usdLak;
  const curr = state.primaryCurrency;

  const handleTabClick = (tab: NavTab) => {
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  const chartData = [
    { name: t.stocks, value: totals.stocksValueUsd, color: '#10b981', tab: 'stocks' as NavTab },
    { name: t.funds, value: totals.etfsValueUsd, color: '#14b8a6', tab: 'funds' as NavTab },
    { name: t.crypto, value: totals.btcValueUsd, color: '#f97316', tab: 'crypto' as NavTab },
    { name: t.gold, value: totals.goldValueUsd, color: '#f59e0b', tab: 'gold' as NavTab },
    { name: t.emergencyFund, value: totals.emergencyFundUsd, color: '#8b5cf6', tab: 'emergency' as NavTab },
    { name: t.cash, value: totals.totalCashInUsd, color: '#3b82f6', tab: 'emergency' as NavTab },
  ].filter((d) => d.value > 0);

  const totalPortfolioValueUsd = totals.netWorthUsd || 1;

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Asset Allocation Visualizer & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 mb-1">
              <PieIcon className="w-4 h-4 text-amber-400" />
              <span>
                {state.language === 'lo' ? 'ສັດສ່ວນຊັບສິນລວມທັງໝົດ' : 'สัดส่วนสินทรัพย์รวมทั้งหมด'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {state.language === 'lo'
                ? 'ຄິດໄລ່ລວມທັງພອດລົງທຶນ, ຄຳ ແລະ ເງິນສຳຮອງ'
                : 'คำนวณรวมทั้งพอร์ตลงทุน, ทอง และเงินสำรอง'}
            </p>
          </div>

          {chartData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl my-2">
              <span className="text-2xl mb-1">🌱</span>
              <p className="text-xs text-slate-300 font-medium">
                {state.language === 'lo' ? 'ເລີ່ມຕົ້ນພອດຂອງທ່ານຈາກ 0' : 'เริ่มต้นพอร์ตของคุณจาก 0'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                {state.language === 'lo'
                  ? 'ເພີ່ມຮຸ້ນ, ບິດຄອຍ, ຄຳ ຫຼື ເງິນສຳຮອງ ເພື່ອເລີ່ມຕິດຕາມຊັບສິນ'
                  : 'เพิ่มหุ้น, บิตคอยน์, ทอง หรือเงินสำรอง เพื่อเริ่มติดตามสินทรัพย์'}
              </p>
            </div>
          ) : (
            <div className="h-56 relative my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [
                      `$${Number(val).toLocaleString('en-US', { maximumFractionDigits: 1 })} USD (≈ ₭${(Number(val) * rateUsdLak).toLocaleString('en-US', { maximumFractionDigits: 0 })})`,
                      'ມູນຄ່າ / มูลค่า',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Net Worth */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-mono text-slate-500">Net Worth</span>
                <span className="text-sm font-bold font-mono text-amber-300">
                  ${totals.netWorthUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          )}

          {/* Mini Legend */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-2 border-t border-slate-800">
            {chartData.map((item) => {
              const pct = (item.value / totalPortfolioValueUsd) * 100;
              return (
                <div
                  key={item.name}
                  onClick={() => handleTabClick(item.tab)}
                  className="flex items-center space-x-1.5 text-slate-300 hover:text-white cursor-pointer truncate"
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                  <span className="font-mono text-slate-500 text-[10px] ml-auto">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Investment Performance & Profit Breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>
                    {state.language === 'lo' ? 'ຜົນຕອບແທນພອດການລົງທຶນ (P/L)' : 'ผลตอบแทนพอร์ตการลงทุน (P/L)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {state.language === 'lo'
                    ? 'ກຳໄລ / ຂາດທຶນປັດຈຸບັນຂອງ ຮຸ້ນ + ETFs + ບິດຄອຍ + ຄຳ'
                    : 'กำไร / ขาดทุนปัจจุบันของ หุ้น + ETFs + บิตคอยน์ + ทอง'}
                </p>
              </div>

              <div className="text-left sm:text-right font-mono">
                <span className="text-xs text-slate-400">Total Unrealized P/L: </span>
                <span className={`text-base font-bold ${totals.unrealizedPlUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {totals.unrealizedPlUsd >= 0 ? '+' : ''}${totals.unrealizedPlUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </span>
                <div className="text-[11px] text-slate-400">
                  (≈ {totals.unrealizedPlUsd >= 0 ? '+' : ''}₭{totals.unrealizedPlLak.toLocaleString()})
                </div>
              </div>
            </div>

            {/* Asset Class Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              
              {/* US Stocks Performance */}
              <div
                onClick={() => handleTabClick('stocks')}
                className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3.5 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{t.stocks}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {state.holdings.stocks.length} {state.language === 'lo' ? 'ລາຍການ' : 'รายการ'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="font-mono">
                    <div className="text-base font-bold text-slate-100">
                      ${totals.stocksValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ≈ ₭{totals.stocksValueLak.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className={`text-xs font-bold ${totals.stocksValueUsd - totals.stocksCostUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {totals.stocksValueUsd - totals.stocksCostUsd >= 0 ? '+' : ''}
                      ${(totals.stocksValueUsd - totals.stocksCostUsd).toFixed(1)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {totals.stocksCostUsd > 0
                        ? formatPercent(((totals.stocksValueUsd - totals.stocksCostUsd) / totals.stocksCostUsd) * 100, true)
                        : '0.0%'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Funds/ETFs Performance */}
              <div
                onClick={() => handleTabClick('funds')}
                className="bg-slate-950/80 border border-slate-800 hover:border-teal-500/50 rounded-xl p-3.5 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span>{t.funds}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {state.holdings.etfs.length} {state.language === 'lo' ? 'ລາຍການ' : 'รายการ'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="font-mono">
                    <div className="text-base font-bold text-slate-100">
                      ${totals.etfsValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ≈ ₭{totals.etfsValueLak.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className={`text-xs font-bold ${totals.etfsValueUsd - totals.etfsCostUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {totals.etfsValueUsd - totals.etfsCostUsd >= 0 ? '+' : ''}
                      ${(totals.etfsValueUsd - totals.etfsCostUsd).toFixed(1)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {totals.etfsCostUsd > 0
                        ? formatPercent(((totals.etfsValueUsd - totals.etfsCostUsd) / totals.etfsCostUsd) * 100, true)
                        : '0.0%'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bitcoin Performance */}
              <div
                onClick={() => handleTabClick('crypto')}
                className="bg-slate-950/80 border border-slate-800 hover:border-orange-500/50 rounded-xl p-3.5 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span>{t.crypto}</span>
                  </span>
                  <span className="text-[10px] font-mono text-orange-400">
                    {state.holdings.btc.amountBtc.toFixed(4)} BTC
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="font-mono">
                    <div className="text-base font-bold text-slate-100">
                      ${totals.btcValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ≈ ₭{totals.btcValueLak.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className={`text-xs font-bold ${totals.btcValueUsd - totals.btcCostUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {totals.btcValueUsd - totals.btcCostUsd >= 0 ? '+' : ''}
                      ${(totals.btcValueUsd - totals.btcCostUsd).toFixed(1)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {totals.btcCostUsd > 0
                        ? formatPercent(((totals.btcValueUsd - totals.btcCostUsd) / totals.btcCostUsd) * 100, true)
                        : '0.0%'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gold Performance */}
              <div
                onClick={() => handleTabClick('gold')}
                className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 rounded-xl p-3.5 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>{t.gold}</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">
                    {state.holdings.gold.grams} g (≈ {(state.holdings.gold.grams / 15.244).toFixed(2)} ບາດ)
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="font-mono">
                    <div className="text-base font-bold text-slate-100">
                      ${totals.goldValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ≈ ₭{totals.goldValueLak.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className={`text-xs font-bold ${totals.goldValueUsd - totals.goldCostUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {totals.goldValueUsd - totals.goldCostUsd >= 0 ? '+' : ''}
                      ${(totals.goldValueUsd - totals.goldCostUsd).toFixed(1)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {totals.goldCostUsd > 0
                        ? formatPercent(((totals.goldValueUsd - totals.goldCostUsd) / totals.goldCostUsd) * 100, true)
                        : '0.0%'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
