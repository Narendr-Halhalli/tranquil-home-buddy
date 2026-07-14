export type WaterData = {
  kaveriIn: number;
  kaveriOut: number;
  borewellIn: number;
  borewellOut: number;
  bwssb: number; // BWSSB bill amount = water bill
};

export type ElectricityData = {
  prev: number;
  curr: number;
  bill: number;
};

export type WatchmanData = {
  salary: number;
  bonus: number;
  extra: number;
};

export type MonthRecord = {
  month: string; // "YYYY-MM"
  water?: WaterData;
  electricity?: ElectricityData;
  watchman?: WatchmanData;
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

// --- calculations ---
export function waterConsumption(w?: WaterData) {
  if (!w) return { kaveri: 0, borewell: 0, total: 0 };
  const kaveri = Math.max(0, (w.kaveriOut || 0) - (w.kaveriIn || 0));
  const borewell = Math.max(0, (w.borewellOut || 0) - (w.borewellIn || 0));
  return { kaveri, borewell, total: kaveri + borewell };
}

export function electricityUnits(e?: ElectricityData) {
  if (!e) return 0;
  return Math.max(0, (e.curr || 0) - (e.prev || 0));
}

export function watchmanTotal(w?: WatchmanData) {
  if (!w) return 0;
  return (w.salary || 0) + (w.bonus || 0) + (w.extra || 0);
}

export function monthTotal(r?: MonthRecord) {
  if (!r) return 0;
  return (r.water?.bwssb || 0) + (r.electricity?.bill || 0) + watchmanTotal(r.watchman);
}

export function completeness(r?: MonthRecord) {
  if (!r) return 0;
  let filled = 0;
  if (r.water) filled++;
  if (r.electricity) filled++;
  if (r.watchman) filled++;
  return Math.round((filled / 3) * 100);
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
