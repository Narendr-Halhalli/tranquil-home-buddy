export type FloorKey = "ground" | "first" | "second" | "third";

export const FLOORS: { key: FloorKey; label: string }[] = [
  { key: "ground", label: "Ground Floor" },
  { key: "first", label: "First Floor" },
  { key: "second", label: "Second Floor" },
  { key: "third", label: "Third Floor" },
];

export type FloorReading = {
  borewellStart: number;
  borewellEnd: number;
  kaveriStart: number;
  kaveriEnd: number;
  // legacy fields, preserved for backward compat
  kaveriIn?: number;
  kaveriOut?: number;
};

export type CommonReadings = {
  /** Basement meter located at the terrace */
  basementTerrace: number;
  /** Basement meter located at the parking */
  basementParking: number;
  // legacy fields, preserved for backward compat
  basement?: number;
  terrace?: number;
  parkBorewell?: number;
};

export type WaterData = {
  floors: Record<FloorKey, FloorReading>;
  common: CommonReadings;
  bwssb: number;
  totalLitresReceived?: number;
  // legacy
  kaveriIn?: number;
  kaveriOut?: number;
  borewellIn?: number;
  borewellOut?: number;
};

export type ElectricityData = {
  accountNumber?: string;
  billingPeriod?: string;
  units: number;
  amount: number;
  paidBy?: string;
  paidOn?: string;
  floors: number;
  // legacy
  prev?: number;
  curr?: number;
  bill?: number;
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
  date: string;
  category: MiscCategory;
  description: string;
  amount: number;
};

