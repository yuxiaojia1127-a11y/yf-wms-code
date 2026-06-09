const menuData = [
  {
    "key": "cockpit",
    "icon": "coverage",
    "name": "驾驶舱",
    "meta": "总览驾驶舱 / 1.0 自营版",
    "direct": true,
    "items": [
      {
        "key": "cockpit",
        "name": "总览驾驶舱",
        "page": "WMS-WEB-036"
      }
    ]
  },
  {
    "key": "storage",
    "icon": "warehouse",
    "name": "仓储管理",
    "meta": "仓库 / 库区 / 货位 / 人员",
    "items": [
      {
        "key": "warehouse",
        "name": "仓库管理",
        "page": "WMS-WEB-W01"
      },
      {
        "key": "zone",
        "name": "库区管理",
        "page": "WMS-WEB-W02"
      },
      {
        "key": "location",
        "name": "货位管理",
        "page": "WMS-WEB-W03"
      },
      {
        "key": "warehouse-staff",
        "name": "仓库人员管理",
        "page": "WMS-WEB-W04"
      }
    ]
  },
  {
    "key": "product-manage",
    "icon": "inventory",
    "name": "商品管理",
    "meta": "我的商品 / 接口上下架日志",
    "items": [
      {
        "key": "my-product",
        "name": "我的商品",
        "page": "WMS-WEB-006-MY"
      },
      {
        "key": "product-listing-log",
        "name": "接口上下架日志",
        "page": "WMS-WEB-006-LOG"
      }
    ]
  },
  {
    "key": "owner-data",
    "icon": "owner",
    "name": "基础资料",
    "meta": "销售渠道管理",
    "items": [
      {
        "key": "shop",
        "name": "销售渠道管理",
        "page": "WMS-WEB-004-SHOP"
      }
    ]
  },
  {
    "key": "inventory",
    "icon": "inventory",
    "name": "库存中心",
    "meta": "库存查询 / 库存明细 / 库存控制 / 库存风险",
    "items": [
      {
        "key": "inventory-query",
        "name": "库存查询",
        "page": "WMS-WEB-012"
      },
      {
        "key": "inventory-detail",
        "name": "库存明细",
        "page": "WMS-WEB-013"
      },
      {
        "key": "inventory-control",
        "name": "库存控制",
        "page": "WMS-WEB-015"
      },
      {
        "key": "inventory-risk-list",
        "name": "库存风险列表",
        "page": "WMS-WEB-015A"
      }
    ]
  },
  {
    "key": "warehouse-job",
    "icon": "operation",
    "name": "仓内作业",
    "meta": "入库 / 出库 / 调拨 / 盘点 / 仓内作业跟踪",
    "items": [
      {
        "key": "inbound",
        "name": "入库管理",
        "page": "WMS-WEB-010"
      },
      {
        "key": "outbound",
        "name": "出库管理",
        "page": "WMS-WEB-016"
      },
      {
        "key": "transfer",
        "name": "调拨管理",
        "page": "WMS-WEB-028"
      },
      {
        "key": "stocktake",
        "name": "盘点管理",
        "page": "WMS-WEB-STOCKTAKE"
      },
      {
        "key": "warehouse-operation-track-list",
        "name": "仓内作业跟踪",
        "page": "WMS-WEB-030A"
      }
    ]
  },
  {
    "key": "fulfillment",
    "icon": "fulfillment",
    "name": "履约中心",
    "meta": "履约链路跟踪",
    "items": [
      {
        "key": "fulfillment-link-track-list",
        "name": "履约链路跟踪",
        "page": "WMS-WEB-020A"
      }
    ]
  },
  {
    "key": "after-sale",
    "icon": "service",
    "name": "售后中心",
    "meta": "退货管理",
    "items": [
      {
        "key": "return",
        "name": "退货管理",
        "page": "WMS-WEB-026"
      }
    ]
  },
  {
    "key": "exception",
    "icon": "warning",
    "name": "异常中心",
    "meta": "超时/紧急列表",
    "items": [
      {
        "key": "exception-urgent-list",
        "name": "超时/紧急列表",
        "page": "WMS-WEB-032A"
      }
    ]
  }
];

function iconSvg(name) {
  const icons = {
    dashboard: '<svg viewBox="0 0 24 24"><path d="M4 5.5h7v5H4zM13 5.5h7v8h-7zM4 12.5h7V20H4zM13 15.5h7V20h-7z"/></svg>',
    warehouse: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.5V20h14V9.5"/><path d="M9 20v-5h6v5"/></svg>',
    owner: '<svg viewBox="0 0 24 24"><path d="M16.5 20v-1.2a4.3 4.3 0 0 0-4.3-4.3H8.8a4.3 4.3 0 0 0-4.3 4.3V20"/><circle cx="10.5" cy="8" r="3.5"/><path d="M16.5 9.5a3 3 0 1 1 0-6"/><path d="M19.5 20v-1a3.4 3.4 0 0 0-2.4-3.3"/></svg>',
    inventory: '<svg viewBox="0 0 24 24"><path d="M4 7.5h16"/><path d="M4 12h16"/><path d="M4 16.5h10"/><rect x="3.5" y="5" width="17" height="14" rx="2.5"/></svg>',
    operation: '<svg viewBox="0 0 24 24"><path d="M8 7h10"/><path d="m14 3 4 4-4 4"/><path d="M16 17H6"/><path d="m10 21-4-4 4-4"/></svg>',
    fulfillment: '<svg viewBox="0 0 24 24"><path d="M7 7h10"/><path d="m13 3 4 4-4 4"/><path d="M17 17H7"/><path d="m11 21-4-4 4-4"/></svg>',
    service: '<svg viewBox="0 0 24 24"><path d="M5 17v-3a7 7 0 0 1 14 0v3"/><path d="M5 17a2 2 0 0 0 2 2h1v-6H7a2 2 0 0 0-2 2Z"/><path d="M19 17a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z"/></svg>',
    warning: '<svg viewBox="0 0 24 24"><path d="M12 4 3.5 19h17L12 4Z"/><path d="M12 9v4.5"/><circle cx="12" cy="16.5" r=".9" fill="currentColor" stroke="none"/></svg>',
    coverage: '<svg viewBox="0 0 24 24"><path d="M12 21s7-3.5 7-10V5l-7-2-7 2v6c0 6.5 7 10 7 10Z"/><path d="M9.5 12.5 11 14l3.5-4"/></svg>'
  };
  return icons[name] || icons.dashboard;
}

