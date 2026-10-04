import { Currency, Language, MarketRates } from '../types';
import { MONTH_NAMES } from './translations';

/**
 * Format number as currency string
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: Currency,
  opts?: { hideSymbol?: boolean; precision?: number }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }

  const symbol = opts?.hideSymbol
    ? ''
    : currency === 'LAK'
    ? '₭'
    : currency === 'USD'
    ? '$'
    : '฿';

  const defaultPrecision = currency === 'LAK' ? 0 : 2;
  const precision = opts?.precision !== undefined ? opts.precision : defaultPrecision;

  const formatted = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  return opts?.hideSymbol ? formatted : `${symbol}${formatted}`;
}

/**
 * Format USD amount with automatic secondary Lao Kip conversion display
 * Example: "$1,200.00 (≈ 27,000,000 ₭)"
 */
export function formatUsdWithLak(
  amountUsd: number,
  usdLakRate: number,
  compact = false
): { usdStr: string; lakStr: string; combined: string } {
  const usdStr = `$${Number(amountUsd).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const lakAmount = amountUsd * usdLakRate;
  const lakStr = `₭${Number(lakAmount).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;

  const combined = compact ? `${usdStr} (≈ ${lakStr})` : `${usdStr} · ≈ ${lakStr}`;

  return { usdStr, lakStr, combined };
}

/**
 * Currency conversion utilities
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: MarketRates
): number {
  if (from === to) return amount;

  // Convert `from` to USD as standard base
  let amountInUsd = amount;
  if (from === 'LAK') {
    amountInUsd = amount / rates.usdLak;
  } else if (from === 'THB') {
    amountInUsd = amount / rates.usdThb;
  }

  // Convert USD to `to`
  if (to === 'USD') return amountInUsd;
  if (to === 'LAK') return amountInUsd * rates.usdLak;
  if (to === 'THB') return amountInUsd * rates.usdThb;

  return amountInUsd;
}

/**
 * Format month key (e.g. '2026-08') into localized string
 */
export function formatMonthLabel(monthKey: string, lang: Language = 'lo'): string {
  const parts = monthKey.split('-');
  if (parts.length !== 2) return monthKey;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthList = MONTH_NAMES[lang] || MONTH_NAMES.lo;
  const monthName = monthList[monthIdx] || parts[1];
  return `${monthName} ${year}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, signed = false): string {
  if (isNaN(value)) return '0.0%';
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Generate unique id
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
}

/**
 * Get current ISO month string (e.g. '2026-08')
 */
export function getCurrentMonthKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