export type MonthRecord = {
  month: string;
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
  flats: 4,
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

/** Default floors: 3 before June 2024, 4 from June 2024 onwards. */
export function defaultFloorsForMonth(monthKey: string): number {
  return monthKey >= "2024-06" ? 4 : 3;
}

export function emptyFloorReading(): FloorReading {
  return { borewellStart: 0, borewellEnd: 0, kaveriStart: 0, kaveriEnd: 0 };
}

export function emptyFloors(): Record<FloorKey, FloorReading> {
  return {
    ground: emptyFloorReading(),
    first: emptyFloorReading(),
    second: emptyFloorReading(),
    third: emptyFloorReading(),
  };
}

export function emptyCommon(): CommonReadings {
  return { basementTerrace: 0, basementParking: 0 };
}

export function defaultWater(): WaterData {
  return { floors: emptyFloors(), common: emptyCommon(), bwssb: 0, totalLitresReceived: 0 };
}

function normalizeFloor(f: any): FloorReading {
  if (!f) return emptyFloorReading();
  // Legacy: kaveriIn (larger) - kaveriOut (smaller) = consumption
  // Map to kaveriEnd/kaveriStart to preserve consumption.
  const kaveriStart = f.kaveriStart ?? f.kaveriOut ?? 0;
  const kaveriEnd = f.kaveriEnd ?? f.kaveriIn ?? 0;
  return {
    borewellStart: f.borewellStart || 0,
    borewellEnd: f.borewellEnd || 0,
    kaveriStart: kaveriStart || 0,
    kaveriEnd: kaveriEnd || 0,
  };
}

export function normalizeWater(w?: WaterData): WaterData {
  if (!w) return defaultWater();
  return {
    floors: {
      ground: normalizeFloor((w.floors as any)?.ground),
      first: normalizeFloor((w.floors as any)?.first),
      second: normalizeFloor((w.floors as any)?.second),
      third: normalizeFloor((w.floors as any)?.third),
    },
    common: {
      basementTerrace: w.common?.basementTerrace ?? w.common?.terrace ?? w.common?.basement ?? 0,
      basementParking: w.common?.basementParking ?? w.common?.parkBorewell ?? 0,
    },
    bwssb: w.bwssb || 0,
    totalLitresReceived: w.totalLitresReceived || 0,
  };
}

export function normalizeElectricity(e?: ElectricityData, monthKey?: string): ElectricityData {
  const defFloors = monthKey ? defaultFloorsForMonth(monthKey) : 4;
  if (!e) return { units: 0, amount: 0, floors: defFloors };
  const units = e.units ?? Math.max(0, (e.curr || 0) - (e.prev || 0));
  const amount = e.amount ?? e.bill ?? 0;
  return {
    accountNumber: e.accountNumber || "",
    billingPeriod: e.billingPeriod || "",
    units: units || 0,
    amount: amount || 0,
    paidBy: e.paidBy || "",
    paidOn: e.paidOn || "",
    floors: e.floors || defFloors,
  };
}

// --- water calculations ---
export function borewellConsumption(f?: FloorReading) {
  if (!f) return 0;
  return Math.max(0, (f.borewellEnd || 0) - (f.borewellStart || 0));
}
export function kaveriConsumption(f?: FloorReading) {
  if (!f) return 0;
  const start = f.kaveriStart ?? f.kaveriOut ?? 0;
  const end = f.kaveriEnd ?? f.kaveriIn ?? 0;
  return Math.max(0, end - start);
}
export function floorConsumption(f?: FloorReading) {
  return borewellConsumption(f) + kaveriConsumption(f);
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
  return (n.common.basementTerrace || 0) + (n.common.basementParking || 0);
}

export function waterLoss(w?: WaterData) {
  return Math.max(0, commonReadingTotal(w) - totalFloorConsumption(w));
}

export function floorShares(w?: WaterData): Record<FloorKey, number> {
  const cons = floorConsumptions(w);
  const total = cons.ground + cons.first + cons.second + cons.third;
  const bill = w?.bwssb || 0;
  if (total <= 0 || bill <= 0) return { ground: 0, first: 0, second: 0, third: 0 };
  return {
    ground: Math.round((cons.ground / total) * bill),
    first: Math.round((cons.first / total) * bill),
    second: Math.round((cons.second / total) * bill),
    third: Math.round((cons.third / total) * bill),
  };
}

export function costPerLitre(w?: WaterData) {
  const n = normalizeWater(w);
  const litres = n.totalLitresReceived || 0;
  if (litres <= 0 || (n.bwssb || 0) <= 0) return 0;
  return n.bwssb / litres;
}

export function waterConsumption(w?: WaterData) {
  const total = totalFloorConsumption(w);
  return { kaveri: total, borewell: 0, total };
}

// --- electricity ---
export function electricityUnits(e?: ElectricityData) {
  if (!e) return 0;
  if (typeof e.units === "number" && e.units > 0) return e.units;
  return Math.max(0, (e.curr || 0) - (e.prev || 0));
}
export function electricityAmount(e?: ElectricityData) {
  if (!e) return 0;
  return e.amount ?? e.bill ?? 0;
}
export function electricityAvgCost(e?: ElectricityData) {
  const u = electricityUnits(e);
  if (u <= 0) return 0;
  return electricityAmount(e) / u;
}
export function electricitySharePerFloor(e?: ElectricityData) {
  if (!e) return 0;
  const floors = e.floors || 4;
  if (floors <= 0) return 0;
  return electricityAmount(e) / floors;
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
    electricityAmount(r.electricity) +
    watchmanTotal(r.watchman) +
    miscTotal(r)
  );
}

/** Final contribution per flat = total monthly expense / number of flats (default 4). */
export function perFlatShare(r?: MonthRecord, flats = 4) {
  const n = flats > 0 ? flats : 4;
  return monthTotal(r) / n;
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

export function electricityStats(records: MonthRecord[]) {
  const list = records.filter(r => r.electricity && electricityAmount(r.electricity) > 0);
  if (list.length === 0) return { avgBill: 0, avgUnits: 0, avgShare: 0, accountNumber: "" };
  const totalBill = list.reduce((s, r) => s + electricityAmount(r.electricity), 0);
  const totalUnits = list.reduce((s, r) => s + electricityUnits(r.electricity), 0);
  const totalShare = list.reduce((s, r) => s + electricitySharePerFloor(r.electricity), 0);
  const accountNumber = list.map(r => r.electricity?.accountNumber).find(Boolean) || "";
  return {
    avgBill: totalBill / list.length,
    avgUnits: totalUnits / list.length,
    avgShare: totalShare / list.length,
    accountNumber,
  };
}