const nav = document.getElementById('nav');
const menuSearchInput = document.getElementById('menuSearchInput');
const contentFrame = document.getElementById('contentFrame');
const breadcrumbModule = document.getElementById('breadcrumbModule');
const breadcrumbPage = document.getElementById('breadcrumbPage');
const warehouseSelect = document.getElementById('warehouseSelect');
const ownerSelect = document.getElementById('ownerSelect');
const storeSelect = document.getElementById('storeSelect');
let menuQuery = '';
let currentRoute = null;

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, '');
}

function fuzzyMatch(text, query) {
  const source = normalizeText(text);
  const keyword = normalizeText(query);
  if (!keyword || source.includes(keyword)) return true;
  let cursor = 0;
  for (const char of source) {
    if (char === keyword[cursor]) cursor += 1;
    if (cursor === keyword.length) return true;
  }
  return false;
}

function findRoute(pageKey) {
  const group = menuData.find((candidate) => candidate.items.some((item) => item.key === pageKey));
  const item = group && group.items.find((candidate) => candidate.key === pageKey);
  return group && item ? { group, item } : null;
}

function pageUrl(pageKey) {
  return './pages/' + pageKey + '.html';
}

function updateBreadcrumb(route) {
  breadcrumbModule.textContent = route.group.name;
  breadcrumbPage.textContent = route.item.name;
}

function updateAddress(pageKey) {
  const url = new URL(window.location.href);
  url.searchParams.set('page', pageKey);
  window.history.replaceState({ pageKey }, '', url);
}

function scopePayload() {
  return {
    warehouse: warehouseSelect.value,
    owner: ownerSelect.value,
    store: storeSelect.value
  };
}

function sendScopeToFrame() {
  contentFrame.contentWindow?.postMessage({ type: 'wms-scope-change', scope: scopePayload() }, '*');
}

function activatePage(pageKey, options = {}) {
  const route = findRoute(pageKey) || findRoute('cockpit');
  currentRoute = route;
  menuData.forEach((group) => group.items.forEach((item) => { item.active = item.key === route.item.key; }));
  renderNav();
  updateBreadcrumb(route);
  if (options.updateAddress !== false) updateAddress(route.item.key);
  if (options.updateFrame !== false) contentFrame.src = pageUrl(route.item.key);
}

function renderNav() {
  nav.innerHTML = '';
  const query = menuQuery.trim();
  menuData.forEach((group) => {
    const groupMatched = fuzzyMatch(group.name + ' ' + group.meta, query);
    const visibleItems = !query ? group.items : group.items.filter((item) => fuzzyMatch(item.name + ' ' + item.page, query));
    if (query && !groupMatched && visibleItems.length === 0) return;

    const isActiveGroup = group.items.some((item) => item.active);
    const wrapper = document.createElement('div');
    wrapper.className = 'nav-group'
      + (group.direct ? ' is-direct' : '')
      + ((query || isActiveGroup) && !group.direct ? ' is-open' : '');

    const head = document.createElement('button');
    head.className = 'nav-group-button'
      + (isActiveGroup ? ' active' : '')
      + (isActiveGroup && group.direct ? ' active-direct' : '')
      + (isActiveGroup && !group.direct ? ' active-parent' : '');
    head.innerHTML = '<div class="nav-group-left">'
      + '<span class="nav-icon">' + iconSvg(group.icon) + '</span>'
      + '<div><div class="nav-group-name">' + group.name + '</div>'
      + '<div class="nav-group-meta">' + group.meta + '</div></div>'
      + '</div><span class="nav-caret">⌃</span>';
    head.addEventListener('click', () => {
      if (group.direct) {
        activatePage(group.items[0].key);
        return;
      }
      wrapper.classList.toggle('is-open');
    });

    const items = document.createElement('div');
    items.className = 'nav-items';
    (query && groupMatched ? group.items : visibleItems).forEach((item) => {
      const button = document.createElement('button');
      button.className = 'nav-item' + (item.active ? ' active' : '');
      button.textContent = item.name;
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        activatePage(item.key);
      });
      items.appendChild(button);
    });

    wrapper.appendChild(head);
    if (!group.direct) wrapper.appendChild(items);
    nav.appendChild(wrapper);
  });
}

menuSearchInput.addEventListener('input', (event) => {
  menuQuery = event.target.value || '';
  renderNav();
});

document.querySelector('.breadcrumb-home')?.addEventListener('click', () => activatePage('cockpit'));
[warehouseSelect, ownerSelect, storeSelect].forEach((select) => select.addEventListener('change', sendScopeToFrame));
contentFrame.addEventListener('load', sendScopeToFrame);
window.addEventListener('message', (event) => {
  const message = event.data || {};
  if (message.type !== 'wms-content-ready' || !message.pageKey) return;
  activatePage(message.pageKey, { updateFrame: false });
});

const initialPageKey = new URLSearchParams(window.location.search).get('page') || 'cockpit';
activatePage(initialPageKey);
