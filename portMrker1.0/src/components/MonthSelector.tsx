import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { formatCurrency, formatMonthLabel } from '../utils/formatters';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface MonthSelectorProps {
  onOpenNewMonthModal: () => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ onOpenNewMonthModal }) => {
  const { state, setSelectedMonth, monthlySummary } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;

  // Get sorted list of months
  const availableMonths = Object.keys(state.months).sort((a, b) => b.localeCompare(a));

  const handlePrev = () => {
    const idx = availableMonths.indexOf(state.selectedMonth);
    if (idx < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[idx + 1]);
    }
  };

  const handleNext = () => {
    const idx = availableMonths.indexOf(state.selectedMonth);
    if (idx > 0) {
      setSelectedMonth(availableMonths[idx - 1]);
    }
  };

  const currentIdx = availableMonths.indexOf(state.selectedMonth);
  const hasPrev = currentIdx < availableMonths.length - 1;
  const hasNext = currentIdx > 0;

  const isOverBudget = monthlySummary.remainingBudgetLak < 0;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Month selection pills & navigation buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              title="Previous Month"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5 px-3 py-1 font-semibold text-sm text-amber-300">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{formatMonthLabel(state.selectedMonth, state.language)}</span>
            </div>

            <button
              onClick={handleNext}
              disabled={!hasNext}
              title="Next Month"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick list of all available months as pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-1">
            {availableMonths.map((mKey) => (
              <button
                key={mKey}
                onClick={() => setSelectedMonth(mKey)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                  state.selectedMonth === mKey
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {mKey}
              </button>
            ))}
          </div>

          {/* New Month button */}
          <button
            onClick={onOpenNewMonthModal}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 font-medium transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.newMonth}</span>
          </button>
        </div>

        {/* Right: Monthly Status summary pills */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          
          {/* Income badge */}
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 mr-1.5">
              {state.language === 'lo' ? 'ລາຍຮັບເດືອນ:' : 'รายได้เดือน:'}
            </span>
            <strong className="text-emerald-400 font-semibold">
              {formatCurrency(monthlySummary.incomeLak, 'LAK')}
            </strong>
          </div>

          {/* Planned Investments in USD & LAK */}
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 mr-1.5">
              {state.language === 'lo' ? 'ເປົ້າລົງທຶນ:' : 'เป้าลงทุน:'}
            </span>
            <strong className="text-amber-400 font-semibold">
              ${monthlySummary.plannedInvestmentsUsd.toLocaleString()} USD
            </strong>
            <span className="text-slate-400 text-[11px] ml-1">
              (≈ ₭{monthlySummary.plannedInvestmentsLak.toLocaleString()})
            </span>
          </div>

          {/* Remaining Balance */}
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 ${
              isOverBudget
                ? 'bg-red-950/40 border-red-800/60 text-red-400'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
            }`}
          >
            {isOverBudget ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>
              {state.language === 'lo' ? 'ເຫຼືອງົບ:' : 'เหลืองบ:'}{' '}
              <strong>{formatCurrency(monthlySummary.remainingBudgetLak, 'LAK')}</strong>
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
