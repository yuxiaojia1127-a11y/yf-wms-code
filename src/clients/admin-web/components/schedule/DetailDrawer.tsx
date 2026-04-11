import DrawerShell from "@/clients/admin-web/components/schedule/DrawerShell";
import StatusPill from "@/clients/admin-web/components/schedule/StatusPill";
import type { ScheduleItem, Vehicle } from "@/utils/scheduleTypes";

function dateRangeLabel(item: ScheduleItem) {
  const endInclusive = new Date(`${item.endDate}T00:00:00`);
  endInclusive.setDate(endInclusive.getDate() - 1);
  const y = endInclusive.getFullYear();
  const m = String(endInclusive.getMonth() + 1).padStart(2, "0");
  const d = String(endInclusive.getDate()).padStart(2, "0");
  return `${item.startDate} ~ ${y}-${m}-${d}`;
}

export default function DetailDrawer(props: {
  open: boolean;
  item: ScheduleItem | null;
  vehicle: Vehicle | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DrawerShell
      open={props.open}
      side="right"
      widthClassName="w-[520px]"
      title={props.item ? "排单详情" : "排单详情"}
      onClose={props.onClose}
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={props.onDelete}
            disabled={!props.item}
            className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-white px-3 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            删除
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={props.onClose}
              className="inline-flex h-9 items-center rounded-lg border bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              关闭
            </button>
            <button
              type="button"
              onClick={props.onEdit}
              disabled={!props.item}
              className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3 text-sm text-white hover:bg-black disabled:opacity-50"
            >
              编辑
            </button>
          </div>
        </div>
      }
    >
      {props.item ? (
        <div className="space-y-5">
          <div className="rounded-lg border bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-zinc-900">{props.item.title}</div>
                <div className="mt-1 text-xs text-zinc-500">{dateRangeLabel(props.item)}</div>
              </div>
              <StatusPill status={props.item.status} />
            </div>
          </div>

          <div className="rounded-lg border bg-white p-3">
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <div className="text-xs text-zinc-500">车辆</div>
                <div className="mt-0.5 font-medium text-zinc-900">
                  {props.vehicle ? `${props.vehicle.code} • ${props.vehicle.plateNo}` : props.item.vehicleId}
                </div>
                {props.vehicle ? <div className="mt-0.5 text-xs text-zinc-500">{props.vehicle.model}</div> : null}
              </div>
              <div>
                <div className="text-xs text-zinc-500">类型</div>
                <div className="mt-0.5 font-medium text-zinc-900">{props.item.kind === "order" ? "订单" : "非营收占用"}</div>
              </div>
              {props.item.kind === "non_rev" ? (
                <div>
                  <div className="text-xs text-zinc-500">占用分类</div>
                  <div className="mt-0.5 font-medium text-zinc-900">{props.item.nonRevType ?? "-"}</div>
                </div>
              ) : null}
              <div>
                <div className="text-xs text-zinc-500">备注</div>
                <div className="mt-0.5 whitespace-pre-wrap text-zinc-800">{props.item.note?.trim() ? props.item.note : "-"}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-zinc-500">未选择排单</div>
      )}
    </DrawerShell>
  );
}

