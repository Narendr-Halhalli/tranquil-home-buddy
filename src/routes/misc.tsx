import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Wrench } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { MonthRecord, MiscCategory, MiscExpense, Settings } from "@/lib/mps-store";
import {
  DEFAULT_SETTINGS,
  MISC_CATEGORIES,
  currentMonthKey,
  formatMonthKey,
  MONTH_NAMES,
  miscTotal,
} from "@/lib/mps-store";
import { PageHeader } from "@/components/mps/PageHeader";

export const Route = createFileRoute("/misc")({
  head: () => ({ meta: [{ title: "Miscellaneous — MPS Tranquil" }] }),
  component: MiscPage,
});

function MiscPage() {
  const [records, setRecords] = useLocalStorage<MonthRecord[]>("mps.records", []);
  const [settings] = useLocalStorage<Settings>("mps.settings", DEFAULT_SETTINGS);
  const [month, setMonth] = useState(currentMonthKey());

  const rec = records.find(r => r.month === month);
  const items = useMemo(() => rec?.misc ?? [], [rec]);
  const total = miscTotal(rec);
  const c = settings.currency;

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<MiscCategory>("Repair");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);

  const add = () => {
    if (amount <= 0) { toast.error("Amount must be greater than zero"); return; }
    if (!description.trim()) { toast.error("Please add a description"); return; }
    const entry: MiscExpense = {
      id: crypto.randomUUID(),
      date, category, description: description.trim(), amount,
    };
    setRecords(prev => {
      const idx = prev.findIndex(r => r.month === month);
      if (idx >= 0) {
        const cur = prev[idx];
        return prev.map((r, i) => i === idx ? { ...cur, misc: [...(cur.misc ?? []), entry] } : r);
      }
      return [...prev, { month, misc: [entry] }];
    });
    setDescription(""); setAmount(0);
    toast.success("Expense added");
  };

  const remove = (id: string) => {
    setRecords(prev => prev.map(r => r.month === month ? { ...r, misc: (r.misc ?? []).filter(m => m.id !== id) } : r)
      .filter(r => r.water || r.electricity || r.watchman || (r.misc && r.misc.length)));
    toast.success("Removed");
  };

  const [y, m] = month.split("-");

  return (
    <div className="mps-fade-in space-y-5 pb-32">
      <PageHeader icon={<Wrench size={22}/>} title="Miscellaneous" subtitle="Ad-hoc apartment expenses" />

      <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_-12px_rgba(59,130,246,0.15)] p-5">
        <label className="text-xs font-medium text-slate-500 mb-2 block">Month</label>
        <div className="flex gap-2">
          <select value={m} onChange={e => setMonth(`${y}-${e.target.value}`)} className="flex-1 rounded-2xl bg-secondary/70 border border-white/60 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40">
            {MONTH_NAMES.map((n, i) => <option key={n} value={String(i+1).padStart(2,"0")}>{n}</option>)}
          </select>
          <select value={y} onChange={e => setMonth(`${e.target.value}-${m}`)} className="w-28 rounded-2xl bg-secondary/70 border border-white/60 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40">
            {yearsAround().map(yr => <option key={yr} value={yr}>{yr}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_-12px_rgba(59,130,246,0.15)] p-5 space-y-4">
        <h3 className="text-base font-bold tracking-tight text-slate-900">Add expense</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Date</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-2xl bg-white border border-slate-200 px-3 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Category</span>
            <select value={category} onChange={e => setCategory(e.target.value as MiscCategory)} className="w-full rounded-2xl bg-white border border-slate-200 px-3 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40">
              {MISC_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </label>
          <label className="block col-span-2">
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Description</span>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Lift AMC quarterly" className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </label>
          <label className="block col-span-2">
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Amount</span>
            <input type="number" min={0} value={amount || 0} onChange={e => setAmount(Math.max(0, parseFloat(e.target.value) || 0))} className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </label>
        </div>
        <button onClick={add} className="w-full flex items-center justify-center gap-2 rounded-full bg-primary text-white py-3.5 font-semibold shadow-lg shadow-primary/30 hover:scale-[1.01] transition-all">
          <Plus size={18}/> Add expense
        </button>
      </div>

      <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_-12px_rgba(59,130,246,0.15)] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold tracking-tight text-slate-900">{formatMonthKey(month)}</h3>
          <div className="text-sm font-semibold text-primary">{c}{total.toLocaleString()}</div>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No expenses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Category</th>
                  <th className="py-2 pr-2">Description</th>
                  <th className="py-2 pr-2 text-right">Amount</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(m => (
                  <tr key={m.id}>
                    <td className="py-2.5 pr-2 text-slate-600 whitespace-nowrap">{m.date}</td>
                    <td className="py-2.5 pr-2"><span className="rounded-full bg-secondary/70 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">{m.category}</span></td>
                    <td className="py-2.5 pr-2 text-slate-800">{m.description}</td>
                    <td className="py-2.5 pr-2 font-semibold text-slate-900 text-right whitespace-nowrap">{c}{m.amount.toLocaleString()}</td>
                    <td className="py-2.5 text-right"><button onClick={() => remove(m.id)} className="text-red-500 hover:bg-red-50 rounded-full p-2"><Trash2 size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function yearsAround() {
  const cy = new Date().getFullYear();
  const arr: number[] = [];
  for (let i = cy - 3; i <= cy + 1; i++) arr.push(i);
  return arr;
}
