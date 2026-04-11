import { useMemo, useState } from "react";
import { useScheduleStore } from "@/clients/admin-web/stores/scheduleStore";
import { addDaysYMD, buildDateRange, parseDateYMD, todayYMD } from "@/utils/date";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hashToInt(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function percentFor(key: string) {
  const n = hashToInt(key) % 141;
  return clamp(n - 5, 0, 130);
}

function toneClass(p: number) {
  if (p <= 0) return "bg-zinc-100 text-zinc-500";
  if (p >= 100) return "bg-red-500 text-white";
  if (p >= 80) return "bg-orange-500 text-white";
  if (p >= 50) return "bg-amber-400 text-zinc-900";
  return "bg-emerald-500 text-white";
}

function monthLabelZh(ymd: string) {
  const d = parseDateYMD(ymd);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

function dowLabelZh(ymd: string) {
  const d = parseDateYMD(ymd);
  const labels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return labels[d.getDay()] ?? "";
}

function valueToneLabel(p: number) {
  if (p <= 0) return "无数据";
  if (p >= 100) return "高";
  if (p >= 80) return "偏高";
  if (p >= 50) return "中";
  return "低";
}

function legendItems() {
  return [
    { label: "≥100%", className: "bg-red-500" },
    { label: "80–99%", className: "bg-orange-500" },
    { label: "50–79%", className: "bg-amber-400" },
    { label: "1–49%", className: "bg-emerald-500" },
    { label: "0%", className: "bg-zinc-200" },
  ];
}

function pseudoCount(key: string, min: number, max: number) {
  const span = Math.max(1, max - min + 1);
  return min + (hashToInt(key) % span);
}

type DisplayVehicle = {
  id: string;
  groupName: string;
  code: string;
  plateNo: string;
  model: string;
  status: "avail" | "busy";
};

function buildExtraVehicles(seed: DisplayVehicle[]) {
  const models = [
    "Proton Persona • CCAR",
    "Perodua Axia • CCAR",
    "Hyundai Starex • MVAV",
    "Mazda CX-5 • CDAR",
    "Honda CR-V 5 Seats • FDAR",
    "Perodua Bezza • CCAR",
    "Honda City • CCAR",
    "Volkswagen Tiguan • CDAR",
    "Toyota Alphard/Vellfire • MFBV",
    "Mitsubishi Xpander • MVAV",
    "Wuling Confero • MVAV",
    "Toyota Vios • CCAR",
    "Honda HR-V • CDAR",
    "Perodua Alza • MVAV",
    "Proton Saga • CCAR",
  ];

  const groups = ["A", "B", "C", "D"];
  const existingCodes = new Set(seed.map((v) => v.code));

  const out: DisplayVehicle[] = [];
  let idx = 1;
  for (const g of groups) {
    for (const m of models) {
      const base = m.split("•")[0]?.trim() || m;
      const code = `${base.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5)}${idx}`;
      idx += 1;
      if (existingCodes.has(code)) continue;
      const plateSeed = hashToInt(`${g}|${m}`) % 9000;
      const plateNo = `W${String.fromCharCode(65 + (plateSeed % 26))}${String.fromCharCode(65 + ((plateSeed / 2) % 26))} ${String(1000 + plateSeed).slice(-4)}`;
      out.push({
        id: `v_extra_${g}_${idx}`,
        groupName: g,
        code,
        plateNo,
        model: m,
        status: hashToInt(`${code}|status`) % 5 === 0 ? "busy" : "avail",
      });
      if (out.length >= 24) return out;
    }
  }
  return out;
}

export default function RevenueManagementCalendar() {
  const vehicles = useScheduleStore((s) => s.vehicles);

  const [store, setStore] = useState<string>("全部门店");
  const [group, setGroup] = useState<string>("全部分组");
  const [sipp, setSipp] = useState<string>("全部SIPP");
  const [model, setModel] = useState<string>("全部车型");

  const today = todayYMD();
  const defaultStart = addDaysYMD(today, -14);
  const defaultEnd = addDaysYMD(today, 30);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const dates = useMemo(() => {
    const s = startDate <= endDate ? startDate : endDate;
    const e = startDate <= endDate ? endDate : startDate;
    const diffDays = Math.min(80, Math.max(1, Math.round((new Date(`${e}T00:00:00`).getTime() - new Date(`${s}T00:00:00`).getTime()) / 86400000) + 1));
    return buildDateRange(s, diffDays);
  }, [startDate, endDate]);

  const monthSegments = useMemo(() => {
    const segs: { label: string; startIndex: number; span: number }[] = [];
    let i = 0;
    while (i < dates.length) {
      const label = monthLabelZh(dates[i]);
      let j = i;
      while (j < dates.length && monthLabelZh(dates[j]) === label) j += 1;
      segs.push({ label, startIndex: i, span: j - i });
      i = j;
    }
    return segs;
  }, [dates]);

  const displayVehicles = useMemo(() => {
    const base: DisplayVehicle[] = vehicles.map((v) => ({
      id: v.id,
      groupName: v.groupName,
      code: v.code,
      plateNo: v.plateNo,
      model: v.model,
      status: v.status,
    }));
    const extras = buildExtraVehicles(base);
    const all = [...base, ...extras]
      .filter((v) => (group === "全部分组" ? true : v.groupName === group))
      .filter((v) => (model === "全部车型" ? true : v.model.toLowerCase().includes(model.toLowerCase())))
      .sort((a, b) => (a.groupName === b.groupName ? a.code.localeCompare(b.code) : a.groupName.localeCompare(b.groupName)));
    return all;
  }, [vehicles, group, model]);

  const [activeCell, setActiveCell] = useState<null | { vehicle: DisplayVehicle; date: string; p: number }>(null);

  const overallUtilization = useMemo(() => {
    if (displayVehicles.length === 0 || dates.length === 0) return 0;
    let sum = 0;
    let count = 0;
    for (const v of displayVehicles) {
      for (const d of dates) {
        const p = percentFor(`${v.id}|${d}`);
        sum += Math.min(100, p);
        count += 1;
      }
    }
    return Math.round(sum / Math.max(1, count));
  }, [displayVehicles, dates]);

  const totalsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of dates) {
      let sum = 0;
      for (const v of displayVehicles) sum += Math.min(100, percentFor(`${v.id}|${d}`));
      map[d] = displayVehicles.length ? Math.round(sum / displayVehicles.length) : 0;
    }
    return map;
  }, [displayVehicles, dates]);

  return (
    <div className="mx-auto max-w-[1600px] p-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[160px]">
            <div className="text-xs font-semibold text-zinc-700">门店</div>
            <select value={store} onChange={(e) => setStore(e.target.value)} className="mt-1 h-9 w-full rounded-lg border bg-white px-3 text-sm">
              <option value="全部门店">全部门店</option>
              <option value="门店A">门店A</option>
              <option value="门店B">门店B</option>
            </select>
          </label>
          <label className="min-w-[160px]">
            <div className="text-xs font-semibold text-zinc-700">车辆分组</div>
            <select value={group} onChange={(e) => setGroup(e.target.value)} className="mt-1 h-9 w-full rounded-lg border bg-white px-3 text-sm">
              <option value="全部分组">全部分组</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </label>
          <label className="min-w-[160px]">
            <div className="text-xs font-semibold text-zinc-700">SIPP</div>
            <select value={sipp} onChange={(e) => setSipp(e.target.value)} className="mt-1 h-9 w-full rounded-lg border bg-white px-3 text-sm">
              <option value="全部SIPP">全部SIPP</option>
              <option value="CCAR">CCAR</option>
              <option value="CDAR">CDAR</option>
              <option value="FDAR">FDAR</option>
            </select>
          </label>
          <label className="min-w-[180px]">
            <div className="text-xs font-semibold text-zinc-700">车型名称</div>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 h-9 w-full rounded-lg border bg-white px-3 text-sm">
              <option value="全部车型">全部车型</option>
              <option value="Proton Saga">Proton Saga</option>
              <option value="Mazda CX-5">Mazda CX-5</option>
              <option value="Hyundai Staria">Hyundai Staria</option>
            </select>
          </label>
          <label className="min-w-[240px]">
            <div className="text-xs font-semibold text-zinc-700">时间范围</div>
            <div className="mt-1 flex items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 w-full rounded-lg border bg-white px-3 text-sm" />
              <span className="text-xs text-zinc-400">-</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 w-full rounded-lg border bg-white px-3 text-sm" />
            </div>
          </label>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" className="inline-flex h-9 items-center rounded-lg border bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50">
              重置
            </button>
            <button type="button" className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3 text-sm text-white hover:bg-black">
              搜索
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm font-semibold text-zinc-900">
            查询范围：{startDate} - {endDate}
          </div>
          <div className="text-sm text-zinc-700">
            整体利用率：<span className="font-semibold text-zinc-900">{overallUtilization}%</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs text-zinc-500">颜色说明</div>
            {legendItems().map((x) => (
              <div key={x.label} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-sm ${x.className}`} />
                <span className="text-xs text-zinc-600">{x.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeCell ? (
        <div className="mt-3 flex justify-end">
          <div className="w-full max-w-[420px] space-y-3">
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-900">{activeCell.vehicle.code} • {activeCell.vehicle.plateNo}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {activeCell.vehicle.model} · {activeCell.date} · {dowLabelZh(activeCell.date)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCell(null)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white text-zinc-600 hover:bg-zinc-50"
                  aria-label="关闭"
                >
                  ×
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-zinc-50 px-3 py-2">
                  <div className="text-[11px] text-zinc-500">Utilization</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">{activeCell.p}%</div>
                </div>
                <div className="rounded-lg border bg-zinc-50 px-3 py-2">
                  <div className="text-[11px] text-zinc-500">状态</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">{valueToneLabel(activeCell.p)}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <div className="text-sm font-semibold text-zinc-900">详情</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border bg-white px-3 py-2">
                  <div className="text-[11px] text-zinc-500">订单数</div>
                  <div className="mt-1 font-semibold text-zinc-900">{pseudoCount(`${activeCell.vehicle.id}|${activeCell.date}|orders`, 0, 8)}</div>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2">
                  <div className="text-[11px] text-zinc-500">可租车辆数</div>
                  <div className="mt-1 font-semibold text-zinc-900">{pseudoCount(`${activeCell.vehicle.id}|${activeCell.date}|avail`, 1, 12)}</div>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2">
                  <div className="text-[11px] text-zinc-500">已确认订单</div>
                  <div className="mt-1 font-semibold text-zinc-900">{pseudoCount(`${activeCell.vehicle.id}|${activeCell.date}|confirmed`, 0, 6)}</div>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2">
                  <div className="text-[11px] text-zinc-500">待确认订单</div>
                  <div className="mt-1 font-semibold text-zinc-900">{pseudoCount(`${activeCell.vehicle.id}|${activeCell.date}|pending`, 0, 6)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 overflow-auto rounded-xl border bg-white">
        <div className="min-w-[1200px]">
          <div className="grid border-b" style={{ gridTemplateColumns: `240px repeat(${dates.length}, 44px)` }}>
            <div className="sticky left-0 z-10 border-r bg-white px-4 py-3">
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
            {monthSegments.map((s) => (
              <div
                key={`${s.label}-${s.startIndex}`}
                className="flex items-center justify-center border-r bg-zinc-50 px-2 py-3 text-[11px] font-semibold text-zinc-700"
                style={{ gridColumn: `${s.startIndex + 2} / span ${s.span}` }}
              >
                {s.label}
              </div>
            ))}
          </div>

          <div className="grid border-b bg-white" style={{ gridTemplateColumns: `240px repeat(${dates.length}, 44px)` }}>
            <div className="sticky left-0 z-10 border-r bg-white px-4 py-2 text-xs font-semibold text-zinc-600">&nbsp;</div>
            {dates.map((d) => (
              <div key={d} className="border-r px-1 py-2 text-center">
                <div className="text-[10px] font-semibold text-zinc-500">{dowLabelZh(d)}</div>
                <div className="mt-0.5 text-xs font-semibold text-zinc-900">{Number(d.split("-")[2])}</div>
              </div>
            ))}
          </div>

          <div>
            {displayVehicles.map((v) => (
              <div key={v.id} className="grid border-b" style={{ gridTemplateColumns: `240px repeat(${dates.length}, 44px)` }}>
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white text-zinc-600 hover:bg-zinc-50"
                      aria-label="更多"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {dates.map((d) => {
                  const p = percentFor(`${v.id}|${d}`);
                  return (
                    <button
                      key={`${v.id}-${d}`}
                      type="button"
                      onClick={() => setActiveCell({ vehicle: v, date: d, p })}
                      className="border-r p-1"
                    >
                      <div className={`flex h-9 w-full items-center justify-center rounded-md text-xs font-semibold ${toneClass(p)} hover:brightness-95`}>
                        {p}%
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}

            <div className="grid bg-zinc-50" style={{ gridTemplateColumns: `240px repeat(${dates.length}, 44px)` }}>
              <div className="sticky left-0 z-10 border-r bg-zinc-50 px-4 py-2">
                <div className="text-xs font-semibold text-zinc-900">总计</div>
              </div>
              {dates.map((d) => {
                const p = totalsByDate[d] ?? 0;
                return (
                  <div key={`total-${d}`} className="border-r p-1">
                    <div className={`flex h-9 w-full items-center justify-center rounded-md text-xs font-semibold ${toneClass(p)}`}>{p}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
