import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { formatCurrency } from '../utils/formatters';
import {
  ShieldCheck,
  Wallet,
  Coins,
  Edit2,
  Save,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const EmergencyCashManager: React.FC = () => {
  const { state, totals, updateEmergencyFund, updateCashBalances } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;
  const rateUsdLak = state.rates.usdLak;
  const emergency = state.holdings.emergency;
  const cash = state.holdings.cash;

  // Edit Emergency State
  const [isEditingEmerg, setIsEditingEmerg] = useState(false);
  const [emergBalInput, setEmergBalInput] = useState(emergency.balanceLak.toString());
  const [targetMonthsInput, setTargetMonthsInput] = useState(emergency.targetMonths.toString());
  const [monthlyExpInput, setMonthlyExpInput] = useState(emergency.monthlyExpenseLak.toString());

  // Edit Cash State
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [cashLakInput, setCashLakInput] = useState(cash.balanceLak.toString());
  const [cashUsdInput, setCashUsdInput] = useState(cash.balanceUsd.toString());

  // Quick Deposit/Withdraw State
  const [quickAmountLak, setQuickAmountLak] = useState('');

  const targetEmergencyLak = emergency.targetMonths * emergency.monthlyExpenseLak;
  const emergCoverageMonths =
    emergency.monthlyExpenseLak > 0 ? emergency.balanceLak / emergency.monthlyExpenseLak : 0;
  const emergProgressPct =
    targetEmergencyLak > 0 ? Math.min(100, (emergency.balanceLak / targetEmergencyLak) * 100) : 0;

  const handleSaveEmerg = () => {
    updateEmergencyFund(
      parseFloat(emergBalInput) || 0,
      parseFloat(targetMonthsInput) || 6,
      parseFloat(monthlyExpInput) || 10000000
    );
    setIsEditingEmerg(false);
  };

  const handleSaveCash = () => {
    updateCashBalances(parseFloat(cashLakInput) || 0, parseFloat(cashUsdInput) || 0);
    setIsEditingCash(false);
  };

  const handleQuickEmergAction = (isDeposit: boolean) => {
    const amt = parseFloat(quickAmountLak) || 0;
    if (amt <= 0) return;
    const newBal = isDeposit
      ? emergency.balanceLak + amt
      : Math.max(0, emergency.balanceLak - amt);
    updateEmergencyFund(newBal);
    setQuickAmountLak('');
  };

  return (
    <div className="space-y-6">
      
      {/* Emergency Fund Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <span>{t.emergencyFund}</span>
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-purple-950 text-purple-400 border border-purple-800/40">
                LAK ₭
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {state.language === 'lo'
                ? 'ກອງທຶນສຳຮອງສຸກເສີນໄວ້ໃຊ້ໃນຍາມຈຳເປັນ (3 - 6 ເດືອນຂອງລາຍຈ່າຍ)'
                : 'กองทุนสำรองฉุกเฉินสำหรับใช้ยามจำเป็น (3 - 6 เดือนของรายจ่าย)'}
            </p>
          </div>

          {!isEditingEmerg ? (
            <button
              onClick={() => {
                setEmergBalInput(emergency.balanceLak.toString());
                setTargetMonthsInput(emergency.targetMonths.toString());
                setMonthlyExpInput(emergency.monthlyExpenseLak.toString());
                setIsEditingEmerg(true);
              }}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs px-4 py-2 rounded-xl font-semibold border border-slate-700 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{state.language === 'lo' ? 'ປັບເປົ້າໝາຍສຳຮອງ' : 'ปรับเป้าหมายสำรอง'}</span>
            </button>
          ) : (
            <button
              onClick={handleSaveEmerg}
              className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs px-4 py-2 rounded-xl font-bold transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t.save}</span>
            </button>
          )}
        </div>

        {/* Form or Metrics */}
        {isEditingEmerg ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Current Balance (₭ LAK)*</label>
              <input
                type="number"
                value={emergBalInput}
                onChange={(e) => setEmergBalInput(e.target.value)}
                className="w-full bg-slate-950 border border-purple-500/60 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Target Months of Expenses*</label>
              <input
                type="number"
                value={targetMonthsInput}
                onChange={(e) => setTargetMonthsInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Monthly Living Expense (₭ LAK)*</label>
              <input
                type="number"
                value={monthlyExpInput}
                onChange={(e) => setMonthlyExpInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                {state.language === 'lo' ? 'ຍອດເງິນສຳຮອງປັດຈຸບັນ' : 'ยอดเงินสำรองปัจจุบัน'}
              </div>
              <div className="text-2xl font-bold font-mono text-purple-300">
                {formatCurrency(emergency.balanceLak, 'LAK')}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                ≈ ${(emergency.balanceLak / rateUsdLak).toLocaleString('en-US', { maximumFractionDigits: 1 })} USD
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                {state.language === 'lo' ? 'ໄລຍະເວລາຮອງຮັບ (Runway)' : 'ระยะเวลารองรับ (Runway)'}
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {emergCoverageMonths.toFixed(1)} {state.language === 'lo' ? 'ເດືອນ' : 'เดือน'}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {state.language === 'lo' ? 'ເປົ້າໝາຍ:' : 'เป้าหมาย:'} {emergency.targetMonths} {state.language === 'lo' ? 'ເດືອນ' : 'เดือน'} (₭{targetEmergencyLak.toLocaleString()})
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                {state.language === 'lo' ? 'ຄວາມຄືບໜ້າຕາມເປົ້າ' : 'ความคืบหน้าตามเป้า'}
              </div>
              <div className="text-2xl font-bold font-mono text-amber-300">
                {emergProgressPct.toFixed(0)}%
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${emergProgressPct}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Deposit / Withdraw into Emergency Fund */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">
            {state.language === 'lo' ? 'ຝາກ/ຖອນ ເງິນສຳຮອງດ່ວນ (₭):' : 'ฝาก/ถอน เงินสำรองด่วน (₭):'}
          </span>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={quickAmountLak}
              onChange={(e) => setQuickAmountLak(e.target.value)}
              placeholder="e.g. 1000000"
              className="w-36 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 font-mono focus:outline-none"
            />
            <button
              onClick={() => handleQuickEmergAction(true)}
              className="flex items-center space-x-1 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg font-semibold transition"
            >
              <Plus className="w-3 h-3" />
              <span>{state.language === 'lo' ? 'ຝາກເພີ່ມ' : 'ฝากเพิ่ม'}</span>
            </button>
            <button
              onClick={() => handleQuickEmergAction(false)}
              className="flex items-center space-x-1 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 px-3 py-1 rounded-lg font-semibold transition"
            >
              <Minus className="w-3 h-3" />
              <span>{state.language === 'lo' ? 'ຖອນອອກ' : 'ถอนออก'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cash & Bank Balances Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-400" />
                <span>{t.cash}</span>
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-blue-950 text-blue-400 border border-blue-800/40">
                LAK ₭ & USD $
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {state.language === 'lo'
                ? 'ເງິນສົດໃນບັນຊີທະນາຄານ (BCEL, LDB, etc.) ແລະ ເງິນສົດ USD'
                : 'เงินสดในบัญชีธนาคาร (BCEL, LDB, etc.) และเงินสด USD'}
            </p>
          </div>

          {!isEditingCash ? (
            <button
              onClick={() => {
                setCashLakInput(cash.balanceLak.toString());
                setCashUsdInput(cash.balanceUsd.toString());
                setIsEditingCash(true);
              }}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs px-4 py-2 rounded-xl font-semibold border border-slate-700 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{state.language === 'lo' ? 'ປັບຍອດເງິນສົດ' : 'ปรับยอดเงินสด'}</span>
            </button>
          ) : (
            <button
              onClick={handleSaveCash}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl font-bold transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t.save}</span>
            </button>
          )}
        </div>

        {isEditingCash ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Lao Kip Cash (₭ LAK)*</label>
              <input
                type="number"
                value={cashLakInput}
                onChange={(e) => setCashLakInput(e.target.value)}
                className="w-full bg-slate-950 border border-blue-500/60 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">USD Cash Wallet ($ USD)*</label>
              <input
                type="number"
                value={cashUsdInput}
                onChange={(e) => setCashUsdInput(e.target.value)}
                className="w-full bg-slate-950 border border-blue-500/60 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none"
              />
              <div className="text-[11px] text-slate-400 mt-1">
                ≈ ₭{((parseFloat(cashUsdInput) || 0) * rateUsdLak).toLocaleString()} Kip
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
            
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                {state.language === 'lo' ? 'ເງິນກີບໃນບັນຊີ (LAK)' : 'เงินกีบในบัญชี (LAK)'}
              </div>
              <div className="text-2xl font-bold font-mono text-blue-300">
                {formatCurrency(cash.balanceLak, 'LAK')}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                ≈ ${(cash.balanceLak / rateUsdLak).toLocaleString('en-US', { maximumFractionDigits: 1 })} USD
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                {state.language === 'lo' ? 'ເງິນດອນລ່າສົດ (USD)' : 'เงินดอลลาร์สด (USD)'}
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                ${cash.balanceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                ≈ ₭{(cash.balanceUsd * rateUsdLak).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                {state.language === 'lo' ? 'ມູນຄ່າເງິນສົດລວມທັງໝົດ' : 'มูลค่าเงินสดรวมทั้งหมด'}
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {formatCurrency(totals.totalCashInLak, 'LAK')}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                ≈ ${totals.totalCashInUsd.toLocaleString('en-US', { maximumFractionDigits: 1 })} USD
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
