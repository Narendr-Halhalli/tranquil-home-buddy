import { useState } from "react";
import { X, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import type { Settings } from "@/lib/mps-store";

export function SettingsButton({ settings, setSettings }: { settings: Settings; setSettings: (s: Settings) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(settings);

  const save = () => {
    if (!draft.apartmentName.trim()) return toast.error("Apartment name required");
    if (draft.flats < 1) return toast.error("Flats must be at least 1");
    setSettings(draft);
    toast.success("Settings saved");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => { setDraft(settings); setOpen(true); }}
        className="rounded-full bg-white/60 backdrop-blur-xl border border-white/70 p-2.5 shadow-sm hover:bg-white transition-all"
        aria-label="Settings"
      >
        <SettingsIcon size={18} className="text-slate-600" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl m-0 sm:m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold tracking-tight">Settings</h3>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-slate-100"><X size={18}/></button>
            </div>
            <div className="space-y-4">
              <Field label="Apartment Name">
                <input value={draft.apartmentName} onChange={e => setDraft({...draft, apartmentName:e.target.value})} className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40"/>
              </Field>
              <Field label="Default Currency">
                <input value={draft.currency} onChange={e => setDraft({...draft, currency:e.target.value})} maxLength={3} className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40"/>
              </Field>
              <Field label="Number of Flats">
                <input type="number" min={1} value={draft.flats} onChange={e => setDraft({...draft, flats: Math.max(1, parseInt(e.target.value)||1)})} className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40"/>
              </Field>
            </div>
            <button onClick={save} className="mt-6 w-full rounded-full bg-primary text-white py-3.5 font-semibold shadow-lg shadow-primary/30">Save</button>
          </div>
        </div>
      )}
    </>
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
