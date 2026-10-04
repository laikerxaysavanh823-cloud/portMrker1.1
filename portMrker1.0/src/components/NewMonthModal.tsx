import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, MONTH_NAMES } from '../utils/translations';
import { Calendar, Plus, X, Copy, Sparkles } from 'lucide-react';
import { notify } from '../utils/platform';

interface NewMonthModalProps {
  onClose: () => void;
}

export const NewMonthModal: React.FC<NewMonthModalProps> = ({ onClose }) => {
  const { state, createNewMonth } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const defaultYear = nextMonth.getFullYear().toString();
  const defaultMonth = String(nextMonth.getMonth() + 1).padStart(2, '0');

  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [copyFromPrev, setCopyFromPrev] = useState(true);

  const monthKey = `${year}-${month}`;
  const monthExists = Boolean(state.months[monthKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (monthExists) {
      notify(
        state.language === 'lo'
          ? 'ເດືອນນີ້ມີຢູ່ໃນລະບົບແລ້ວ / เดือนนี้มีอยู่ในระบบแล้ว'
          : 'This month already exists'
      );
      return;
    }

    createNewMonth(monthKey, copyFromPrev);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-slate-100">{t.newMonth}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          
          {/* Year & Month Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono mb-1">Year (ປີ / ปี)*</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm font-bold focus:outline-none focus:border-amber-500"
              >
                {['2025', '2026', '2027', '2028'].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-mono mb-1">Month (ເດືອນ / เดือน)*</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm font-bold focus:outline-none focus:border-amber-500"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const mStr = String(i + 1).padStart(2, '0');
                  const mLabel = (MONTH_NAMES[state.language] || MONTH_NAMES.lo)[i];
                  return (
                    <option key={mStr} value={mStr}>
                      {mLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Month Key Preview */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-mono">Selected Month ID:</span>
            <span className="font-mono font-bold text-amber-300 text-sm">{monthKey}</span>
          </div>

          {monthExists && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-400 font-mono">
              {state.language === 'lo'
                ? `ເດືອນ ${monthKey} ມີຢູ່ແລ້ວ`
                : `เดือน ${monthKey} มีอยู่แล้ว`}
            </div>
          )}

          {/* Copy from previous month option */}
          <label className="flex items-start space-x-2.5 p-3 bg-slate-950/80 rounded-xl border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={copyFromPrev}
              onChange={(e) => setCopyFromPrev(e.target.checked)}
              className="mt-0.5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <div>
              <span className="font-semibold text-slate-200 block">{t.copyPrevMonth}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {state.language === 'lo'
                  ? 'ຄັດລອກສັດສ່ວນງົບປະມານ ແລະ ລາຍຮັບຈາກເດືອນທີ່ເລືອກຢູ່ປັດຈຸບັນ'
                  : 'คัดลอกสัดส่วนงบประมาณและรายได้จากเดือนที่เลือกอยู่ปัจจุบัน'}
              </span>
            </div>
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
              disabled={monthExists}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
