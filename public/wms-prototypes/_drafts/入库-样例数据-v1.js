/* ============================================================
 * 入库原型 · 样例数据草稿 v1（第1段交付，待确认）
 * 口径：MySQL 库 wms 真实表
 *   w_wms_inbound_orders(order_no/warehouse_id/inbound_at/status/remark)
 *   w_wms_inbound_order_items(item_sku_id/quantity/unit_price/total_amount/expiry_date)
 *   档案：w_wms_items(item_name/brand_id/category_id/unit) + w_wms_item_skus(sku_name/barcode)
 *
 * 本次调整：
 *   - 去掉「来源单号」(source) 字段（已确认本期不做）
 *   - 货币统一 RM
 *   - SKU 目录补 brand / category / unit（部分缺省，用于演示显隐）
 *   - 明细行补 expiry（有效期，部分缺省）
 *   - 状态口径：1=草稿 2=已入库 3=已作废
 *
 * 显隐约定（关键）：字段值为 "" / null / undefined / 0(单价) 时，前端不渲染该行/标签，
 *   不出现 "—" 占位。下方样例刻意做成"有的全、有的缺"。
 * ============================================================ */

// 状态映射（与 w_wms_inbound_orders.status 一致）
const statusMap = {
  1: { key: "draft", zh: "草稿",   en: "Draft",   className: "draft" },
  2: { key: "done",  zh: "已入库", en: "Inbound", className: "done" },
  3: { key: "void",  zh: "已作废", en: "Voided",  className: "void" }
};

// 入库类型（UI 字段，库表需后端扩展；来源单号已去掉）
const inboundTypes = [
  { id: "purchase", zh: "采购入库", en: "Purchase" },
  { id: "return",   zh: "退货入库", en: "Return" },
  { id: "transfer", zh: "调拨入库", en: "Transfer" },
  { id: "other",    zh: "其他入库", en: "Other" }
];

// 库房（来源 w_wms_warehouses，启用）
const warehouses = [
  { id: 15, name: "piao自营",      code: "WH-15" },
  { id: 7,  name: "KL自营仓库",     code: "WH-07" },
  { id: 8,  name: "静库1",          code: "WH-08" },
  { id: 10, name: "嘿咻库房",       code: "WH-10" },
  { id: 13, name: "静库2",          code: "WH-13" },
  { id: 6,  name: "KL超市默认库房", code: "WH-06" }
];

/* SKU 目录：刻意做成不同完整度
 *   brand / category / spec / unit / barcode 任一为空 → 行内副信息不拼该项
 *   字段：skuId, itemId, name, brand?, category?, spec?, unit?, barcode?, price
 */
const skuCatalog = [
  // —— 档案完整 ——
  { skuId: 77,  itemId: 57, name: "乐事鲜浓蕃茄味薯片 90g", brand: "乐事",   category: "膨化零食", spec: "90g*1桶",   unit: "桶", barcode: "6924743915855", price: 8.90 },
  { skuId: 78,  itemId: 58, name: "百草味津酥大麻花 120g",  brand: "百草味", category: "糕点点心", spec: "120g*1袋",  unit: "袋", barcode: "6920887361234", price: 6.50 },
  { skuId: 65,  itemId: 49, name: "黄飞红麻辣花生 210g",    brand: "黄飞红", category: "坚果炒货", spec: "210g*1袋",  unit: "袋", barcode: "12345678",      price: 10.00 },
  { skuId: 68,  itemId: 51, name: "旺旺雪饼 84g",           brand: "旺旺",   category: "饼干蛋糕", spec: "84g*1袋",   unit: "袋", barcode: "9501101530",    price: 3.50 },
  // —— 部分缺省（无品牌 / 无分类 / 无条码）——
  { skuId: 67,  itemId: 50, name: "甘源缤纷每日豆果 208g",  brand: "甘源",   category: "",         spec: "208g*1包",  unit: "包", barcode: "1000001",       price: 1.20 }, // 无分类
  { skuId: 174, itemId: 122, name: "MAMEE金厨隆冬风味 97g*4/袋", brand: "",   category: "方便速食", spec: "2包",       unit: "袋", barcode: "333333",        price: 2.00 }, // 无品牌
  { skuId: 99,  itemId: 77, name: "Omega3鸡蛋 600g（10枚）", brand: "",      category: "",         spec: "10枚/盒",   unit: "盒", barcode: "5000001",       price: 1.10 }, // 无品牌无分类
  // —— 极简档案（只有名称+单位，无品牌/分类/规格/条码）——
  { skuId: 83,  itemId: 63, name: "商品分发",               brand: "",       category: "",         spec: "",          unit: "袋", barcode: "",              price: 1.30 },
  { skuId: 200, itemId: 150, name: "老干妈干煸肉丝油辣椒 260g", brand: "",   category: "罐头酱菜", spec: "",          unit: "",   barcode: "",              price: 0.00 }  // 几乎全缺、单价0
];

