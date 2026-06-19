(() => {
  const data = window.WMSAppData;
  const helpers = window.WMSAppHelpers;
  const {
    allWarehouseIds,
    roleWarehouseMap,
    roleMap,
    profileMap,
    localeMap
  } = data;
  const { iconSvg } = helpers;
  const params = new URLSearchParams(window.location.search);

  const state = {
    role: params.get("role") || "operator",
    profile: params.get("profile") || "standard",
    scene: params.get("scene") || "peak",
    warehouses: parseWarehouseParam(params.get("warehouses")),
    locale: params.get("locale") || "zh",
    loggedIn: params.get("loggedIn") !== "false",
    passwordVisible: false,
    loginAccount: "",
    loginPassword: "",
    loginError: "",
    unreadMessages: Number(params.get("unreadMessages") || 99),
    route: params.get("page") || "workbench",
    menuId: params.get("menu") || "inventory_query"
  };

  let activeFrameKey = "";

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
  }

  function intersectMenus() {
    const roleMenus = new Set(roleMap[state.role].baseMenus);
    return profileMap[state.profile].menus.filter((id) => roleMenus.has(id));
  }

  function text() {
    return localeMap[state.locale] || localeMap.zh;
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

  function frameKey() {
    return `${state.route}:${state.route === "feature" ? state.menuId : ""}`;
  }

  function frameUrl() {
    if (state.route === "mine") {
      return `./pages/mine.html?${stateQuery()}`;
    }
    if (state.route === "feature") {
      if (state.menuId === "outbound_order") {
        return `./pages/pickup-accept.html?${stateQuery()}`;
      }
      if (state.menuId === "outbound_wait_pick") {
        return `./pages/pickup-accept.html?${stateQuery()}&tab=mine`;
      }
      if (state.menuId === "create_inbound") {
        return `./pages/inbound-create.html?${stateQuery()}`;
      }
      if (state.menuId === "inventory_in_record") {
        return `./pages/inbound-list.html?${stateQuery()}`;
      }
      return `./pages/feature.html?${stateQuery({ menu: state.menuId })}`;
    }
    return `./pages/workbench.html?${stateQuery()}`;
  }

  function sendFrameState() {
    const frame = document.getElementById("contentFrame");
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage({ type: "wms-state", state: publicState() }, "*");
  }

  function syncFrame(force = false) {
    const frame = document.getElementById("contentFrame");
    if (!frame || !state.loggedIn) return;
    const nextKey = frameKey();
    if (force || activeFrameKey !== nextKey) {
      activeFrameKey = nextKey;
      frame.src = frameUrl();
      return;
    }
    sendFrameState();
  }

  function setupSingleSelect(groupId, key) {
    const group = document.getElementById(groupId);
    group.addEventListener("click", (event) => {
      const target = event.target.closest(".chip");
      if (!target) return;
      state[key] = target.dataset[key];
      if (key === "role") {
        if (state.role === "manager") {
          enforceWarehouseAccess(allWarehouseIds.slice());
        } else {
          enforceWarehouseAccess();
        }
      }
      syncControlChips();
      render();
    });
  }

  function setupWarehouseSelect() {
    const group = document.getElementById("warehouseGroup");
    group.addEventListener("click", (event) => {
      const target = event.target.closest(".chip");
      if (!target || target.classList.contains("disabled")) return;
      const id = target.dataset.warehouse;
      if (id === "all") {
        state.warehouses = allWarehouseIds.slice();
      } else {
        const next = new Set(state.warehouses);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        state.warehouses = Array.from(next);
        if (!state.warehouses.length) {
          state.warehouses = allWarehouseIds.slice();
        }
      }
      enforceWarehouseAccess();
      syncControlChips();
      render();
    });
  }

  function syncControlChips() {
    document.querySelectorAll("#roleGroup .chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.role === state.role);
    });

    document.querySelectorAll("#profileGroup .chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.profile === state.profile);
    });

    document.querySelectorAll("#sceneGroup .chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.scene === state.scene);
    });

    const authorizedIds = getAuthorizedWarehouseIds();
    const allSelected = authorizedIds.length === allWarehouseIds.length && state.warehouses.length === allWarehouseIds.length;
    document.querySelectorAll("#warehouseGroup .chip").forEach((chip) => {
      const id = chip.dataset.warehouse;
      if (id === "all") {
        chip.classList.toggle("active", allSelected);
        chip.classList.toggle("disabled", authorizedIds.length !== allWarehouseIds.length);
        chip.classList.toggle("is-hidden", authorizedIds.length !== allWarehouseIds.length);
      } else {
        chip.classList.toggle("active", state.warehouses.includes(id));
        chip.classList.toggle("disabled", !authorizedIds.includes(id));
        chip.classList.toggle("is-hidden", !authorizedIds.includes(id));
      }
    });

    document.querySelectorAll(".locale-switch .lang-btn").forEach((button) => {
      button.classList.toggle("active", button.dataset.locale === state.locale);
    });
  }

  function syncPasswordToggle() {
    const passwordInput = document.getElementById("loginPassword");
    const passwordIcon = document.getElementById("passwordToggleIcon");
    passwordInput.type = state.passwordVisible ? "text" : "password";
    passwordIcon.innerHTML = iconSvg(state.passwordVisible ? "eyeOff" : "eye");
  }

  function updateLoginVisibility() {
    document.getElementById("loginOverlay").classList.toggle("is-hidden", state.loggedIn);
    document.getElementById("appShell").classList.toggle("is-hidden", !state.loggedIn);
  }

  function setupLocaleSwitch() {
    document.getElementById("appScreen").addEventListener("click", (event) => {
      const target = event.target.closest(".lang-btn");
      if (!target) return;
      state.locale = target.dataset.locale;
      render();
    });
  }

  function setupTabSwitch() {
    document.querySelector(".bottom-nav").addEventListener("click", (event) => {
      const target = event.target.closest("[data-tab]");
      if (!target) return;
      state.route = target.dataset.tab === "mine" ? "mine" : "workbench";
      render(true);
    });
  }

  function setupLoginInteractions() {
    const accountInput = document.getElementById("loginAccount");
    const passwordInput = document.getElementById("loginPassword");
    const submitButton = document.getElementById("loginSubmit");
    const toggleButton = document.getElementById("passwordToggle");

    accountInput.addEventListener("input", (event) => {
      state.loginAccount = event.target.value;
      if (state.loginError) {
        state.loginError = "";
        render();
      }
    });

    passwordInput.addEventListener("input", (event) => {
      state.loginPassword = event.target.value;
      if (state.loginError) {
        state.loginError = "";
        render();
      }
    });

    toggleButton.addEventListener("click", () => {
      state.passwordVisible = !state.passwordVisible;
      syncPasswordToggle();
    });

    submitButton.addEventListener("click", () => {
      if (!state.loginAccount.trim() || !state.loginPassword.trim()) {
        state.loginError = text().loginErrorEmpty;
        render();
        return;
      }
      state.loginError = "";
      state.loggedIn = true;
      state.route = "workbench";
      render(true);
    });
  }

  function setupFrameBridge() {
    document.getElementById("contentFrame").addEventListener("load", sendFrameState);

    window.addEventListener("message", (event) => {
      const message = event.data || {};
      if (message.type === "wms-navigate") {
        state.route = message.route || "workbench";
        if (message.menuId) state.menuId = message.menuId;
        render(true);
        return;
      }

      if (message.type === "wms-state-change" && message.state) {
        Object.assign(state, {
          role: message.state.role || state.role,
          profile: message.state.profile || state.profile,
          scene: message.state.scene || state.scene,
          warehouses: Array.isArray(message.state.warehouses) ? message.state.warehouses : state.warehouses,
          locale: message.state.locale || state.locale,
          unreadMessages: Number.isFinite(Number(message.state.unreadMessages))
            ? Number(message.state.unreadMessages)
            : state.unreadMessages
        });
        enforceWarehouseAccess();
        syncControlChips();
        render();
        return;
      }

      if (message.type === "wms-logout") {
        state.loggedIn = false;
        state.route = "workbench";
        render();
      }
    });
  }

  function render(forceFrame = false) {
    enforceWarehouseAccess();
    const t = text();
    const enabledMenus = intersectMenus();

    document.getElementById("appScreen").dataset.locale = state.locale;
    document.getElementById("loginTitle").textContent = t.loginTitle;
    document.getElementById("loginAccount").placeholder = t.loginAccountPlaceholder;
    document.getElementById("loginPassword").placeholder = t.loginPasswordPlaceholder;
    document.getElementById("loginSubmit").textContent = t.loginButton;
    document.getElementById("loginHelper").textContent = t.loginHelper;
    document.getElementById("loginError").textContent = state.loginError || t.loginErrorEmpty;
    document.getElementById("loginError").classList.toggle("hidden", !state.loginError);
    document.getElementById("loginAccount").value = state.loginAccount;
    document.getElementById("loginPassword").value = state.loginPassword;
    document.getElementById("navHome").textContent = t.navHome;
    document.getElementById("navMine").textContent = t.navMine;
    document.getElementById("navHomeItem").classList.toggle("active", state.route === "workbench" || state.route === "feature");
    document.getElementById("navMineItem").classList.toggle("active", state.route === "mine");
    // feature路由时隐藏底部导航栏，子页面自带操作栏
    const bottomNav = document.querySelector(".bottom-nav");
    if (bottomNav) bottomNav.classList.toggle("is-hidden", state.route === "feature");
    document.getElementById("panelWarehouseCount").textContent = state.warehouses.length;
    document.getElementById("panelMenuCount").textContent = enabledMenus.length;

    syncControlChips();
    syncPasswordToggle();
    updateLoginVisibility();
    syncFrame(forceFrame);
  }

  setupSingleSelect("roleGroup", "role");
  setupSingleSelect("profileGroup", "profile");
  setupSingleSelect("sceneGroup", "scene");
  setupWarehouseSelect();
  setupLocaleSwitch();
  setupTabSwitch();
  setupLoginInteractions();
  setupFrameBridge();
  render(true);
})();
