/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { MonthSelector } from './components/MonthSelector';
import { MonthlyBudgetManager } from './components/MonthlyBudgetManager';
import { PortfolioOverview } from './components/PortfolioOverview';
import { StocksManager } from './components/StocksManager';
import { FundsManager } from './components/FundsManager';
import { BitcoinManager } from './components/BitcoinManager';
import { GoldManager } from './components/GoldManager';
import { EmergencyCashManager } from './components/EmergencyCashManager';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { ExchangeRatesModal } from './components/ExchangeRatesModal';
import { QuickAddModal } from './components/QuickAddModal';
import { NewMonthModal } from './components/NewMonthModal';
import { ExpenseModal } from './components/ExpenseModal';
import { InvestmentModal } from './components/InvestmentModal';
import { DataSyncModal } from './components/DataSyncModal';
import { BudgetAlerts } from './components/BudgetAlerts';
import { GoalsManager } from './components/GoalsManager';
import { AiAdvisor } from './components/AiAdvisor';
import { DialogHost } from './components/DialogHost';
import { isTabHidden } from './utils/categories';
import { TRANSLATIONS } from './utils/translations';
import { NavTab } from './types';
import {
  Calendar,
  PieChart,
  TrendingUp,
  Layers,
  Coins,
  ShieldCheck,
  Wallet,
  Activity,
  Plus,
  Zap,
  Target,
  Bot,
} from 'lucide-react';

const MainDashboard: React.FC = () => {
  const { state, settings } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<NavTab>('budget');

  // Modals state
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showNewMonthModal, setShowNewMonthModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showDataSyncModal, setShowDataSyncModal] = useState(false);

  const allTabs: { id: NavTab; label: string; icon: any; color: string }[] = [
    { id: 'budget', label: t.monthlyBudget, icon: Calendar, color: 'text-amber-400' },
    { id: 'portfolio', label: t.portfolio, icon: PieChart, color: 'text-emerald-400' },
    { id: 'stocks', label: t.stocks, icon: TrendingUp, color: 'text-emerald-400' },
    { id: 'funds', label: t.funds, icon: Layers, color: 'text-teal-400' },
    { id: 'crypto', label: t.crypto, icon: Coins, color: 'text-orange-400' },
    { id: 'gold', label: t.gold, icon: ShieldCheck, color: 'text-amber-300' },
    { id: 'emergency', label: t.emergencyFund, icon: Wallet, color: 'text-purple-400' },
    { id: 'goals', label: t.goals, icon: Target, color: 'text-emerald-400' },
    { id: 'analytics', label: t.analytics, icon: Activity, color: 'text-blue-400' },
    { id: 'advisor', label: t.aiAdvisor, icon: Bot, color: 'text-purple-300' },
  ];
  const tabs = allTabs.filter((tab) => !isTabHidden(tab.id, settings.hiddenCategories));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-300">
      
      {/* Global Navigation Header */}
      <Navbar
        onOpenRatesModal={() => setShowRatesModal(true)}
        onOpenQuickAdd={() => setShowQuickAddModal(true)}
        onOpenDataSync={() => setShowDataSyncModal(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container with responsive padding for mobile bottom bar */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 pb-24 md:pb-8">
        
        {/* Horizontal Scrollable Category Tabs Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/80 -mx-3 px-3 sm:mx-0 sm:px-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 shadow-md border border-slate-700 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Rendering */}
        {activeTab === 'budget' && (
          <div className="space-y-5">
            <MonthSelector onOpenNewMonthModal={() => setShowNewMonthModal(true)} />
            <BudgetAlerts />
            <MonthlyBudgetManager
              onOpenExpenseModal={() => setShowExpenseModal(true)}
              onOpenInvestmentModal={() => setShowInvestmentModal(true)}
              onOpenDataSync={() => setShowDataSyncModal(true)}
            />
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-5">
            <PortfolioOverview onSelectTab={(tab) => setActiveTab(tab)} />
          </div>
        )}

        {activeTab === 'stocks' && <StocksManager />}

        {activeTab === 'funds' && <FundsManager />}

        {activeTab === 'crypto' && <BitcoinManager />}

        {activeTab === 'gold' && <GoldManager />}

        {activeTab === 'emergency' && <EmergencyCashManager />}

        {activeTab === 'goals' && <GoalsManager />}

        {activeTab === 'analytics' && <AnalyticsCharts />}

        {activeTab === 'advisor' && <AiAdvisor />}

      </main>

      {/* Mobile Bottom Navigation Bar (Fixed for quick 1-thumb touch navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
          
          {/* 1. Monthly Budget */}
          <button
            onClick={() => setActiveTab('budget')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              activeTab === 'budget' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight truncate">
              {state.language === 'lo' ? 'ງົບປະມານ' : 'งบประมาณ'}
            </span>
          </button>

          {/* 2. Portfolio */}
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              activeTab === 'portfolio' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight truncate">
              {state.language === 'lo' ? 'ພອດລວມ' : 'พอร์ต'}
            </span>
          </button>

          {/* 3. Center Quick Add Button */}
          <button
            onClick={() => setShowQuickAddModal(true)}
            className="flex flex-col items-center justify-center -mt-4"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950 font-bold active:scale-95 transition">
              <Plus className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-[9px] text-amber-300 font-semibold mt-0.5">
              {state.language === 'lo' ? 'ບັນທຶກ' : 'บันทึก'}
            </span>
          </button>

          {/* 4. Crypto / Stocks Quick Tab */}
          <button
            onClick={() => setActiveTab(activeTab === 'crypto' ? 'stocks' : 'crypto')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              activeTab === 'crypto' || activeTab === 'stocks' || activeTab === 'funds' || activeTab === 'gold'
                ? 'text-orange-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight truncate">
              {state.language === 'lo' ? 'ຮຸ້ນ/BTC/ຄຳ' : 'หุ้น/BTC/ทอง'}
            </span>
          </button>

          {/* 5. Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              activeTab === 'analytics' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight truncate">
              {state.language === 'lo' ? 'ສະຖິຕິ' : 'สถิติ'}
            </span>
          </button>

        </div>
      </nav>

      {/* Desktop Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            portMrker • ລະບົບວາງແຜນງົບປະມານ & ພອດການລົງທຶນ (LAK ₭ & USD $)
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span>$1 = ₭{state.rates.usdLak.toLocaleString()}</span>
            <span>•</span>
            <span>BTC: ${state.rates.btcUsd.toLocaleString()}</span>
            <span>•</span>
            <span>Gold: ${state.rates.goldUsdPerGram}/g</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showRatesModal && (
        <ExchangeRatesModal onClose={() => setShowRatesModal(false)} />
      )}

      {showQuickAddModal && (
        <QuickAddModal onClose={() => setShowQuickAddModal(false)} />
      )}

      {showNewMonthModal && (
        <NewMonthModal onClose={() => setShowNewMonthModal(false)} />
      )}

      {showExpenseModal && (
        <ExpenseModal
          monthKey={state.selectedMonth}
          onClose={() => setShowExpenseModal(false)}
        />
      )}

      {showInvestmentModal && (
        <InvestmentModal
          monthKey={state.selectedMonth}
          onClose={() => setShowInvestmentModal(false)}
        />
      )}

      {showDataSyncModal && (
        <DataSyncModal onClose={() => setShowDataSyncModal(false)} />
      )}

      <DialogHost />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainDashboard />
    </AppProvider>
  );
}

