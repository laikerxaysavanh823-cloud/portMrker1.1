import { MarketRates } from '../types';

/**
 * Live market price fetching from free, CORS-enabled public APIs (no API key needed).
 *  - BTC & gold: CoinGecko (gold via Tether Gold / XAUT, 1 token = 1 troy ounce)
 *  - BTC fallback: Binance
 *  - USD→LAK / USD→THB: open.er-api.com (official reference rate — may differ from Lao market rate)
 */

const TROY_OUNCE_GRAMS = 31.1034768;
const TIMEOUT_MS = 10000;

export interface FetchedRates {
  btcUsd?: number;
  goldUsdPerGram?: number;
  usdLak?: number;
  usdThb?: number;
  errors: string[];
}

async function fetchJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const isValidNumber = (n: unknown): n is number => typeof n === 'number' && isFinite(n) && n > 0;

async function fetchCryptoAndGold(): Promise<{ btcUsd?: number; goldUsdPerGram?: number }> {
  const data = await fetchJson(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether-gold&vs_currencies=usd'
  );
  const btc = data?.bitcoin?.usd;
  const goldOz = data?.['tether-gold']?.usd;
  return {
    btcUsd: isValidNumber(btc) ? btc : undefined,
    goldUsdPerGram: isValidNumber(goldOz) ? +(goldOz / TROY_OUNCE_GRAMS).toFixed(2) : undefined,
  };
}

async function fetchBtcFallback(): Promise<number | undefined> {
  const data = await fetchJson('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
  const price = parseFloat(data?.price);
  return isValidNumber(price) ? price : undefined;
}

async function fetchFx(): Promise<{ usdLak?: number; usdThb?: number }> {
  const data = await fetchJson('https://open.er-api.com/v6/latest/USD');
  const lak = data?.rates?.LAK;
  const thb = data?.rates?.THB;
  return {
    usdLak: isValidNumber(lak) ? Math.round(lak) : undefined,
    usdThb: isValidNumber(thb) ? +thb.toFixed(2) : undefined,
  };
}

/**
 * Fetch all market prices in parallel. Never throws — failed sources are listed in `errors`.
 */
export async function fetchLiveRates(): Promise<FetchedRates> {
  const result: FetchedRates = { errors: [] };

  const [cg, fx] = await Promise.allSettled([fetchCryptoAndGold(), fetchFx()]);

  if (cg.status === 'fulfilled') {
    result.btcUsd = cg.value.btcUsd;
    result.goldUsdPerGram = cg.value.goldUsdPerGram;
  } else {
    result.errors.push('BTC/Gold (CoinGecko)');
  }

  if (!result.btcUsd) {
    try {
      result.btcUsd = await fetchBtcFallback();
    } catch {
      /* ignore — reported below */
    }
  }
  if (!result.btcUsd && cg.status === 'fulfilled') result.errors.push('BTC');
  if (!result.goldUsdPerGram && cg.status === 'fulfilled') result.errors.push('Gold');

  if (fx.status === 'fulfilled') {
    result.usdLak = fx.value.usdLak;
    result.usdThb = fx.value.usdThb;
  } else {
    result.errors.push('USD/LAK (open.er-api.com)');
  }

  return result;
}

/**
 * Convert fetched prices into a partial MarketRates update.
 * FX rates are only included when `includeFx` is true, because many users in Laos
 * prefer to keep their own (market / bank) USD→LAK rate.
 */
export function toRatesUpdate(fetched: FetchedRates, includeFx: boolean): Partial<MarketRates> {
  const update: Partial<MarketRates> = {};
  if (fetched.btcUsd) update.btcUsd = Math.round(fetched.btcUsd * 100) / 100;
  if (fetched.goldUsdPerGram) update.goldUsdPerGram = fetched.goldUsdPerGram;
  if (includeFx) {
    if (fetched.usdLak) update.usdLak = fetched.usdLak;
    if (fetched.usdThb) update.usdThb = fetched.usdThb;
  }
  return update;
}

/** Minutes between automatic refreshes while the app is open. */
export const AUTO_REFRESH_MINUTES = 15;
