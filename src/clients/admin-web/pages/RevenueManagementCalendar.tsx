import { useEffect, useMemo, useState } from "react";
import { useScheduleStore } from "@/clients/admin-web/stores/scheduleStore";
import { addDaysYMD, buildDateRange, parseDateYMD, todayYMD } from "@/utils/date";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import DrawerShell from "@/clients/admin-web/components/schedule/DrawerShell";

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

type AnnotationItem = {
  id: string;
  no: number;
  name: string;
  goal: string;
  entry: string;
  rules: string[];
};

const annotationItems: AnnotationItem[] = [
  {
    id: "filter",
    no: 1,
    name: "查询筛选",
    goal: "支持运营或调度人员按门店、车辆分组、SIPP、车型和时间范围缩小分析范围，快速定位目标资源池。",
    entry: "页面顶部筛选卡片，包括门店、车辆分组、SIPP、车型名称、时间范围、重置和搜索。",
    rules: [
      "支持多维条件组合筛选。",
      "时间范围异常时按较早日期到较晚日期自动纠正。",
      "重置恢复默认筛选状态，搜索刷新页面下方所有结果。",
    ],
  },
  {
    id: "overview",
    no: 2,
    name: "利用率概览",
    goal: "帮助用户快速判断当前查询范围内的整体利用率水平，并理解矩阵颜色含义。",
    entry: "查询范围、整体利用率、颜色说明概览卡片。",
    rules: [
      "查询范围与当前筛选条件保持一致。",
      "整体利用率按当前车辆集合与日期集合计算。",
      "颜色图例必须与利用率单元格色阶一一对应。",
    ],
  },
  {
    id: "resource",
    no: 3,
    name: "资源信息行",
    goal: "让用户在浏览矩阵前先识别车辆状态、车辆编码、车牌号和车型信息。",
    entry: "左侧资源列中的车辆信息块与更多按钮。",
    rules: [
      "展示状态点、车辆编码、车牌号和车型名称。",
      "资源列在横向滚动时保持固定，便于与日期列对照。",
      "更多按钮作为后续扩展入口，不影响当前浏览主流程。",
    ],
  },
  {
    id: "month",
    no: 4,
    name: "月份表头",
    goal: "帮助用户在长日期范围下快速识别当前列所属月份分段。",
    entry: "矩阵顶部月份分段表头。",
    rules: [
      "按月份对日期列进行分段展示。",
      "月份标签跨越该月对应的全部日期列。",
      "月份表头与下方日期列保持对齐。",
    ],
  },
  {
    id: "date",
    no: 5,
    name: "日期表头",
    goal: "帮助用户同时识别每一列对应的星期和日期数字，减少跨列误读。",
    entry: "月份表头下方的日期表头单元格。",
    rules: [
      "每列展示周几和日期数字。",
      "日期表头与下方利用率单元格垂直对齐。",
      "在滚动浏览中保持统一密度与节奏。",
    ],
  },
  {
    id: "cell",
    no: 6,
    name: "利用率单元格",
    goal: "让用户按日期和车辆交叉维度查看利用率，并通过点击查看单元格详情。",
    entry: "日历矩阵中的利用率百分比色块单元格。",
    rules: [
      "单元格展示百分比并映射不同色阶。",
      "点击单元格后打开右侧详情卡片。",
      "色阶从无数据、低、中、偏高到高形成统一判断标准。",
    ],
  },
];

const annotationStorageKey = "revenue-calendar-annotations";

