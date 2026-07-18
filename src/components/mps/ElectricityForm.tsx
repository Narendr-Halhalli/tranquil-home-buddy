import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Save, Trash2, Copy, Pencil, Plus, X } from "lucide-react";
import type { MonthRecord, ElectricityData } from "@/lib/mps-store";
import {
  currentMonthKey,
  formatMonthKey,
  MONTH_NAMES,
  defaultFloorsForMonth,
  normalizeElectricity,
  electricityUnits,
  electricityAmount,
  electricitySharePerFloor,
  electricityStats,
} from "@/lib/mps-store";

type Draft = ElectricityData & { month: string };

function emptyDraft(month = currentMonthKey()): Draft {
  return {
    month,
    accountNumber: "",
    billingPeriod: "",
    units: 0,
    amount: 0,
    paidBy: "",
    paidOn: "",
    floors: defaultFloorsForMonth(month),
  };
}

export function ElectricityForm({
  records,
  setRecords,
}: {
  records: MonthRecord[];
  setRecords: (fn: (r: MonthRecord[]) => MonthRecord[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const editing = records.some(r => r.month === draft.month && r.electricity);

  const stats = useMemo(() => electricityStats(records), [records]);
  const bills = useMemo(() =>
    records
      .filter(r => r.electricity)
      .map(r => ({ month: r.month, e: normalizeElectricity(r.electricity, r.month) }))
      .sort((a, b) => b.month.localeCompare(a.month)),
    [records]
  );

  const startNew = () => { setDraft(emptyDraft()); setOpen(true); };
  const startEdit = (month: string) => {
    const rec = records.find(r => r.month === month);
    if (!rec?.electricity) return;
    setDraft({ month, ...normalizeElectricity(rec.electricity, month) });
    setOpen(true);
  };
  const duplicate = (month: string) => {
    const rec = records.find(r => r.month === month);
    if (!rec?.electricity) return;
    // find next unused month
    let m = nextMonthKey(month);
    while (records.some(r => r.month === m && r.electricity)) m = nextMonthKey(m);
    setDraft({ ...normalizeElectricity(rec.electricity, m), month: m, floors: defaultFloorsForMonth(m) });
    setOpen(true);
  };
  const remove = (month: string) => {
    setRecords(prev => prev.map(r => {
      if (r.month !== month) return r;
      const { electricity: _, ...rest } = r;
      return rest as MonthRecord;
    }).filter(r => r.water || r.electricity || r.watchman || (r.misc && r.misc.length)));
    toast.success("Bill deleted");
    setConfirmDel(null);
  };

  const save = () => {
    if (draft.amount <= 0) { toast.error("Amount is required"); return; }
    if (draft.floors <= 0) { toast.error("Number of floors must be greater than zero"); return; }
    const { month, ...data } = draft;
    setRecords(prev => {
      const idx = prev.findIndex(r => r.month === month);
      if (idx >= 0) {
        const rec = { ...prev[idx], electricity: data };
        return prev.map((r, i) => i === idx ? rec : r);
      }
      return [...prev, { month, electricity: data }];
    });
    toast.success(`Bill saved for ${formatMonthKey(month)}`);
    setOpen(false);
  };

  const shareEach = draft.floors > 0 ? draft.amount / draft.floors : 0;
  const c = "₹";

  return (
    <div className="space-y-5 pb-32">
      {/* Summary */}
      <div className="rounded-[28px] bg-gradient-to-br from-primary to-blue-500 text-white shadow-[0_20px_60px_-20px_rgba(59,130,246,0.5)] p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-white/80">Account</div>
            <div className="mt-0.5 text-lg font-bold tracking-tight">{stats.accountNumber || "—"}</div>
          </div>
          <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-4 py-2 text-sm font-semibold hover:bg-white/30 transition-colors">
            <Plus size={16} /> Add bill
          </button>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <SummaryStat label="Avg Bill" value={`${c}${Math.round(stats.avgBill).toLocaleString()}`} />
          <SummaryStat label="Avg Units" value={`${Math.round(stats.avgUnits).toLocaleString()}`} />
          <SummaryStat label="Avg / Floor" value={`${c}${Math.round(stats.avgShare).toLocaleString()}`} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[24px] bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_-12px_rgba(59,130,246,0.15)] overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <div className="text-base font-bold tracking-tight text-slate-900">All Bills</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">{bills.length} record{bills.length === 1 ? "" : "s"}</div>
          </div>
        </div>
        {bills.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-500">
            No bills yet. <button onClick={startNew} className="text-primary font-semibold">Add your first bill</button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100">
                <tr className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="text-left px-4 py-3">Month</th>
                  <th className="text-left px-2 py-3">Period</th>
                  <th className="text-right px-2 py-3">Units</th>
                  <th className="text-right px-2 py-3">Amount</th>
                  <th className="text-right px-2 py-3">Floors</th>
                  <th className="text-right px-2 py-3">Share</th>
                  <th className="text-left px-2 py-3">Paid By</th>
                  <th className="text-left px-2 py-3">Paid On</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(({ month, e }) => (
                  <tr key={month} className="border-t border-slate-100 hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{formatMonthKey(month)}</td>
                    <td className="px-2 py-3 text-slate-500 whitespace-nowrap">{e.billingPeriod || "—"}</td>
                    <td className="text-right px-2 py-3 tabular-nums">{electricityUnits(e).toLocaleString()}</td>
                    <td className="text-right px-2 py-3 tabular-nums font-semibold">{c}{electricityAmount(e).toLocaleString()}</td>
                    <td className="text-right px-2 py-3 tabular-nums text-slate-500">{e.floors}</td>
                    <td className="text-right px-2 py-3 tabular-nums font-semibold text-primary">{c}{Math.round(electricitySharePerFloor(e)).toLocaleString()}</td>
                    <td className="px-2 py-3 text-slate-600 whitespace-nowrap">{e.paidBy || "—"}</td>
                    <td className="px-2 py-3 text-slate-600 whitespace-nowrap">{e.paidOn || "—"}</td>
                    <td className="text-right px-4 py-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <IconBtn onClick={() => startEdit(month)} label="Edit"><Pencil size={14} /></IconBtn>
                        <IconBtn onClick={() => duplicate(month)} label="Duplicate"><Copy size={14} /></IconBtn>
                        <IconBtn onClick={() => setConfirmDel(month)} label="Delete" danger><Trash2 size={14} /></IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl mps-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-bold text-slate-900">{editing ? "Edit bill" : "Add bill"}</div>
                <div className="text-xs text-slate-500 mt-0.5">Share = Amount ÷ Floors</div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full bg-slate-100 hover:bg-slate-200 p-2 text-slate-600"><X size={16} /></button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Month</label>
                <MonthPicker value={draft.month} onChange={m => setDraft(d => ({ ...d, month: m, floors: d.floors || defaultFloorsForMonth(m) }))} />
              </div>
              <Field label="Account Number">
                <TextInput value={draft.accountNumber || ""} onChange={v => setDraft(d => ({ ...d, accountNumber: v }))} placeholder="BESCOM RR No." />
              </Field>
              <Field label="Billing Period">
                <TextInput value={draft.billingPeriod || ""} onChange={v => setDraft(d => ({ ...d, billingPeriod: v }))} placeholder="e.g. 15 Mar – 14 Apr" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Units"><NumInput value={draft.units} onChange={v => setDraft(d => ({ ...d, units: v }))} /></Field>
                <Field label="Amount Paid"><NumInput value={draft.amount} onChange={v => setDraft(d => ({ ...d, amount: v }))} /></Field>
                <Field label="Paid By"><TextInput value={draft.paidBy || ""} onChange={v => setDraft(d => ({ ...d, paidBy: v }))} placeholder="Name" /></Field>
                <Field label="Paid On"><DateInput value={draft.paidOn || ""} onChange={v => setDraft(d => ({ ...d, paidOn: v }))} /></Field>
                <Field label={`Floors (default ${defaultFloorsForMonth(draft.month)})`}>
                  <NumInput value={draft.floors} onChange={v => setDraft(d => ({ ...d, floors: v }))} />
                </Field>
                <Field label="Share / Floor">
                  <div className="rounded-2xl bg-primary/10 text-primary px-4 py-3 text-lg font-bold tabular-nums">{c}{Math.round(shareEach).toLocaleString()}</div>
                </Field>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-full bg-slate-100 py-3 font-medium">Cancel</button>
              <button onClick={save} className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary text-white py-3 font-semibold shadow-lg shadow-primary/30 hover:scale-[1.01] transition-transform">
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-6" onClick={() => setConfirmDel(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete bill?</h3>
            <p className="text-sm text-slate-500 mt-1">{formatMonthKey(confirmDel)} electricity bill will be removed.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 rounded-full bg-slate-100 py-3 font-medium">Cancel</button>
              <button onClick={() => remove(confirmDel)} className="flex-1 rounded-full bg-red-500 text-white py-3 font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function nextMonthKey(k: string) {
  const [y, m] = k.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/15 backdrop-blur px-3 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-white/80">{label}</div>
      <div className="mt-0.5 text-lg font-bold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

function IconBtn({ children, onClick, label, danger }: { children: React.ReactNode; onClick: () => void; label: string; danger?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className={`rounded-full p-2 transition-colors ${danger ? "bg-red-50 hover:bg-red-100 text-red-500" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}>
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="text" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all" />;
}
function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <input type="number" min={0} value={Number.isFinite(value) ? value : 0} onChange={e => { const v = parseFloat(e.target.value); onChange(Number.isFinite(v) && v >= 0 ? v : 0); }} className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all" />;
}
function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input type="date" value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all" />;
}
function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [y, m] = value.split("-");
  const years: number[] = [];
  const cy = new Date().getFullYear();
  for (let i = cy - 4; i <= cy + 1; i++) years.push(i);
  return (
    <div className="flex gap-2">
      <select value={m} onChange={e => onChange(`${y}-${e.target.value}`)} className="flex-1 rounded-2xl bg-secondary/70 border border-white/60 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40">
        {MONTH_NAMES.map((n, i) => <option key={n} value={String(i + 1).padStart(2, "0")}>{n}</option>)}
      </select>
      <select value={y} onChange={e => onChange(`${e.target.value}-${m}`)} className="w-28 rounded-2xl bg-secondary/70 border border-white/60 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40">
        {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
      </select>
    </div>
  );
}
