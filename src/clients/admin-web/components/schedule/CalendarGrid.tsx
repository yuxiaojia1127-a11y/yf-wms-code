import { useMemo } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDaysYMD, buildDateRange, formatDowLabel, parseDateYMD } from "@/utils/date";
import { assignLanes, maxLane, overlaps } from "@/utils/scheduleMath";
import type { ScheduleItem, Vehicle } from "@/utils/scheduleTypes";
import StatusPill from "@/clients/admin-web/components/schedule/StatusPill";
import { getItemTone } from "@/clients/admin-web/components/schedule/itemTone";

function dayNumber(ymd: string) {
  return parseDateYMD(ymd).getDate();
}

export default function CalendarGrid(props: {
  rangeStart: string;
  rangeDays: number;
  vehicles: Vehicle[];
  items: ScheduleItem[];
  onOpenDetail: (id: string) => void;
  onCreateOnVehicle: (vehicleId: string) => void;
}) {
  const dates = useMemo(() => buildDateRange(props.rangeStart, props.rangeDays), [props.rangeStart, props.rangeDays]);
  const rangeEnd = useMemo(() => addDaysYMD(props.rangeStart, props.rangeDays), [props.rangeStart, props.rangeDays]);

  const gridCols = useMemo(
    () => ({ gridTemplateColumns: `240px repeat(${props.rangeDays}, minmax(84px, 1fr))` }),
    [props.rangeDays],
  );

  return (
    <div className="flex h-full flex-col rounded-lg border bg-white">
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="grid" style={gridCols}>
          <div className="sticky left-0 z-20 border-r bg-white px-3 py-2">
            <div className="text-xs font-semibold text-zinc-700">RESOURCE</div>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Avail
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Busy
              </span>
            </div>
          </div>
          {dates.map((d) => (
            <div key={d} className="border-r px-2 py-2">
              <div className="text-[11px] font-semibold text-zinc-600">{formatDowLabel(d)}</div>
              <div className="mt-0.5 text-sm font-semibold text-zinc-900">{dayNumber(d)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {props.vehicles.length === 0 ? (
          <div className="p-4 text-sm text-zinc-500">暂无可展示资源</div>
        ) : (
          <div className="min-w-[980px]">
            {props.vehicles.map((v) => {
              const rowItems = props.items.filter(
                (it) => it.vehicleId === v.id && overlaps(it.startDate, it.endDate, props.rangeStart, rangeEnd),
              );
              const lanes = assignLanes(rowItems, props.rangeStart, props.rangeDays);
              const lanesCount = Math.max(1, maxLane(lanes) + 1);
              const height = Math.max(52, 12 + lanesCount * 28);

              return (
                <div key={v.id} className="grid border-b" style={{ ...gridCols, height }}>
                  <div className="sticky left-0 z-10 border-r bg-white px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "mt-1 h-2 w-2 rounded-full",
                              v.status === "avail" ? "bg-emerald-500" : "bg-red-500",
                            )}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="truncate text-sm font-semibold text-zinc-900">{v.code}</div>
                              <div className="text-xs text-zinc-500">{v.plateNo}</div>
                            </div>
                            <div className="truncate text-xs text-zinc-500">{v.model}</div>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => props.onCreateOnVehicle(v.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white text-zinc-600 hover:bg-zinc-50"
                        aria-label="新增"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="relative col-span-full col-start-2">
                    <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${props.rangeDays}, 1fr)` }}>
                      {dates.map((d) => (
                        <div key={d} className={cn("border-r", d === dates[0] ? "" : "")} />
                      ))}
                    </div>
                    <div
                      className="absolute inset-0 grid px-1 py-2"
                      style={{ gridTemplateColumns: `repeat(${props.rangeDays}, 1fr)` }}
                    >
                      {lanes.map((li) => {
                        const tone = getItemTone(li.item);
                        const y = li.lane * 28;
                        return (
                          <button
                            key={li.item.id}
                            type="button"
                            title={li.item.title}
                            onClick={() => props.onOpenDetail(li.item.id)}
                            className={cn(
                              "flex h-6 min-w-0 items-center gap-2 overflow-hidden rounded-md border px-2 text-left text-xs",
                              tone.bg,
                              tone.border,
                              tone.text,
                              "hover:brightness-95",
                            )}
                            style={{ gridColumn: `${li.colStart} / ${li.colEnd}`, transform: `translateY(${y}px)` }}
                          >
                            <span className="truncate font-semibold">{li.item.title}</span>
                            <span className="ml-auto shrink-0">
                              <StatusPill status={li.item.status} className="border-transparent bg-white/60" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

