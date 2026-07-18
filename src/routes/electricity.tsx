import { createFileRoute } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { MonthRecord } from "@/lib/mps-store";
import { ElectricityForm } from "@/components/mps/ElectricityForm";
import { PageHeader } from "@/components/mps/PageHeader";

export const Route = createFileRoute("/electricity")({
  head: () => ({ meta: [{ title: "Electricity — MPS Tranquil" }] }),
  component: ElectricityPage,
});

function ElectricityPage() {
  const [records, setRecords] = useLocalStorage<MonthRecord[]>("mps.records", []);
  return (
    <div className="mps-fade-in space-y-5 pb-8">
      <PageHeader icon={<Zap size={22} />} title="Electricity" subtitle="BESCOM bills & per-floor share" />
      <ElectricityForm records={records} setRecords={setRecords as any} />
    </div>
  );
}
