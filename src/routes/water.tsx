import { createFileRoute } from "@tanstack/react-router";
import { Droplets } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { MonthRecord } from "@/lib/mps-store";
import { SectionForm } from "@/components/mps/SectionForm";
import { PageHeader } from "@/components/mps/PageHeader";

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

