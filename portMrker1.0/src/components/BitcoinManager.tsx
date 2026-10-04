import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  Coins,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wallet,
  Calendar,
  History,
  CheckCircle2,
} from 'lucide-react';
import { notify } from '../utils/platform';

export const BitcoinManager: React.FC = () => {
  const { state, totals, updateRates, recordBtcTransaction } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const rateUsdLak = state.rates.usdLak;
  const btc = state.holdings.btc;

  const [showDcaModal, setShowDcaModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newBtcPrice, setNewBtcPrice] = useState(state.rates.btcUsd.toString());

  // Form state
  const [txType, setTxType] = useState<'buy' | 'sell'>('buy');
  const [inputMode, setInputMode] = useState<'usd' | 'btc'>('usd');
  const [amountInput, setAmountInput] = useState('');
  const [priceAtTx, setPriceAtTx] = useState(state.rates.btcUsd.toString());
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [syncWithMonth, setSyncWithMonth] = useState(true);
  const [note, setNote] = useState('');

  const currentPrice = state.rates.btcUsd;
  const totalBtc = btc.amountBtc;
  const avgCost = btc.avgCostUsd;
  const totalValueUsd = totals.btcValueUsd;
  const totalValueLak = totals.btcValueLak;
  const totalCostUsd = totalBtc * avgCost;
  const totalCostLak = totalCostUsd * rateUsdLak;
  const plUsd = totalValueUsd - totalCostUsd;
  const plPct = totalCostUsd > 0 ? (plUsd / totalCostUsd) * 100 : 0;
  const isPos = plUsd >= 0;

  const handleDcaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountInput) || 0;
    const price = parseFloat(priceAtTx) || currentPrice;

    if (val <= 0 || price <= 0) {
      notify('ກະລຸນາປ້ອນຈຳນວນເງິນ / กรุณากรอกจำนวนเงิน');
      return;
    }

    let btcAmount = 0;
    let totalUsd = 0;

    if (inputMode === 'usd') {
      totalUsd = val;
      btcAmount = val / price;
    } else {
      btcAmount = val;
      totalUsd = val * price;
    }

    recordBtcTransaction(
      {
        date: txDate,
        type: txType,
        btcAmount,
        priceUsd: price,
        totalUsd,
        fundingSource: 'monthly_budget',
        note: note.trim() || (txType === 'buy' ? 'DCA Bitcoin' : 'Sell Bitcoin'),
      },
      syncWithMonth
    );

    setAmountInput('');
    setNote('');
    setShowDcaModal(false);
  };

  const handleUpdatePrice = () => {
    const p = parseFloat(newBtcPrice) || currentPrice;
    updateRates({ btcUsd: p });
    setShowPriceModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Bitcoin DCA Dashboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Coins className="w-5 h-5 text-orange-400" />
                <span>{t.crypto}</span>
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-orange-950 text-orange-400 border border-orange-800/40">
                DCA • USD $ → LAK ₭
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {state.language === 'lo'
                ? 'ສະສົມບິດຄອຍແບບ DCA, ຄິດໄລ່ຕົ້ນທຶນສະເລ່ຍອັດຕະໂນມັດ ແລະ ແປງມູນຄ່າເປັນເງິນກີບ'
                : 'สะสมบิตคอยน์แบบ DCA, คำนวณต้นทุนเฉลี่ยอัตโนมัติ และแปลงมูลค่าเป็นเงินกีบ'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setNewBtcPrice(currentPrice.toString());
                setShowPriceModal(true);
              }}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl border border-slate-700 font-mono transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
              <span>BTC: ${currentPrice.toLocaleString()}</span>
            </button>

            <button
              onClick={() => setShowDcaModal(true)}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-slate-950 text-xs px-4 py-2 rounded-xl font-bold shadow-lg shadow-orange-500/20 transition"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{t.buyDCA}</span>
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-5">
          
          {/* Total BTC Held */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {state.language === 'lo' ? 'ຈຳນວນ BTC ທີ່ຖືຄອງ' : 'จำนวน BTC ที่ถือครอง'}
            </div>
            <div className="text-2xl font-bold font-mono text-orange-400">
              {totalBtc.toFixed(6)} BTC
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              {(totalBtc * 100000000).toLocaleString()} Satoshis
            </div>
          </div>

          {/* DCA Avg Cost Basis */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {t.avgCost} (DCA Basis)
            </div>
            <div className="text-2xl font-bold font-mono text-slate-200">
              ${avgCost.toLocaleString('en-US', { minimumFractionDigits: 1 })} USD
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              ≈ ₭{(avgCost * rateUsdLak).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Current Value */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {t.currentValue}
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ${totalValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              ≈ ₭{totalValueLak.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Profit / Loss */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {t.profitVal} (P/L)
            </div>
            <div className={`text-2xl font-bold font-mono ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPos ? '+' : ''}${plUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>≈ {isPos ? '+' : ''}₭{(plUsd * rateUsdLak).toLocaleString()}</span>
              <strong className={isPos ? 'text-emerald-400' : 'text-red-400'}>
                ({formatPercent(plPct, true)})
              </strong>
            </div>
          </div>

        </div>
      </div>

      {/* DCA Transaction History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <History className="w-4 h-4 text-orange-400" />
            <span>
              {state.language === 'lo' ? 'ປະຫວັດການຊື້-ຂາຍ Bitcoin (DCA Log)' : 'ประวัติการซื้อ-ขาย Bitcoin (DCA Log)'}
            </span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {btc.transactions.length} {state.language === 'lo' ? 'ທຸລະກຳ' : 'ธุรกรรม'}
          </span>
        </div>

        {btc.transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            {state.language === 'lo' ? 'ຍັງບໍ່ມີປະຫວັດການຊື້ Bitcoin' : 'ยังไม่มีประวัติการซื้อ Bitcoin'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">{t.date}</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">BTC Amount</th>
                  <th className="py-3 px-4 text-right">Price at Purchase ($)</th>
                  <th className="py-3 px-4 text-right">Total ($ USD)</th>
                  <th className="py-3 px-4 text-right">Converted (₭ LAK)</th>
                  <th className="py-3 px-4">{t.notes}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {btc.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-slate-300 font-sans">{tx.date}</td>
                    
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          tx.type === 'buy'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : 'bg-red-950 text-red-400 border border-red-800/40'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-orange-400">
                      {tx.btcAmount.toFixed(6)} BTC
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-300">
                      ${tx.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                      ${tx.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-400">
                      ₭{tx.totalLak.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-sans text-[11px] truncate max-w-xs">
                      {tx.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record DCA Buy/Sell Modal */}
      {showDcaModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-orange-400" />
              <span>
                {txType === 'buy'
                  ? state.language === 'lo'
                    ? 'ບັນທຶກການຊື້ Bitcoin (DCA)'
                    : 'บันทึกการซื้อ Bitcoin (DCA)'
                  : 'ບັນທຶກການຂາຍ Bitcoin'}
              </span>
            </h3>

            <form onSubmit={handleDcaSubmit} className="space-y-3.5 text-xs">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono">
                <button
                  type="button"
                  onClick={() => setTxType('buy')}
                  className={`py-1.5 rounded-lg font-bold transition ${
                    txType === 'buy' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  BUY (ຊື້ສະສົມ)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('sell')}
                  className={`py-1.5 rounded-lg font-bold transition ${
                    txType === 'sell' ? 'bg-red-600 text-white' : 'text-slate-400'
                  }`}
                >
                  SELL (ຂາຍ)
                </button>
              </div>

              {/* Mode: USD or BTC */}
              <div className="flex items-center justify-between text-slate-400 font-mono pt-1">
                <span>Input Mode:</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setInputMode('usd')}
                    className={`px-2 py-0.5 rounded text-xs ${
                      inputMode === 'usd' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800'
                    }`}
                  >
                    Amount in USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('btc')}
                    className={`px-2 py-0.5 rounded text-xs ${
                      inputMode === 'btc' ? 'bg-orange-500 text-slate-950 font-bold' : 'bg-slate-800'
                    }`}
                  >
                    Amount in BTC
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">
                  {inputMode === 'usd' ? 'Total Invested ($ USD)*' : 'BTC Amount*'}
                </label>
                <input
                  type="number"
                  step={inputMode === 'usd' ? '0.01' : '0.00000001'}
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-base font-bold focus:outline-none focus:border-orange-500"
                  placeholder={inputMode === 'usd' ? '100.00' : '0.00128'}
                />
                {inputMode === 'usd' && amountInput && (
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    ≈ ₭{((parseFloat(amountInput) || 0) * rateUsdLak).toLocaleString()} LAK (≈{' '}
                    {((parseFloat(amountInput) || 0) / (parseFloat(priceAtTx) || currentPrice)).toFixed(6)} BTC)
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Bitcoin Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={priceAtTx}
                    onChange={(e) => setPriceAtTx(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">{t.date}</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">{t.notes}</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-orange-500"
                  placeholder="e.g. Binance Monthly DCA"
                />
              </div>

              {/* Sync with Month Checkbox */}
              {txType === 'buy' && (
                <label className="flex items-center space-x-2 text-slate-300 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncWithMonth}
                    onChange={(e) => setSyncWithMonth(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-orange-500 focus:ring-orange-500"
                  />
                  <span>
                    {state.language === 'lo'
                      ? `ບັນທຶກລົງໃນລາຍການລົງທຶນເດືອນນີ້ (${state.selectedMonth}) ພ້ອມກັນ`
                      : `บันทึกลงในรายการลงทุนเดือนนี้ (${state.selectedMonth}) ด้วย`}
                  </span>
                </label>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDcaModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg transition"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit BTC Price Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-2 font-mono flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-orange-400" />
              <span>Update Bitcoin Spot Price</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter current Bitcoin price in USD ($) to update all portfolio calculations:
            </p>

            <div className="space-y-4">
              <div>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={newBtcPrice}
                  onChange={(e) => setNewBtcPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-orange-500 rounded-xl px-3 py-2 text-lg font-mono font-bold text-orange-400 focus:outline-none"
                />
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  ≈ ₭{((parseFloat(newBtcPrice) || 0) * rateUsdLak).toLocaleString()} Kip / BTC
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => setShowPriceModal(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 transition"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleUpdatePrice}
                  className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg transition"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
