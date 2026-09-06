import { useState } from "react";
import { useActiveMonth } from "@/hooks/useActiveMonth";
import { toast } from "sonner";
import { Trash2, Save } from "lucide-react";
import type { MonthRecord, WaterData, FloorKey } from "@/lib/mps-store";
import {
  currentMonthKey,
  formatMonthKey,
  MONTH_NAMES,
  FLOORS,
  normalizeWater,
  floorConsumption,
  totalFloorConsumption,
  commonReadingTotal,
  waterLoss,
  floorShares,
  electricityUnits,
  electricityAvgCost,
} from "@/lib/mps-store";

type Section = "water" | "electricity" | "watchman";

function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [y, m] = value.split("-");
  const years: number[] = [];
  const cy = new Date().getFullYear();
  for (let i = cy - 3; i <= cy + 1; i++) years.push(i);
  return (
    <div className="flex gap-2">
      <select value={m} onChange={(e) => onChange(`${y}-${e.target.value}`)} className="flex-1 rounded-2xl bg-secondary/70 border border-white/60 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40">
        {MONTH_NAMES.map((n, i) => (<option key={n} value={String(i+1).padStart(2,"0")}>{n}</option>))}
      </select>
      <select value={y} onChange={(e) => onChange(`${e.target.value}-${m}`)} className="w-28 rounded-2xl bg-secondary/70 border border-white/60 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40">
        {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
      </select>
    </div>
  );
}

function NumberField({ label, value, onChange, invalid }: { label: string; value: number; onChange: (n: number) => void; invalid?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 mb-1.5 block">{label}</span>
      <input
        type="number"
        min={0}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(Number.isFinite(v) && v >= 0 ? v : 0);
        }}
        className={`w-full rounded-2xl bg-white border px-4 py-3 text-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 transition-all ${invalid ? "border-red-300 focus:ring-red-300/40" : "border-slate-200 focus:ring-primary/40 focus:border-primary/40"}`}
      />
    </label>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (n: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 mb-1.5 block">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
      />
    </label>
  );
}

