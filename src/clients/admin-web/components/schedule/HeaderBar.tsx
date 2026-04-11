import { CalendarDays, ChevronLeft, ChevronRight, Filter, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/clients/admin-web/stores/scheduleStore";

function Segmented({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const items: { key: ViewMode; label: string }[] = [
    { key: "day", label: "日" },
    { key: "week", label: "周" },
    { key: "month", label: "月" },
  ];
  return (
    <div className="inline-flex rounded-lg border bg-white p-1">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          onClick={() => onChange(it.key)}
          className={cn(
            "rounded-md px-3 py-1 text-sm transition",
            value === it.key ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export default function HeaderBar(props: {
  title: string;
  rangeLabel: string;
  view: ViewMode;
  search: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChangeView: (v: ViewMode) => void;
  onChangeSearch: (v: string) => void;
  onOpenFilter: () => void;
  onOpenCreate: () => void;
}) {
  return (
    <div className="sticky top-0 z-20 border-b bg-white">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-zinc-50">
            <CalendarDays className="h-5 w-5 text-zinc-700" />
          </span>
          <div>
            <div className="text-sm font-semibold text-zinc-900">{props.title}</div>
            <div className="text-xs text-zinc-500">{props.rangeLabel}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden w-[280px] sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={props.search}
              onChange={(e) => props.onChangeSearch(e.target.value)}
              placeholder="搜索车辆/任务"
              className="h-9 w-full rounded-lg border bg-white pl-9 pr-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={props.onPrev}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-zinc-700 hover:bg-zinc-50"
              aria-label="上一段"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={props.onToday}
              className="inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              今天
            </button>
            <button
              type="button"
              onClick={props.onNext}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-zinc-700 hover:bg-zinc-50"
              aria-label="下一段"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Segmented value={props.view} onChange={props.onChangeView} />
          <button
            type="button"
            onClick={props.onOpenFilter}
            className="inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Filter className="h-4 w-4" />
            筛选
          </button>
          <button
            type="button"
            onClick={props.onOpenCreate}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-3 text-sm text-white hover:bg-black"
          >
            <Plus className="h-4 w-4" />
            新增排单
          </button>
        </div>
      </div>
    </div>
  );
}

