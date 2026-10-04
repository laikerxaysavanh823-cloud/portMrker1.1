import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
} from 'lucide-react';
import { askConfirm, notify } from '../utils/platform';

export const StocksManager: React.FC = () => {
  const { state, totals, addStock, updateStockPrice, removeStock } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const rateUsdLak = state.rates.usdLak;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPriceStock, setEditingPriceStock] = useState<{ id: string; ticker: string; price: number } | null>(null);

  // Add form state
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [shares, setShares] = useState('');
  const [avgCostUsd, setAvgCostUsd] = useState('');
  const [currentPriceUsd, setCurrentPriceUsd] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !shares || !avgCostUsd) {
      notify('ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ / กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const curPrice = parseFloat(currentPriceUsd) || parseFloat(avgCostUsd);

    addStock({
      ticker: ticker.toUpperCase().trim(),
      name: name.trim() || ticker.toUpperCase().trim(),
      shares: parseFloat(shares) || 0,
      avgCostUsd: parseFloat(avgCostUsd) || 0,
      currentPriceUsd: curPrice,
      notes: notes.trim(),
    });

    setTicker('');
    setName('');
    setShares('');
    setAvgCostUsd('');
    setCurrentPriceUsd('');
    setNotes('');
    setShowAddModal(false);
  };

  const handleUpdatePrice = () => {
    if (editingPriceStock) {
      updateStockPrice(editingPriceStock.id, editingPriceStock.price);
      setEditingPriceStock(null);
    }
  };

  const totalStocksPlUsd = totals.stocksValueUsd - totals.stocksCostUsd;
  const totalStocksPlPct = totals.stocksCostUsd > 0 ? (totalStocksPlUsd / totals.stocksCostUsd) * 100 : 0;

  return (
    <div className="space-y-6">
      
      {/* Header & Stats Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>{t.stocks}</span>
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                USD $ → LAK ₭
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {state.language === 'lo'
                ? 'ຕິດຕາມຮຸ້ນສະຫະລັດເປັນດອນລ່າ ($) ພ້ອມແປງເປັນກີບ (₭) ຕາມອັດຕາແລກປ່ຽນປັດຈຸບັນ'
                : 'ติดตามหุ้นสหรัฐเป็นดอลลาร์ ($) พร้อมแปลงเป็นกีบ (₭) ตามอัตราแลกเปลี่ยนปัจจุบัน'}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-xl font-semibold shadow-lg shadow-emerald-900/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addPosition}</span>
          </button>
        </div>

        {/* Aggregate Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {state.language === 'lo' ? 'ມູນຄ່າຮຸ້ນລວມປັດຈຸບັນ' : 'มูลค่าหุ้นรวมปัจจุบัน'}
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ${totals.stocksValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              ≈ ₭{totals.stocksValueLak.toLocaleString()} (@ ₭{rateUsdLak.toLocaleString()})
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {state.language === 'lo' ? 'ຕົ້ນທຶນຮຸ້ນທັງໝົດ' : 'ต้นทุนหุ้นทั้งหมด'}
            </div>
            <div className="text-2xl font-bold font-mono text-slate-200">
              ${totals.stocksCostUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              ≈ ₭{totals.stocksCostLak.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {t.profitVal} (P/L)
            </div>
            <div className={`text-2xl font-bold font-mono ${totalStocksPlUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalStocksPlUsd >= 0 ? '+' : ''}${totalStocksPlUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>≈ {totalStocksPlUsd >= 0 ? '+' : ''}₭{(totalStocksPlUsd * rateUsdLak).toLocaleString()}</span>
              <strong className={totalStocksPlUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                ({formatPercent(totalStocksPlPct, true)})
              </strong>
            </div>
          </div>

        </div>
      </div>

      {/* Stocks Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200">
            {state.language === 'lo' ? 'ລາຍການຮຸ້ນໃນພອດ' : 'รายการหุ้นในพอร์ต'} ({state.holdings.stocks.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {state.language === 'lo' ? 'ກົດປຸ່ມແກ້ໄຂເພື່ອປັບລາຄາປັດຈຸບັນ' : 'กดปุ่มแก้ไขเพื่อปรับราคาปัจจุบัน'}
          </span>
        </div>

        {state.holdings.stocks.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            {state.language === 'lo' ? 'ຍັງບໍ່ມີຮຸ້ນໃນພອດ' : 'ยังไม่มีหุ้นในพอร์ต'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Ticker & Name</th>
                  <th className="py-3 px-4 text-right">{t.shares}</th>
                  <th className="py-3 px-4 text-right">{t.avgCost} ($)</th>
                  <th className="py-3 px-4 text-right">{t.currentPrice} ($)</th>
                  <th className="py-3 px-4 text-right">{t.currentValue} ($ & ₭)</th>
                  <th className="py-3 px-4 text-right">{t.profitVal} (P/L)</th>
                  <th className="py-3 px-4 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {state.holdings.stocks.map((stock) => {
                  const valUsd = stock.shares * stock.currentPriceUsd;
                  const costUsd = stock.shares * stock.avgCostUsd;
                  const plUsd = valUsd - costUsd;
                  const plPct = costUsd > 0 ? (plUsd / costUsd) * 100 : 0;
                  const isPos = plUsd >= 0;

                  return (
                    <tr key={stock.id} className="hover:bg-slate-800/40 transition">
                      
                      {/* Ticker & Name */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-100 font-mono">
                            {stock.ticker}
                          </span>
                          <span className="text-xs text-slate-400 truncate max-w-[140px]">
                            {stock.name}
                          </span>
                        </div>
                        {stock.notes && (
                          <div className="text-[10px] text-slate-500 mt-0.5">{stock.notes}</div>
                        )}
                      </td>

                      {/* Shares */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-200">
                        {stock.shares.toLocaleString()}
                      </td>

                      {/* Avg Cost */}
                      <td className="py-3.5 px-4 text-right text-slate-300">
                        ${stock.avgCostUsd.toFixed(2)}
                      </td>

                      {/* Current Price */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-emerald-400">
                          ${stock.currentPriceUsd.toFixed(2)}
                        </span>
                      </td>

                      {/* Current Value in USD & Kip */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-100">
                          ${valUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ≈ ₭{(valUsd * rateUsdLak).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                      </td>

                      {/* P/L */}
                      <td className="py-3.5 px-4 text-right">
                        <div className={`font-bold flex items-center justify-end gap-1 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          <span>{isPos ? '+' : ''}${plUsd.toFixed(2)}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatPercent(plPct, true)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() =>
                              setEditingPriceStock({
                                id: stock.id,
                                ticker: stock.ticker,
                                price: stock.currentPriceUsd,
                              })
                            }
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
                            title="Update Price"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (await askConfirm(t.confirmDelete)) {
                                removeStock(stock.id);
                              }
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-red-950/60 rounded-lg text-slate-400 hover:text-red-400 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>{t.addPosition}</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Ticker (e.g. AAPL, NVDA, TSLA)*</label>
                <input
                  type="text"
                  required
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 uppercase font-mono font-bold focus:outline-none focus:border-emerald-500"
                  placeholder="NVDA"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Company Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  placeholder="NVIDIA Corporation"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">{t.shares}*</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="5.0"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Purchase Price ($ USD)*</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={avgCostUsd}
                    onChange={(e) => setAvgCostUsd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="120.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Current Price ($ USD) (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentPriceUsd}
                  onChange={(e) => setCurrentPriceUsd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="Leave empty to use purchase price"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">{t.notes}</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. AI semiconductor growth"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl shadow-lg transition"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      {editingPriceStock && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-2 font-mono">
              Update Price: {editingPriceStock.ticker}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter current price in USD ($) from your broker or Yahoo Finance:
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Current Price ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={editingPriceStock.price}
                  onChange={(e) =>
                    setEditingPriceStock({
                      ...editingPriceStock,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-950 border border-emerald-500 rounded-xl px-3 py-2 text-lg font-mono font-bold text-emerald-400 focus:outline-none"
                />
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  ≈ ₭{(editingPriceStock.price * rateUsdLak).toLocaleString()} Kip
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => setEditingPriceStock(null)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 transition"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleUpdatePrice}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg transition"
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
