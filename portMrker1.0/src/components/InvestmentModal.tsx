import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import {
  TrendingUp,
  X,
  Plus,
  DollarSign,
  Coins,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { notify } from '../utils/platform';

interface InvestmentModalProps {
  monthKey: string;
  onClose: () => void;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({ monthKey, onClose }) => {
  const { state, addInvestment, settings, customCategories } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const rateUsdLak = state.rates.usdLak;
  const hidden = settings.hiddenCategories || [];

  // Built-in asset types the user has switched on, then the user's own categories
  const builtinChoices = [
    { id: 'stock', key: 'stocks', label: 'US Stock', defaultName: 'NVDA' },
    { id: 'etf', key: 'funds', label: 'ETF Fund', defaultName: 'VOO' },
    { id: 'btc', key: 'btc', label: 'Bitcoin', defaultName: 'Bitcoin (BTC)' },
    { id: 'gold', key: 'gold', label: 'Gold', defaultName: 'Gold (ຄຳແທ່ງ)' },
  ].filter((c) => !hidden.includes(c.key as any));
  const choices = [
    ...builtinChoices.map((c) => ({ id: c.id, label: c.label, defaultName: c.defaultName })),
    ...customCategories.map((c) => ({ id: 'custom:' + c.id, label: c.name, defaultName: c.name })),
  ];

  const [assetType, setAssetType] = useState<string>(choices[0]?.id || 'stock');
  const [assetName, setAssetName] = useState(choices[0]?.defaultName || 'NVDA');

  const customCat = assetType.startsWith('custom:')
    ? customCategories.find((c) => 'custom:' + c.id === assetType)
    : undefined;
  const inLak = customCat?.currency === 'LAK';
  const [amountUsd, setAmountUsd] = useState('');
  const [sharesOrUnits, setSharesOrUnits] = useState('');
  const [unitPriceUsd, setUnitPriceUsd] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [syncToPortfolio, setSyncToPortfolio] = useState(true);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = parseFloat(amountUsd) || 0;
    if (entered <= 0) {
      notify('ກະລຸນາປ້ອນຈຳນວນເງິນ / กรุณากรอกจำนวนเงิน');
      return;
    }
    // Investments are stored in USD with the rate used; a ₭ category is converted
    const usd = inLak ? entered / rateUsdLak : entered;

    if (customCat) {
      addInvestment(monthKey, {
        assetType: 'custom',
        customCategoryId: customCat.id,
        assetName: assetName.trim(),
        amountUsd: usd,
        rateUsed: rateUsdLak,
        date,
        note: note.trim(),
      });
      onClose();
      return;
    }

    const uCount = parseFloat(sharesOrUnits) || undefined;
    const uPrice = parseFloat(unitPriceUsd) || (uCount ? usd / uCount : undefined);

    addInvestment(
      monthKey,
      {
        assetType: assetType as 'stock' | 'etf' | 'btc' | 'gold',
        assetName: assetName.trim(),
        amountUsd: usd,
        rateUsed: rateUsdLak,
        date,
        sharesOrUnits: uCount,
        unitPriceUsd: uPrice,
        note: note.trim(),
      },
      { syncToPortfolio }
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-slate-100">
              {t.addInvestment} ({monthKey})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          
          {/* Asset Category Selection */}
          <div>
            <label className="block text-slate-400 font-mono mb-1">Asset Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono">
              {choices.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setAssetType(item.id);
                    setAssetName(item.defaultName);
                  }}
                  className={`py-1.5 px-2 rounded-lg border text-center transition truncate ${
                    assetType === item.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">Ticker / Asset Name*</label>
            <input
              type="text"
              required
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
              placeholder="e.g. AAPL, VOO, BTC..."
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold font-mono mb-1 flex items-center justify-between">
              <span>{inLak ? 'Amount (₭ LAK)*' : 'Invested Amount ($ USD)*'}</span>
              <span className="text-amber-400 font-mono">{inLak ? 'LAK' : 'USD → LAK'}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/60 rounded-xl px-3 py-2.5 text-base font-bold font-mono text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder={inLak ? '1000000' : '100.00'}
              />
              <span className="absolute right-3 top-3 text-slate-500 font-mono">{inLak ? '₭ LAK' : '$ USD'}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              {inLak
                ? `≈ $${((parseFloat(amountUsd) || 0) / rateUsdLak).toFixed(2)} USD`
                : `≈ ₭${((parseFloat(amountUsd) || 0) * rateUsdLak).toLocaleString()} Kip (@ ₭${rateUsdLak.toLocaleString()})`}
            </div>
          </div>

          {!customCat && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono mb-1">Shares/Units (optional)</label>
              <input
                type="number"
                step="0.00000001"
                value={sharesOrUnits}
                onChange={(e) => setSharesOrUnits(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                placeholder="e.g. 0.85"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono mb-1">Price / Unit ($ USD)</label>
              <input
                type="number"
                step="0.01"
                value={unitPriceUsd}
                onChange={(e) => setUnitPriceUsd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                placeholder="e.g. 120.00"
              />
            </div>
          </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono mb-1">{t.date}</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono mb-1">{t.notes}</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                placeholder="e.g. Monthly DCA"
              />
            </div>
          </div>

          {/* Sync to Portfolio Checkbox (own categories have no portfolio holdings) */}
          {!customCat && (
          <label className="flex items-center space-x-2 text-slate-300 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={syncToPortfolio}
              onChange={(e) => setSyncToPortfolio(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <span>
              {state.language === 'lo'
                ? 'ອັບເດດຍອດຖືຄອງໃນພອດການລົງທຶນນຳ'
                : 'อัปเดตยอดถือครองในพอร์ตการลงทุนด้วย'}
            </span>
          </label>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg transition"
            >
              {t.save}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
