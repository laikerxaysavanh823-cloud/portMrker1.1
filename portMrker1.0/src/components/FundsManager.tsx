import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from 'lucide-react';
import { askConfirm, notify } from '../utils/platform';

export const FundsManager: React.FC = () => {
  const { state, totals, addEtf, updateEtfPrice, removeEtf } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const rateUsdLak = state.rates.usdLak;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPriceEtf, setEditingPriceEtf] = useState<{ id: string; name: string; price: number } | null>(null);

  // Form state
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [units, setUnits] = useState('');
  const [avgCostUsd, setAvgCostUsd] = useState('');
  const [currentPriceUsd, setCurrentPriceUsd] = useState('');
  const [category, setCategory] = useState<'index_etf' | 'tech_etf' | 'dividend' | 'bond' | 'other'>('index_etf');
  const [notes, setNotes] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !units || !avgCostUsd) {
      notify('ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ / กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    const curPrice = parseFloat(currentPriceUsd) || parseFloat(avgCostUsd);

    addEtf({
      ticker: ticker.toUpperCase().trim(),
      name: name.trim() || ticker.toUpperCase().trim(),
      units: parseFloat(units) || 0,
      avgCostUsd: parseFloat(avgCostUsd) || 0,
      currentPriceUsd: curPrice,
      category,
      notes: notes.trim(),
    });

    setTicker('');
    setName('');
    setUnits('');
    setAvgCostUsd('');
    setCurrentPriceUsd('');
    setNotes('');
    setShowAddModal(false);
  };

  const handleUpdatePrice = () => {
    if (editingPriceEtf) {
      updateEtfPrice(editingPriceEtf.id, editingPriceEtf.price);
      setEditingPriceEtf(null);
    }
  };

  const totalEtfPlUsd = totals.etfsValueUsd - totals.etfsCostUsd;
  const totalEtfPlPct = totals.etfsCostUsd > 0 ? (totalEtfPlUsd / totals.etfsCostUsd) * 100 : 0;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-400" />
                <span>{t.funds}</span>
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-teal-950 text-teal-400 border border-teal-800/40">
                USD $ → LAK ₭
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {state.language === 'lo'
                ? 'ກອງທຶນດັດຊະນີ VOO (S&P 500), QQQ (Nasdaq 100), VT ແລະ ກອງທຶນອື່ນໆ'
                : 'กองทุนดัชนี VOO (S&P 500), QQQ (Nasdaq 100), VT และกองทุนรวมอื่นๆ'}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs px-4 py-2 rounded-xl font-semibold shadow-lg shadow-teal-900/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addPosition}</span>
          </button>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {state.language === 'lo' ? 'ມູນຄ່າກອງທຶນລວມປັດຈຸບັນ' : 'มูลค่ากองทุนรวมปัจจุบัน'}
            </div>
            <div className="text-2xl font-bold font-mono text-teal-400">
              ${totals.etfsValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              ≈ ₭{totals.etfsValueLak.toLocaleString()} (@ ₭{rateUsdLak.toLocaleString()})
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {state.language === 'lo' ? 'ຕົ້ນທຶນກອງທຶນທັງໝົດ' : 'ต้นทุนกองทุนทั้งหมด'}
            </div>
            <div className="text-2xl font-bold font-mono text-slate-200">
              ${totals.etfsCostUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              ≈ ₭{totals.etfsCostLak.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {t.profitVal} (P/L)
            </div>
            <div className={`text-2xl font-bold font-mono ${totalEtfPlUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalEtfPlUsd >= 0 ? '+' : ''}${totalEtfPlUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>≈ {totalEtfPlUsd >= 0 ? '+' : ''}₭{(totalEtfPlUsd * rateUsdLak).toLocaleString()}</span>
              <strong className={totalEtfPlUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                ({formatPercent(totalEtfPlPct, true)})
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Funds Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200">
            {state.language === 'lo' ? 'ລາຍການກອງທຶນ' : 'รายการกองทุน'} ({state.holdings.etfs.length})
          </h3>
        </div>

        {state.holdings.etfs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            {state.language === 'lo' ? 'ຍັງບໍ່ມີກອງທຶນໃນພອດ' : 'ยังไม่มีกองทุนในพอร์ต'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Fund / ETF</th>
                  <th className="py-3 px-4 text-right">{t.units}</th>
                  <th className="py-3 px-4 text-right">{t.avgCost} ($)</th>
                  <th className="py-3 px-4 text-right">{t.currentPrice} ($)</th>
                  <th className="py-3 px-4 text-right">{t.currentValue} ($ & ₭)</th>
                  <th className="py-3 px-4 text-right">{t.profitVal}</th>
                  <th className="py-3 px-4 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {state.holdings.etfs.map((etf) => {
                  const valUsd = etf.units * etf.currentPriceUsd;
                  const costUsd = etf.units * etf.avgCostUsd;
                  const plUsd = valUsd - costUsd;
                  const plPct = costUsd > 0 ? (plUsd / costUsd) * 100 : 0;
                  const isPos = plUsd >= 0;

                  return (
                    <tr key={etf.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-teal-400 font-mono">
                            {etf.ticker}
                          </span>
                          <span className="text-xs text-slate-300">{etf.name}</span>
                        </div>
                        {etf.notes && (
                          <div className="text-[10px] text-slate-500 mt-0.5">{etf.notes}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-200">
                        {etf.units.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-300">
                        ${etf.avgCostUsd.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-teal-400">
                          ${etf.currentPriceUsd.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-100">
                          ${valUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ≈ ₭{(valUsd * rateUsdLak).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className={`font-bold flex items-center justify-end gap-1 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          <span>{isPos ? '+' : ''}${plUsd.toFixed(2)}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatPercent(plPct, true)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() =>
                              setEditingPriceEtf({
                                id: etf.id,
                                name: etf.name,
                                price: etf.currentPriceUsd,
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
                                removeEtf(etf.id);
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

      {/* Add ETF Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-400" />
              <span>{t.addPosition} (Fund / ETF)</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Fund Ticker/Code (e.g. VOO, QQQ, SPY)*</label>
                <input
                  type="text"
                  required
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 uppercase font-mono font-bold focus:outline-none focus:border-teal-500"
                  placeholder="VOO"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Fund Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                  placeholder="Vanguard S&P 500 ETF"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">{t.units}*</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                    placeholder="2.5"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                    placeholder="520.00"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                  placeholder="Leave empty to use purchase price"
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
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-2 rounded-xl shadow-lg transition"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      {editingPriceEtf && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-2 font-mono">
              Update Price: {editingPriceEtf.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Current Price ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={editingPriceEtf.price}
                  onChange={(e) =>
                    setEditingPriceEtf({
                      ...editingPriceEtf,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-950 border border-teal-500 rounded-xl px-3 py-2 text-lg font-mono font-bold text-teal-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => setEditingPriceEtf(null)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 transition"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleUpdatePrice}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg transition"
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
