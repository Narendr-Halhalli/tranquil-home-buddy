import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { MonthRecord } from "@/lib/mps-store";
import { SectionForm } from "@/components/mps/SectionForm";
import { PageHeader } from "@/components/mps/PageHeader";

export const Route = createFileRoute("/watchman")({
  head: () => ({ meta: [{ title: "Watchman — MPS Tranquil" }] }),
  component: WatchmanPage,
});

function WatchmanPage() {
  const [records, setRecords] = useLocalStorage<MonthRecord[]>("mps.records", []);
  return (
    <div className="mps-fade-in space-y-5 pb-8">
      <PageHeader icon={<Shield size={22}/>} title="Watchman" subtitle="Salary, bonus & extras"/>
      <SectionForm section="watchman" records={records} setRecords={setRecords as any} />
    </div>
  );
}
