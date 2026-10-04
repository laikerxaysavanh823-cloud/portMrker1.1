import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { formatCurrency, formatUsdWithLak } from '../utils/formatters';
import { Currency, Language, NavTab } from '../types';
import { computeBudgetAlerts } from '../utils/budgetAlerts';
import { categoryOptionsOf, isTabHidden } from '../utils/categories';
import {
  TrendingUp,
  Coins,
  RefreshCw,
  SlidersHorizontal,
  Download,
  Upload,
  Globe,
  DollarSign,
  PieChart,
  Calendar,
  Wallet,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Target,
  Bot,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { askConfirm, notify, saveFile } from '../utils/platform';

interface NavbarProps {
  onOpenRatesModal: () => void;
  onOpenQuickAdd: () => void;
  onOpenDataSync?: () => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRatesModal,
  onOpenQuickAdd,
  onOpenDataSync,
  activeTab,
  setActiveTab,
}) => {
  const {
    state,
    totals,
    setLanguage,
    setPrimaryCurrency,
    exportData,
    importData,
    resetToDefaults,
    rateRefresh,
    currentMonthData,
    syncStatus,
  } = useApp();

  const budgetAlertCount = computeBudgetAlerts(currentMonthData, state.rates.usdLak, categoryOptionsOf(state)).filter(
    (a) => a.level === 'over'
  ).length;

  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;

  const handleExport = () => {
    setShowBackupMenu(false);
    saveFile(`portMrker-${new Date().toISOString().slice(0, 10)}.json`, exportData(), 'application/json');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            const success = importData(content);
            if (success) {
              notify(state.language === 'lo' ? 'ກູ້ຄືນຂໍ້ມູນສຳເລັດແລ້ວ!' : 'กู้คืนข้อมูลสำเร็จแล้ว!');
            } else {
              notify(state.language === 'lo' ? 'ໄຟລ໌ບໍ່ຖືກຕ້ອງ' : 'ไฟล์ไม่ถูกต้อง');
            }
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
    setShowBackupMenu(false);
  };

  const handleReset = async () => {
    const msg =
      state.language === 'lo'
        ? 'ທ່ານຕ້ອງການຣີເຊັດກັບເປັນຂໍ້ມູນເລີ່ມຕົ້ນ (15/35/15/10/25) ແທ້ບໍ່?'
        : 'คุณต้องการรีเซ็ตเป็นข้อมูลเริ่มต้น (15/35/15/10/25) หรือไม่?';
    if (await askConfirm(msg)) {
      resetToDefaults();
      setShowBackupMenu(false);
    }
  };

  const plIsPositive = totals.unrealizedPlUsd >= 0;

  const allNavTabs: { id: NavTab; label: string; icon: any; badge?: string; alert?: number }[] = [
    { id: 'budget', label: t.monthlyPlanner, icon: Calendar, badge: '15/35/15', alert: budgetAlertCount },
    { id: 'portfolio', label: t.investments, icon: PieChart },
    { id: 'stocks', label: t.stocks, icon: TrendingUp },
    { id: 'funds', label: t.funds, icon: Layers },
    { id: 'crypto', label: t.crypto, icon: Coins },
    { id: 'gold', label: t.gold, icon: ShieldCheck },
    { id: 'emergency', label: t.emergencyFund, icon: Wallet },
    { id: 'goals', label: t.goals, icon: Target },
    { id: 'analytics', label: t.analytics, icon: Activity },
    { id: 'advisor', label: t.aiAdvisor, icon: Bot },
  ];
  const navTabs = allNavTabs.filter((tab) => !isTabHidden(tab.id, state.settings?.hiddenCategories || []));

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40">
      {/* Top Bar: Brand, Exchange Rate Pill, Currency Toggle, Language, Backup */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Logo & App Info */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black shrink-0">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 flex-wrap">
                <h1 className="font-bold text-base sm:text-lg text-slate-100 tracking-tight truncate">
                  {t.appTitle}
                </h1>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  LAK ₭ & USD $
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Controls: Live Rates Pill, Currency Toggle, Language & Backup */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            
            {/* Live Rates Button */}
            <button
              onClick={onOpenRatesModal}
              title={`${t.lastUpdatedAt}: ${new Date(state.rates.lastUpdated).toLocaleString()}`}
              className="group relative flex items-center space-x-1.5 bg-slate-950/90 hover:bg-slate-800 border border-slate-700/70 hover:border-amber-500/50 px-2 sm:px-3 py-1.5 rounded-lg text-xs transition duration-150"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-amber-400 shrink-0 ${
                  rateRefresh.status === 'loading'
                    ? 'animate-spin'
                    : 'group-hover:rotate-180 transition-transform duration-500'
                }`}
              />
              {(rateRefresh.status === 'ok' || rateRefresh.status === 'partial' || rateRefresh.status === 'error') && (
                <span
                  className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                    rateRefresh.status === 'ok'
                      ? 'bg-emerald-400'
                      : rateRefresh.status === 'partial'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                />
              )}
              <div className="flex items-center space-x-1 text-slate-300 font-mono text-[11px] sm:text-xs">
                <span>$1 = <strong className="text-amber-400">₭{(state.rates.usdLak / 1000).toFixed(1)}k</strong></span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="text-slate-400 hidden sm:inline">
                  BTC <strong className="text-orange-400">${(state.rates.btcUsd / 1000).toFixed(1)}k</strong>
                </span>
              </div>
            </button>

            {/* Cloud sync status (claude.ai web version) */}
            {syncStatus !== 'local' && (
              <span
                title={
                  syncStatus === 'synced'
                    ? t.syncCloud
                    : syncStatus === 'error'
                    ? t.syncError
                    : t.syncSaving
                }
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-950/90 border border-slate-700/70 shrink-0"
              >
                {syncStatus === 'error' ? (
                  <CloudOff className="w-4 h-4 text-rose-400" />
                ) : (
                  <Cloud
                    className={`w-4 h-4 ${
                      syncStatus === 'synced' ? 'text-emerald-400' : 'text-slate-400 animate-pulse'
                    }`}
                  />
                )}
              </span>
            )}

            {/* Quick Add Action Button */}
            <button
              onClick={onOpenQuickAdd}
              className="flex items-center space-x-1 sm:space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg text-xs shadow-md shadow-emerald-900/30 transition active:scale-95 shrink-0"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{state.language === 'lo' ? 'ບັນທຶກດ່ວນ' : 'บันทึกด่วน'}</span>
              <span className="xs:hidden">+</span>
            </button>

            {/* Currency Switcher */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
              {(['LAK', 'USD'] as Currency[]).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setPrimaryCurrency(curr)}
                  className={`px-1.5 sm:px-2 py-1 rounded-md transition font-medium ${
                    state.primaryCurrency === curr
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {curr === 'LAK' ? '₭' : '$'}
                </button>
              ))}
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              {(['lo', 'th', 'en'] as Language[]).map((lng) => (
                <button
                  key={lng}
                  onClick={() => setLanguage(lng)}
                  className={`px-1.5 sm:px-2 py-1 rounded-md transition font-medium ${
                    state.language === lng
                      ? 'bg-slate-700 text-slate-100 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lng === 'lo' ? 'LA' : lng === 'th' ? 'TH' : 'EN'}
                </button>
              ))}
            </div>

            {/* Backup / Data Dropdown */}
            <div className="relative">
              <button
                onClick={() => (onOpenDataSync ? onOpenDataSync() : setShowBackupMenu(!showBackupMenu))}
                className="flex items-center space-x-1 p-1.5 sm:px-2.5 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 transition"
                title="ບັນທຶກຟາຍ & ໃຊ້ຮ່ວມກັນ (Backup / Multi-device Sync)"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-semibold hidden lg:inline">
                  {state.language === 'lo' ? 'ບັນທຶກຟາຍ/Sync' : 'บันทึกไฟล์/Sync'}
                </span>
              </button>

              {showBackupMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-2 py-1 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                    {t.exportBackup} / {t.importBackup}
                  </div>
                  <button
                    onClick={handleExport}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-slate-200 hover:bg-slate-800 rounded-lg text-left transition"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>{t.exportBackup}</span>
                  </button>
                  <button
                    onClick={handleImport}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-slate-200 hover:bg-slate-800 rounded-lg text-left transition"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>{t.importBackup}</span>
                  </button>
                  <div className="my-1 border-t border-slate-800" />
                  <button
                    onClick={handleReset}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-red-400 hover:bg-red-950/40 rounded-lg text-left transition"
                  >
                    <RefreshCw className="w-4 h-4 text-red-400" />
                    <span>{t.resetData}</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Global Net Worth & Investment Quick Summary Banner */}
        <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-slate-800/60">
          
          {/* Net Worth */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 sm:p-2.5">
            <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>{t.netWorth}</span>
              <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            </div>
            <div className="text-sm sm:text-lg font-bold text-amber-300 font-mono mt-0.5 truncate">
              {formatCurrency(
                state.primaryCurrency === 'LAK'
                  ? totals.netWorthLak
                  : state.primaryCurrency === 'USD'
                  ? totals.netWorthUsd
                  : totals.netWorthThb,
                state.primaryCurrency
              )}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {state.primaryCurrency === 'LAK' ? (
                <span>≈ ${totals.netWorthUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD</span>
              ) : (
                <span>≈ ₭{totals.netWorthLak.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              )}
            </div>
          </div>

          {/* Total Investment Portfolio */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 sm:p-2.5">
            <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>{t.totalInvested}</span>
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
            </div>
            <div className="text-sm sm:text-lg font-bold text-emerald-400 font-mono mt-0.5 truncate">
              {formatCurrency(
                state.primaryCurrency === 'LAK'
                  ? totals.totalInvestmentsLak
                  : totals.totalInvestmentsUsd,
                state.primaryCurrency
              )}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              ${totals.totalInvestmentsUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
            </div>
          </div>

          {/* Unrealized Profit / Loss */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 sm:p-2.5">
            <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>{t.unrealizedPL}</span>
              <span className={`text-[10px] font-bold px-1 rounded ${plIsPositive ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                {plIsPositive ? '+' : ''}{totals.unrealizedPlPct.toFixed(1)}%
              </span>
            </div>
            <div className={`text-sm sm:text-lg font-bold font-mono mt-0.5 truncate ${plIsPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {plIsPositive ? '+' : ''}
              {formatCurrency(
                state.primaryCurrency === 'LAK'
                  ? totals.unrealizedPlLak
                  : totals.unrealizedPlUsd,
                state.primaryCurrency
              )}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {plIsPositive ? '+' : ''}${totals.unrealizedPlUsd.toLocaleString('en-US', { maximumFractionDigits: 1 })} USD
            </div>
          </div>

          {/* Emergency & Cash Reserves */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 sm:p-2.5">
            <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>{t.emergencyFund}</span>
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />
            </div>
            <div className="text-sm sm:text-lg font-bold text-blue-300 font-mono mt-0.5 truncate">
              {formatCurrency(
                state.primaryCurrency === 'LAK'
                  ? totals.emergencyFundLak + totals.totalCashInLak
                  : (totals.emergencyFundLak + totals.totalCashInLak) / state.rates.usdLak,
                state.primaryCurrency
              )}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              ₭{totals.emergencyFundLak.toLocaleString()} (6+ mo)
            </div>
          </div>

        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex space-x-1.5 overflow-x-auto pt-2.5 pb-0.5 mt-1 scrollbar-none text-xs font-medium border-t border-slate-800/40">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition duration-150 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[10px] rounded ${
                      isActive ? 'bg-slate-900 text-amber-400 font-mono' : 'bg-slate-800 text-slate-400 font-mono'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {!!tab.alert && (
                  <span className="ml-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-rose-500 text-white">
                    {tab.alert}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

