import { AppState } from '../types';
import { formatCurrency, formatMonthLabel } from './formatters';
import { isClaudeArtifact, notify, saveFile } from './platform';

/**
 * Generate CSV content for the monthly budget, expenses, investments, and asset holdings
 */
export function exportToCSV(state: AppState): string {
  const lines: string[] = [];
  const lang = state.language;

  // Header
  lines.push(`"portMrker - Financial & Investment Report"`);
  lines.push(`"Export Date","${new Date().toLocaleString()}"`);
  lines.push(`"Exchange Rate (USD to LAK)","${state.rates.usdLak}"`);
  lines.push(`"Exchange Rate (USD to THB)","${state.rates.usdThb}"`);
  lines.push(`"Bitcoin Price (USD)","${state.rates.btcUsd}"`);
  lines.push(`"Gold Price (USD/gram)","${state.rates.goldUsdPerGram}"`);
  lines.push('');

  // 1. Monthly Records Summary
  lines.push(`"--- MONTHLY BUDGET & ALLOCATION SUMMARY ---"`);
  lines.push(
    `"Month","Income (LAK)","Food/Living Plan (LAK)","US Stocks Plan (USD)","Funds/ETFs Plan (USD)","Bitcoin Plan (USD)","Gold Plan (USD)","Emergency Plan (LAK)","Actual Expenses (LAK)","Total Invested (USD)"`
  );

  const sortedMonths = Object.keys(state.months).sort((a, b) => b.localeCompare(a));
  for (const mKey of sortedMonths) {
    const mData = state.months[mKey];
    const totalExpLak = mData.expenses.reduce((acc, e) => acc + (e.amountLak || 0), 0);
    const totalInvUsd = mData.investments.reduce((acc, i) => acc + (i.amountUsd || 0), 0);

    lines.push(
      [
        `"${mKey}"`,
        mData.incomeLak || 0,
        mData.allocations.foodLivingLak || 0,
        mData.allocations.usStocksUsd || 0,
        mData.allocations.fundsEtfsUsd || 0,
        mData.allocations.bitcoinUsd || 0,
        mData.allocations.goldUsd || 0,
        mData.allocations.emergencyLak || 0,
        totalExpLak,
        totalInvUsd,
      ].join(',')
    );
  }
  lines.push('');

  // 2. All Monthly Expenses Log
  lines.push(`"--- EXPENSE TRANSACTIONS LOG ---"`);
  lines.push(`"Month","Date","Category","Amount (LAK)","Note"`);
  for (const mKey of sortedMonths) {
    const mData = state.months[mKey];
    for (const exp of mData.expenses) {
      lines.push(
        [
          `"${mKey}"`,
          `"${exp.date}"`,
          `"${(exp.category || '').replace(/"/g, '""')}"`,
          exp.amountLak || 0,
          `"${(exp.note || '').replace(/"/g, '""')}"`,
        ].join(',')
      );
    }
  }
  lines.push('');

  // 3. All Monthly Investments Log
  lines.push(`"--- INVESTMENT TRANSACTIONS LOG ---"`);
  lines.push(`"Month","Date","Type","Asset Name","Amount (USD)","Amount (LAK)","Rate Used","Shares/Units","Note"`);
  for (const mKey of sortedMonths) {
    const mData = state.months[mKey];
    for (const inv of mData.investments) {
      lines.push(
        [
          `"${mKey}"`,
          `"${inv.date}"`,
          `"${inv.assetType}"`,
          `"${(inv.assetName || '').replace(/"/g, '""')}"`,
          inv.amountUsd || 0,
          inv.amountLak || 0,
          inv.rateUsed || state.rates.usdLak,
          inv.sharesOrUnits || 0,
          `"${(inv.note || '').replace(/"/g, '""')}"`,
        ].join(',')
      );
    }
  }
  lines.push('');

  // 4. US Stocks Holdings
  lines.push(`"--- CURRENT US STOCKS HOLDINGS ---"`);
  lines.push(`"Ticker","Name","Shares","Avg Cost (USD)","Current Price (USD)","Total Cost (USD)","Current Value (USD)","Profit/Loss (USD)"`);
  for (const stk of state.holdings.stocks) {
    const totalCost = (stk.shares || 0) * (stk.avgCostUsd || 0);
    const curVal = (stk.shares || 0) * (stk.currentPriceUsd || 0);
    const pl = curVal - totalCost;
    lines.push(
      [
        `"${stk.ticker}"`,
        `"${(stk.name || '').replace(/"/g, '""')}"`,
        stk.shares || 0,
        stk.avgCostUsd || 0,
        stk.currentPriceUsd || 0,
        totalCost.toFixed(2),
        curVal.toFixed(2),
        pl.toFixed(2),
      ].join(',')
    );
  }
  lines.push('');

  // 5. ETFs Holdings
  lines.push(`"--- CURRENT FUNDS & ETFS HOLDINGS ---"`);
  lines.push(`"Ticker","Name","Category","Units","Avg Cost (USD)","Current Price (USD)","Total Cost (USD)","Current Value (USD)","Profit/Loss (USD)"`);
  for (const etf of state.holdings.etfs) {
    const totalCost = (etf.units || 0) * (etf.avgCostUsd || 0);
    const curVal = (etf.units || 0) * (etf.currentPriceUsd || 0);
    const pl = curVal - totalCost;
    lines.push(
      [
        `"${etf.ticker}"`,
        `"${(etf.name || '').replace(/"/g, '""')}"`,
        `"${etf.category || ''}"`,
        etf.units || 0,
        etf.avgCostUsd || 0,
        etf.currentPriceUsd || 0,
        totalCost.toFixed(2),
        curVal.toFixed(2),
        pl.toFixed(2),
      ].join(',')
    );
  }
  lines.push('');

  // 6. Bitcoin Holdings & Transactions
  lines.push(`"--- BITCOIN (BTC) HOLDINGS & TRANSACTIONS ---"`);
  lines.push(`"Total BTC Balance","${state.holdings.btc.amountBtc || 0}"`);
  lines.push(`"Current Price (USD)","${state.rates.btcUsd}"`);
  lines.push(`"Current Value (USD)","${((state.holdings.btc.amountBtc || 0) * state.rates.btcUsd).toFixed(2)}"`);
  lines.push(`"Date","Type","BTC Amount","Price (USD)","Total USD","Total LAK","Note"`);
  for (const tx of state.holdings.btc.transactions) {
    lines.push(
      [
        `"${tx.date}"`,
        `"${tx.type}"`,
        tx.btcAmount || 0,
        tx.priceUsd || 0,
        tx.totalUsd || 0,
        tx.totalLak || 0,
        `"${(tx.note || '').replace(/"/g, '""')}"`,
      ].join(',')
    );
  }
  lines.push('');

  // 7. Gold Holdings
  lines.push(`"--- GOLD BULLION HOLDINGS ---"`);
  lines.push(`"Total Grams","${state.holdings.gold.grams || 0}"`);
  lines.push(`"Approx Baht Gold","${((state.holdings.gold.grams || 0) / 15.244).toFixed(3)}"`);
  lines.push(`"Current Price (USD/gram)","${state.rates.goldUsdPerGram}"`);
  lines.push(`"Current Value (USD)","${((state.holdings.gold.grams || 0) * state.rates.goldUsdPerGram).toFixed(2)}"`);
  lines.push(`"Current Value (LAK)","${(((state.holdings.gold.grams || 0) * state.rates.goldUsdPerGram) * state.rates.usdLak).toFixed(0)}"`);
  lines.push('');

  // 8. Emergency Fund & Cash
  lines.push(`"--- EMERGENCY CASH & RESERVES ---"`);
  lines.push(`"Emergency Fund Balance (LAK)","${state.holdings.emergency.balanceLak || 0}"`);
  lines.push(`"Cash Balance (LAK)","${state.holdings.cash.balanceLak || 0}"`);
  lines.push(`"Cash Balance (USD)","${state.holdings.cash.balanceUsd || 0}"`);

  return lines.join('\n');
}

