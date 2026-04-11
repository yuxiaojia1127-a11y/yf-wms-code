import { create } from "zustand";
import { loadScheduleData, saveScheduleData } from "@/utils/storage";
import type { ScheduleData, ScheduleItem, ScheduleStatus, Vehicle } from "@/utils/scheduleTypes";
import { createId } from "@/utils/id";
import { addDaysYMD, todayYMD } from "@/utils/date";
import { overlaps } from "@/utils/scheduleMath";

export type ViewMode = "day" | "week" | "month";

export interface FiltersState {
  status: Record<ScheduleStatus, boolean>;
  groups: Record<string, boolean>;
}

export interface UiState {
  view: ViewMode;
  anchorDate: string;
  search: string;
  selectedVehicleIds: Record<string, boolean>;
  isFilterOpen: boolean;
  isDetailOpen: boolean;
  isFormOpen: boolean;
  isConflictOpen: boolean;
  activeItemId: string | null;
  editingItemId: string | null;
  formVehicleId: string | null;
}

export interface DraftItemInput {
  id?: string;
  kind: ScheduleItem["kind"];
  title: string;
  vehicleId: string;
  startDate: string;
  endDateInclusive: string;
  status: ScheduleStatus;
  note?: string;
  nonRevType?: ScheduleItem["nonRevType"];
}

interface ScheduleStore {
  vehicles: Vehicle[];
  items: ScheduleItem[];
  filters: FiltersState;
  ui: UiState;
  pendingSave: { draft: DraftItemInput; conflicts: ScheduleItem[] } | null;

  init: () => void;
  setView: (view: ViewMode) => void;
  shiftAnchor: (deltaDays: number) => void;
  resetToToday: () => void;
  setSearch: (v: string) => void;
  toggleVehicleSelected: (vehicleId: string) => void;
  selectAllVisible: (vehicleIds: string[]) => void;
  setFilterOpen: (open: boolean) => void;
  setDetailOpen: (open: boolean) => void;
  setFormOpen: (open: boolean) => void;
  openCreate: (vehicleId?: string) => void;
  openEdit: (itemId: string) => void;
  openDetail: (itemId: string) => void;
  closeOverlays: () => void;
  applyFilters: (filters: FiltersState) => void;
  saveDraft: (draft: DraftItemInput) => void;
  confirmForceSave: () => void;
  cancelConflict: () => void;
  deleteItem: (id: string) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  resetData: () => void;
}

function seedData(): ScheduleData {
  const vehicles: Vehicle[] = [
    { id: "v_alza2", code: "ALZA2", plateNo: "WNS 5289", model: "Perodua Alza • MAY", groupName: "B", status: "avail" },
    { id: "v_alza3", code: "ALZA3", plateNo: "WNS 5287", model: "Perodua Alza • MAY", groupName: "B", status: "avail" },
    { id: "v_aruz1", code: "ARUZ1", plateNo: "VJF 2167", model: "Perodua Aruz • SAY", groupName: "B", status: "avail" },
    { id: "v_aruz2", code: "ARUZ2", plateNo: "VJF 2175", model: "Perodua Aruz • SAY", groupName: "B", status: "avail" },
    { id: "v_staria1", code: "STARIA1", plateNo: "WJQ 2062", model: "Hyundai Staria • RMAD", groupName: "C", status: "avail" },
    { id: "v_staria2", code: "STARIA2", plateNo: "WJQ 2063", model: "Hyundai Staria • RMAD", groupName: "C", status: "avail" },
    { id: "v_cx5", code: "CX5", plateNo: "WAX 7124", model: "Mazda CX-5 • SUV", groupName: "D", status: "avail" },
  ];

  const today = todayYMD();
  const start = addDaysYMD(today, 2);
  const endExclusive = addDaysYMD(start, 2);
  const items: ScheduleItem[] = [
    {
      id: "it_seed_1",
      kind: "order",
      title: "C1433... 取/还车",
      vehicleId: "v_alza2",
      startDate: start,
      endDate: endExclusive,
      status: "in_progress",
      note: "示例排单",
    },
  ];

  return { vehicles, items };
}

function defaultFilters(groups: string[]): FiltersState {
  return {
    status: { in_progress: true, done: true, canceled: true, conflict: true },
    groups: Object.fromEntries(groups.map((g) => [g, true])),
  };
}

function buildSelectedAll(vehicleIds: string[]) {
  return Object.fromEntries(vehicleIds.map((id) => [id, true]));
}

function computeConflicts(draft: DraftItemInput, items: ScheduleItem[]) {
  const endExclusive = addDaysYMD(draft.endDateInclusive, 1);
  return items.filter((it) => {
    if (draft.id && it.id === draft.id) return false;
    if (it.vehicleId !== draft.vehicleId) return false;
    return overlaps(draft.startDate, endExclusive, it.startDate, it.endDate);
  });
}

