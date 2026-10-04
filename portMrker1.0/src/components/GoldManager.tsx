import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  Coins,
  ShieldCheck,
  Edit2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Save,
} from 'lucide-react';

export const GoldManager: React.FC = () => {
  const { state, totals, updateGoldHoldings, updateRates } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const rateUsdLak = state.rates.usdLak;
  const gold = state.holdings.gold;

  const [isEditing, setIsEditing] = useState(false);
  const [gramsInput, setGramsInput] = useState(gold.grams.toString());
  const [costInput, setCostInput] = useState(gold.avgCostUsdPerGram.toString());
  const [notesInput, setNotesInput] = useState(gold.notes || '');

  const [goldRateInput, setGoldRateInput] = useState(state.rates.goldUsdPerGram.toString());
  const [showGoldRateModal, setShowGoldRateModal] = useState(false);

  const grams = gold.grams;
  const bahtGold = grams / 15.244; // 1 Baht of gold weight ≈ 15.244 grams
  const currentSpotUsdPerGram = state.rates.goldUsdPerGram;
  const currentSpotUsdPerBaht = currentSpotUsdPerGram * 15.244;
  const currentSpotLakPerBaht = currentSpotUsdPerBaht * rateUsdLak;

  const totalValueUsd = totals.goldValueUsd;
  const totalValueLak = totals.goldValueLak;
  const totalCostUsd = totals.goldCostUsd;
  const totalCostLak = totals.goldCostLak;
  const plUsd = totalValueUsd - totalCostUsd;
  const plPct = totalCostUsd > 0 ? (plUsd / totalCostUsd) * 100 : 0;
  const isPos = plUsd >= 0;

  const handleSave = () => {
    const g = parseFloat(gramsInput) || 0;
    const c = parseFloat(costInput) || 0;
    updateGoldHoldings(g, c);
    setIsEditing(false);
  };

  const handleSaveGoldRate = () => {
    const r = parseFloat(goldRateInput) || currentSpotUsdPerGram;
    updateRates({ goldUsdPerGram: r });
    setShowGoldRateModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>{t.gold}</span>
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-amber-950 text-amber-400 border border-amber-800/40">
                Gold Bullion (ກຣາມ / ບາດ)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {state.language === 'lo'
                ? 'ຄິດໄລ່ທັງນ້ຳໜັກເປັນ ກຣາມ (g) ແລະ ບາດຄຳ (1 ບາດ ≈ 15.244 g), ປຽບທຽບມູນຄ່າເປັນ USD ແລະ ກີບ'
                : 'คำนวณทั้งน้ำหนักเป็น กรัม (g) และ บาททอง (1 บาท ≈ 15.244 g), เปรียบเทียบมูลค่าเป็น USD และ กีบ'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setGoldRateInput(currentSpotUsdPerGram.toString());
                setShowGoldRateModal(true);
              }}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl border border-slate-700 font-mono transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Gold Spot: ${currentSpotUsdPerGram.toFixed(1)}/g</span>
            </button>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs px-4 py-2 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition"
              >
                <Edit2 className="w-4 h-4 text-slate-950" />
                <span>{state.language === 'lo' ? 'ປັບຈຳນວນຄຳ' : 'ปรับจำนวนทอง'}</span>
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-xl font-bold shadow-lg transition"
              >
                <Save className="w-4 h-4" />
                <span>{t.save}</span>
              </button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-5">
          
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {state.language === 'lo' ? 'ນ້ຳໜັກຄຳທີ່ຖືຄອງ' : 'น้ำหนักทองที่ถือครอง'}
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300">
              {grams.toFixed(1)} g
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              ≈ {bahtGold.toFixed(2)} {state.language === 'lo' ? 'ບາດຄຳ' : 'บาททอง'}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {t.avgCost} ($/g)
            </div>
            <div className="text-2xl font-bold font-mono text-slate-200">
              ${gold.avgCostUsdPerGram.toFixed(1)}/g
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              ≈ ₭{(gold.avgCostUsdPerGram * 15.244 * rateUsdLak).toLocaleString('en-US', { maximumFractionDigits: 0 })} / ບາດ
            </div>
          </div>

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

      {/* Gold Adjuster Form if editing */}
      {isEditing && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-amber-300">
            {state.language === 'lo' ? 'ແກ້ໄຂນ້ຳໜັກຄຳ ແລະ ຕົ້ນທຶນ' : 'แก้ไขน้ำหนักทองและต้นทุน'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Total Grams Held (g)*</label>
              <input
                type="number"
                step="0.01"
                value={gramsInput}
                onChange={(e) => setGramsInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
              />
              <div className="text-[11px] text-slate-400 mt-1">
                ≈ {((parseFloat(gramsInput) || 0) / 15.244).toFixed(2)} ບາດ (1 ບາດ = 15.244 g)
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Avg Purchase Price ($ USD / gram)*</label>
              <input
                type="number"
                step="0.01"
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
              />
              <div className="text-[11px] text-slate-400 mt-1">
                ≈ ₭{(((parseFloat(costInput) || 0) * 15.244) * rateUsdLak).toLocaleString()} / ບາດ
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs"
            >
              {t.save}
            </button>
          </div>
        </div>
      )}

      {/* Gold Market Reference Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="font-bold text-sm text-slate-200 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>
            {state.language === 'lo' ? 'ຕາຕະລາງອ້າງອີງລາຄາຄຳ' : 'ตารางอ้างอิงราคาทอง'}
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400">Spot Rate / Gram:</span>
            <div className="text-base font-bold text-amber-300 mt-0.5">
              ${currentSpotUsdPerGram.toFixed(2)} USD
            </div>
            <div className="text-[11px] text-slate-500">
              ≈ ₭{(currentSpotUsdPerGram * rateUsdLak).toLocaleString()} / g
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400">Spot Rate / 1 ບາດຄຳ (15.244g):</span>
            <div className="text-base font-bold text-amber-300 mt-0.5">
              ${currentSpotUsdPerBaht.toFixed(2)} USD
            </div>
            <div className="text-[11px] text-slate-500">
              ≈ ₭{currentSpotLakPerBaht.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400">Gold Oz (31.1035g):</span>
            <div className="text-base font-bold text-amber-300 mt-0.5">
              ${(currentSpotUsdPerGram * 31.1035).toFixed(1)} USD
            </div>
            <div className="text-[11px] text-slate-500">
              International Troy Ounce Spot
            </div>
          </div>
        </div>
      </div>

      {/* Gold Spot Modal */}
      {showGoldRateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-2 font-mono flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Update Gold Spot Rate</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter current Gold price per gram in USD ($):
            </p>

            <div className="space-y-4">
              <div>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={goldRateInput}
                  onChange={(e) => setGoldRateInput(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500 rounded-xl px-3 py-2 text-lg font-mono font-bold text-amber-300 focus:outline-none"
                />
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  ≈ ₭{(((parseFloat(goldRateInput) || 0) * 15.244) * rateUsdLak).toLocaleString()} Kip / ບາດ
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => setShowGoldRateModal(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 transition"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSaveGoldRate}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg transition"
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
