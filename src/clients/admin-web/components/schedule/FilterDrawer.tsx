import { useEffect, useState } from "react";
import DrawerShell from "@/clients/admin-web/components/schedule/DrawerShell";
import type { FiltersState } from "@/clients/admin-web/stores/scheduleStore";
import type { ScheduleStatus } from "@/utils/scheduleTypes";

const statusOptions: { key: ScheduleStatus; label: string }[] = [
  { key: "in_progress", label: "进行中" },
  { key: "done", label: "已完成" },
  { key: "canceled", label: "已取消" },
  { key: "conflict", label: "冲突" },
];

function cloneFilters(filters: FiltersState): FiltersState {
  return {
    status: { ...filters.status },
    groups: { ...filters.groups },
  };
}

export default function FilterDrawer(props: {
  open: boolean;
  groups: string[];
  value: FiltersState;
  onClose: () => void;
  onApply: (v: FiltersState) => void;
}) {
  const [draft, setDraft] = useState<FiltersState>(() => cloneFilters(props.value));

  useEffect(() => {
    if (!props.open) setDraft(cloneFilters(props.value));
  }, [props.open, props.value]);

  return (
    <DrawerShell
      open={props.open}
      side="right"
      title="筛选"
      onClose={() => {
        setDraft(cloneFilters(props.value));
        props.onClose();
      }}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              setDraft({
                status: { in_progress: true, done: true, canceled: true, conflict: true },
                groups: Object.fromEntries(props.groups.map((g) => [g, true])),
              })
            }
            className="inline-flex h-9 items-center rounded-lg border bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            重置
          </button>
          <button
            type="button"
            onClick={() => {
              props.onApply(draft);
              props.onClose();
            }}
            className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3 text-sm text-white hover:bg-black"
          >
            应用
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <div className="text-xs font-semibold text-zinc-700">状态</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {statusOptions.map((s) => (
              <label key={s.key} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.status[s.key]}
                  onChange={(e) => setDraft((d) => ({ ...d, status: { ...d.status, [s.key]: e.target.checked } }))}
                />
                <span className="text-zinc-800">{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-zinc-700">车组</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {props.groups.map((g) => (
              <label key={g} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.groups[g] ?? true}
                  onChange={(e) => setDraft((d) => ({ ...d, groups: { ...d.groups, [g]: e.target.checked } }))}
                />
                <span className="text-zinc-800">{g}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </DrawerShell>
  );
}

