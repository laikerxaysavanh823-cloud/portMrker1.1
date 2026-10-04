import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import {
  Zap,
  X,
  Utensils,
  TrendingUp,
  DollarSign,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { notify } from '../utils/platform';

interface QuickAddModalProps {
  initialType?: 'expense' | 'investment';
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  initialType = 'investment',
  onClose,
}) => {
  const { state, addExpense, addInvestment } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const rateUsdLak = state.rates.usdLak;

  const [activeType, setActiveType] = useState<'expense' | 'investment'>(initialType);

  // Expense State
  const [expCategory, setExpCategory] = useState('Food & Groceries (ຄ່າອາຫານ)');
  const [expAmountLak, setExpAmountLak] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expNote, setExpNote] = useState('');

  // Investment State
  const [assetType, setAssetType] = useState<'stock' | 'etf' | 'btc' | 'gold'>('stock');
  const [assetName, setAssetName] = useState('NVDA');
  const [amountUsd, setAmountUsd] = useState('');
  const [unitsCount, setUnitsCount] = useState('');
  const [unitPriceUsd, setUnitPriceUsd] = useState('');
  const [invDate, setInvDate] = useState(new Date().toISOString().slice(0, 10));
  const [syncToPortfolio, setSyncToPortfolio] = useState(true);
  const [invNote, setInvNote] = useState('');

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expAmountLak) || 0;
    if (amt <= 0) {
      notify('ກະລຸນາປ້ອນຈຳນວນເງິນ / กรุณากรอกจำนวนเงิน');
      return;
    }

    addExpense(state.selectedMonth, {
      category: expCategory,
      amountLak: amt,
      date: expDate,
      note: expNote.trim(),
    });

    onClose();
  };

  const handleInvestmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const usd = parseFloat(amountUsd) || 0;
    if (usd <= 0) {
      notify('ກະລຸນາປ້ອນຈຳນວນເງິນ USD / กรุณากรอกจำนวนเงิน USD');
      return;
    }

    const uCount = parseFloat(unitsCount) || undefined;
    const uPrice = parseFloat(unitPriceUsd) || (uCount ? usd / uCount : undefined);

    addInvestment(
      state.selectedMonth,
      {
        assetType,
        assetName: assetName.trim(),
        amountUsd: usd,
        rateUsed: rateUsdLak,
        date: invDate,
        sharesOrUnits: uCount,
        unitPriceUsd: uPrice,
        note: invNote.trim(),
      },
      { syncToPortfolio }
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header & Close */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-slate-100">
              {state.language === 'lo' ? 'ບັນທຶກດ່ວນ' : 'บันทึกด่วน'} ({state.selectedMonth})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Expense (LAK) vs Investment (USD -> LAK) */}
        <div className="grid grid-cols-2 gap-2 my-4 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveType('investment')}
            className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              activeType === 'investment'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t.addInvestment}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('expense')}
            className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              activeType === 'expense'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>{t.addExpense}</span>
          </button>
        </div>

        {/* INVESTMENT FORM (in USD with auto LAK display) */}
        {activeType === 'investment' && (
          <form onSubmit={handleInvestmentSubmit} className="space-y-3.5 text-xs">
            
            {/* Asset Class Selector */}
            <div>
              <label className="block text-slate-400 font-mono mb-1">Asset Category</label>
              <div className="grid grid-cols-4 gap-1.5 font-mono">
                {[
                  { id: 'stock', label: 'US Stock', icon: TrendingUp },
                  { id: 'etf', label: 'ETF Fund', icon: DollarSign },
                  { id: 'btc', label: 'Bitcoin', icon: Coins },
                  { id: 'gold', label: 'Gold', icon: ShieldCheck },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setAssetType(item.id as any);
                      if (item.id === 'btc') setAssetName('Bitcoin (BTC)');
                      else if (item.id === 'etf') setAssetName('VOO');
                      else if (item.id === 'gold') setAssetName('Gold (ຄຳແທ່ງ)');
                      else setAssetName('NVDA');
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-center transition ${
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

            {/* Asset Name / Ticker */}
            <div>
              <label className="block text-slate-400 font-mono mb-1">Ticker / Asset Name*</label>
              <input
                type="text"
                required
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                placeholder="NVDA, AAPL, VOO, BTC..."
              />
            </div>

            {/* Amount in USD */}
            <div>
              <label className="block text-slate-300 font-bold font-mono mb-1 flex items-center justify-between">
                <span>Invested Amount ($ USD)*</span>
                <span className="text-amber-400 font-mono">USD → LAK</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/60 rounded-xl px-3 py-2.5 text-base font-bold font-mono text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="100.00"
                />
                <span className="absolute right-3 top-3 text-slate-500 font-mono">$ USD</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-1">
                ≈ ₭{((parseFloat(amountUsd) || 0) * rateUsdLak).toLocaleString()} Kip (@ ₭{rateUsdLak.toLocaleString()})
              </div>
            </div>

            {/* Optional Units & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Shares/Units (optional)</label>
                <input
                  type="number"
                  step="0.00000001"
                  value={unitsCount}
                  onChange={(e) => setUnitsCount(e.target.value)}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-mono mb-1">{t.date}</label>
                <input
                  type="date"
                  required
                  value={invDate}
                  onChange={(e) => setInvDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">{t.notes}</label>
                <input
                  type="text"
                  value={invNote}
                  onChange={(e) => setInvNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  placeholder="e.g. Monthly DCA"
                />
              </div>
            </div>

            {/* Sync to Portfolio Checkbox */}
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
        )}

        {/* EXPENSE FORM (in Lao Kip) */}
        {activeType === 'expense' && (
          <form onSubmit={handleExpenseSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-400 font-mono mb-1">Expense Category*</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Food & Groceries (ຄ່າອາຫານ)">Food & Groceries (ຄ່າອາຫານ)</option>
                <option value="Utilities & Bills (ຄ່ານ້ຳ-ຄ່າໄຟ)">Utilities & Bills (ຄ່ານ້ຳ-ຄ່າໄຟ)</option>
                <option value="Transportation (ຄ່ານ້ຳມັນ/ເດີນທາງ)">Transportation (ຄ່ານ້ຳມັນ/ເດີນທາງ)</option>
                <option value="Rent & Housing (ຄ່າເຊົ່າບ້ານ)">Rent & Housing (ຄ່າເຊົ່າບ້ານ)</option>
                <option value="Shopping & Personal (ຊື້ເຄື່ອງໃຊ້)">Shopping & Personal (ຊື້ເຄື່ອງໃຊ້)</option>
                <option value="Healthcare & Family (ສຸຂະພາບ/ຄອບຄົວ)">Healthcare & Family (ສຸຂະພາບ/ຄອບຄົວ)</option>
                <option value="Other Expenses (ອື່ນໆ)">Other Expenses (ອື່ນໆ)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold font-mono mb-1">Amount (₭ LAK)*</label>
              <input
                type="number"
                step="1000"
                required
                value={expAmountLak}
                onChange={(e) => setExpAmountLak(e.target.value)}
                className="w-full bg-slate-950 border border-blue-500/60 rounded-xl px-3 py-2.5 text-base font-bold font-mono text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="500000"
              />
              <div className="text-[11px] font-mono text-slate-400 mt-1">
                ≈ ${((parseFloat(expAmountLak) || 0) / rateUsdLak).toFixed(2)} USD
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-mono mb-1">{t.date}</label>
                <input
                  type="date"
                  required
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">{t.notes}</label>
                <input
                  type="text"
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  placeholder="e.g. ຊື້ເຄື່ອງຢູ່ຕະຫຼາດ"
                />
              </div>
            </div>

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
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl shadow-lg transition"
              >
                {t.save}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
