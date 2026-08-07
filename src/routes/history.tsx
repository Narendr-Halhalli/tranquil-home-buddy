import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Pencil, Trash2, Droplets, Zap, Wrench, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { MonthRecord, Settings } from "@/lib/mps-store";
import {
  DEFAULT_SETTINGS,
  formatMonthKey,
  MONTH_NAMES,
  FLOORS,
  monthTotal,
  miscTotal,
  floorConsumptions,
  totalFloorConsumption,
  floorShares,
  commonReadingTotal,
  waterLoss,
  normalizeWater,
} from "@/lib/mps-store";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "History — MPS Tranquil" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [records, setRecords] = useLocalStorage<MonthRecord[]>("mps.records", []);
  const [settings] = useLocalStorage<Settings>("mps.settings", DEFAULT_SETTINGS);
  const [q, setQ] = useState("");
  const [year, setYear] = useState<string>("all");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const years = useMemo(() => {
    const s = new Set(records.map(r => r.month.split("-")[0]));
    return Array.from(s).sort().reverse();
  }, [records]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return [...records]
      .filter(r => year === "all" || r.month.startsWith(year))
      .filter(r => {
        if (!ql) return true;
        const label = formatMonthKey(r.month).toLowerCase();
        const mIdx = parseInt(r.month.split("-")[1], 10) - 1;
        const mName = MONTH_NAMES[mIdx].toLowerCase();
        return label.includes(ql) || mName.includes(ql) || r.month.includes(ql);
      })
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [records, q, year]);

  const del = (month: string) => {
    setRecords(prev => prev.filter(r => r.month !== month));
    toast.success("Month deleted");
    setConfirmDel(null);
  };

  const c = settings.currency;

  return (
    <div className="mps-fade-in space-y-5 pb-32">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">History</h1>
        <p className="text-sm text-slate-500 mt-1">{filtered.length} record{filtered.length===1?"":"s"}</p>
      </div>

      <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-sm p-3 flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search size={16} className="text-slate-400"/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by month" className="flex-1 bg-transparent py-2 text-sm focus:outline-none"/>
        </div>
        <select value={year} onChange={e => setYear(e.target.value)} className="rounded-xl bg-secondary/70 px-3 py-2 text-sm font-medium">
          <option value="all">All years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/70 p-10 text-center">
          <p className="text-slate-500">No records yet.</p>
          <p className="text-sm text-slate-400 mt-1">Add entries in Water, Electricity or Miscellaneous.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(r => {
          const w = r.water?.bwssb ?? 0;
          const e = r.electricity?.bill ?? 0;
          const mi = miscTotal(r);
          const total = monthTotal(r);
          const isOpen = open === r.month;
          const water = normalizeWater(r.water);
          const cons = floorConsumptions(water);
          const totalCons = totalFloorConsumption(water);
          const shares = floorShares(water);
          return (
            <div key={r.month} className="rounded-[24px] bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_10px_30px_-15px_rgba(30,64,175,0.25)] p-5">
              <div className="flex items-start justify-between">
                <button onClick={() => setOpen(isOpen ? null : r.month)} className="text-left flex-1">
                  <div className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    {formatMonthKey(r.month)}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}/>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Grand Total</div>
                  <div className="text-2xl font-bold text-primary mt-0.5">{c}{total.toLocaleString()}</div>
                </button>
                <div className="flex gap-2">
                  <Link to="/water" className="rounded-full bg-secondary/70 hover:bg-secondary p-2.5 text-primary" aria-label="Edit"><Pencil size={16}/></Link>
                  <button onClick={() => setConfirmDel(r.month)} className="rounded-full bg-red-50 hover:bg-red-100 p-2.5 text-red-500" aria-label="Delete"><Trash2 size={16}/></button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniPill icon={<Droplets size={14}/>} label="Water" value={`${c}${w.toLocaleString()}`}/>
                <MiniPill icon={<Zap size={14}/>} label="Power" value={`${c}${e.toLocaleString()}`}/>
                <MiniPill icon={<Wrench size={14}/>} label="Misc" value={`${c}${mi.toLocaleString()}`}/>
              </div>

              {isOpen && (
                <div className="mt-4 space-y-3 mps-fade-in">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Floor Consumption</div>
                    <div className="grid grid-cols-2 gap-2">
                      {FLOORS.map(f => (
                        <div key={f.key} className="rounded-2xl bg-secondary/60 px-3 py-2.5">
                          <div className="text-[10px] uppercase text-slate-500">{f.label}</div>
                          <div className="text-sm font-bold text-slate-900">{cons[f.key]} units</div>
                        </div>
                      ))}
                      <div className="col-span-2 rounded-2xl bg-primary/10 px-3 py-2.5">
                        <div className="text-[10px] uppercase text-primary/80">Total Consumption</div>
                        <div className="text-sm font-bold text-primary">{totalCons} units</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Common Meters</div>
                    <div className="grid grid-cols-3 gap-2">
                      <MiniPill label="Basement @ Terrace" value={`${water.common.basementTerrace ?? 0}`} />
                      <MiniPill label="Basement @ Parking" value={`${water.common.basementParking ?? 0}`} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Common total</span><span className="font-semibold text-slate-800">{commonReadingTotal(water)} units</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Water loss / common usage</span><span className="font-semibold text-slate-800">{waterLoss(water)} units</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Water bill</span><span className="font-semibold text-slate-800">{c}{w.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Individual Floor Share</div>
                    <div className="grid grid-cols-2 gap-2">
                      {FLOORS.map(f => (
                        <div key={f.key} className="rounded-2xl bg-white border border-slate-100 px-3 py-2.5">
                          <div className="text-[10px] uppercase text-slate-500">{f.label}</div>
                          <div className="text-sm font-bold text-slate-900">{c}{shares[f.key].toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {r.misc && r.misc.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Miscellaneous</div>
                      <div className="space-y-1.5">
                        {r.misc.map(m => (
                          <div key={m.id} className="flex items-center justify-between text-xs bg-secondary/50 rounded-xl px-3 py-2">
                            <span className="text-slate-700"><span className="font-semibold">{m.category}</span> · {m.description}</span>
                            <span className="font-semibold text-slate-900">{c}{m.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-6" onClick={() => setConfirmDel(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete entire month?</h3>
            <p className="text-sm text-slate-500 mt-1">{formatMonthKey(confirmDel)} will be permanently removed.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 rounded-full bg-slate-100 py-3 font-medium">Cancel</button>
              <button onClick={() => del(confirmDel)} className="flex-1 rounded-full bg-red-500 text-white py-3 font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniPill({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/60 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {icon}{label}
      </div>
      <div className="mt-0.5 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}
