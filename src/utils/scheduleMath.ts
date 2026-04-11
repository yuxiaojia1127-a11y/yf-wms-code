import { clamp, diffDaysYMD } from "@/utils/date";
import type { ScheduleItem } from "@/utils/scheduleTypes";

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && aEnd > bStart;
}

export function normalizeSpan(rangeStart: string, rangeDays: number, startDate: string, endDate: string) {
  const startOffset = diffDaysYMD(rangeStart, startDate);
  const endOffset = diffDaysYMD(rangeStart, endDate);
  const start = clamp(startOffset, 0, rangeDays);
  const end = clamp(endOffset, 0, rangeDays);
  return { start, end: Math.max(start + 1, end) };
}

export interface LaneItem {
  item: ScheduleItem;
  lane: number;
  colStart: number;
  colEnd: number;
}

export function assignLanes(items: ScheduleItem[], rangeStart: string, rangeDays: number): LaneItem[] {
  const sorted = [...items].sort((a, b) => (a.startDate === b.startDate ? a.endDate.localeCompare(b.endDate) : a.startDate.localeCompare(b.startDate)));
  const laneEnds: string[] = [];
  const out: LaneItem[] = [];

  for (const it of sorted) {
    let lane = laneEnds.findIndex((end) => it.startDate >= end);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(it.endDate);
    } else {
      laneEnds[lane] = it.endDate;
    }

    const span = normalizeSpan(rangeStart, rangeDays, it.startDate, it.endDate);
    out.push({ item: it, lane, colStart: span.start + 1, colEnd: span.end + 1 });
  }

  return out;
}

export function maxLane(lanes: LaneItem[]) {
  return lanes.reduce((m, x) => Math.max(m, x.lane), -1);
}

