export type FloorKey = "ground" | "first" | "second" | "third";

export const FLOORS: { key: FloorKey; label: string }[] = [
  { key: "ground", label: "Ground Floor" },
  { key: "first", label: "First Floor" },
  { key: "second", label: "Second Floor" },
  { key: "third", label: "Third Floor" },
];

export type FloorReading = { kaveriIn: number; kaveriOut: number };

export type CommonReadings = {
  basement: number;
  terrace: number;
  parkBorewell: number;
};

export type WaterData = {
  floors: Record<FloorKey, FloorReading>;
  common: CommonReadings;
  bwssb: number;
  // legacy fields, kept for backward compatibility
  kaveriIn?: number;
  kaveriOut?: number;
  borewellIn?: number;
  borewellOut?: number;
};

export type ElectricityData = {
  prev: number;
  curr: number;
  bill: number;
  billingPeriod?: string;
};

export type WatchmanData = {
  salary: number;
  bonus: number;
  extra: number;
};

export type MiscCategory =
  | "Lift" | "Cleaning" | "Painting" | "Repair" | "Plumbing"
  | "Electrical" | "Security" | "Garden" | "Other";

export const MISC_CATEGORIES: MiscCategory[] = [
  "Lift","Cleaning","Painting","Repair","Plumbing","Electrical","Security","Garden","Other",
];

export type MiscExpense = {
  id: string;
  date: string; // YYYY-MM-DD
  category: MiscCategory;
  description: string;
  amount: number;
};

export type MonthRecord = {
  month: string; // "YYYY-MM"
  water?: WaterData;
  electricity?: ElectricityData;
  watchman?: WatchmanData;
  misc?: MiscExpense[];
};

export type Settings = {
  apartmentName: string;
  currency: string;
  flats: number;
};

export const DEFAULT_SETTINGS: Settings = {
  apartmentName: "MPS Tranquil",
  currency: "₹",
  flats: 12,
};

export const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export function currentMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthKey(key: string) {
  const [y, m] = key.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

export function prevMonthKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return currentMonthKey(d);
}

export function emptyFloors(): Record<FloorKey, FloorReading> {
  return {
    ground: { kaveriIn: 0, kaveriOut: 0 },
    first: { kaveriIn: 0, kaveriOut: 0 },
    second: { kaveriIn: 0, kaveriOut: 0 },
    third: { kaveriIn: 0, kaveriOut: 0 },
  };
}

export function emptyCommon(): CommonReadings {
  return { basement: 0, terrace: 0, parkBorewell: 0 };
}

export function defaultWater(): WaterData {
  return { floors: emptyFloors(), common: emptyCommon(), bwssb: 0 };
}

/** Normalize legacy or partial water data into the new floor-aware shape. */
export function normalizeWater(w?: WaterData): WaterData {
  if (!w) return defaultWater();
  const floors = w.floors
    ? {
        ground: { kaveriIn: w.floors.ground?.kaveriIn || 0, kaveriOut: w.floors.ground?.kaveriOut || 0 },
        first: { kaveriIn: w.floors.first?.kaveriIn || 0, kaveriOut: w.floors.first?.kaveriOut || 0 },
        second: { kaveriIn: w.floors.second?.kaveriIn || 0, kaveriOut: w.floors.second?.kaveriOut || 0 },
        third: { kaveriIn: w.floors.third?.kaveriIn || 0, kaveriOut: w.floors.third?.kaveriOut || 0 },
      }
    : emptyFloors();
  const common = w.common
    ? {
        basement: w.common.basement || 0,
        terrace: w.common.terrace || 0,
        parkBorewell: w.common.parkBorewell || 0,
      }
    : emptyCommon();
  return { floors, common, bwssb: w.bwssb || 0 };
}

// --- calculations ---
export function floorConsumption(f?: FloorReading) {
  if (!f) return 0;
  return Math.max(0, (f.kaveriIn || 0) - (f.kaveriOut || 0));
}

