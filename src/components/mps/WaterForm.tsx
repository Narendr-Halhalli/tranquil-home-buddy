import { useMemo, useState } from "react";
import { useActiveMonth } from "@/hooks/useActiveMonth";
import { toast } from "sonner";
import { Save, Trash2, ChevronDown } from "lucide-react";
import type { MonthRecord, WaterData, FloorKey, FloorReading } from "@/lib/mps-store";
import {
  currentMonthKey,
  formatMonthKey,
  MONTH_NAMES,
  FLOORS,
  normalizeWater,
  borewellConsumption,
  kaveriConsumption,
  floorConsumption,
  totalFloorConsumption,
  waterLoss,
  costPerLitre,
} from "@/lib/mps-store";

export function WaterForm({
  records,
  setRecords,
}: {
  records: MonthRecord[];
  setRecords: (fn: (r: MonthRecord[]) => MonthRecord[]) => void;
}) {
  const { month, setMonth } = useActiveMonth();
  const existing = records.find(r => r.month === month);
  const [confirmDel, setConfirmDel] = useState(false);
  const [openFloor, setOpenFloor] = useState<FloorKey | null>("ground");

  // Carry forward previous month's ending readings as this month's starting readings
  const buildForm = (): WaterData => {
    const base = normalizeWater(existing?.water);
    if (existing?.water) return base;
    const [y, m] = month.split("-").map(Number);
    const prevKey = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
    const prev = records.find(r => r.month === prevKey)?.water;
    if (!prev) return base;
    const prevN = normalizeWater(prev);
    for (const f of FLOORS) {
      base.floors[f.key].borewellStart = prevN.floors[f.key].borewellEnd;
      base.floors[f.key].kaveriStart = prevN.floors[f.key].kaveriEnd;
    }
    return base;
  };

  const [form, setForm] = useState<WaterData>(buildForm);
  const key = month + (existing ? "1" : "0");
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setForm(buildForm());
  }

  const updateFloor = (fk: FloorKey, k: keyof FloorReading, v: number) =>
    setForm(f => ({ ...f, floors: { ...f.floors, [fk]: { ...f.floors[fk], [k]: v } } }));
  const updateTop = <K extends keyof WaterData>(k: K, v: WaterData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const totalCons = useMemo(() => totalFloorConsumption(form), [form]);
  const loss = useMemo(() => waterLoss(form), [form]);
  const cpl = useMemo(() => costPerLitre(form), [form]);

  const validate = (): string | null => {
    for (const f of FLOORS) {
      const fr = form.floors[f.key];
      if ((fr.borewellEnd || 0) < (fr.borewellStart || 0) && (fr.borewellStart || 0) > 0)
        return `${f.label}: Borewell end cannot be below start`;
      if ((fr.kaveriEnd || 0) < (fr.kaveriStart || 0) && (fr.kaveriStart || 0) > 0)
        return `${f.label}: Kaveri end cannot be below start`;
    }
    if ((form.bwssb || 0) <= 0) return "BWSSB bill amount is required";
    return null;
  };

  const save = () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setRecords(prev => {
      const idx = prev.findIndex(r => r.month === month);
      const rec: MonthRecord = idx >= 0 ? { ...prev[idx] } : { month };
      rec.water = form;
      return idx >= 0 ? prev.map((r, i) => i === idx ? rec : r) : [...prev, rec];
    });
    toast.success(`Water saved for ${formatMonthKey(month)}`);
  };

  const del = () => {
    setRecords(prev => prev.map(r => {
      if (r.month !== month) return r;
      const { water: _, ...rest } = r;
      return rest as MonthRecord;
    }).filter(r => r.water || r.electricity || r.watchman || (r.misc && r.misc.length)));
    toast.success("Water entry deleted");
    setForm(normalizeWater(undefined));
    setConfirmDel(false);
  };

  return (
    <div className="space-y-5 pb-32">
      {/* Section 1: Monthly Summary */}
      <div>
        <div className="rounded-[28px] bg-white/90 backdrop-blur-xl border border-white/70 shadow-[0_20px_60px_-20px_rgba(59,130,246,0.35)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <MonthPicker value={month} onChange={setMonth} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Litres Recv." value={form.totalLitresReceived || 0} />
            <Metric label="BWSSB Bill" value={form.bwssb || 0} unit="₹" />
            <Metric label="₹ / Litre" value={Math.round(cpl * 100) / 100} />
            <Metric label="Block Total" value={totalCons} highlight />
            <Metric label="Loss" value={loss} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberField label="Total Litres Received" compact value={form.totalLitresReceived || 0} onChange={v => updateTop("totalLitresReceived", v)} />
            <NumberField label="BWSSB Bill Amount" compact value={form.bwssb} onChange={v => updateTop("bwssb", v)} />
          </div>
        </div>
      </div>

      {/* Section 2: Four Floor Cards */}
      <div className="space-y-3">
        {FLOORS.map(f => {
          const fr = form.floors[f.key];
          const bc = borewellConsumption(fr);
          const kc = kaveriConsumption(fr);
          const tc = floorConsumption(fr);
          const isOpen = openFloor === f.key;
          return (
            <div key={f.key} className="rounded-[24px] bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_-12px_rgba(59,130,246,0.15)] overflow-hidden">
              <button onClick={() => setOpenFloor(isOpen ? null : f.key)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/60 transition-colors">
                <div>
                  <div className="text-base font-bold tracking-tight text-slate-900">{f.label}</div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                    BW {bc} · Kaveri {kc}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1">{tc} units</span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 mps-fade-in space-y-4">
                  <FieldGroup title="Borewell">
                    <NumberField label="Start" value={fr.borewellStart} onChange={v => updateFloor(f.key, "borewellStart", v)} />
                    <NumberField label="End" value={fr.borewellEnd} onChange={v => updateFloor(f.key, "borewellEnd", v)} invalid={fr.borewellEnd < fr.borewellStart && fr.borewellStart > 0} />
                  </FieldGroup>
                  <FieldGroup title="Kaveri">
                    <NumberField label="Start" value={fr.kaveriStart} onChange={v => updateFloor(f.key, "kaveriStart", v)} />
                    <NumberField label="End" value={fr.kaveriEnd} onChange={v => updateFloor(f.key, "kaveriEnd", v)} invalid={fr.kaveriEnd < fr.kaveriStart && fr.kaveriStart > 0} />
                  </FieldGroup>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Section 4: Results Table */}
      <ResultsTable form={form} />

      <div className="flex gap-3">
        <button onClick={save} className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary text-white py-4 font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all">
          <Save size={18} /> Save
        </button>
        {existing?.water && (
          <button onClick={() => setConfirmDel(true)} className="rounded-full bg-white border border-red-200 text-red-500 px-6 py-4 font-semibold hover:bg-red-50 transition-all">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-6" onClick={() => setConfirmDel(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete water entry?</h3>
            <p className="text-sm text-slate-500 mt-1">This removes water data for {formatMonthKey(month)}.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmDel(false)} className="flex-1 rounded-full bg-slate-100 py-3 font-medium">Cancel</button>
              <button onClick={del} className="flex-1 rounded-full bg-red-500 text-white py-3 font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsTable({ form }: { form: WaterData }) {
  const total = totalFloorConsumption(form);
  const bill = form.bwssb || 0;
  const loss = waterLoss(form);
  // Common amount = share of loss proportional to floor consumption × cost/litre? Simple: distribute loss cost equally.
  // Interpret Common Amount = (Water Loss / floors) × (bill/total), i.e. equal share of loss cost.
  const perUnitCost = total > 0 && bill > 0 ? bill / total : 0;
  const commonAmountEach = perUnitCost * loss / 4;
  const rows = FLOORS.map(f => {
    const cons = floorConsumption(form.floors[f.key]);
    const pct = total > 0 ? cons / total : 0;
    const home = Math.round(pct * bill);
    const commonAmt = Math.round(commonAmountEach);
    return {
      key: f.key,
      label: f.label,
      cons,
      pct,
      home,
      commonAmt,
      final: home + commonAmt,
    };
  });
  const totals = rows.reduce((a, r) => ({
    cons: a.cons + r.cons,
    home: a.home + r.home,
    commonAmt: a.commonAmt + r.commonAmt,
    final: a.final + r.final,
  }), { cons: 0, home: 0, commonAmt: 0, final: 0 });
  return (
    <div className="rounded-[24px] bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_-12px_rgba(59,130,246,0.15)] overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="text-base font-bold tracking-tight text-slate-900">Cost Distribution</div>
        <div className="text-[11px] font-medium text-slate-500 mt-0.5">Auto-calculated · Read-only</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50/80 backdrop-blur">
            <tr className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="text-left px-4 py-2.5">Floor</th>
              <th className="text-right px-2 py-2.5">Cons.</th>
              <th className="text-right px-2 py-2.5">%</th>
              <th className="text-right px-2 py-2.5">Home</th>
              <th className="text-right px-2 py-2.5">Common</th>
              <th className="text-right px-4 py-2.5">Final</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-2.5 font-semibold text-slate-800">{r.label}</td>
                <td className="text-right px-2 py-2.5 tabular-nums">{r.cons}</td>
                <td className="text-right px-2 py-2.5 tabular-nums text-slate-500">{(r.pct * 100).toFixed(1)}%</td>
                <td className="text-right px-2 py-2.5 tabular-nums">₹{r.home.toLocaleString()}</td>
                <td className="text-right px-2 py-2.5 tabular-nums text-slate-500">₹{r.commonAmt.toLocaleString()}</td>
                <td className="text-right px-4 py-2.5 tabular-nums font-bold text-primary">₹{r.final.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="border-t border-slate-200 bg-slate-50/60">
              <td className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">Total</td>
              <td className="text-right px-2 py-2.5 tabular-nums font-bold">{totals.cons}</td>
              <td className="text-right px-2 py-2.5 tabular-nums text-slate-400">100%</td>
              <td className="text-right px-2 py-2.5 tabular-nums font-bold">₹{totals.home.toLocaleString()}</td>
              <td className="text-right px-2 py-2.5 tabular-nums font-bold">₹{totals.commonAmt.toLocaleString()}</td>
              <td className="text-right px-4 py-2.5 tabular-nums font-bold text-primary">₹{totals.final.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [y, m] = value.split("-");
  const years: number[] = [];
  const cy = new Date().getFullYear();
  for (let i = cy - 3; i <= cy + 1; i++) years.push(i);
  return (
    <div className="flex gap-2 w-full">
      <select value={m} onChange={e => onChange(`${y}-${e.target.value}`)} className="flex-1 rounded-2xl bg-secondary/70 border border-white/60 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40">
        {MONTH_NAMES.map((n, i) => <option key={n} value={String(i + 1).padStart(2, "0")}>{n}</option>)}
      </select>
      <select value={y} onChange={e => onChange(`${e.target.value}-${m}`)} className="w-28 rounded-2xl bg-secondary/70 border border-white/60 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40">
        {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
      </select>
    </div>
  );
}

function NumberField({ label, value, onChange, invalid, compact }: { label: string; value: number; onChange: (n: number) => void; invalid?: boolean; compact?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 mb-1.5 block">{label}</span>
      <input
        type="number"
        min={0}
        value={Number.isFinite(value) ? value : 0}
        onChange={e => {
          const v = parseFloat(e.target.value);
          onChange(Number.isFinite(v) && v >= 0 ? v : 0);
        }}
        className={`w-full rounded-2xl bg-white border px-4 ${compact ? "py-2.5 text-base" : "py-3 text-lg"} font-semibold text-slate-900 focus:outline-none focus:ring-2 transition-all ${invalid ? "border-red-300 focus:ring-red-300/40" : "border-slate-200 focus:ring-primary/40 focus:border-primary/40"}`}
      />
    </label>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Metric({ label, value, unit, highlight }: { label: string; value: number; unit?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl px-3 py-2.5 ${highlight ? "bg-gradient-to-br from-primary to-blue-500 text-white shadow-md shadow-primary/30" : "bg-secondary/60"}`}>
      <div className={`text-[9px] font-semibold uppercase tracking-wide ${highlight ? "text-white/80" : "text-slate-500"}`}>{label}</div>
      <div className={`mt-0.5 text-base font-bold tabular-nums tracking-tight ${highlight ? "text-white" : "text-slate-900"}`}>
        {unit === "₹" ? "₹" : ""}{Number(value).toLocaleString()}
      </div>
    </div>
  );
}
