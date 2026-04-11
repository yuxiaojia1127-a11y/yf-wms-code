import { useEffect, useMemo } from "react";
import CalendarGrid from "@/clients/admin-web/components/schedule/CalendarGrid";
import ConflictModal from "@/clients/admin-web/components/schedule/ConflictModal";
import DetailDrawer from "@/clients/admin-web/components/schedule/DetailDrawer";
import FilterDrawer from "@/clients/admin-web/components/schedule/FilterDrawer";
import FormModal from "@/clients/admin-web/components/schedule/FormModal";
import HeaderBar from "@/clients/admin-web/components/schedule/HeaderBar";
import LegendBar from "@/clients/admin-web/components/schedule/LegendBar";
import ResourcePanel from "@/clients/admin-web/components/schedule/ResourcePanel";
import { useScheduleStore } from "@/clients/admin-web/stores/scheduleStore";
import type { FiltersState } from "@/clients/admin-web/stores/scheduleStore";
import { addDaysYMD, daysCountForView, getRangeStartForView } from "@/utils/date";
import type { ScheduleItem, Vehicle } from "@/utils/scheduleTypes";

function uniqueGroups(vehicles: Vehicle[]) {
  return Array.from(new Set(vehicles.map((v) => v.groupName))).sort();
}

function toMap<V extends { id: string }>(arr: V[]) {
  return Object.fromEntries(arr.map((x) => [x.id, x] as const));
}

function endInclusiveLabel(rangeStart: string, rangeDays: number) {
  return addDaysYMD(rangeStart, Math.max(0, rangeDays - 1));
}

function matchesVehicle(v: Vehicle, q: string) {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return `${v.code} ${v.plateNo} ${v.model} ${v.groupName}`.toLowerCase().includes(t);
}

function matchesItem(it: ScheduleItem, q: string) {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return `${it.title} ${it.note ?? ""}`.toLowerCase().includes(t);
}

