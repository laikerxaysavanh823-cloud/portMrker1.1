import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { isClaudeArtifact } from '../utils/platform';
import {
  RefreshCw,
  X,
  Save,
  DollarSign,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Wifi,
  AlertTriangle,
} from 'lucide-react';

interface ExchangeRatesModalProps {
  onClose: () => void;
}

export const ExchangeRatesModal: React.FC<ExchangeRatesModalProps> = ({ onClose }) => {
  const { state, updateRates, settings, updateSettings, refreshMarketRates } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;

  const [usdLak, setUsdLak] = useState(state.rates.usdLak.toString());
  const [usdThb, setUsdThb] = useState(state.rates.usdThb.toString());
  const [btcUsd, setBtcUsd] = useState(state.rates.btcUsd.toString());
  const [goldUsd, setGoldUsd] = useState(state.rates.goldUsdPerGram.toString());
  const [sourceName, setSourceName] = useState(state.rates.sourceName || 'BCEL / Market Rates');

  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [fetchErrors, setFetchErrors] = useState<string[]>([]);

  // Fetch live prices into the form only — the user reviews them and presses Save
  const handleFetchLive = async () => {
    setFetchState('loading');
    const fetched = await refreshMarketRates({ apply: false });
    if (fetched.usdLak) setUsdLak(String(fetched.usdLak));
    if (fetched.usdThb) setUsdThb(String(fetched.usdThb));
    if (fetched.btcUsd) setBtcUsd(String(Math.round(fetched.btcUsd * 100) / 100));
    if (fetched.goldUsdPerGram) setGoldUsd(String(fetched.goldUsdPerGram));
    if (fetched.usdLak) setSourceName('open.er-api.com / CoinGecko');
    const gotAny = !!(fetched.usdLak || fetched.usdThb || fetched.btcUsd || fetched.goldUsdPerGram);
    setFetchErrors(fetched.errors);
    setFetchState(gotAny ? 'ok' : 'error');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateRates({
      usdLak: parseFloat(usdLak) || state.rates.usdLak,
      usdThb: parseFloat(usdThb) || state.rates.usdThb,
      btcUsd: parseFloat(btcUsd) || state.rates.btcUsd,
      goldUsdPerGram: parseFloat(goldUsd) || state.rates.goldUsdPerGram,
      sourceName: sourceName.trim(),
    });
    onClose();
  };

  const applyPreset = (preset: { lak: number; thb: number }) => {
    setUsdLak(preset.lak.toString());
    setUsdThb(preset.thb.toString());
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-slate-100">
              {t.changeRates} (Exchange Rates Engine)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 mt-4 text-xs font-mono">

          {/* Live Prices (outside price APIs are unreachable on claude.ai) */}
          {isClaudeArtifact ? (
            <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-sans">
              {t.livePricesUnavailable}
            </p>
          ) : (
          <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/50 space-y-2.5 font-sans">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleFetchLive}
                disabled={fetchState === 'loading'}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition"
              >
                <Wifi className={`w-3.5 h-3.5 ${fetchState === 'loading' ? 'animate-pulse' : ''}`} />
                <span>{fetchState === 'loading' ? t.fetchingPrices : t.fetchLivePrices}</span>
              </button>
              <span className="text-[10px] text-slate-400 font-mono">
                {t.lastUpdatedAt}: {new Date(state.rates.lastUpdated).toLocaleString()}
              </span>
            </div>

            {fetchState === 'ok' && (
              <div className="flex items-start space-x-1.5 text-emerald-300 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  {t.pricesFetched}
                  {fetchErrors.length > 0 && (
                    <span className="text-amber-300"> ({t.pricesFetchFailed}: {fetchErrors.join(', ')})</span>
                  )}
                </span>
              </div>
            )}
            {fetchState === 'error' && (
              <div className="flex items-start space-x-1.5 text-rose-300 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{t.pricesFetchFailed}: {fetchErrors.join(', ')}</span>
              </div>
            )}

            <label className="flex items-center space-x-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoRefreshRates}
                onChange={(e) => updateSettings({ autoRefreshRates: e.target.checked })}
                className="accent-emerald-500"
              />
              <span>{t.autoRefreshRates}</span>
            </label>
            <label className="flex items-start space-x-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoRefreshFx}
                disabled={!settings.autoRefreshRates}
                onChange={(e) => updateSettings({ autoRefreshFx: e.target.checked })}
                className="accent-emerald-500 mt-0.5"
              />
              <span>
                {t.autoRefreshFx}
                <span className="block text-[10px] text-slate-500">{t.autoRefreshFxHint}</span>
              </span>
            </label>
          </div>
          )}

          {/* Quick Presets */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-2 text-[11px]">
              {state.language === 'lo' ? 'ເລືອກອັດຕາແລກປ່ຽນດ່ວນ:' : 'เลือกอัตราแลกเปลี่ยนด่วน:'}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset({ lak: 22500, thb: 34.5 })}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] transition"
              >
                Standard (₭22,500 / ฿34.50)
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ lak: 23000, thb: 35.0 })}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] transition"
              >
                Market High (₭23,000 / ฿35.00)
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ lak: 22000, thb: 34.0 })}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] transition"
              >
                Bank Mid (₭22,000 / ฿34.00)
              </button>
            </div>
          </div>

          {/* USD to LAK Rate */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
              <span>1 USD in Lao Kip (₭ LAK)*</span>
              <span className="text-amber-400">USD → LAK</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                required
                value={usdLak}
                onChange={(e) => setUsdLak(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/60 rounded-xl px-3 py-2.5 text-base font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="absolute right-3 top-3 text-slate-500">₭ / $</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              {state.language === 'lo'
                ? 'ອັດຕາແລກປ່ຽນຫຼັກທີ່ໃຊ້ແປງຮຸ້ນ, ກອງທຶນ ແລະ ບິດຄອຍເປັນເງິນກີບ'
                : 'อัตราแลกเปลี่ยนหลักที่ใช้แปลงหุ้น, กองทุน และบิตคอยน์เป็นเงินกีบ'}
            </p>
          </div>

          {/* USD to THB Rate */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
              <span>1 USD in Thai Baht (฿ THB)*</span>
              <span className="text-slate-400">USD → THB</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={usdThb}
              onChange={(e) => setUsdThb(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Bitcoin Price */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">Bitcoin Price ($ USD)*</label>
              <input
                type="number"
                step="0.01"
                required
                value={btcUsd}
                onChange={(e) => setBtcUsd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-orange-400 font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Gold Price */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">Gold ($/gram)*</label>
              <input
                type="number"
                step="0.01"
                required
                value={goldUsd}
                onChange={(e) => setGoldUsd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Rate Source Name / Notes</label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-sans focus:outline-none focus:border-amber-500"
              placeholder="e.g. BCEL Mid-Market Rate"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 font-sans transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg font-sans transition"
            >
              <Save className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
