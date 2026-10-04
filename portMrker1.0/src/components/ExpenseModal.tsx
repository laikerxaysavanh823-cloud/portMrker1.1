import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { formatCurrency } from '../utils/formatters';
import { previewLivingBudget, WARNING_THRESHOLD_PCT } from '../utils/budgetAlerts';
import { Utensils, X, Plus, AlertTriangle } from 'lucide-react';
import { notify } from '../utils/platform';

interface ExpenseModalProps {
  monthKey: string;
  onClose: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ monthKey, onClose }) => {
  const { state, addExpense, currentMonthData } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const rateUsdLak = state.rates.usdLak;

  const [category, setCategory] = useState('Food & Groceries (ຄ່າອາຫານ)');
  const [amountLak, setAmountLak] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  const month = state.months[monthKey] || currentMonthData;
  const enteredAmount = parseFloat(amountLak) || 0;
  const preview = previewLivingBudget(month, enteredAmount);
  const willExceed = enteredAmount > 0 && preview.planned > 0 && preview.pctUsed > 100;
  const nearLimit = enteredAmount > 0 && !willExceed && preview.pctUsed >= WARNING_THRESHOLD_PCT;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountLak) || 0;
    if (amt <= 0) {
      notify('ກະລຸນາປ້ອນຈຳນວນເງິນ / กรุณากรอกจำนวนเงิน');
      return;
    }

    addExpense(monthKey, {
      category,
      amountLak: amt,
      date,
      note: note.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Utensils className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-slate-100">
              {t.addExpense} ({monthKey})
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
          <div>
            <label className="block text-slate-400 font-mono mb-1">Expense Category*</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
              value={amountLak}
              onChange={(e) => setAmountLak(e.target.value)}
              className="w-full bg-slate-950 border border-blue-500/60 rounded-xl px-3 py-2.5 text-base font-bold font-mono text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="500000"
            />
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              ≈ ${((parseFloat(amountLak) || 0) / rateUsdLak).toFixed(2)} USD
            </div>

            {enteredAmount > 0 && preview.planned > 0 && (
              <div
                className={`mt-2 rounded-lg px-3 py-2 text-[11px] border ${
                  willExceed
                    ? 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                    : nearLimit
                    ? 'bg-amber-950/30 border-amber-700/50 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {willExceed && (
                  <div className="flex items-center space-x-1.5 font-bold mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t.expenseWillExceed}</span>
                  </div>
                )}
                <div className="font-mono">
                  {t.budgetAfterThis} {Math.round(preview.pctUsed)}% (
                  {formatCurrency(preview.actual, 'LAK')} / {formatCurrency(preview.planned, 'LAK')})
                  {willExceed && ` · +${formatCurrency(-preview.remaining, 'LAK')}`}
                </div>
              </div>
            )}
          </div>

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
                placeholder="e.g. ຊື້ເຄື່ອງໃຊ້ຄົວເຮືອນ"
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

      </div>
    </div>
  );
};