/**
 * Trigger download of CSV report
 */
export function downloadCSVReport(state: AppState) {
  const csvContent = exportToCSV(state);
  const dateStr = new Date().toISOString().slice(0, 10);
  // Add UTF-8 BOM so Excel opens Lao and Thai characters correctly
  saveFile(`portMrker-report-${dateStr}.csv`, '\uFEFF' + csvContent, 'text/csv;charset=utf-8;');
}

/**
 * Trigger print/PDF view of the report
 */
export function printMonthlyReport(monthKey: string, state: AppState) {
  const mData = state.months[monthKey];
  if (!mData) return;

  // Pop-ups are blocked on claude.ai: save the report as an HTML file to open and print instead
  const printWindow = isClaudeArtifact ? null : window.open('', '_blank');
  if (!printWindow && !isClaudeArtifact) {
    notify(state.language === 'lo' ? 'ກະລຸນາອະນຸຍາດ Pop-up ເພື່ອພິມ' : 'กรุณาอนุญาต Pop-up เพื่อพิมพ์');
    return;
  }

  const rate = state.rates.usdLak;
  const totalExp = mData.expenses.reduce((acc, e) => acc + (e.amountLak || 0), 0);
  const totalInvUsd = mData.investments.reduce((acc, i) => acc + (i.amountUsd || 0), 0);
  const totalInvLak = totalInvUsd * rate;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>portMrker Report - ${monthKey}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; line-height: 1.5; }
          h1 { margin-bottom: 4px; color: #0f172a; font-size: 24px; }
          .subtitle { color: #64748b; font-size: 13px; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
          .card-title { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; }
          .card-value { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 24px; font-size: 13px; }
          th { text-align: left; background: #f1f5f9; padding: 8px; border-bottom: 2px solid #cbd5e1; font-weight: 600; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
          .text-right { text-align: right; }
          .tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; background: #e2e8f0; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1>📊 portMrker - ໃບສະຫຼຸບງົບປະມານ & ການລົງທຶນ</h1>
            <div class="subtitle">ປະຈຳເດືອນ: <strong>${formatMonthLabel(monthKey, state.language)} (${monthKey})</strong> | ອັດຕາແລກປ່ຽນ: $1 = ₭${rate.toLocaleString()}</div>
          </div>
          <button onclick="window.print()" style="padding: 8px 16px; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
            🖨️ ພິມ / Print to PDF
          </button>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">ລາຍຮັບເດືອນນີ້</div>
            <div class="card-value">₭${(mData.incomeLak || 0).toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="card-title">ລາຍຈ່າຍຕົວຈິງ</div>
            <div class="card-value">₭${totalExp.toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="card-title">ລົງທຶນທັງໝົດ ($)</div>
            <div class="card-value">$${totalInvUsd.toFixed(2)} USD</div>
            <div style="font-size: 11px; color: #64748b;">≈ ₭${totalInvLak.toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="card-title">ເງິນສຳຮອງສຸກເສີນເດືອນນີ້</div>
            <div class="card-value">₭${(mData.allocations.emergencyLak || 0).toLocaleString()}</div>
          </div>
        </div>

        <h3>1. ແຜນການຈັດສັນງົບປະມານ (15/35/15/10/25)</h3>
        <table>
          <thead>
            <tr>
              <th>ໝວດໝູ່</th>
              <th>ສັດສ່ວນ (%)</th>
              <th class="text-right">ແຜນທີ່ຕັ້ງໄວ້</th>
              <th class="text-right">ມູນຄ່າແປງເປັນກີບ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>🍽️ ຄ່າກິນຢູ່ & ຄ່າຄອງຊີບ</td>
              <td>${mData.allocations.foodLivingPct}%</td>
              <td class="text-right">₭${(mData.allocations.foodLivingLak || 0).toLocaleString()}</td>
              <td class="text-right">₭${(mData.allocations.foodLivingLak || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>📈 ຮຸ້ນສະຫະລັດ (US Stocks)</td>
              <td>${mData.allocations.usStocksPct}%</td>
              <td class="text-right">$${(mData.allocations.usStocksUsd || 0).toFixed(2)} USD</td>
              <td class="text-right">₭${((mData.allocations.usStocksUsd || 0) * rate).toLocaleString()}</td>
            </tr>
            <tr>
              <td>🏢 ກອງທຶນດັດຊະນີ & ETFs</td>
              <td>${mData.allocations.fundsEtfsPct}%</td>
              <td class="text-right">$${(mData.allocations.fundsEtfsUsd || 0).toFixed(2)} USD</td>
              <td class="text-right">₭${((mData.allocations.fundsEtfsUsd || 0) * rate).toLocaleString()}</td>
            </tr>
            <tr>
              <td>🪙 ບິດຄອຍ (Bitcoin DCA)</td>
              <td>${mData.allocations.bitcoinPct}%</td>
              <td class="text-right">$${(mData.allocations.bitcoinUsd || 0).toFixed(2)} USD</td>
              <td class="text-right">₭${((mData.allocations.bitcoinUsd || 0) * rate).toLocaleString()}</td>
            </tr>
            <tr>
              <td>🥇 ຄຳແທ່ງສະສົມ (Gold)</td>
              <td>${mData.allocations.goldPct}%</td>
              <td class="text-right">$${(mData.allocations.goldUsd || 0).toFixed(2)} USD</td>
              <td class="text-right">₭${((mData.allocations.goldUsd || 0) * rate).toLocaleString()}</td>
            </tr>
            <tr>
              <td>🛡️ ເງິນສຳຮອງສຸກເສີນ (Emergency Fund)</td>
              <td>${mData.allocations.emergencyPct}%</td>
              <td class="text-right">₭${(mData.allocations.emergencyLak || 0).toLocaleString()}</td>
              <td class="text-right">₭${(mData.allocations.emergencyLak || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <h3>2. ລາຍການລົງທຶນໃນເດືອນນີ້ (${mData.investments.length} ລາຍການ)</h3>
        ${
          mData.investments.length === 0
            ? '<p style="color: #94a3b8; font-style: italic;">ຍັງບໍ່ມີລາຍການລົງທຶນ</p>'
            : `
          <table>
            <thead>
              <tr>
                <th>ວັນທີ</th>
                <th>ປະເພດ</th>
                <th>ຊື່ຊັບສິນ</th>
                <th class="text-right">ຈຳນວນ USD</th>
                <th class="text-right">ແປງເປັນກີບ</th>
                <th>ໝາຍເຫດ</th>
              </tr>
            </thead>
            <tbody>
              ${mData.investments
                .map(
                  (inv) => `
                <tr>
                  <td>${inv.date}</td>
                  <td><span class="tag">${inv.assetType.toUpperCase()}</span></td>
                  <td><strong>${inv.assetName}</strong></td>
                  <td class="text-right">$${Number(inv.amountUsd).toFixed(2)}</td>
                  <td class="text-right">₭${Number(inv.amountLak).toLocaleString()}</td>
                  <td>${inv.note || '-'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
        }

        <h3>3. ລາຍການລາຍຈ່າຍໃນເດືອນນີ້ (${mData.expenses.length} ລາຍການ)</h3>
        ${
          mData.expenses.length === 0
            ? '<p style="color: #94a3b8; font-style: italic;">ຍັງບໍ່ມີລາຍການລາຍຈ່າຍ</p>'
            : `
          <table>
            <thead>
              <tr>
                <th>ວັນທີ</th>
                <th>ໝວດໝູ່ລາຍຈ່າຍ</th>
                <th class="text-right">ຈຳນວນເງິນ (ກີບ)</th>
                <th>ໝາຍເຫດ</th>
              </tr>
            </thead>
            <tbody>
              ${mData.expenses
                .map(
                  (exp) => `
                <tr>
                  <td>${exp.date}</td>
                  <td>${exp.category}</td>
                  <td class="text-right"><strong>₭${Number(exp.amountLak).toLocaleString()}</strong></td>
                  <td>${exp.note || '-'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
        }

        <div style="margin-top: 32px; border-top: 1px dashed #cbd5e1; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center;">
          ສ້າງລາຍງານໂດຍ portMrker • ເວລາ: ${new Date().toLocaleString()}
        </div>
      </body>
    </html>
  `;

  if (!printWindow) {
    saveFile(`portMrker-report-${monthKey}.html`, html.trim(), 'text/html');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}
