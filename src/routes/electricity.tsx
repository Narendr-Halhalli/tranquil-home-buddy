import { createFileRoute } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { MonthRecord } from "@/lib/mps-store";
import { SectionForm } from "@/components/mps/SectionForm";
import { PageHeader } from "./water";

export const Route = createFileRoute("/electricity")({
  head: () => ({ meta: [{ title: "Electricity — MPS Tranquil" }] }),
  component: ElectricityPage,
});

function ElectricityPage() {
  const [records, setRecords] = useLocalStorage<MonthRecord[]>("mps.records", []);
  return (
    <div className="mps-fade-in space-y-5 pb-8">
      <PageHeader icon={<Zap size={22}/>} title="Electricity" subtitle="Meter readings & bill"/>
      <SectionForm section="electricity" records={records} setRecords={setRecords as any} />
    </div>
  );
}
