import type { MonthRecord, Settings } from "./mps-store";
import {
  formatMonthKey,
  waterConsumption,
  electricityUnits,
  watchmanTotal,
  monthTotal,
} from "./mps-store";

export function exportCSV(records: MonthRecord[], settings: Settings) {
  const rows = [
    ["Month","Kaveri In","Kaveri Out","Kaveri Consumption","Borewell In","Borewell Out","Borewell Consumption","Total Water","Water Bill","Elec Prev","Elec Curr","Units","Elec Bill","Salary","Bonus","Extra","Watchman Total","Grand Total"],
  ];
  const sorted = [...records].sort((a, b) => b.month.localeCompare(a.month));
  for (const r of sorted) {
    const w = r.water; const wc = waterConsumption(w);
    const e = r.electricity; const eu = electricityUnits(e);
    const m = r.watchman; const wt = watchmanTotal(m);
    rows.push([
      formatMonthKey(r.month),
      w?.kaveriIn ?? "", w?.kaveriOut ?? "", wc.kaveri,
      w?.borewellIn ?? "", w?.borewellOut ?? "", wc.borewell,
      wc.total, w?.bwssb ?? "",
      e?.prev ?? "", e?.curr ?? "", eu, e?.bill ?? "",
      m?.salary ?? "", m?.bonus ?? "", m?.extra ?? "", wt,
      monthTotal(r),
    ].map(v => String(v)));
  }
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g,'""')}"`).join(",")).join("\n");
  download(`${settings.apartmentName.replace(/\s+/g,"_")}_records.csv`, csv, "text/csv");
}

export function exportPDF(records: MonthRecord[], settings: Settings) {
  const sorted = [...records].sort((a, b) => b.month.localeCompare(a.month));
  const html = `<!doctype html><html><head><title>${settings.apartmentName} Report</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',system-ui,sans-serif;padding:40px;color:#0f172a;background:#f5f7fb}
    h1{font-size:32px;margin:0 0 4px}
    .sub{color:#64748b;margin-bottom:32px}
    .card{background:#fff;border-radius:20px;padding:20px 24px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
    .card h2{margin:0 0 12px;font-size:20px;color:#3B82F6}
    .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
    .row span:first-child{color:#64748b}
    .total{border-top:1px solid #e2e8f0;margin-top:10px;padding-top:10px;font-weight:600;font-size:16px}
    @media print{body{padding:20px;background:#fff}}
  </style></head><body>
  <h1>${settings.apartmentName}</h1>
  <div class="sub">Monthly Expense Report · ${settings.flats} flats</div>
  ${sorted.map(r => {
    const wc = waterConsumption(r.water);
    const eu = electricityUnits(r.electricity);
    const wt = watchmanTotal(r.watchman);
    const c = settings.currency;
    return `<div class="card"><h2>${formatMonthKey(r.month)}</h2>
      <div class="row"><span>Water Consumption</span><span>${wc.total} units</span></div>
      <div class="row"><span>Water Bill</span><span>${c}${r.water?.bwssb ?? 0}</span></div>
      <div class="row"><span>Electricity Units</span><span>${eu}</span></div>
      <div class="row"><span>Electricity Bill</span><span>${c}${r.electricity?.bill ?? 0}</span></div>
      <div class="row"><span>Watchman Total</span><span>${c}${wt}</span></div>
      <div class="row total"><span>Grand Total</span><span>${c}${monthTotal(r)}</span></div>
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
