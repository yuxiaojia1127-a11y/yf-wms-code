(() => {
  const data = window.WMSAppData;
  const helpers = window.WMSAppHelpers;
  const {
    allWarehouseIds,
    roleWarehouseMap,
    roleMap,
    profileMap,
    menuDefs,
    warehouseMap,
    sceneMap,
    localeMap
  } = data;
  const { iconSvg, getCount } = helpers;

  const pageType = document.body.dataset.page || "workbench";
  const params = new URLSearchParams(window.location.search);
  const isEmbedded = window.parent && window.parent !== window;

  const state = {
    role: params.get("role") || "operator",
    profile: params.get("profile") || "standard",
    scene: params.get("scene") || "peak",
    warehouses: parseWarehouseParam(params.get("warehouses")),
    locale: params.get("locale") || "zh",
    unreadMessages: Number(params.get("unreadMessages") || 99),
    warehouseDropdownOpen: false,
    menuId: params.get("menu") || "inventory_count"
  };

  const virtualMenus = {
    create_inbound: {
      id: "create_inbound",
      module: "inbound",
      code: "IB-NEW",
      desc: "创建采购、退货或调拨入库单"
    }
  };

  function parseWarehouseParam(value) {
    const requested = value ? value.split(",").filter(Boolean) : ["whA"];
    return requested.length ? requested : ["whA"];
  }

  function getAuthorizedWarehouseIds(role = state.role) {
    return (roleWarehouseMap[role] || allWarehouseIds).slice();
  }

  function canSwitchWarehouse() {
    return getAuthorizedWarehouseIds().length > 1;
  }

  function enforceWarehouseAccess(preferredIds = state.warehouses) {
    const authorizedIds = getAuthorizedWarehouseIds();
    const filtered = preferredIds.filter((id) => authorizedIds.includes(id));
    state.warehouses = filtered.length ? filtered : authorizedIds.slice();
    if (!canSwitchWarehouse()) {
      state.warehouseDropdownOpen = false;
    }
  }

  function intersectMenus() {
    const roleMenus = new Set(roleMap[state.role].baseMenus);
    return profileMap[state.profile].menus.filter((id) => roleMenus.has(id));
  }

  function aggregateData() {
    const sceneKey = sceneMap[state.scene].key;
    const summary = {
      todo: 0,
      done: 0,
      active: 0,
      exception: 0,
      messages: 0,
      menuCounts: {}
    };

    state.warehouses.forEach((warehouseId) => {
      const warehouse = warehouseMap[warehouseId];
      if (!warehouse) return;
      const metrics = warehouse.metrics[sceneKey];
      summary.todo += metrics.todo;
      summary.done += metrics.done;
      summary.active += metrics.active;
      summary.exception += metrics.exception;
      summary.messages += metrics.messages;

      Object.entries(warehouse.menuCounts[sceneKey]).forEach(([menuId, count]) => {
        summary.menuCounts[menuId] = (summary.menuCounts[menuId] || 0) + count;
      });
    });

    return summary;
  }

  function text(key) {
    return localeMap[state.locale] || localeMap.zh;
  }

  function formatTemplate(template, replacements) {
    return Object.entries(replacements).reduce((result, [key, value]) => {
      return result.replace(`{${key}}`, value);
    }, template);
  }

  function getWarehouseTitle() {
    const names = text().warehouses;
    return names[state.warehouses[0]] || "";
  }

  function getWarehouseExtra() {
    return state.warehouses.length > 1 ? `+${state.warehouses.length - 1}` : "";
  }

  function getWarehouseCodes() {
    return state.warehouses.map((id) => warehouseMap[id]?.code).filter(Boolean).join(" / ");
  }

  function getRoleSubtitle() {
    return text().roles[state.role] || text().roles.operator;
  }

  function getUserCode() {
    return state.role === "manager" ? "100008" : "100122";
  }

  function getMenuMeta(menuId) {
    return menuDefs.find((item) => item.id === menuId) || virtualMenus[menuId] || menuDefs[0];
  }

  function getMenuLabel(menuId) {
    const t = text();
    const meta = getMenuMeta(menuId);
    return t.metrics[menuId] || t.shortcuts[menuId] || meta.label || menuId;
  }

  function stateQuery(extra = {}) {
    const query = new URLSearchParams();
    query.set("role", state.role);
    query.set("profile", state.profile);
    query.set("scene", state.scene);
    query.set("warehouses", state.warehouses.join(","));
    query.set("locale", state.locale);
    query.set("unreadMessages", String(state.unreadMessages));
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null) query.set(key, value);
    });
    return query.toString();
  }

  function postToParent(message) {
    if (isEmbedded) {
      window.parent.postMessage(message, "*");
    }
  }

  function changeState(patch) {
    Object.assign(state, patch);
    enforceWarehouseAccess();
    render();
    postToParent({ type: "wms-state-change", state: publicState() });
  }

  function publicState() {
    return {
      role: state.role,
      profile: state.profile,
      scene: state.scene,
      warehouses: state.warehouses.slice(),
      locale: state.locale,
      unreadMessages: state.unreadMessages
    };
  }

  function navigate(route, menuId) {
    if (isEmbedded) {
      postToParent({ type: "wms-navigate", route, menuId });
      return;
    }

    if (route === "mine") {
      window.location.href = `mine.html?${stateQuery()}`;
      return;
    }
    if (route === "feature") {
      if (menuId === "outbound_order") {
        window.location.href = `pickup-accept.html?${stateQuery()}`;
        return;
      }
      if (menuId === "outbound_wait_pick") {
        window.location.href = `pickup-accept.html?${stateQuery()}&tab=mine`;
        return;
      }
      if (menuId === "shipping_pending") {
        window.location.href = `shipping-list.html?${stateQuery()}`;
        return;
      }
      if (menuId === "create_inbound") {
        window.location.href = `inbound-create.html?${stateQuery()}`;
        return;
      }
      if (menuId === "inventory_in_record") {
        window.location.href = `inbound-list.html?${stateQuery()}`;
        return;
      }
      if (menuId === "stocktake_task" || menuId === "inventory_count") {
        window.location.href = `stocktake-list.html?${stateQuery()}`;
        return;
      }
      if (menuId === "create_stocktake") {
        window.location.href = `stocktake-create.html?${stateQuery()}`;
        return;
      }
      if (menuId === "stocktake_count") {
        window.location.href = `stocktake-count.html?${stateQuery()}`;
        return;
      }
      if (menuId === "order_tracking") {
        window.location.href = `order-tracking.html?${stateQuery()}`;
        return;
      }
      window.location.href = `feature.html?${stateQuery({ menu: menuId })}`;
      return;
    }
    window.location.href = `workbench.html?${stateQuery()}`;
  }

  function syncLocaleSwitch() {
    document.body.dataset.locale = state.locale;
    document.querySelectorAll(".locale-switch .lang-btn").forEach((button) => {
      button.classList.toggle("active", button.dataset.locale === state.locale);
    });
  }

  function renderWarehouseOptions() {
    const t = text();
    return getAuthorizedWarehouseIds().map((id) => {
      const active = state.warehouses.includes(id);
      return `
        <button class="warehouse-option ${active ? "active" : ""}" type="button" data-warehouse="${id}">
          <span class="warehouse-check">${active ? "✓" : ""}</span>
          <span class="warehouse-option-main">
            <span class="warehouse-option-name">${t.warehouses[id]}</span>
            <span class="warehouse-option-code">${warehouseMap[id].code}</span>
          </span>
        </button>
      `;
    }).join("");
  }

  function metricItem(menuId, label, value) {
    return `
      <div class="replica-metric-item" data-menu-id="${menuId}">
        <div class="replica-metric-label">${label}</div>
        <div class="replica-metric-value">${value}</div>
      </div>
    `;
  }

  function shortcutItem(menuId, iconClass, iconName, label) {
    return `
      <div class="replica-shortcut" data-menu-id="${menuId}">
        <div class="replica-shortcut-icon ${iconClass}">${iconSvg(iconName)}</div>
        <div class="replica-shortcut-label">${label}</div>
      </div>
    `;
  }

  function renderReplicaModules(enabledMenus, counts) {
    const enabled = new Set(enabledMenus);
    const t = text();
    const cards = [];

    if (enabled.has("outbound_order") || enabled.has("outbound_wait_pick")) {
      cards.push(`
        <section class="replica-card">
          <div class="replica-card-head">
            <span class="replica-card-icon outbound">${iconSvg("outbound")}</span>
            <div class="replica-card-title">${t.modules.outbound}</div>
          </div>
          <div class="replica-metric-grid cols-4">
            ${metricItem("outbound_order", t.metrics.outbound_order, getCount(counts, "outbound_order"))}
            ${metricItem("outbound_wait_pick", t.metrics.outbound_wait_pick, getCount(counts, "outbound_wait_pick"))}
          </div>
        </section>
      `);
    }

    if (enabled.has("outbound_merge")) {
      cards.push(`
        <section class="replica-card">
          <div class="replica-card-head">
            <span class="replica-card-icon outbound">${iconSvg("outbound")}</span>
            <div class="replica-card-title">${t.modules.packingReview}</div>
          </div>
          <div class="replica-metric-grid cols-4">
            ${metricItem("outbound_merge", t.metrics.outbound_merge, getCount(counts, "outbound_merge"))}
          </div>
        </section>
      `);
    }

    if (
      enabled.has("shipping_pending") ||
      enabled.has("shipping_redispatch") ||
      enabled.has("shipping_wait_order") ||
      enabled.has("shipping_accepted") ||
      enabled.has("shipping_exception") ||
      enabled.has("shipping_delivering") ||
      enabled.has("shipping_delivered_today")
    ) {
      cards.push(`
        <section class="replica-card">
          <div class="replica-card-head">
            <span class="replica-card-icon shipping">${iconSvg("shipping")}</span>
            <div class="replica-card-title">${t.modules.shipping}</div>
          </div>
          <div class="replica-metric-grid cols-4">
            ${metricItem("shipping_pending", t.metrics.shipping_pending, getCount(counts, "shipping_pending"))}
            ${metricItem("shipping_wait_order", t.metrics.shipping_wait_order, getCount(counts, "shipping_wait_order"))}
            ${metricItem("shipping_redispatch", t.metrics.shipping_redispatch, getCount(counts, "shipping_redispatch"))}
            ${metricItem("shipping_exception", t.metrics.shipping_exception, getCount(counts, "shipping_exception"))}
            ${metricItem("shipping_accepted", t.metrics.shipping_accepted, getCount(counts, "shipping_accepted"))}
            ${metricItem("shipping_delivering", t.metrics.shipping_delivering, getCount(counts, "shipping_delivering"))}
            ${metricItem("shipping_delivered_today", t.metrics.shipping_delivered_today, getCount(counts, "shipping_delivered_today"))}
          </div>
        </section>
      `);
    }

    if (enabled.has("inventory_in_record")) {
      cards.push(`
        <section class="replica-card">
          <div class="replica-card-head">
            <span class="replica-card-icon inbound">${iconSvg("inbound")}</span>
            <div class="replica-card-title">${t.modules.inbound}</div>
          </div>
          <div class="replica-shortcuts">
            ${shortcutItem("inventory_in_record", "purple", "inboundRecord", t.shortcuts.inbound_order_list)}
            ${shortcutItem("create_inbound", "green", "addInbound", t.shortcuts.create_inbound)}
          </div>
        </section>
      `);
    }

    cards.push(`
      <section class="replica-card">
        <div class="replica-card-head">
          <span class="replica-card-icon other">${iconSvg("other")}</span>
          <div class="replica-card-title">${t.modules.other}</div>
        </div>
        <div class="replica-shortcuts">
          ${shortcutItem("order_tracking", "blue", "tracking", t.shortcuts.order_tracking)}
          ${shortcutItem("shipping_tracking", "green", "tracking", t.shortcuts.shipping_tracking)}
          ${shortcutItem("inventory_count", "orange", "count", t.shortcuts.inventory_count)}
        </div>
      </section>
    `);

    document.getElementById("moduleList").innerHTML = cards.join("");
  }

  function renderWorkbench() {
    const summary = aggregateData();
    const enabledMenus = intersectMenus();
    const t = text();
    const switchEnabled = canSwitchWarehouse();

    document.getElementById("avatarText").textContent = t.avatar;
    document.getElementById("userName").textContent = t.userName;
    document.getElementById("roleName").textContent = getRoleSubtitle();
    document.getElementById("warehouseTitle").textContent = getWarehouseTitle();
    document.getElementById("warehouseExtra").textContent = getWarehouseExtra();
    document.getElementById("warehouseExtra").style.display = getWarehouseExtra() ? "block" : "none";
    document.getElementById("warehouseDropdownTitle").textContent = t.warehouseSelectorTitle;
    document.getElementById("warehouseSelectAll").textContent = t.warehouseSelectorSelectAll;
    document.getElementById("warehouseDone").textContent = t.warehouseSelectorDone;
    document.getElementById("warehouseOptionList").innerHTML = renderWarehouseOptions();
    document.getElementById("warehouseToggle").classList.toggle("is-open", switchEnabled && state.warehouseDropdownOpen);
    document.getElementById("warehouseToggle").classList.toggle("is-static", !switchEnabled);
    document.getElementById("warehouseToggle").setAttribute("aria-expanded", switchEnabled && state.warehouseDropdownOpen ? "true" : "false");
    document.getElementById("warehouseToggle").setAttribute("aria-disabled", switchEnabled ? "false" : "true");
    document.getElementById("warehouseDropdown").classList.toggle("is-open", switchEnabled && state.warehouseDropdownOpen);
    renderReplicaModules(enabledMenus, summary.menuCounts);
  }

  function renderMineWarehouseTags() {
    const t = text();
    return state.warehouses.map((id) => {
      return `<span class="mine-warehouse-tag">${t.warehouses[id]}</span>`;
    }).join("");
  }

  function renderMine() {
    const t = text();
    document.getElementById("mineTitle").textContent = t.mineTitle;
    document.getElementById("mineAvatarText").textContent = t.avatar;
    document.getElementById("mineUserLabel").textContent = t.mineUserLabel;
    document.getElementById("mineUserName").textContent = t.userName;
    document.getElementById("mineUserCode").textContent = getUserCode();
    document.getElementById("mineUserRole").textContent = getRoleSubtitle();
    document.getElementById("mineLanguageLabel").textContent = t.mineLanguageLabel;
    document.getElementById("mineCountryLabel").textContent = t.mineCountryLabel;
    document.getElementById("mineCountryValue").textContent = t.mineCountryValue;
    document.getElementById("mineWarehouseLabel").textContent = t.mineWarehouseLabel;
    document.getElementById("mineWarehouseCountText").textContent = formatTemplate(t.mineWarehouseCount, { count: state.warehouses.length });
    document.getElementById("mineWarehouseHint").textContent = t.mineWarehouseHint;
    document.getElementById("mineWarehouseCodes").textContent = getWarehouseCodes();
    document.getElementById("mineWarehouseTags").innerHTML = renderMineWarehouseTags();
    document.getElementById("mineAccountHint").textContent = formatTemplate(t.mineAccountHint, { code: getUserCode() });
    document.getElementById("logoutBtn").textContent = t.mineLogout;
    document.getElementById("mineMessageBadge").textContent = state.unreadMessages > 99 ? "99+" : String(state.unreadMessages);
    document.getElementById("mineMessageBadge").style.display = state.unreadMessages ? "inline-flex" : "none";
  }

  function renderFeature() {
    const summary = aggregateData();
    const menuId = state.menuId;
    const meta = getMenuMeta(menuId);
    const label = getMenuLabel(menuId);
    const t = text();
    const count = summary.menuCounts[menuId] || 0;
    const warehouses = state.warehouses.map((id) => t.warehouses[id]).join(" / ");

    document.getElementById("featureTitle").textContent = label;
    document.getElementById("featureSubtitle").textContent = warehouses;
    document.getElementById("featureCode").textContent = meta.code || "APP";
    document.getElementById("featureDesc").textContent = meta.desc || label;
    document.getElementById("featureCount").textContent = count;
    document.getElementById("featureWarehouseCount").textContent = state.warehouses.length;
    document.getElementById("featureList").innerHTML = [1, 2, 3].map((index) => {
      const padded = String(index).padStart(3, "0");
      return `
        <div class="feature-list-item">
          <div>
            <div class="feature-item-title">${label} #${padded}</div>
            <div class="feature-item-meta">${warehouses} · ${meta.code || "APP"}-${state.scene.toUpperCase()}-${padded}</div>
          </div>
          <span class="feature-item-status">${count > 0 ? "待处理" : "已同步"}</span>
        </div>
      `;
    }).join("");
  }

  function render() {
    enforceWarehouseAccess();
    syncLocaleSwitch();
    if (pageType === "workbench") renderWorkbench();
    if (pageType === "mine") renderMine();
    if (pageType === "feature") renderFeature();
  }

  function setupInteractions() {
    document.addEventListener("click", (event) => {
      const localeButton = event.target.closest(".locale-switch .lang-btn");
      if (localeButton) {
        changeState({ locale: localeButton.dataset.locale });
        return;
      }

      const menuTarget = event.target.closest("[data-menu-id]");
      if (menuTarget) {
        navigate("feature", menuTarget.dataset.menuId);
        return;
      }

      if (event.target.closest("#featureBack")) {
        navigate("workbench");
        return;
      }

      if (event.target.closest("#mineMessageButton")) {
        changeState({ unreadMessages: 0 });
        return;
      }

      if (event.target.closest("#logoutBtn")) {
        if (isEmbedded) {
          postToParent({ type: "wms-logout" });
        } else {
          window.location.href = `../WMS-APP端原型.html?${stateQuery()}`;
        }
        return;
      }

      const toggle = event.target.closest("#warehouseToggle");
      const option = event.target.closest(".warehouse-option");
      const action = event.target.closest("[data-warehouse-action]");
      const insideWrap = event.target.closest(".warehouse-switch-wrap");

      if (toggle) {
        if (!canSwitchWarehouse()) return;
        state.warehouseDropdownOpen = !state.warehouseDropdownOpen;
        render();
        return;
      }

      if (option) {
        if (!canSwitchWarehouse()) return;
        const id = option.dataset.warehouse;
        const next = new Set(state.warehouses);
        if (next.has(id)) {
          if (next.size > 1) next.delete(id);
        } else {
          next.add(id);
        }
        changeState({ warehouses: Array.from(next) });
        return;
      }

      if (action) {
        if (!canSwitchWarehouse()) return;
        if (action.dataset.warehouseAction === "all") {
          changeState({ warehouses: allWarehouseIds.slice(), warehouseDropdownOpen: false });
        } else {
          state.warehouseDropdownOpen = false;
          render();
        }
        return;
      }

      if (state.warehouseDropdownOpen && !insideWrap) {
        state.warehouseDropdownOpen = false;
        render();
      }
    });

    window.addEventListener("message", (event) => {
      const message = event.data || {};
      if (message.type !== "wms-state" || !message.state) return;
      Object.assign(state, message.state);
      state.warehouseDropdownOpen = false;
      render();
    });
  }

  setupInteractions();
  render();
})();
