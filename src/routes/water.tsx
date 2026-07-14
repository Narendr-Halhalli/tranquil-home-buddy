import { createFileRoute } from "@tanstack/react-router";
import { Droplets } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { MonthRecord } from "@/lib/mps-store";
import { SectionForm } from "@/components/mps/SectionForm";

export const Route = createFileRoute("/water")({
  head: () => ({ meta: [{ title: "Water — MPS Tranquil" }] }),
  component: WaterPage,
});

function WaterPage() {
  const [records, setRecords] = useLocalStorage<MonthRecord[]>("mps.records", []);
  return (
    <div className="mps-fade-in space-y-5 pb-8">
      <PageHeader icon={<Droplets size={22}/>} title="Water" subtitle="Kaveri, Borewell & BWSSB"/>
      <SectionForm section="water" records={records} setRecords={setRecords as any} />
    </div>
  );
}

export function PageHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-blue-500 text-white w-12 h-12 flex items-center justify-center shadow-lg shadow-primary/30">{icon}</div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