export function SectionForm({
  section, records, setRecords,
}: {
  section: Section;
  records: MonthRecord[];
  setRecords: (fn: (r: MonthRecord[]) => MonthRecord[]) => void;
}) {
  const { month, setMonth } = useActiveMonth();
  const [confirmDel, setConfirmDel] = useState(false);
  const existing = records.find(r => r.month === month);
  const data = existing?.[section];

  const [form, setForm] = useState<any>(() => hydrate(section, data));

  const key = month + section + (existing ? "1" : "0");
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setForm(hydrate(section, data));
  }

  const update = (k: string, v: number | string) => setForm((f: any) => ({ ...f, [k]: v }));
  const updateFloor = (fk: FloorKey, k: "kaveriIn" | "kaveriOut", v: number) =>
    setForm((f: any) => ({ ...f, floors: { ...f.floors, [fk]: { ...f.floors[fk], [k]: v } } }));
  const updateCommon = (k: "basementTerrace" | "basementParking", v: number) =>
    setForm((f: any) => ({ ...f, common: { ...f.common, [k]: v } }));

  const validate = (): string | null => {
    if (section === "water") {
      for (const f of FLOORS) {
        const fr = form.floors[f.key];
        if ((fr.kaveriIn || 0) < 0 || (fr.kaveriOut || 0) < 0) return `${f.label}: readings cannot be negative`;
        if ((fr.kaveriOut || 0) > (fr.kaveriIn || 0) && (fr.kaveriIn || 0) > 0)
          return `${f.label}: Out reading cannot exceed In reading`;
      }
      if ((form.bwssb || 0) <= 0) return "BWSSB bill amount is required";
    }
    if (section === "electricity") {
      if ((form.prev || 0) < 0 || (form.curr || 0) < 0) return "Readings cannot be negative";
      if ((form.curr || 0) < (form.prev || 0)) return "Current reading cannot be less than previous";
      if ((form.bill || 0) <= 0) return "Bill amount is required";
    }
    if (section === "watchman") {
      if (Object.values(form).some((v: any) => typeof v === "number" && v < 0)) return "Values cannot be negative";
    }
    return null;
  };

  const save = () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setRecords(prev => {
      const idx = prev.findIndex(r => r.month === month);
      const rec: MonthRecord = idx >= 0 ? { ...prev[idx] } : { month };
      (rec as any)[section] = form;
      return idx >= 0 ? prev.map((r,i) => i===idx?rec:r) : [...prev, rec];
    });
    toast.success(`${cap(section)} saved for ${formatMonthKey(month)}`);
  };

  const del = () => {
    setRecords(prev => prev.map(r => {
      if (r.month !== month) return r;
      const { [section]: _, ...rest } = r as any;
      return rest;
    }).filter(r => r.water || r.electricity || r.watchman || (r.misc && r.misc.length)));
    toast.success("Entry deleted");
    setForm(hydrate(section, undefined));
    setConfirmDel(false);
  };

  return (
    <div className="space-y-5 pb-32">
      <Card>
        <label className="text-xs font-medium text-slate-500 mb-2 block">Month</label>
        <MonthPicker value={month} onChange={setMonth} />
      </Card>

      {section === "water" && (
        <>
          {FLOORS.map(f => {
            const fr = form.floors[f.key];
            const cons = floorConsumption(fr);
            return (
              <Card key={f.key}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold tracking-tight text-slate-900">{f.label}</h3>
                  <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1">{cons} units</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <NumberField label="Kaveri In" value={fr.kaveriIn} onChange={v => updateFloor(f.key, "kaveriIn", v)} />
                  <NumberField label="Kaveri Out" value={fr.kaveriOut} onChange={v => updateFloor(f.key, "kaveriOut", v)} invalid={fr.kaveriOut > fr.kaveriIn && fr.kaveriIn > 0} />
                </div>
              </Card>
            );
          })}

          <Card>
            <h3 className="text-base font-bold tracking-tight text-slate-900 mb-3">Common Readings</h3>
            <div className="grid grid-cols-2 gap-4">
              <NumberField label="Basement Meter at Terrace" value={form.common.basementTerrace} onChange={v => updateCommon("basementTerrace", v)} />
              <NumberField label="Basement Meter at Parking" value={form.common.basementParking} onChange={v => updateCommon("basementParking", v)} />
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-bold tracking-tight text-slate-900 mb-3">BWSSB Bill</h3>
            <NumberField label="Consumption Charge (Bill Amount)" value={form.bwssb} onChange={v => update("bwssb", v)} />
          </Card>

          <WaterSummary form={form} />
        </>
      )}

      {section === "electricity" && (
        <>
          <Card>
            <div className="grid grid-cols-2 gap-4">
              <NumberField label="Previous Reading" value={form.prev} onChange={v => update("prev", v)} />
              <NumberField label="Current Reading" value={form.curr} onChange={v => update("curr", v)} invalid={form.curr < form.prev} />
              <div className="col-span-2">
                <NumberField label="BESCOM Bill Amount" value={form.bill} onChange={v => update("bill", v)} />
              </div>
              <div className="col-span-2">
                <TextField label="Billing Period" value={form.billingPeriod || ""} onChange={v => update("billingPeriod", v)} placeholder="e.g. 15 Mar – 14 Apr" />
              </div>
            </div>
          </Card>
          <ElectricitySummary form={form} />
        </>
      )}

      {section === "watchman" && (
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <NumberField label="Watchman Salary" value={form.salary} onChange={v => update("salary", v)} />
            </div>
            <NumberField label="Bonus" value={form.bonus} onChange={v => update("bonus", v)} />
            <NumberField label="Extra Expenses" value={form.extra} onChange={v => update("extra", v)} />
          </div>
        </Card>
      )}

      {section === "watchman" && <WatchmanSummary form={form} />}

      <div className="flex gap-3">
        <button onClick={save} className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary text-white py-4 font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all">
          <Save size={18}/> Save
        </button>
        {existing && data && (
          <button onClick={() => setConfirmDel(true)} className="rounded-full bg-white border border-red-200 text-red-500 px-6 py-4 font-semibold hover:bg-red-50 transition-all">
            <Trash2 size={18}/>
          </button>
        )}
      </div>

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-6" onClick={() => setConfirmDel(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete this entry?</h3>
            <p className="text-sm text-slate-500 mt-1">This will remove {section} data for {formatMonthKey(month)}.</p>
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

function WaterSummary({ form }: { form: WaterData }) {
  const total = totalFloorConsumption(form);
  const common = commonReadingTotal(form);
  const loss = waterLoss(form);
  const shares = floorShares(form);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <MiniStat label="Total Consumption" value={total} unit="u" highlight />
        <MiniStat label="Common Total" value={common} unit="u" />
        <MiniStat label="Water Loss / Common" value={loss} unit="u" />
        <MiniStat label="BWSSB Bill" value={form.bwssb || 0} unit="₹" />
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2 mt-1">Floor Share</div>
        <div className="grid grid-cols-2 gap-3">
          {FLOORS.map(f => (
            <MiniStat key={f.key} label={f.label} value={shares[f.key]} unit="₹" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ElectricitySummary({ form }: { form: any }) {
  const u = electricityUnits(form);
  const avg = electricityAvgCost(form);
  return (
    <div className="grid grid-cols-3 gap-3">
      <MiniStat label="Units" value={u} unit="kWh" highlight />
      <MiniStat label="Bill" value={form.bill || 0} unit="₹" />
      <MiniStat label="Avg / Unit" value={Math.round(avg * 100) / 100} unit="₹" />
    </div>
  );
}

function WatchmanSummary({ form }: { form: any }) {
  const t = (form.salary || 0) + (form.bonus || 0) + (form.extra || 0);
  return (
    <div className="grid grid-cols-1 gap-3">
      <MiniStat label="Total Watchman Expense" value={t} unit="₹" highlight />
    </div>
  );
}

function MiniStat({ label, value, unit, highlight }: { label: string; value: number; unit: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${highlight ? "bg-gradient-to-br from-primary to-blue-500 text-white shadow-lg shadow-primary/30" : "bg-white"}`}>
      <div className={`text-[10px] font-medium uppercase tracking-wide ${highlight ? "text-white/80" : "text-slate-500"}`}>{label}</div>
      <div className="mt-1 text-xl font-bold tracking-tight">
        {unit === "₹" && unit}{Number(value).toLocaleString()}{unit !== "₹" && ` ${unit}`}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_-12px_rgba(59,130,246,0.15)] p-5">{children}</div>;
}

function hydrate(section: Section, data: any): any {
  if (section === "water") return normalizeWater(data);
  if (section === "electricity") return data ? { prev: data.prev || 0, curr: data.curr || 0, bill: data.bill || 0, billingPeriod: data.billingPeriod || "" } : { prev: 0, curr: 0, bill: 0, billingPeriod: "" };
  return data ?? { salary: 0, bonus: 0, extra: 0 };
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