/* 入库单样例：覆盖 6 类数据场景（见每条 scenario 注释）
 * 字段：id, no, type, warehouseId, warehouseName, date, time, ts, status, remark, creator, items[]
 * items 字段：lineNo, skuId, name, brand?, category?, spec?, unit?, barcode?, qty, price, amount, expiry?
 */
const orders = [
  /* 场景1 · 完整采购单（已入库）：有备注 + 多行 + 品牌/分类/规格/单位/条码/有效期/单价齐全 */
  {
    id: 101, no: "RK202606180012", type: "purchase",
    warehouseId: 15, warehouseName: "piao自营", date: "2026-06-18", time: "16:17",
    ts: 1781770640, status: 2, remark: "供应商批量到货，已核对效期", creator: "杨文强",
    items: [
      { lineNo: 1, skuId: 77, name: "乐事鲜浓蕃茄味薯片 90g", brand: "乐事",   category: "膨化零食", spec: "90g*1桶",  unit: "桶", barcode: "6924743915855", qty: 12, price: 8.90, amount: 106.80, expiry: "2026-12-01" },
      { lineNo: 2, skuId: 78, name: "百草味津酥大麻花 120g",  brand: "百草味", category: "糕点点心", spec: "120g*1袋", unit: "袋", barcode: "6920887361234", qty: 8,  price: 6.50, amount: 52.00,  expiry: "2026-10-15" }
    ]
  },

  /* 场景2 · 极简其他入库（已入库）：无备注 + 单价0 + 商品行仅名称+数量（无品牌/分类/规格/单位/条码/有效期） */
  {
    id: 102, no: "RK202606180011", type: "other",
    warehouseId: 13, warehouseName: "静库2", date: "2026-06-18", time: "16:16",
    ts: 1781770600, status: 2, remark: "", creator: "piaole",
    items: [
      { lineNo: 1, skuId: 200, name: "老干妈干煸肉丝油辣椒 260g", qty: 10, price: 0.00, amount: 0.00 }
    ]
  },

  /* 场景3 · 退货部分字段（已入库）：无备注；行1有有效期、行2无有效期；含品牌缺分类的混合 */
  {
    id: 103, no: "RK202606180009", type: "return",
    warehouseId: 7, warehouseName: "KL自营仓库", date: "2026-06-18", time: "15:38",
    ts: 1781768280, status: 2, remark: "", creator: "piaole",
    items: [
      { lineNo: 1, skuId: 67,  name: "甘源缤纷每日豆果 208g", brand: "甘源", category: "", spec: "208g*1包", unit: "包", barcode: "1000001", qty: 3, price: 1.20, amount: 3.60, expiry: "2026-09-30" },
      { lineNo: 2, skuId: 174, name: "MAMEE金厨隆冬风味 97g*4/袋", brand: "", category: "方便速食", spec: "2包", unit: "袋", barcode: "333333", qty: 6, price: 2.00, amount: 12.00 }
    ]
  },

  /* 场景4 · 草稿单（可编辑）：有备注；可进入编辑、删除、提交 */
  {
    id: 104, no: "RK202606190003", type: "purchase",
    warehouseId: 15, warehouseName: "piao自营", date: "2026-06-19", time: "09:28",
    ts: 1781854080, status: 1, remark: "今日到货，待复核数量后提交", creator: "piaole",
    items: [
      { lineNo: 1, skuId: 99, name: "Omega3鸡蛋 600g（10枚）", spec: "10枚/盒", unit: "盒", barcode: "5000001", qty: 12, price: 1.10, amount: 13.20, expiry: "2026-07-20" },
      { lineNo: 2, skuId: 68, name: "旺旺雪饼 84g", brand: "旺旺", category: "饼干蛋糕", spec: "84g*1袋", unit: "袋", barcode: "9501101530", qty: 6, price: 3.50, amount: 21.00 }
    ]
  },

  /* 场景5 · 标准已入库单（列表丰富度）：有品牌分类、无有效期、有备注 */
  {
    id: 105, no: "RK202606180007", type: "purchase",
    warehouseId: 15, warehouseName: "piao自营", date: "2026-06-18", time: "13:46",
    ts: 1781761560, status: 2, remark: "常规补货", creator: "杨文强",
    items: [
      { lineNo: 1, skuId: 65, name: "黄飞红麻辣花生 210g", brand: "黄飞红", category: "坚果炒货", spec: "210g*1袋", unit: "袋", barcode: "12345678", qty: 12, price: 10.00, amount: 120.00 }
    ]
  },

  /* 场景6 · 已作废单（只读）：调拨撤销，状态置灰，无底部操作 */
  {
    id: 106, no: "RK202606180004", type: "transfer",
    warehouseId: 13, warehouseName: "静库2", date: "2026-06-18", time: "11:09",
    ts: 1781751540, status: 3, remark: "调拨单撤销，入库单作废", creator: "supadmin",
    items: [
      { lineNo: 1, skuId: 83, name: "商品分发", unit: "袋", qty: 10, price: 1.30, amount: 13.00 }
    ]
  }
];

/* 轻量统计（列表页用）：今日入库单数 + 草稿数（演示值） */
const listStats = { todayDone: 4, draft: 1 };
