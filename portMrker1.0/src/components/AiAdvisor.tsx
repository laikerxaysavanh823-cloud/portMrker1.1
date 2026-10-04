import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import { computeBudgetAlerts } from '../utils/budgetAlerts';
import { getCurrentMonthKey } from '../utils/formatters';
import { buildAdvisorPrompt } from '../utils/aiPrompt';
import { categoryOptionsOf, getBudgetLines } from '../utils/categories';
import { isClaudeArtifact, isStaticSite, useCapability } from '../utils/platform';
import { askGeminiDirect, getSavedGeminiKey, saveGeminiKey } from '../utils/geminiDirect';
import { goalSavedLak } from './GoalsManager';
import { Bot, Sparkles, Loader2, AlertTriangle, ShieldCheck, Info, Square } from 'lucide-react';

type Focus = 'overall' | 'budget' | 'portfolio' | 'goals';

const round = (n: number) => Math.round(n);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Tiny Markdown renderer for the AI reply: ## headings, - / 1. lists and **bold**. */
function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="text-slate-50 font-bold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

const MarkdownView: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-300">
      {lines.map((raw, i) => {
        const line = raw.trim();
        if (!line) return null;
        const heading = line.match(/^#{1,4}\s+(.*)$/);
        if (heading) {
          return (
            <h3 key={i} className="text-base font-bold text-amber-300 pt-3 first:pt-0">
              {renderInline(heading[1])}
            </h3>
          );
        }
        const bullet = line.match(/^[-*•]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex space-x-2 pl-1">
              <span className="text-amber-400 shrink-0">•</span>
              <span>{renderInline(bullet[1])}</span>
            </div>
          );
        }
        const numbered = line.match(/^(\d+)[.)]\s+(.*)$/);
        if (numbered) {
          return (
            <div key={i} className="flex space-x-2 pl-1">
              <span className="text-emerald-400 font-bold font-mono shrink-0">{numbered[1]}.</span>
              <span>{renderInline(numbered[2])}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
};

export const AiAdvisor: React.FC = () => {
  const { state, totals, currentMonthData, monthlySummary, goals } = useApp();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.lo;

  const [focus, setFocus] = useState<Focus>('overall');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [geminiKey, setGeminiKey] = useState(() => (isStaticSite ? getSavedGeminiKey() : ''));

  /** Summary numbers only — no names, notes or transaction details leave the device. */
  const buildSnapshot = () => {
    const rate = state.rates.usdLak;
    const catOpts = categoryOptionsOf(state);
    const expensesByCategory: Record<string, number> = {};
    for (const e of currentMonthData.expenses || []) {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amountLak;
    }

    return {
      month: currentMonthData.monthKey,
      rates: { usdLak: rate, btcUsd: state.rates.btcUsd, goldUsdPerGram: state.rates.goldUsdPerGram },
      monthlyBudget: {
        incomeLak: round(monthlySummary.incomeLak),
        // The user's own budget lines (switched-off built-ins are left out)
        categories: getBudgetLines(currentMonthData, rate, catOpts).map((l) => ({
          category: l.custom ? `custom: ${l.custom.name}` : l.id,
          pctOfIncome: round2(l.pct),
          plannedLak: round(l.plannedLak),
          actualLak: round(l.actualLak),
        })),
        actualExpensesLak: round(monthlySummary.actualExpensesLak),
        expensesByCategory,
        actualInvestmentsLak: round(monthlySummary.actualInvestmentsLak),
        savingsDepositedLak: round(currentMonthData.savingsDepositedLak || 0),
        remainingLak: round(monthlySummary.remainingBudgetLak),
        savingsRatePct: round2(monthlySummary.savingsRatePct),
        alerts: computeBudgetAlerts(currentMonthData, rate, catOpts).map((x) => ({
          category: x.line?.custom ? `custom: ${x.line.custom.name}` : x.id,
          level: x.level,
          pctUsed: isFinite(x.pctUsed) ? round(x.pctUsed) : null,
        })),
      },
      portfolio: {
        stocksValueUsd: round2(totals.stocksValueUsd),
        stocksCostUsd: round2(totals.stocksCostUsd),
        stockTickers: state.holdings.stocks.map((s) => ({
          ticker: s.ticker,
          valueUsd: round2(s.shares * s.currentPriceUsd),
          plPct: s.avgCostUsd > 0 ? round2(((s.currentPriceUsd - s.avgCostUsd) / s.avgCostUsd) * 100) : null,
        })),
        etfsValueUsd: round2(totals.etfsValueUsd),
        etfsCostUsd: round2(totals.etfsCostUsd),
        btcAmount: state.holdings.btc.amountBtc,
        btcValueUsd: round2(totals.btcValueUsd),
        btcCostUsd: round2(totals.btcCostUsd),
        goldGrams: state.holdings.gold.grams,
        goldValueUsd: round2(totals.goldValueUsd),
        goldCostUsd: round2(totals.goldCostUsd),
        unrealizedPlPct: round2(totals.unrealizedPlPct),
        cashLak: round(totals.totalCashInLak),
        emergencyFundLak: round(totals.emergencyFundLak),
        emergencyTargetMonths: state.holdings.emergency.targetMonths,
        monthlyExpenseLak: round(state.holdings.emergency.monthlyExpenseLak),
        netWorthLak: round(totals.netWorthLak),
        netWorthUsd: round2(totals.netWorthUsd),
      },
      savingsGoals: goals.map((g, idx) => ({
        goal: `Goal ${idx + 1}`,
        targetLak: round(g.targetLak),
        savedLak: round(goalSavedLak(g)),
        deadline: g.deadline || null,
      })),
      today: getCurrentMonthKey(),
    };
  };

  const handleAnalyze = async () => {
    if (isClaudeArtifact) {
      await analyzeWithClaude();
      return;
    }
    if (isStaticSite) {
      await analyzeWithOwnKey();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: state.language,
          focus,
          question: question.trim(),
          snapshot: buildSnapshot(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error === 'NO_API_KEY' ? t.aiNoKey : `${t.aiError}: ${data.error || res.status}`);
        return;
      }
      setResult(data.text);
    } catch (e: any) {
      setError(`${t.aiError}: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  /** Static website version: Gemini with the user's own key, straight from the browser. */
  const analyzeWithOwnKey = async () => {
    const key = geminiKey.trim();
    if (!key) {
      setError(t.aiKeyMissing);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const prompt = buildAdvisorPrompt(state.language, focus, question.trim(), buildSnapshot());
      setResult(await askGeminiDirect(key, prompt));
    } catch (e: any) {
      setError(`${t.aiError}: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  /** claude.ai web version: ask Claude directly on the viewer's own account, streaming the answer. */
  const analyzeWithClaude = async () => {
    const sample = await useCapability('sample');
    if (!sample) {
      setError(t.aiNotAllowed);
      return;
    }
    const ctl = new AbortController();
    abortRef.current = ctl;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const prompt = buildAdvisorPrompt(state.language, focus, question.trim(), buildSnapshot());
      const { text } = await sample(prompt, {
        signal: ctl.signal,
        onText: ({ text }: { text: string }) => setResult(text),
      });
      setResult(text);
    } catch (e: any) {
      if (e?.text) setResult(e.text);
      if (e?.code === 'cancelled') return;
      if (e?.code === 'refused') setResult(null);
      setError(
        e?.code === 'not_granted' || e?.code === 'sampling_disabled'
          ? t.aiNotAllowed
          : e?.code === 'rate_limited'
          ? t.aiRateLimited
          : `${t.aiError}: ${e?.code || e}`
      );
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  };

  const focusOptions: { id: Focus; label: string }[] = [
    { id: 'overall', label: t.aiFocusOverall },
    { id: 'budget', label: t.aiFocusBudget },
    { id: 'portfolio', label: t.aiFocusPortfolio },
    { id: 'goals', label: t.aiFocusGoals },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-700/40 flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">{t.aiAdvisor}</h2>
            <p className="text-[11px] text-slate-400 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{isClaudeArtifact ? t.aiPrivacy.replace('Google Gemini', 'Claude') : t.aiPrivacy}</span>
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4 text-xs">
          {isStaticSite && !isClaudeArtifact && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <label htmlFor="gemini-key" className="block text-slate-300 font-semibold">
                {t.aiKeyLabel}
              </label>
              <div className="flex gap-2">
                <input
                  id="gemini-key"
                  type="password"
                  autoComplete="off"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  onBlur={() => saveGeminiKey(geminiKey.trim())}
                  placeholder="AIza..."
                  className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
                {geminiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setGeminiKey('');
                      saveGeminiKey('');
                    }}
                    className="px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    {t.delete}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {t.aiKeyHint}{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-400 underline">
                  aistudio.google.com/apikey
                </a>
              </p>
            </div>
          )}

          <div>
            <div className="text-slate-400 mb-1.5">{t.aiFocus}</div>
            <div className="flex flex-wrap gap-2">
              {focusOptions.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFocus(f.id)}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    focus === f.id
                      ? 'bg-blue-600 border-blue-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1.5">{t.aiQuestion}</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder={t.aiQuestionPlaceholder}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? t.aiAnalyzing : t.aiAnalyze}</span>
          </button>
          {loading && isClaudeArtifact && (
            <button
              onClick={() => abortRef.current?.abort()}
              className="w-full sm:w-auto sm:ml-2 mt-2 sm:mt-0 inline-flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition"
            >
              <Square className="w-3.5 h-3.5" />
              <span>{t.aiStop}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start space-x-2 bg-rose-950/40 border border-rose-800/60 rounded-2xl p-4 text-xs text-rose-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className={`bg-slate-900 border border-blue-800/40 rounded-2xl p-5 sm:p-6 shadow-xl ${loading && !isClaudeArtifact ? 'opacity-50' : ''}`}>
          <MarkdownView text={result} />
          <div className="mt-5 pt-3 border-t border-slate-800 flex items-start space-x-1.5 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{t.aiDisclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
};