export function floorConsumptions(w?: WaterData): Record<FloorKey, number> {
  const n = normalizeWater(w);
  return {
    ground: floorConsumption(n.floors.ground),
    first: floorConsumption(n.floors.first),
    second: floorConsumption(n.floors.second),
    third: floorConsumption(n.floors.third),
  };
}

export function totalFloorConsumption(w?: WaterData) {
  const c = floorConsumptions(w);
  return c.ground + c.first + c.second + c.third;
}

export function commonReadingTotal(w?: WaterData) {
  const n = normalizeWater(w);
  return (n.common.basement || 0) + (n.common.terrace || 0) + (n.common.parkBorewell || 0);
}

export function waterLoss(w?: WaterData) {
  return Math.max(0, commonReadingTotal(w) - totalFloorConsumption(w));
}

export function floorShares(w?: WaterData): Record<FloorKey, number> {
  const cons = floorConsumptions(w);
  const total = cons.ground + cons.first + cons.second + cons.third;
  const bill = w?.bwssb || 0;
  if (total <= 0 || bill <= 0) {
    return { ground: 0, first: 0, second: 0, third: 0 };
  }
  return {
    ground: Math.round((cons.ground / total) * bill),
    first: Math.round((cons.first / total) * bill),
    second: Math.round((cons.second / total) * bill),
    third: Math.round((cons.third / total) * bill),
  };
}

// Legacy helper for older code paths.
export function waterConsumption(w?: WaterData) {
  const total = totalFloorConsumption(w);
  return { kaveri: total, borewell: 0, total };
}

export function electricityUnits(e?: ElectricityData) {
  if (!e) return 0;
  return Math.max(0, (e.curr || 0) - (e.prev || 0));
}

export function electricityAvgCost(e?: ElectricityData) {
  const u = electricityUnits(e);
  if (!e || u <= 0) return 0;
  return (e.bill || 0) / u;
}

export function watchmanTotal(w?: WatchmanData) {
  if (!w) return 0;
  return (w.salary || 0) + (w.bonus || 0) + (w.extra || 0);
}

export function miscTotal(r?: MonthRecord) {
  if (!r?.misc) return 0;
  return r.misc.reduce((s, m) => s + (m.amount || 0), 0);
}

export function monthTotal(r?: MonthRecord) {
  if (!r) return 0;
  return (
    (r.water?.bwssb || 0) +
    (r.electricity?.bill || 0) +
    watchmanTotal(r.watchman) +
    miscTotal(r)
  );
}

export function completeness(r?: MonthRecord) {
  if (!r) return 0;
  let filled = 0;
  if (r.water) filled++;
  if (r.electricity) filled++;
  if (r.watchman) filled++;
  if (r.misc && r.misc.length > 0) filled++;
  return Math.round((filled / 4) * 100);
}

export function analytics(records: MonthRecord[], activeKey: string) {
  const sorted = [...records].sort((a, b) => a.month.localeCompare(b.month));
  const current = records.find(r => r.month === activeKey);
  const prev = records.find(r => r.month === prevMonthKey(activeKey));
  const currentTotal = monthTotal(current);
  const prevTotal = monthTotal(prev);
  const diff = currentTotal - prevTotal;

  const totals = sorted.map(r => ({ month: r.month, total: monthTotal(r) })).filter(t => t.total > 0);
  const avg = totals.length ? totals.reduce((s, t) => s + t.total, 0) / totals.length : 0;
  const highest = totals.reduce((a, b) => (b.total > a.total ? b : a), { month: "-", total: 0 });
  const lowest = totals.reduce((a, b) => (a.total === 0 || b.total < a.total ? b : a), { month: "-", total: 0 });

  const year = activeKey.split("-")[0];
  const yearTotal = totals.filter(t => t.month.startsWith(year)).reduce((s, t) => s + t.total, 0);

  return { currentTotal, prevTotal, diff, avg, highest, lowest, yearTotal };
}
