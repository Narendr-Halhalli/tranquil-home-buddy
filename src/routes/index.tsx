import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Droplets, Zap, Wrench, Wallet, TrendingUp, TrendingDown, Download, FileText } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { MonthRecord, Settings } from "@/lib/mps-store";
import {
  DEFAULT_SETTINGS,
  currentMonthKey,
  formatMonthKey,
  MONTH_NAMES,
  FLOORS,
  totalFloorConsumption,
  floorShares,
  electricityUnits,
  electricityAmount,
  miscTotal,
  watchmanTotal,
  monthTotal,
  perFlatShare,
  completeness,
  analytics,
  prevMonthKey,
} from "@/lib/mps-store";
import { ProgressRing } from "@/components/mps/ProgressRing";
import { SettingsButton } from "@/components/mps/SettingsButton";
import { exportCSV, exportPDF } from "@/lib/mps-export";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const [records] = useLocalStorage<MonthRecord[]>("mps.records", []);
  const [settings, setSettings] = useLocalStorage<Settings>("mps.settings", DEFAULT_SETTINGS);
  const [activeMonth, setActiveMonth] = useLocalStorage<string>("mps.activeMonth", currentMonthKey());

  const rec = useMemo(() => records.find(r => r.month === activeMonth), [records, activeMonth]);
  const prev = useMemo(() => records.find(r => r.month === prevMonthKey(activeMonth)), [records, activeMonth]);
  const pct = completeness(rec);
  const a = useMemo(() => analytics(records, activeMonth), [records, activeMonth]);

  const now = new Date();
  const [y, m] = activeMonth.split("-").map(Number);
  const isCurrent = activeMonth === currentMonthKey();

  const c = settings.currency;
  const shares = floorShares(rec?.water);
  const totalWaterCons = totalFloorConsumption(rec?.water);
  const waterBill = rec?.water?.bwssb ?? 0;
  const flats = settings.flats > 0 ? settings.flats : 4;
  const perFlat = perFlatShare(rec, flats);

  return (
    <div className="mps-fade-in space-y-6 pb-32">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-primary/80">{settings.apartmentName}</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {MONTH_NAMES[m-1]} <span className="text-slate-400">{y}</span>
          </h1>
          <div className="mt-1 text-sm text-slate-500">
            {isCurrent ? now.toLocaleDateString(undefined, { weekday:"long", day:"numeric", month:"long" }) : formatMonthKey(activeMonth)}
          </div>
        </div>
        <SettingsButton settings={settings} setSettings={setSettings} />
      </div>

      <MonthSelect value={activeMonth} onChange={setActiveMonth} />

      <div className="relative overflow-hidden rounded-[28px] bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_20px_60px_-20px_rgba(59,130,246,0.35)] p-6">
        <div className="flex items-center gap-6">
          <ProgressRing value={pct} label="Entries" sublabel={`${Math.round(pct/25)}/4 modules`} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Monthly Total</div>
            <div className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
              {c}{monthTotal(rec).toLocaleString()}
            </div>
            <DiffBadge diff={a.diff} currency={c} />
          </div>
        </div>
      </div>

      {/* Final contribution per flat */}
      <div className="rounded-[28px] bg-gradient-to-br from-primary to-blue-500 text-white shadow-[0_20px_60px_-20px_rgba(59,130,246,0.55)] p-6">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">Final Contribution Per Flat</div>
        <div className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
          {c}{Math.round(perFlat).toLocaleString()}
        </div>
        <div className="mt-2 text-[11px] font-medium text-white/80">
          Total expense {c}{monthTotal(rec).toLocaleString()} ÷ {flats} flats
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/15 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wide text-white/70">Water + Electricity</div>
            <div className="mt-0.5 text-sm font-bold">{c}{(waterBill + electricityAmount(rec?.electricity)).toLocaleString()}</div>
          </div>
          <div className="rounded-2xl bg-white/15 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wide text-white/70">Watchman + Misc</div>
            <div className="mt-0.5 text-sm font-bold">{c}{(watchmanTotal(rec?.watchman) + miscTotal(rec)).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Water summary with floor split */}
      <div className="rounded-[28px] bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_10px_30px_-15px_rgba(30,64,175,0.25)] p-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-white w-9 h-9 shadow-md"><Droplets size={18}/></div>
          <div className="flex-1">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Water</div>
            <div className="text-lg font-bold text-slate-900">{c}{waterBill.toLocaleString()} <span className="text-slate-400 text-sm font-medium">· {totalWaterCons} units</span></div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">Cost</div>
            <div className="text-sm font-bold text-primary">{c}{waterBill.toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {FLOORS.map(f => (
            <div key={f.key} className="rounded-2xl bg-secondary/60 px-3 py-2.5">
              <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{f.label}</div>
              <div className="mt-0.5 text-sm font-bold text-slate-900">{c}{shares[f.key].toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Overview stat cards: Water, Electricity, Misc, Grand Total */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Droplets size={18}/>} label="Water" value={`${c}${waterBill.toLocaleString()}`}
          delta={waterBill - (prev?.water?.bwssb ?? 0)} currency={c} tint="from-sky-400 to-blue-500" />
        <StatCard icon={<Zap size={18}/>} label="Electricity" value={`${c}${electricityAmount(rec?.electricity).toLocaleString()}`}
          delta={electricityAmount(rec?.electricity) - electricityAmount(prev?.electricity)} currency={c} tint="from-amber-400 to-orange-500" />
        <StatCard icon={<Wrench size={18}/>} label="Miscellaneous" value={`${c}${miscTotal(rec).toLocaleString()}`}
          delta={miscTotal(rec) - miscTotal(prev)} currency={c} tint="from-violet-400 to-indigo-500" />
        <StatCard icon={<Wallet size={18}/>} label="Grand Total" value={`${c}${monthTotal(rec).toLocaleString()}`}
          delta={a.diff} currency={c} tint="from-emerald-400 to-teal-500" />
      </div>

      <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-white/70 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">This Month</h3>
        <div className="mt-3 divide-y divide-slate-100">
          <Row label="Total Water Consumption" value={`${totalWaterCons} units`} />
          <Row label="Electricity Units" value={`${electricityUnits(rec?.electricity)} kWh`} />
          <Row label="Miscellaneous" value={`${c}${miscTotal(rec).toLocaleString()}`} />
        </div>
      </div>

      <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-white/70 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Analytics</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <AnalyticTile label="Previous Month" value={`${c}${a.prevTotal.toLocaleString()}`} />
          <AnalyticTile label="Average Monthly" value={`${c}${Math.round(a.avg).toLocaleString()}`} />
          <AnalyticTile label="Highest" value={a.highest.month === "-" ? "—" : `${c}${a.highest.total.toLocaleString()}`} sub={a.highest.month === "-" ? "" : formatMonthKey(a.highest.month)} />
          <AnalyticTile label="Lowest" value={a.lowest.month === "-" ? "—" : `${c}${a.lowest.total.toLocaleString()}`} sub={a.lowest.month === "-" ? "" : formatMonthKey(a.lowest.month)} />
          <div className="col-span-2">
            <AnalyticTile label={`Total ${activeMonth.split("-")[0]}`} value={`${c}${a.yearTotal.toLocaleString()}`} highlight />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => exportCSV(records, settings)} className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white/80 backdrop-blur-xl border border-white/70 py-3.5 font-medium text-slate-700 hover:bg-white transition-all shadow-sm">
          <Download size={16}/> Export CSV
        </button>
        <button onClick={() => exportPDF(records, settings)} className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary text-white py-3.5 font-medium shadow-lg shadow-primary/30 hover:scale-[1.01] transition-all">
          <FileText size={16}/> PDF Report
        </button>
      </div>
    </div>
  );
}

function MonthSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [y, m] = value.split("-");
  const years: number[] = [];
  const cy = new Date().getFullYear();
  for (let i = cy - 3; i <= cy + 1; i++) years.push(i);
  return (
    <div className="flex gap-2">
      <select value={m} onChange={e => onChange(`${y}-${e.target.value}`)} className="flex-1 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/70 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40">
        {MONTH_NAMES.map((n, i) => <option key={n} value={String(i+1).padStart(2,"0")}>{n}</option>)}
      </select>
      <select value={y} onChange={e => onChange(`${e.target.value}-${m}`)} className="w-28 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/70 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40">
        {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
      </select>
    </div>
  );
}

function StatCard({ icon, label, value, delta, currency, tint }: { icon: React.ReactNode; label: string; value: string; delta: number; currency: string; tint: string }) {
  return (
    <div className="rounded-[24px] bg-white/85 backdrop-blur-xl border border-white/70 p-4 shadow-[0_8px_24px_-12px_rgba(30,64,175,0.15)] transition-all hover:shadow-[0_12px_32px_-12px_rgba(59,130,246,0.35)] hover:-translate-y-0.5 duration-250">
      <div className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${tint} text-white w-9 h-9 shadow-md`}>{icon}</div>
      <div className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">{value}</div>
      <DiffBadge diff={delta} currency={currency} small />
    </div>
  );
}

function DiffBadge({ diff, currency, small }: { diff: number; currency: string; small?: boolean }) {
  if (!diff) return <div className={`${small ? "text-[10px]" : "text-xs"} text-slate-400 mt-1`}>No change</div>;
  const up = diff > 0;
  return (
    <div className={`${small ? "text-[10px]" : "text-xs"} mt-1 inline-flex items-center gap-1 font-medium ${up ? "text-red-500" : "text-emerald-500"}`}>
      {up ? <TrendingUp size={small ? 10 : 12}/> : <TrendingDown size={small ? 10 : 12}/>}
      {up ? "+" : "−"}{currency}{Math.abs(diff).toLocaleString()}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function AnalyticTile({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${highlight ? "bg-gradient-to-br from-primary to-blue-500 text-white shadow-lg shadow-primary/30" : "bg-secondary/60"}`}>
      <div className={`text-[10px] font-medium uppercase tracking-wide ${highlight ? "text-white/80" : "text-slate-500"}`}>{label}</div>
      <div className={`mt-1 text-lg font-bold tracking-tight ${highlight ? "text-white" : "text-slate-900"}`}>{value}</div>
      {sub && <div className={`text-[10px] mt-0.5 ${highlight ? "text-white/70" : "text-slate-400"}`}>{sub}</div>}
    </div>
  );
}