function AnnotationBadge(props: {
  no: number;
  onClick: (event: React.MouseEvent<HTMLSpanElement>) => void;
  className?: string;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={props.onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          props.onClick(event as unknown as React.MouseEvent<HTMLSpanElement>);
        }
      }}
      className={cn(
        "absolute z-20 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white shadow ring-2 ring-white",
        props.className,
      )}
      aria-label={`查看标注 ${props.no}`}
    >
      {props.no}
    </span>
  );
}

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
  const [activeAnnotationId, setActiveAnnotationId] = useState(annotationItems[0]?.id ?? "filter");
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [annotations, setAnnotations] = useState<AnnotationItem[]>(annotationItems);
  const [annotationSaved, setAnnotationSaved] = useState(false);

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

  useEffect(() => {
    const raw = window.localStorage.getItem(annotationStorageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as AnnotationItem[];
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      setAnnotations(
        annotationItems.map((item) => {
          const saved = parsed.find((x) => x.id === item.id);
          if (!saved) return item;
          return {
            ...item,
            name: saved.name || item.name,
            goal: saved.goal || item.goal,
            entry: saved.entry || item.entry,
            rules: Array.isArray(saved.rules) && saved.rules.length > 0 ? saved.rules : item.rules,
          };
        }),
      );
    } catch {
      window.localStorage.removeItem(annotationStorageKey);
    }
  }, []);

  const activeAnnotation = annotations.find((item) => item.id === activeAnnotationId) ?? annotations[0];

  function updateAnnotation(id: string, patch: Partial<AnnotationItem>) {
    setAnnotationSaved(false);
    setAnnotations((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function saveAnnotations() {
    window.localStorage.setItem(annotationStorageKey, JSON.stringify(annotations));
    setAnnotationSaved(true);
  }

  function openAnnotation(id: string) {
    setActiveAnnotationId(id);
    setAnnotationOpen(true);
    setAnnotationSaved(false);
  }

  return (
    <div className="mx-auto max-w-[1600px] p-4">
      <div className="relative rounded-xl border bg-white p-4">
        <AnnotationBadge no={1} onClick={() => openAnnotation("filter")} className="right-3 top-3" />
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

      <div className="relative mt-3 rounded-xl border bg-white px-4 py-3">
        <AnnotationBadge no={2} onClick={() => openAnnotation("overview")} className="right-3 top-3" />
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
                className="relative flex items-center justify-center border-r bg-zinc-50 px-2 py-3 text-[11px] font-semibold text-zinc-700"
                style={{ gridColumn: `${s.startIndex + 2} / span ${s.span}` }}
              >
                {s.startIndex === 0 ? (
                  <AnnotationBadge no={4} onClick={() => openAnnotation("month")} className="right-1 top-1" />
                ) : null}
                {s.label}
              </div>
            ))}
          </div>

          <div className="grid border-b bg-white" style={{ gridTemplateColumns: `240px repeat(${dates.length}, 44px)` }}>
            <div className="sticky left-0 z-10 border-r bg-white px-4 py-2 text-xs font-semibold text-zinc-600">&nbsp;</div>
            {dates.map((d) => (
              <div key={d} className="relative border-r px-1 py-2 text-center">
                {d === dates[0] ? <AnnotationBadge no={5} onClick={() => openAnnotation("date")} className="right-0 top-1" /> : null}
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
                          <div className="relative flex items-center gap-2">
                            {v.id === displayVehicles[0]?.id ? (
                              <AnnotationBadge no={3} onClick={() => openAnnotation("resource")} className="-right-1 -top-2" />
                            ) : null}
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
                      className="relative border-r p-1"
                    >
                      {v.id === displayVehicles[0]?.id && d === dates[0] ? (
                        <AnnotationBadge
                          no={6}
                          onClick={(event) => {
                            event.stopPropagation();
                            openAnnotation("cell");
                          }}
                          className="right-0 top-1"
                        />
                      ) : null}
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
      <DrawerShell open={annotationOpen} title="角标标注说明" onClose={() => setAnnotationOpen(false)} widthClassName="w-[520px]">
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-xs font-semibold text-zinc-500">切换功能点</div>
            <select
              value={activeAnnotation.id}
              onChange={(event) => setActiveAnnotationId(event.target.value)}
              className="h-10 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900"
            >
              {annotationItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {`${item.no}. ${item.name}`}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border bg-zinc-50 p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-[11px] font-semibold text-white">
                {activeAnnotation.no}
              </span>
              <input
                value={activeAnnotation.name}
                onChange={(event) => updateAnnotation(activeAnnotation.id, { name: event.target.value })}
                className="h-9 flex-1 rounded-lg border bg-white px-3 text-sm font-semibold text-zinc-900"
              />
            </div>
            <div className="mt-4 space-y-4 text-sm text-zinc-700">
              <div>
                <div className="mb-1 text-xs font-semibold text-zinc-500">业务目标</div>
                <textarea
                  value={activeAnnotation.goal}
                  onChange={(event) => updateAnnotation(activeAnnotation.id, { goal: event.target.value })}
                  className="min-h-[88px] w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900"
                />
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-zinc-500">触发入口</div>
                <textarea
                  value={activeAnnotation.entry}
                  onChange={(event) => updateAnnotation(activeAnnotation.id, { entry: event.target.value })}
                  className="min-h-[72px] w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900"
                />
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-zinc-500">功能规则</div>
                <textarea
                  value={activeAnnotation.rules.join("\n")}
                  onChange={(event) =>
                    updateAnnotation(activeAnnotation.id, {
                      rules: event.target.value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  className="min-h-[120px] w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900"
                />
                <div className="mt-1 text-[11px] text-zinc-500">每行一条规则</div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className={cn("text-xs", annotationSaved ? "text-emerald-600" : "text-zinc-500")}>
                  {annotationSaved ? "已保存到本地" : "修改后点击保存"}
                </div>
                <button
                  type="button"
                  onClick={saveAnnotations}
                  className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-black"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      </DrawerShell>
    </div>
  );
}
