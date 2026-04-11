import type { ScheduleItem } from "@/utils/scheduleTypes";

export function getItemTone(item: ScheduleItem) {
  if (item.kind === "non_rev") {
    if (item.nonRevType === "maint") return { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" };
    if (item.nonRevType === "temp_hold") return { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" };
    if (item.nonRevType === "internal_use") return { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" };
    if (item.nonRevType === "ops_lock") return { bg: "bg-fuchsia-50", border: "border-fuchsia-200", text: "text-fuchsia-700" };
    return { bg: "bg-zinc-50", border: "border-zinc-200", text: "text-zinc-700" };
  }

  if (item.status === "in_progress") return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" };
  if (item.status === "done") return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" };
  if (item.status === "canceled") return { bg: "bg-zinc-50", border: "border-zinc-200", text: "text-zinc-700" };
  return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" };
}

