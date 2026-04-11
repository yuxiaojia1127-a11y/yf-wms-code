export type ViewMode = "day" | "week" | "month";

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatDateYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseDateYMD(ymd: string) {
  return new Date(`${ymd}T00:00:00`);
}

export function addDaysYMD(ymd: string, days: number) {
  const d = parseDateYMD(ymd);
  d.setDate(d.getDate() + days);
  return formatDateYMD(d);
}

export function diffDaysYMD(fromYmd: string, toYmd: string) {
  const a = parseDateYMD(fromYmd).getTime();
  const b = parseDateYMD(toYmd).getTime();
  return Math.round((b - a) / 86400000);
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function startOfWeekYMD(ymd: string, weekStartsOn: 0 | 1 = 0) {
  const d = parseDateYMD(ymd);
  const day = d.getDay();
  const delta = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - delta);
  return formatDateYMD(d);
}

export function startOfMonthYMD(ymd: string) {
  const d = parseDateYMD(ymd);
  d.setDate(1);
  return formatDateYMD(d);
}

export function todayYMD() {
  return formatDateYMD(new Date());
}

export function daysCountForView(view: ViewMode) {
  if (view === "day") return 1;
  if (view === "week") return 14;
  return 31;
}

export function getRangeStartForView(view: ViewMode, baseYmd: string) {
  if (view === "day") return baseYmd;
  if (view === "week") return startOfWeekYMD(baseYmd, 0);
  return startOfMonthYMD(baseYmd);
}

export function buildDateRange(rangeStart: string, days: number) {
  const out: string[] = [];
  for (let i = 0; i < days; i++) out.push(addDaysYMD(rangeStart, i));
  return out;
}

export function formatDowLabel(ymd: string) {
  const d = parseDateYMD(ymd);
  const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return map[d.getDay()];
}

