import type { ScheduleData, ScheduleItem, Vehicle } from "@/utils/scheduleTypes";

const STORAGE_KEY = "vehicle_schedule_v1";

function isVehicle(v: unknown): v is Vehicle {
  const x = v as Vehicle;
  return Boolean(
    x &&
      typeof x.id === "string" &&
      typeof x.code === "string" &&
      typeof x.plateNo === "string" &&
      typeof x.model === "string" &&
      typeof x.groupName === "string" &&
      (x.status === "avail" || x.status === "busy"),
  );
}

function isItem(v: unknown): v is ScheduleItem {
  const x = v as ScheduleItem;
  return Boolean(
    x &&
      typeof x.id === "string" &&
      (x.kind === "order" || x.kind === "non_rev") &&
      typeof x.title === "string" &&
      typeof x.vehicleId === "string" &&
      typeof x.startDate === "string" &&
      typeof x.endDate === "string" &&
      (x.status === "in_progress" || x.status === "done" || x.status === "canceled" || x.status === "conflict"),
  );
}

export function loadScheduleData(): ScheduleData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ScheduleData>;
    if (!parsed || !Array.isArray(parsed.vehicles) || !Array.isArray(parsed.items)) return null;
    const vehicles = parsed.vehicles.filter(isVehicle);
    const items = parsed.items.filter(isItem);
    return { vehicles, items };
  } catch {
    return null;
  }
}

export function saveScheduleData(data: ScheduleData) {
  const payload: ScheduleData = { vehicles: data.vehicles, items: data.items };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearScheduleData() {
  localStorage.removeItem(STORAGE_KEY);
}

