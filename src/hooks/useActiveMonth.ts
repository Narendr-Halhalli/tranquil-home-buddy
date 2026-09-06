import { useLocalStorage } from "./useLocalStorage";
import { currentMonthKey } from "@/lib/mps-store";

/**
 * Shared "which month are we doing maintenance for" selection.
 * Persisted in local storage so every module stays on the same month.
 */
export function useActiveMonth() {
  const [stored, setStored, hydrated] = useLocalStorage<string | null>("mps.activeMonth", null);
  const month = stored ?? currentMonthKey();
  const setMonth = (m: string) => setStored(m);
  return { month, setMonth, hydrated, chosen: stored != null };
}
