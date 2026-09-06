import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { MONTH_NAMES, currentMonthKey, formatMonthKey } from "@/lib/mps-store";
import { useActiveMonth } from "@/hooks/useActiveMonth";

/** Asks which month the maintenance is being done for, before showing the app. */
export function MonthGate() {
  const { setMonth, hydrated, chosen } = useActiveMonth();
  const [draft, setDraft] = useState(currentMonthKey());

  if (!hydrated || chosen) return null;

  const [y, m] = draft.split("-");
  const cy = new Date().getFullYear();
  const years: number[] = [];
  for (let i = cy - 3; i <= cy + 1; i++) years.push(i);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl mps-fade-in">
        <div className="flex items-center gap-2 text-primary">
          <CalendarDays size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">Get started</span>
        </div>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Which month are we doing maintenance for?</h2>
        <p className="mt-1 text-sm text-slate-500">Every section will be set to this month. You can change it any time.</p>
        <div className="mt-5 flex gap-2">
          <select value={m} onChange={e => setDraft(`${y}-${e.target.value}`)} className="flex-1 rounded-2xl bg-secondary/70 border border-white/60 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40">
            {MONTH_NAMES.map((n, i) => <option key={n} value={String(i + 1).padStart(2, "0")}>{n}</option>)}
          </select>
          <select value={y} onChange={e => setDraft(`${e.target.value}-${m}`)} className="w-28 rounded-2xl bg-secondary/70 border border-white/60 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40">
            {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
          </select>
        </div>
        <button
          onClick={() => setMonth(draft)}
          className="mt-5 w-full rounded-full bg-primary text-white py-3.5 font-semibold shadow-lg shadow-primary/30 hover:shadow-xl active:scale-[0.99] transition-all"
        >
          Continue with {formatMonthKey(draft)}
        </button>
      </div>
    </div>
  );
}
