import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Save } from "lucide-react";
import type { MonthRecord } from "@/lib/mps-store";
import { currentMonthKey, formatMonthKey, MONTH_NAMES } from "@/lib/mps-store";

type Section = "water" | "electricity" | "watchman";

function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [y, m] = value.split("-");
  const years = [];
  const cy = new Date().getFullYear();
  for (let i = cy - 3; i <= cy + 1; i++) years.push(i);
  return (
    <div className="flex gap-2">
      <select
        value={m}
        onChange={(e) => onChange(`${y}-${e.target.value}`)}
        className="flex-1 rounded-2xl bg-secondary/70 border border-white/60 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {MONTH_NAMES.map((n, i) => (
          <option key={n} value={String(i+1).padStart(2,"0")}>{n}</option>
        ))}
      </select>
      <select
        value={y}
        onChange={(e) => onChange(`${e.target.value}-${m}`)}
        className="w-28 rounded-2xl bg-secondary/70 border border-white/60 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
      </select>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
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
        className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
      />
    </label>
  );
}

export function SectionForm({
  section,
  records,
  setRecords,
}: {
  section: Section;
  records: MonthRecord[];
  setRecords: (fn: (r: MonthRecord[]) => MonthRecord[]) => void;
}) {
  const [month, setMonth] = useState(currentMonthKey());
  const [confirmDel, setConfirmDel] = useState(false);
  const existing = records.find(r => r.month === month);
  const data = existing?.[section];

  const [form, setForm] = useState<any>(data ?? defaults(section));

  // sync when month changes
  useState(() => {}); // noop
  // effect via key
  const key = month + section + (existing ? "1" : "0");
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setForm(data ?? defaults(section));
  }

  const update = (k: string, v: number) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = () => {
    if (Object.values(form).some((v: any) => v < 0)) {
      toast.error("Values cannot be negative");
      return;
    }
    setRecords(prev => {
      const idx = prev.findIndex(r => r.month === month);
      const rec: MonthRecord = idx >= 0 ? { ...prev[idx] } : { month };
      (rec as any)[section] = form;
      const next = idx >= 0 ? prev.map((r,i) => i===idx?rec:r) : [...prev, rec];
      return next;
    });
    toast.success(`${cap(section)} saved for ${formatMonthKey(month)}`);
  };

  const del = () => {
    setRecords(prev => prev.map(r => {
      if (r.month !== month) return r;
      const { [section]: _, ...rest } = r as any;
      return rest;
    }).filter(r => r.water || r.electricity || r.watchman));
    toast.success("Entry deleted");
    setForm(defaults(section));
    setConfirmDel(false);
  };

  return (
    <div className="space-y-5">
      <Card>
        <label className="text-xs font-medium text-slate-500 mb-2 block">Month</label>
        <MonthPicker value={month} onChange={setMonth} />
      </Card>

      <Card>
        {section === "water" && (
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Kaveri In" value={form.kaveriIn} onChange={v => update("kaveriIn", v)} />
            <NumberField label="Kaveri Out" value={form.kaveriOut} onChange={v => update("kaveriOut", v)} />
            <NumberField label="Borewell In" value={form.borewellIn} onChange={v => update("borewellIn", v)} />
            <NumberField label="Borewell Out" value={form.borewellOut} onChange={v => update("borewellOut", v)} />
            <div className="col-span-2">
              <NumberField label="BWSSB Bill Amount" value={form.bwssb} onChange={v => update("bwssb", v)} />
            </div>
          </div>
        )}
        {section === "electricity" && (
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Previous Reading" value={form.prev} onChange={v => update("prev", v)} />
            <NumberField label="Current Reading" value={form.curr} onChange={v => update("curr", v)} />
            <div className="col-span-2">
              <NumberField label="Bill Amount" value={form.bill} onChange={v => update("bill", v)} />
            </div>
          </div>
        )}
        {section === "watchman" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <NumberField label="Watchman Salary" value={form.salary} onChange={v => update("salary", v)} />
            </div>
            <NumberField label="Bonus" value={form.bonus} onChange={v => update("bonus", v)} />
            <NumberField label="Extra Expenses" value={form.extra} onChange={v => update("extra", v)} />
          </div>
        )}
      </Card>

      <LiveSummary section={section} form={form} />

      <div className="flex gap-3 pb-28">
        <button
          onClick={save}
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary text-white py-4 font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <Save size={18}/> Save
        </button>
        {existing && data && (
          <button
            onClick={() => setConfirmDel(true)}
            className="rounded-full bg-white border border-red-200 text-red-500 px-6 py-4 font-semibold hover:bg-red-50 transition-all"
          >
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

function LiveSummary({ section, form }: { section: Section; form: any }) {
  if (section === "water") {
    const k = Math.max(0, (form.kaveriOut||0) - (form.kaveriIn||0));
    const b = Math.max(0, (form.borewellOut||0) - (form.borewellIn||0));
    return (
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Kaveri" value={k} unit="u" />
        <MiniStat label="Borewell" value={b} unit="u" />
        <MiniStat label="Total" value={k+b} unit="u" highlight />
      </div>
    );
  }
  if (section === "electricity") {
    const u = Math.max(0, (form.curr||0) - (form.prev||0));
    return (
      <div className="grid grid-cols-2 gap-3">
        <MiniStat label="Units Consumed" value={u} unit="kWh" highlight />
        <MiniStat label="Bill" value={form.bill||0} unit="₹" />
      </div>
    );
  }
  const t = (form.salary||0) + (form.bonus||0) + (form.extra||0);
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
        {unit === "₹" && unit}{value.toLocaleString()}{unit !== "₹" && ` ${unit}`}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_-12px_rgba(59,130,246,0.15)] p-5">{children}</div>;
}

function defaults(section: Section): any {
  if (section === "water") return { kaveriIn:0, kaveriOut:0, borewellIn:0, borewellOut:0, bwssb:0 };
  if (section === "electricity") return { prev:0, curr:0, bill:0 };
  return { salary:0, bonus:0, extra:0 };
}
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
