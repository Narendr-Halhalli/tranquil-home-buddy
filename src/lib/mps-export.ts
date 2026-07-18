import type { MonthRecord, Settings } from "./mps-store";
import {
  formatMonthKey,
  floorConsumptions,
  totalFloorConsumption,
  floorShares,
  electricityUnits,
  electricityAmount,
  electricityAvgCost,
  electricitySharePerFloor,
  miscTotal,
  watchmanTotal,
  monthTotal,
  commonReadingTotal,
  waterLoss,
} from "./mps-store";

export function exportCSV(records: MonthRecord[], settings: Settings) {
  const rows = [
    [
      "Month",
      "Ground Consumption","First Consumption","Second Consumption","Third Consumption","Total Consumption",
      "Basement","Terrace","Park Borewell","Common Total","Water Loss",
      "BWSSB Amount","Ground Share","First Share","Second Share","Third Share",
      "Elec Units","Elec Amount","Elec Floors","Share/Floor","Avg Cost/Unit","Billing Period","Paid By","Paid On",
      "Watchman Total","Miscellaneous","Grand Total",
    ],
  ];
  const sorted = [...records].sort((a, b) => b.month.localeCompare(a.month));
  for (const r of sorted) {
    const cons = floorConsumptions(r.water);
    const shares = floorShares(r.water);
    const eu = electricityUnits(r.electricity);
    const ea = electricityAmount(r.electricity);
    rows.push([
      formatMonthKey(r.month),
      cons.ground, cons.first, cons.second, cons.third, totalFloorConsumption(r.water),
      r.water?.common?.basement ?? 0, r.water?.common?.terrace ?? 0, r.water?.common?.parkBorewell ?? 0,
      commonReadingTotal(r.water), waterLoss(r.water),
      r.water?.bwssb ?? 0, shares.ground, shares.first, shares.second, shares.third,
      eu, ea, r.electricity?.floors ?? "", Math.round(electricitySharePerFloor(r.electricity)),
      Math.round(electricityAvgCost(r.electricity) * 100) / 100, r.electricity?.billingPeriod ?? "",
      r.electricity?.paidBy ?? "", r.electricity?.paidOn ?? "",
      watchmanTotal(r.watchman), miscTotal(r), monthTotal(r),
    ].map(v => String(v)));
  }
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g,'""')}"`).join(",")).join("\n");
  download(`${settings.apartmentName.replace(/\s+/g,"_")}_records.csv`, csv, "text/csv");
}

export function exportPDF(records: MonthRecord[], settings: Settings) {
  const sorted = [...records].sort((a, b) => b.month.localeCompare(a.month));
  const c = settings.currency;
  const html = `<!doctype html><html><head><title>${settings.apartmentName} Report</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',system-ui,sans-serif;padding:40px;color:#0f172a;background:#f5f7fb}
    h1{font-size:32px;margin:0 0 4px}
    h3{margin:14px 0 6px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
    .sub{color:#64748b;margin-bottom:32px}
    .card{background:#fff;border-radius:20px;padding:20px 24px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
    .card h2{margin:0 0 12px;font-size:20px;color:#3B82F6}
    .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
    .row span:first-child{color:#64748b}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px}
    .total{border-top:1px solid #e2e8f0;margin-top:10px;padding-top:10px;font-weight:600;font-size:16px}
    table{width:100%;font-size:12px;border-collapse:collapse;margin-top:6px}
    th,td{text-align:left;padding:4px 6px;border-bottom:1px solid #f1f5f9}
    @media print{body{padding:20px;background:#fff}}
  </style></head><body>
  <h1>${settings.apartmentName}</h1>
  <div class="sub">Monthly Expense Report · ${settings.flats} flats · 4 floors</div>
  ${sorted.map(r => {
    const cons = floorConsumptions(r.water);
    const shares = floorShares(r.water);
    const totalCons = totalFloorConsumption(r.water);
    const eu = electricityUnits(r.electricity);
    const ea = electricityAmount(r.electricity);
    const avg = Math.round(electricityAvgCost(r.electricity) * 100) / 100;
    const sharePerFloor = Math.round(electricitySharePerFloor(r.electricity));
    return `<div class="card"><h2>${formatMonthKey(r.month)}</h2>
      <h3>Water — Floor Consumption</h3>
      <div class="grid">
        <div class="row"><span>Ground</span><span>${cons.ground} u</span></div>
        <div class="row"><span>First</span><span>${cons.first} u</span></div>
        <div class="row"><span>Second</span><span>${cons.second} u</span></div>
        <div class="row"><span>Third</span><span>${cons.third} u</span></div>
      </div>
      <div class="row"><span>Total Consumption</span><span>${totalCons} u</span></div>
      <div class="row"><span>Common Meters (B/T/PB)</span><span>${r.water?.common?.basement ?? 0} / ${r.water?.common?.terrace ?? 0} / ${r.water?.common?.parkBorewell ?? 0}</span></div>
      <div class="row"><span>Water Loss / Common Usage</span><span>${waterLoss(r.water)} u</span></div>
      <div class="row"><span>BWSSB Bill</span><span>${c}${(r.water?.bwssb ?? 0).toLocaleString()}</span></div>
      <h3>Floor Share</h3>
      <div class="grid">
        <div class="row"><span>Ground</span><span>${c}${shares.ground.toLocaleString()}</span></div>
        <div class="row"><span>First</span><span>${c}${shares.first.toLocaleString()}</span></div>
        <div class="row"><span>Second</span><span>${c}${shares.second.toLocaleString()}</span></div>
        <div class="row"><span>Third</span><span>${c}${shares.third.toLocaleString()}</span></div>
      </div>
      <h3>Electricity</h3>
      ${r.electricity?.accountNumber ? `<div class="row"><span>Account</span><span>${r.electricity.accountNumber}</span></div>` : ""}
      <div class="row"><span>Units</span><span>${eu} kWh</span></div>
      <div class="row"><span>Amount</span><span>${c}${ea.toLocaleString()}</span></div>
      <div class="row"><span>Floors</span><span>${r.electricity?.floors ?? "—"}</span></div>
      <div class="row"><span>Share / Floor</span><span>${c}${sharePerFloor.toLocaleString()}</span></div>
      <div class="row"><span>Avg Cost / Unit</span><span>${c}${avg}</span></div>
      ${r.electricity?.billingPeriod ? `<div class="row"><span>Billing Period</span><span>${r.electricity.billingPeriod}</span></div>` : ""}
      ${r.electricity?.paidBy ? `<div class="row"><span>Paid By</span><span>${r.electricity.paidBy}</span></div>` : ""}
      ${r.electricity?.paidOn ? `<div class="row"><span>Paid On</span><span>${r.electricity.paidOn}</span></div>` : ""}
      <h3>Watchman &amp; Miscellaneous</h3>
      <div class="row"><span>Watchman Total</span><span>${c}${watchmanTotal(r.watchman).toLocaleString()}</span></div>
      <div class="row"><span>Miscellaneous</span><span>${c}${miscTotal(r).toLocaleString()}</span></div>
      ${r.misc && r.misc.length ? `<table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>${r.misc.map(m => `<tr><td>${m.date}</td><td>${m.category}</td><td>${m.description}</td><td style="text-align:right">${c}${m.amount.toLocaleString()}</td></tr>`).join("")}</tbody></table>` : ""}
      <div class="row total"><span>Grand Total</span><span>${c}${monthTotal(r).toLocaleString()}</span></div>
    </div>`;
  }).join("")}
  <script>window.onload=()=>{window.print()}</script>
  </body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

function download(name: string, data: string, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
