import { cn } from "@/lib/utils";

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-sm", className)} />
      <span className="text-xs text-zinc-600">{label}</span>
    </div>
  );
}

export default function LegendBar() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <LegendDot className="bg-blue-500" label="进行中" />
      <LegendDot className="bg-emerald-500" label="已完成" />
      <LegendDot className="bg-zinc-400" label="已取消" />
      <LegendDot className="bg-red-500" label="冲突" />
      <div className="h-4 w-px bg-zinc-200" />
      <LegendDot className="bg-indigo-600" label="Maint" />
      <LegendDot className="bg-orange-500" label="Temp Hold" />
      <LegendDot className="bg-purple-500" label="Internal Use" />
      <LegendDot className="bg-fuchsia-600" label="Ops Lock" />
    </div>
  );
}

