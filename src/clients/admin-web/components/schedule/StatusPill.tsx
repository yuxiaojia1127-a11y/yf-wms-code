import { cn } from "@/lib/utils";
import type { ScheduleStatus } from "@/utils/scheduleTypes";

const statusLabel: Record<ScheduleStatus, string> = {
  in_progress: "进行中",
  done: "已完成",
  canceled: "已取消",
  conflict: "冲突",
};

export default function StatusPill({ status, className }: { status: ScheduleStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        status === "in_progress" && "border-blue-200 bg-blue-50 text-blue-700",
        status === "done" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "canceled" && "border-zinc-200 bg-zinc-50 text-zinc-700",
        status === "conflict" && "border-red-200 bg-red-50 text-red-700",
        className,
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

