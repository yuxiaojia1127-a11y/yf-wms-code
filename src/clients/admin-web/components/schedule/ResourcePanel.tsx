import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/utils/scheduleTypes";

export default function ResourcePanel(props: {
  vehicles: Vehicle[];
  selectedVehicleIds: Record<string, boolean>;
  groupsEnabled: Record<string, boolean>;
  onToggleVehicle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const by: Record<string, Vehicle[]> = {};
    for (const v of props.vehicles) {
      if (!props.groupsEnabled[v.groupName]) continue;
      if (q.trim()) {
        const t = q.trim().toLowerCase();
        const hit = `${v.code} ${v.plateNo} ${v.model}`.toLowerCase().includes(t);
        if (!hit) continue;
      }
      by[v.groupName] ??= [];
      by[v.groupName].push(v);
    }
    for (const k of Object.keys(by)) by[k].sort((a, b) => a.code.localeCompare(b.code));
    return Object.entries(by).sort((a, b) => a[0].localeCompare(b[0]));
  }, [props.vehicles, props.groupsEnabled, q]);

  const visibleIds = useMemo(() => groups.flatMap(([, vs]) => vs.map((v) => v.id)), [groups]);

  return (
    <div className="flex h-full flex-col rounded-lg border bg-white">
      <div className="border-b p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-zinc-900">资源</div>
          <button type="button" onClick={() => props.onSelectAll(visibleIds)} className="text-xs text-zinc-600 hover:text-zinc-900">
            全选
          </button>
        </div>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索车辆"
            className="h-9 w-full rounded-lg border bg-white pl-9 pr-3 text-sm outline-none focus:border-zinc-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {groups.length === 0 ? (
          <div className="p-4 text-sm text-zinc-500">无匹配资源</div>
        ) : (
          <div className="p-2">
            {groups.map(([groupName, vs]) => {
              const isOpen = openGroups[groupName] ?? true;
              return (
                <div key={groupName} className="mb-2 rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setOpenGroups((s) => ({ ...s, [groupName]: !isOpen }))}
                    className="flex w-full items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-zinc-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-zinc-600" />
                      )}
                      <span className="text-sm font-semibold text-zinc-900">{groupName}</span>
                      <span className="text-xs text-zinc-500">({vs.length})</span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {vs.filter((v) => props.selectedVehicleIds[v.id]).length}/{vs.length}
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="divide-y">
                      {vs.map((v) => {
                        const selected = Boolean(props.selectedVehicleIds[v.id]);
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => props.onToggleVehicle(v.id)}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-zinc-50",
                              selected && "bg-zinc-50",
                            )}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full",
                                    v.status === "avail" ? "bg-emerald-500" : "bg-red-500",
                                  )}
                                />
                                <span className="text-sm font-semibold text-zinc-900">{v.code}</span>
                                <span className="text-xs text-zinc-500">{v.plateNo}</span>
                              </div>
                              <div className="truncate text-xs text-zinc-500">{v.model}</div>
                            </div>
                            <span
                              className={cn(
                                "inline-flex h-5 items-center rounded-md border px-2 text-[11px]",
                                selected ? "border-zinc-300 bg-white text-zinc-700" : "border-zinc-200 bg-zinc-100 text-zinc-500",
                              )}
                            >
                              {selected ? "显示" : "隐藏"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