export default function Home() {
  const vehicles = useScheduleStore((s) => s.vehicles);
  const items = useScheduleStore((s) => s.items);
  const filters = useScheduleStore((s) => s.filters);
  const ui = useScheduleStore((s) => s.ui);
  const pendingSave = useScheduleStore((s) => s.pendingSave);

  const init = useScheduleStore((s) => s.init);
  const setView = useScheduleStore((s) => s.setView);
  const shiftAnchor = useScheduleStore((s) => s.shiftAnchor);
  const resetToToday = useScheduleStore((s) => s.resetToToday);
  const setSearch = useScheduleStore((s) => s.setSearch);
  const toggleVehicleSelected = useScheduleStore((s) => s.toggleVehicleSelected);
  const selectAllVisible = useScheduleStore((s) => s.selectAllVisible);
  const setFilterOpen = useScheduleStore((s) => s.setFilterOpen);
  const setDetailOpen = useScheduleStore((s) => s.setDetailOpen);
  const openCreate = useScheduleStore((s) => s.openCreate);
  const openDetail = useScheduleStore((s) => s.openDetail);
  const openEdit = useScheduleStore((s) => s.openEdit);
  const applyFilters = useScheduleStore((s) => s.applyFilters);
  const saveDraft = useScheduleStore((s) => s.saveDraft);
  const confirmForceSave = useScheduleStore((s) => s.confirmForceSave);
  const cancelConflict = useScheduleStore((s) => s.cancelConflict);
  const closeOverlays = useScheduleStore((s) => s.closeOverlays);
  const deleteItem = useScheduleStore((s) => s.deleteItem);

  useEffect(() => {
    init();
  }, [init]);

  const groups = useMemo(() => uniqueGroups(vehicles), [vehicles]);

  const rangeDays = useMemo(() => daysCountForView(ui.view), [ui.view]);
  const rangeStart = useMemo(() => getRangeStartForView(ui.view, ui.anchorDate), [ui.view, ui.anchorDate]);
  const rangeLabel = useMemo(() => `${rangeStart} ~ ${endInclusiveLabel(rangeStart, rangeDays)}`, [rangeStart, rangeDays]);

  const vehiclesById = useMemo(() => toMap(vehicles), [vehicles]);
  const groupsEnabled = filters.groups;

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (!filters.status[it.status]) return false;
      const v = vehiclesById[it.vehicleId];
      if (v && !groupsEnabled[v.groupName]) return false;
      if (ui.search.trim()) return matchesItem(it, ui.search) || (v ? matchesVehicle(v, ui.search) : false);
      return true;
    });
  }, [items, filters.status, vehiclesById, groupsEnabled, ui.search]);

  const visibleVehicles = useMemo(() => {
    const q = ui.search.trim();
    const byVehicleHasItem = new Set(filteredItems.map((x) => x.vehicleId));
    return vehicles
      .filter((v) => groupsEnabled[v.groupName])
      .filter((v) => ui.selectedVehicleIds[v.id])
      .filter((v) => {
        if (!q) return true;
        if (matchesVehicle(v, q)) return true;
        return byVehicleHasItem.has(v.id);
      })
      .sort((a, b) => (a.groupName === b.groupName ? a.code.localeCompare(b.code) : a.groupName.localeCompare(b.groupName)));
  }, [vehicles, groupsEnabled, ui.selectedVehicleIds, ui.search, filteredItems]);

  const resourcePanelVehicles = useMemo(() => vehicles.filter((v) => groupsEnabled[v.groupName]), [vehicles, groupsEnabled]);
  const defaultVehicleId = visibleVehicles[0]?.id ?? null;
  const formVehicleId = ui.formVehicleId ?? defaultVehicleId;

  const activeItem = ui.activeItemId ? items.find((x) => x.id === ui.activeItemId) ?? null : null;
  const activeVehicle = activeItem ? vehiclesById[activeItem.vehicleId] ?? null : null;
  const editingItem = ui.editingItemId ? items.find((x) => x.id === ui.editingItemId) ?? null : null;

  const filterValue = filters;
  const onApply = (next: FiltersState) => applyFilters(next);

  return (
    <div className="min-h-screen bg-zinc-50">
      <HeaderBar
        title="车辆排单日历"
        rangeLabel={rangeLabel}
        view={ui.view}
        search={ui.search}
        onPrev={() => shiftAnchor(-rangeDays)}
        onNext={() => shiftAnchor(rangeDays)}
        onToday={resetToToday}
        onChangeView={setView}
        onChangeSearch={setSearch}
        onOpenFilter={() => setFilterOpen(true)}
        onOpenCreate={() => {
          openCreate(defaultVehicleId ?? undefined);
        }}
      />

      <div className="mx-auto grid max-w-[1600px] grid-cols-[280px_1fr] gap-4 p-4">
        <ResourcePanel
          vehicles={resourcePanelVehicles}
          selectedVehicleIds={ui.selectedVehicleIds}
          groupsEnabled={groupsEnabled}
          onToggleVehicle={toggleVehicleSelected}
          onSelectAll={selectAllVisible}
        />

        <div className="flex h-[calc(100vh-112px)] flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
            <LegendBar />
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">密度</span>
              <select className="h-8 rounded-lg border bg-white px-2 text-sm text-zinc-700">
                <option value="normal">标准</option>
                <option value="compact">紧凑</option>
              </select>
            </div>
          </div>

          <div className="flex-1">
            <CalendarGrid
              rangeStart={rangeStart}
              rangeDays={rangeDays}
              vehicles={visibleVehicles}
              items={filteredItems}
              onOpenDetail={(id) => openDetail(id)}
              onCreateOnVehicle={(vehicleId) => openCreate(vehicleId)}
            />
          </div>
        </div>
      </div>

      <FilterDrawer
        open={ui.isFilterOpen}
        groups={groups}
        value={filterValue}
        onClose={() => setFilterOpen(false)}
        onApply={onApply}
      />

      <DetailDrawer
        open={ui.isDetailOpen}
        item={activeItem}
        vehicle={activeVehicle}
        onClose={() => setDetailOpen(false)}
        onEdit={() => {
          if (activeItem) openEdit(activeItem.id);
        }}
        onDelete={() => {
          if (activeItem) deleteItem(activeItem.id);
        }}
      />

      <FormModal
        open={ui.isFormOpen}
        vehicles={resourcePanelVehicles}
        editingItem={editingItem}
        defaultVehicleId={formVehicleId}
        onClose={closeOverlays}
        onSave={(d) => saveDraft(d)}
      />

      <ConflictModal
        open={ui.isConflictOpen}
        conflicts={pendingSave?.conflicts ?? []}
        vehiclesById={vehiclesById}
        onBack={cancelConflict}
        onForceSave={confirmForceSave}
        onCloseAll={closeOverlays}
      />
    </div>
  );
}