function commitDraft(draft: DraftItemInput, prev: ScheduleItem[]) {
  const endExclusive = addDaysYMD(draft.endDateInclusive, 1);
  const id = draft.id ?? createId("it");
  const nextItem: ScheduleItem = {
    id,
    kind: draft.kind,
    title: draft.title.trim(),
    vehicleId: draft.vehicleId,
    startDate: draft.startDate,
    endDate: endExclusive,
    status: draft.status,
    note: draft.note?.trim() ? draft.note.trim() : undefined,
    nonRevType: draft.kind === "non_rev" ? draft.nonRevType : undefined,
  };

  const exists = prev.some((x) => x.id === id);
  if (!exists) return [...prev, nextItem];
  return prev.map((x) => (x.id === id ? nextItem : x));
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  vehicles: [],
  items: [],
  filters: defaultFilters([]),
  ui: {
    view: "week",
    anchorDate: todayYMD(),
    search: "",
    selectedVehicleIds: {},
    isFilterOpen: false,
    isDetailOpen: false,
    isFormOpen: false,
    isConflictOpen: false,
    activeItemId: null,
    editingItemId: null,
    formVehicleId: null,
  },
  pendingSave: null,

  init: () => {
    const loaded = loadScheduleData() ?? seedData();
    const groups = Array.from(new Set(loaded.vehicles.map((v) => v.groupName))).sort();
    set({
      vehicles: loaded.vehicles,
      items: loaded.items,
      filters: defaultFilters(groups),
      ui: {
        ...get().ui,
        selectedVehicleIds: buildSelectedAll(loaded.vehicles.map((v) => v.id)),
      },
    });
    saveScheduleData({ vehicles: loaded.vehicles, items: loaded.items });
  },

  setView: (view) => set((s) => ({ ui: { ...s.ui, view } })),
  shiftAnchor: (deltaDays) => set((s) => ({ ui: { ...s.ui, anchorDate: addDaysYMD(s.ui.anchorDate, deltaDays) } })),
  resetToToday: () => set((s) => ({ ui: { ...s.ui, anchorDate: todayYMD() } })),
  setSearch: (v) => set((s) => ({ ui: { ...s.ui, search: v } })),

  toggleVehicleSelected: (vehicleId) =>
    set((s) => ({
      ui: {
        ...s.ui,
        selectedVehicleIds: {
          ...s.ui.selectedVehicleIds,
          [vehicleId]: !s.ui.selectedVehicleIds[vehicleId],
        },
      },
    })),

  selectAllVisible: (vehicleIds) => set((s) => ({ ui: { ...s.ui, selectedVehicleIds: buildSelectedAll(vehicleIds) } })),
  setFilterOpen: (open) => set((s) => ({ ui: { ...s.ui, isFilterOpen: open } })),
  setDetailOpen: (open) => set((s) => ({ ui: { ...s.ui, isDetailOpen: open } })),
  setFormOpen: (open) =>
    set((s) => ({
      ui: {
        ...s.ui,
        isFormOpen: open,
        ...(open ? {} : { editingItemId: null, formVehicleId: null }),
      },
    })),

  openCreate: (vehicleId) => {
    const vid = vehicleId ?? get().vehicles[0]?.id ?? null;
    set((s) => ({
      ui: { ...s.ui, isFormOpen: true, editingItemId: null, activeItemId: null, isDetailOpen: false, formVehicleId: vid },
      pendingSave: null,
    }));
  },

  openEdit: (itemId) => {
    const it = get().items.find((x) => x.id === itemId);
    set((s) => ({
      ui: { ...s.ui, isFormOpen: true, editingItemId: itemId, isDetailOpen: false, formVehicleId: it?.vehicleId ?? null },
    }));
  },
  openDetail: (itemId) => set((s) => ({ ui: { ...s.ui, isDetailOpen: true, activeItemId: itemId, isFormOpen: false } })),
  closeOverlays: () =>
    set((s) => ({
      ui: { ...s.ui, isFilterOpen: false, isDetailOpen: false, isFormOpen: false, isConflictOpen: false },
      pendingSave: null,
    })),

  applyFilters: (filters) => set({ filters }),

  saveDraft: (draft) => {
    const conflicts = computeConflicts(draft, get().items);
    if (conflicts.length > 0) {
      set((s) => ({
        pendingSave: { draft, conflicts },
        ui: { ...s.ui, isConflictOpen: true },
      }));
      return;
    }
    const nextItems = commitDraft(draft, get().items);
    set((s) => ({ items: nextItems, ui: { ...s.ui, isFormOpen: false, editingItemId: null, formVehicleId: null } }));
    saveScheduleData({ vehicles: get().vehicles, items: nextItems });
  },

  confirmForceSave: () => {
    const ps = get().pendingSave;
    if (!ps) return;
    const nextItems = commitDraft(ps.draft, get().items);
    set((s) => ({
      items: nextItems,
      pendingSave: null,
      ui: { ...s.ui, isConflictOpen: false, isFormOpen: false, editingItemId: null, formVehicleId: null },
    }));
    saveScheduleData({ vehicles: get().vehicles, items: nextItems });
  },

  cancelConflict: () => set((s) => ({ pendingSave: null, ui: { ...s.ui, isConflictOpen: false } })),

  deleteItem: (id) => {
    const nextItems = get().items.filter((x) => x.id !== id);
    set((s) => ({ items: nextItems, ui: { ...s.ui, isDetailOpen: false, activeItemId: null } }));
    saveScheduleData({ vehicles: get().vehicles, items: nextItems });
  },

  setVehicles: (vehicles) => {
    set({ vehicles });
    saveScheduleData({ vehicles, items: get().items });
  },

  resetData: () => {
    const seeded = seedData();
    set({ vehicles: seeded.vehicles, items: seeded.items });
    saveScheduleData({ vehicles: seeded.vehicles, items: seeded.items });
  },
}));

