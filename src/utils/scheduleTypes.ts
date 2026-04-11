export type VehicleStatus = "avail" | "busy";

export type ScheduleStatus = "in_progress" | "done" | "canceled" | "conflict";

export type NonRevType = "maint" | "temp_hold" | "internal_use" | "ops_lock";

export type ItemKind = "order" | "non_rev";

export type DateYMD = string;

export interface Vehicle {
  id: string;
  code: string;
  plateNo: string;
  model: string;
  groupName: string;
  status: VehicleStatus;
}

export interface ScheduleItem {
  id: string;
  kind: ItemKind;
  title: string;
  vehicleId: string;
  startDate: DateYMD;
  endDate: DateYMD;
  status: ScheduleStatus;
  nonRevType?: NonRevType;
  note?: string;
}

export interface ScheduleData {
  vehicles: Vehicle[];
  items: ScheduleItem[];
}

