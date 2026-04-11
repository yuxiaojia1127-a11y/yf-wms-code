import ModalShell from "@/clients/admin-web/components/schedule/ModalShell";
import type { ScheduleItem, Vehicle } from "@/utils/scheduleTypes";

function endInclusiveLabel(endExclusive: string) {
  const d = new Date(`${endExclusive}T00:00:00`);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ConflictModal(props: {
  open: boolean;
  conflicts: ScheduleItem[];
  vehiclesById: Record<string, Vehicle>;
  onBack: () => void;
  onForceSave: () => void;
  onCloseAll?: () => void;
}) {
  return (
    <ModalShell
      open={props.open}
      title="排单冲突"
      onClose={props.onCloseAll ?? props.onBack}
      widthClassName="max-w-[720px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={props.onBack}
            className="inline-flex h-9 items-center rounded-lg border bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            返回修改
          </button>
          <button
            type="button"
            onClick={props.onForceSave}
            className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3 text-sm text-white hover:bg-black"
          >
            仍然保存
          </button>
        </div>
      }
    >
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">检测到时间重叠冲突，请检查以下占用。</div>
      <div className="mt-3 overflow-hidden rounded-lg border">
        <div className="grid grid-cols-12 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700">
          <div className="col-span-5">任务</div>
          <div className="col-span-4">车辆</div>
          <div className="col-span-3">日期</div>
        </div>
        <div className="divide-y">
          {props.conflicts.map((c) => {
            const v = props.vehiclesById[c.vehicleId];
            return (
              <div key={c.id} className="grid grid-cols-12 px-3 py-2 text-sm">
                <div className="col-span-5 truncate text-zinc-900">{c.title}</div>
                <div className="col-span-4 truncate text-zinc-600">{v ? `${v.code} • ${v.plateNo}` : c.vehicleId}</div>
                <div className="col-span-3 text-zinc-600">
                  {c.startDate} ~ {endInclusiveLabel(c.endDate)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ModalShell>
  );
}

