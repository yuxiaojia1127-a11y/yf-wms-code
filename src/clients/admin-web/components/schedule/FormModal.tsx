import { useEffect, useMemo, useState } from "react";
import ModalShell from "@/clients/admin-web/components/schedule/ModalShell";
import type { DraftItemInput } from "@/clients/admin-web/stores/scheduleStore";
import type { ScheduleItem, ScheduleStatus, Vehicle } from "@/utils/scheduleTypes";
import { todayYMD } from "@/utils/date";

const statusOptions: { key: ScheduleStatus; label: string }[] = [
  { key: "in_progress", label: "进行中" },
  { key: "done", label: "已完成" },
  { key: "canceled", label: "已取消" },
  { key: "conflict", label: "冲突" },
];

const nonRevOptions: { key: NonNullable<ScheduleItem["nonRevType"]>; label: string }[] = [
  { key: "maint", label: "Maint" },
  { key: "temp_hold", label: "Temp Hold" },
  { key: "internal_use", label: "Internal Use" },
  { key: "ops_lock", label: "Ops Lock" },
];

function endInclusiveFromExclusive(endExclusive: string) {
  const d = new Date(`${endExclusive}T00:00:00`);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function FormModal(props: {
  open: boolean;
  vehicles: Vehicle[];
  editingItem: ScheduleItem | null;
  defaultVehicleId: string | null;
  onClose: () => void;
  onSave: (draft: DraftItemInput) => void;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ScheduleItem["kind"]>("order");
  const [vehicleId, setVehicleId] = useState("");
  const [startDate, setStartDate] = useState(todayYMD());
  const [endDateInclusive, setEndDateInclusive] = useState(todayYMD());
  const [status, setStatus] = useState<ScheduleStatus>("in_progress");
  const [nonRevType, setNonRevType] = useState<ScheduleItem["nonRevType"]>("temp_hold");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const vehicleOptions = useMemo(() => [...props.vehicles].sort((a, b) => a.code.localeCompare(b.code)), [props.vehicles]);

  useEffect(() => {
    if (!props.open) return;
    setError(null);
    if (props.editingItem) {
      setTitle(props.editingItem.title);
      setKind(props.editingItem.kind);
      setVehicleId(props.editingItem.vehicleId);
      setStartDate(props.editingItem.startDate);
      setEndDateInclusive(endInclusiveFromExclusive(props.editingItem.endDate));
      setStatus(props.editingItem.status);
      setNonRevType(props.editingItem.nonRevType ?? "temp_hold");
      setNote(props.editingItem.note ?? "");
    } else {
      const v = props.defaultVehicleId ?? props.vehicles[0]?.id ?? "";
      setTitle("");
      setKind("order");
      setVehicleId(v);
      const today = todayYMD();
      setStartDate(today);
      setEndDateInclusive(today);
      setStatus("in_progress");
      setNonRevType("temp_hold");
      setNote("");
    }
  }, [props.open, props.editingItem, props.defaultVehicleId, props.vehicles]);

  function submit() {
    const t = title.trim();
    if (!t) {
      setError("请填写任务标题");
      return;
    }
    if (!vehicleId) {
      setError("请选择车辆");
      return;
    }
    if (startDate > endDateInclusive) {
      setError("开始日期不能晚于结束日期");
      return;
    }
    const draft: DraftItemInput = {
      id: props.editingItem?.id,
      kind,
      title: t,
      vehicleId,
      startDate,
      endDateInclusive,
      status,
      note: note.trim() ? note : undefined,
      nonRevType: kind === "non_rev" ? nonRevType : undefined,
    };
    props.onSave(draft);
  }

  return (
    <ModalShell
      open={props.open}
      title={props.editingItem ? "编辑排单" : "新增排单"}
      onClose={props.onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={props.onClose}
            className="inline-flex h-9 items-center rounded-lg border bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={submit}
            className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3 text-sm text-white hover:bg-black"
          >
            保存
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <div className="text-xs font-semibold text-zinc-700">任务标题</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-zinc-400"
              placeholder="例如：订单 C1433..."
            />
          </label>

          <label>
            <div className="text-xs font-semibold text-zinc-700">类型</div>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as ScheduleItem["kind"])}
              className="mt-1 h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-zinc-400"
            >
              <option value="order">订单</option>
              <option value="non_rev">非营收占用</option>
            </select>
          </label>

          <label>
            <div className="text-xs font-semibold text-zinc-700">状态</div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ScheduleStatus)}
              className="mt-1 h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-zinc-400"
            >
              {statusOptions.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-2">
            <div className="text-xs font-semibold text-zinc-700">车辆</div>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-zinc-400"
            >
              <option value="">请选择车辆</option>
              {vehicleOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.groupName} / {v.code} • {v.plateNo}
                </option>
              ))}
            </select>
          </label>

          {kind === "non_rev" ? (
            <label className="sm:col-span-2">
              <div className="text-xs font-semibold text-zinc-700">占用分类</div>
              <select
                value={nonRevType ?? "temp_hold"}
                onChange={(e) => setNonRevType(e.target.value as ScheduleItem["nonRevType"])}
                className="mt-1 h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-zinc-400"
              >
                {nonRevOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label>
            <div className="text-xs font-semibold text-zinc-700">开始日期</div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value > endDateInclusive) setEndDateInclusive(e.target.value);
              }}
              className="mt-1 h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
          </label>

          <label>
            <div className="text-xs font-semibold text-zinc-700">结束日期</div>
            <input
              type="date"
              value={endDateInclusive}
              min={startDate}
              onChange={(e) => setEndDateInclusive(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
          </label>

          <label className="sm:col-span-2">
            <div className="text-xs font-semibold text-zinc-700">备注</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              placeholder="可选"
            />
          </label>
        </div>

        <div className="rounded-lg border bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          日历按“天”粒度渲染：结束日期为包含当天（保存时会自动转换为结束日期+1）。
        </div>
      </div>
    </ModalShell>
  );
}

