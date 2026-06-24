# 仓库APP-发货管理 数据设计与API对接 需求文档

> 版本：v1.0（2026-06-20 初稿，待审核）
>
> 文档定位：本文档是 [00发货简易需求文档.md](./00发货简易需求文档.md) 中明确划出的「独立简易需求文档」，承接其暂未展开的 **数据模型设计、单/合单发货数据流转、Lalamove API 报价与下单、配送状态查询、自配送/线下物流处理**。00 文档负责发货列表/合单选择/确认弹窗的 UI 流程，本文档负责数据落库与对接逻辑，两份文档互补，不重复 UI 细节。
>
> 设计前提：本文档所有表名、字段、状态枚举均来自当前项目 MySQL 库 **真实表结构**（查询时间 2026-06-20）。结论是：**该功能所需的数据模型已在数据库中完整存在**，本期主要是把已有数据结构、APP 页面与 Lalamove API 对接逻辑串起来。

---

## 1. 基础信息

| 项目 | 内容 |
| ---- | ---- |
| 功能名称 | 发货管理（数据设计与API对接） |
| 所属模块 | 仓库APP > 发货 |
| 页面编码 | `WMS-APP-004`（与 00 文档同页面） |
| 适用端 | 仓库APP（仓库作业端） |
| 适用角色 | 仓库发货人员 |
| 关联文档 | 00发货简易需求文档、01发货原型设计说明、02/03 中英文命名与修改清单 |

### 1.1 本期需求范围（来自需求方）

1. 在仓库APP 增加【发货管理】列表 + 发货功能。
2. 支持**单个订单发货**。
3. 支持**多个订单合并发货**。
4. 物流公司 = Lalamove 时，调用 Lalamove API 进行**报价、下单发货**；通过 API 发货的可跟踪到物流轨迹及配送状态【待接单、已接单、配送中、已送达】。本期先在「已发货」列表查询订单配送状态即可，完整【物流跟踪】另行补充。
5. 物流公司 = 自配送或其他未接入 API 的物流公司时，直接**上传物流单号 + 上传物流信息图片**。

---

## 2. 数据库现状分析（核心结论）

经查询当前库，发货/配送链路已具备完整表结构，无需新建主干表。各表与本期需求的对应关系如下：

| 表名 | 表注释 | 在本功能中的角色 |
| ---- | ---- | ---- |
| `w_wms_picking_orders` | 订单维度揽货指令 | **发货任务的数据源**。发货列表、订单状态流转、收发货地址与经纬度均取自此表 |
| `w_wms_outbound_orders` | 出库单头 | 发货成功后生成的出库单（关联 `picking_order_id`） |
| `w_wms_outbound_order_items` | 出库单 SKU 明细 | 出库明细，承载库存解冻/释放 |
| `w_wms_delivery_providers` | 配送商配置 | 物流公司配置（区分在线API/线下手动、Lalamove 密钥、钱包余额） |
| `w_wms_delivery_orders` | 三方配送订单主表 | 一次发货批次生成一条；承载报价、三方订单号、配送状态、物流图 |
| `w_wms_delivery_order_items` | 三方配送订单子表 | **合单发货的一单多点**：一条配送单 N 条子单（每个收货点一条） |
| `w_wms_delivery_order_tracks` | 配送单流转记录 | Lalamove 轨迹节点（订单提交/已接单/已取货/送达），供物流跟踪 |
| `w_pay_orders` | 订单表 | 支付与退款状态来源（用于发货资格判断的辅助校验） |

> 结论：**数据库已为本功能预留了完整模型**，包括合单发货（一单多点）、Lalamove 报价/下单、配送状态枚举、轨迹节点、钱包余额、物流图上传等。开发主要工作是接口编排与 APP 接线，而非建表。

---

## 3. 关键表结构与字段说明

### 3.1 揽货订单表 `w_wms_picking_orders`（发货任务源）

发货列表本质是按状态过滤的揽货订单列表。关键字段：

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `order_no` | varchar(64) | 订单号 |
| `status` | tinyint | **作业状态：1待揽货 2揽货中 3待打包 4待发货 5已发货 6已收货 7已取消** |
| `store_id` | int | 店铺 ID |
| `delivery_type` | tinyint | 配送方式：1即时配送 2物流发货（对应列表筛选） |
| `delivery_name` | varchar(100) | 配送方式展示文案 |
| `delivery_expect_text` | varchar(100) | 送达时间展示文案（如「尽快送达，预估 19:06」） |
| `receiver_name` / `receiver_mobile` / `receiver_address` / `receiver_postal_code` | - | 收货人姓名/电话/地址/邮编 |
| `delivery_point` / `floor_nit_number` | - | 收货点 / 楼层门牌号 |
| `address_lng` / `address_lat` | varchar(30) | **收货地址经纬度**（推荐合单距离计算、Lalamove stop 坐标） |
| `sender_address` / `sender_phone` / `sender_lng` / `sender_lat` | - | **发货人（库房）地址与经纬度**（Lalamove 取货点） |
| `packer_id` / `packer_name` / `packed_at` | - | 打包人快照（进入待发货的前序） |
| `shipped_at` | int | 进入已发货时间戳（发货成功写入） |
| `remark` / `stock_out` | - | 订单备注 / 缺货备注 |

发货相关状态流转：`3待打包 → 4待发货 →（确认发货）→ 5已发货 → 6已收货`。
发货管理列表的「待发货 / 已发货 / 已完成」分别对应 `status = 4 / 5 / 6`（已完成口径以收货为准，最终以产品确认）。

### 3.2 配送商配置表 `w_wms_delivery_providers`

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `provider_code` | varchar(50) | 配送商标识，如 `Lalamove` |
| `name` | varchar(50) | 物流公司展示名（确认弹窗按钮文案来源） |
| `is_offline` | tinyint | **1=线下手动 2=在线API**（决定走 API 还是走手填物流单号） |
| `api_key` / `api_secret` / `api_base_url` / `market` / `env` | - | Lalamove 接口凭证与环境（sandbox/production，market 如 MY） |
| `cities_data` | text | 城市/车型/附加服务能力缓存（JSON） |
| `wallet_balance` / `wallet_currency` / `wallet_updated_at` | - | 钱包余额（webhook 同步，对应截图「Wallet余额 MYR 521.90」） |
| `status` | tinyint | 1=启用 2=禁用 |

**现网种子数据（已存在）**：

| provider_code | name | is_offline | status |
| ---- | ---- | ---- | ---- |
| Lalamove | Lalamove | 2（在线API） | 1启用 |
| J&T Express | J&T Express | 1（线下手动） | 1启用 |

> 注：APP 截图中的物流公司按钮（Lalamove / 自配送 / Ninjavan / J&T express / Grab / DHL / Lalamove-test）多于现网种子数据。**确认弹窗的物流公司按钮组应由本表 `status=1` 的记录动态渲染**，而非前端写死；新增物流公司只需在本表加一条配置（`is_offline=1` 即走线下手填）。「自配送」建议也作为一条 `is_offline=1` 的配送商记录维护，统一数据口径。

### 3.3 三方配送订单主表 `w_wms_delivery_orders`（一次发货批次一条）

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `provider_id` | int | 关联配送商配置 ID |
| `provider_order_id` | varchar(100) | **三方订单号（幂等键）**；Lalamove 为 API 返回订单号 |
| `provider_quotation_id` | varchar(100) | 三方报价号（Lalamove 报价接口返回） |
| `provider_driver_id` | varchar(100) | 三方司机 ID |
| `delivery_status` | tinyint | **配送状态：1待接单 2已接单 3配送中 4重新派单 5配送取消 6配送异常 7已送达 8已关闭** |
| `operated_at` | int | 配送状态最近一次变更时刻 |
| `provider_status` | varchar(50) | 三方原始状态（映射前留存） |
| `exception_reason` | varchar(255) | 异常/取消/重派原因 |
| `vehicle_type` / `provider_service_code` / `delivery_mode` | - | 车型 / 三方服务编码 / 配送模式（REGULAR/PRIORITY/POOLING，对应截图 Regular 常规配送） |
| `currency` / `quote_amount` / `priority_fee` | - | 币种 / 报价金额（截图 MYR 6.9）/ 小费优先费 |
| `driver_info` | text(JSON) | 司机信息 |
| `item_description` | varchar(255) | 物品描述 |
| `sender_phone` / `payment_method` | - | 发件人电话 / 支付方式（默认 Wallet） |
| `share_link` | varchar(255) | 分享链接-骑手配送地图 |
| `logistics_images` | text(JSON 数组) | **物流信息图（线下物流确认发货时上传；Lalamove 为空）** |
| `remark` | varchar(255) | 备注 |

> **本期需求 vs 配送状态枚举对照**：需求方提的【待接单、已接单、配送中、已送达】= `delivery_status` 的 1/2/3/7；表中另有 4重新派单/5配送取消/6配送异常/8已关闭，供后续物流跟踪扩展，本期列表查询展示其文案即可。

### 3.4 三方配送子表 `w_wms_delivery_order_items`（合单一单多点）

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `delivery_order_id` | int | 配送主表 ID |
| `picking_order_id` | int | 揽货订单 ID（**逐订单留痕的关键**） |
| `order_no` | varchar(64) | 订单号 |
| `stop_index` | int | 收货 stop 序号（从 1 起，对应路线规划顺序） |
| `provider_stop_id` | varchar(100) | 三方 stop ID（Lalamove 返回） |
| `item_delivery_status` | tinyint | 子单配送状态（枚举同主表） |
| `remark` | varchar(255) | 收货备注 |

> **合单发货数据表达**：合单 = 1 条 `w_wms_delivery_orders` 主单 + N 条 `w_wms_delivery_order_items` 子单（每个收货点一条 stop）。单订单发货 = 主单 + 1 条子单。WMS 侧逐订单（子单）保留 `picking_order_id` 关联、出库单、库存解冻与状态，物流侧表现为一单多点。这与 00 文档第 5 节「合单发货规则」完全一致。

### 3.5 配送轨迹表 `w_wms_delivery_order_tracks`（物流跟踪）

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `delivery_order_id` | int | 配送主表 ID |
| `node` | varchar(30) | 节点编码：SUBMITTED/ASSIGNED/PICKED_UP/STOP_DELIVERED/ALL_DELIVERED |
| `title` | varchar(50) | 展示文案：订单提交/已接单/司机已取货/第N站送达/已全部送达 |
| `image` | varchar(500) | 送达凭证(POD)照片 URL，仅送达节点有 |
| `stop_index` | int | 单站节点对应第几站（整单节点为 0） |
| `picking_order_id` | int | 单站节点关联的揽货订单 ID |
| `occurred_at` | int | 节点发生时间 |

> 本期【物流跟踪】仅在「已发货」列表/详情读取并展示状态文案，轨迹明细页与 webhook 回调入库的完整需求另行输出。表结构已就绪，回调写入逻辑本期可先实现「下单成功写入 SUBMITTED 节点」。

---

## 4. 功能需求

### 4.1 发货管理列表

- 入口：仓库APP 工作台「发货」卡片 / 底部导航订单入口进入发货管理列表。
- 状态页签：待发货 / 已发货 / 已完成，分别取 `w_wms_picking_orders.status = 4 / 5 / 6`。
- 配送筛选：全部 / 即时配送 / 物流发货，对应 `delivery_type = (不限) / 1 / 2`。
- 搜索：按订单号 / 联系人 / 邮编（`order_no` / `receiver_name` / `receiver_postal_code`）。
- 排序：待发货默认按下单时间升序（00 文档口径，对应揽货订单创建时间）。
- 列表卡片字段取自 `w_wms_picking_orders`（邮编、配送方式、送达时间文案、商品数量、下单时间等）。
- 已发货卡片需展示订单编号与**配送状态文案**（来自该订单子单关联的 `w_wms_delivery_orders.delivery_status`）。

### 4.2 单个订单发货

1. 待发货卡片点击「确认发货」→ 打开确认发货弹窗（仅带当前 1 个订单）。
2. 选择物流公司（来自 `w_wms_delivery_providers` 启用记录）。
3. 按物流公司类型分支（见 4.4 / 4.5）提交。
4. 提交成功：生成 1 条 `w_wms_delivery_orders` + 1 条 `w_wms_delivery_order_items`，生成出库单、解冻库存、`picking_orders.status` → 5已发货、写 `shipped_at`。

### 4.3 多个订单合并发货

1. 列表勾选多张待发货订单（或经推荐发货补充），底部「统一发货」。
2. 打开确认发货弹窗，选择统一的物流公司。
3. 提交成功：生成 **1 条** `w_wms_delivery_orders` 主单 + **N 条** `w_wms_delivery_order_items` 子单（每订单一个 stop，`stop_index` 按路线顺序）。
4. 批次内**每张订单**逐一执行：生成出库单、解冻库存、状态 → 已发货、写 `shipped_at`。
5. Lalamove 模式下，多 stop 作为一张物流订单一次性报价下单（见 4.4）。

> 路线规划/最优顺序（截图「车型选择」页的路线规划、推荐排序）影响 `stop_index`；本期可由 Lalamove 报价返回的 stop 顺序确定，或前端「推荐」开关排序。

### 4.4 Lalamove 发货（在线 API，`is_offline=2`）

提交流程：

1. **报价**：以发货人（库房）坐标为取货点 + 各订单收货坐标为送货 stop，调用 Lalamove Quotation 接口。
   - 入参取自 `picking_orders.sender_lng/sender_lat/sender_phone` 与各订单 `address_lng/address_lat/receiver_mobile`，车型 `vehicle_type`、配送模式 `delivery_mode`、市场 `market`。
   - 返回写入 `provider_quotation_id`、`quote_amount`、`currency`、`provider_service_code`。
2. **下单**：基于报价号调用 Lalamove PlaceOrder 接口。
   - 成功：写入 `provider_order_id`（幂等键）、`provider_stop_id`（各子单）、`delivery_status=1待接单`、`share_link`，并写一条 `tracks` 节点 SUBMITTED。
   - 失败：不完成发货，提示失败原因并允许重试；不生成出库单、不扭转订单状态。
3. **状态/轨迹**：后续 Lalamove webhook 回调更新 `delivery_status`、`provider_driver_id`、`driver_info`、`provider_status`，并追加 `tracks` 节点。本期「已发货」列表读取 `delivery_status` 展示【待接单/已接单/配送中/已送达】文案即可。
4. Lalamove 模式确认弹窗**不要求**手填物流单号、不要求上传物流图（`logistics_images` 为空）。

> 钱包余额：`w_wms_delivery_providers.wallet_balance` 由 webhook 同步，确认下单页可展示余额（截图 MYR 521.90）。

### 4.5 自配送 / 其他物流发货（线下手动，`is_offline=1`）

1. 选择物流公司（J&T Express / 自配送 / 其他线下配送商）。
2. 发货人员先在对应物流平台或线下完成下单，回 WMS：
   - **填写物流单号**（必填）。
   - **上传物流信息图片**（下单截图/交接凭证），写入 `w_wms_delivery_orders.logistics_images`（JSON 数组）。
3. 提交成功：生成配送主单+子单（`delivery_status` 可置初始/不适用），生成出库单、解冻库存、订单状态 → 已发货。
4. 线下物流无 API 轨迹，配送状态由人工更新（后续【订单处理】流程维护）。

> **待开发决定项**：现 `w_wms_delivery_orders` 无独立「物流单号」字段，仅有 `provider_order_id`（注释：三方订单号/幂等键）。线下手填物流单号的落库方式（复用 `provider_order_id` 或新增 `tracking_no` 字段）**交由开发评估后决定**，本文档不强制。无论哪种方案，需保证：① 线下单号可查询展示；② 不与 Lalamove 的三方订单号产生幂等冲突。

---

## 5. 发货成功后的系统动作（每张订单）

提交成功后，对发货批次内每张订单执行（与 00 文档第 8.1 节一致，此处落到表）：

1. 生成出库单 `w_wms_outbound_orders`（`outbound_type=1销售`、`picking_order_id` 关联、`status` 由 1草稿 → 2已完成；库存不足则 3出库失败 + `fail_reason`）。
2. 写出库明细 `w_wms_outbound_order_items`，解冻/释放前序冻结库存（短拣兜底用 `total_released_quantity`）。
3. 记录配送主单/子单 `w_wms_delivery_orders` + `w_wms_delivery_order_items`。
4. `w_wms_picking_orders.status` → 5已发货，写 `shipped_at`。
5. Lalamove 模式写首个轨迹节点 `w_wms_delivery_order_tracks`（SUBMITTED）。

> 出库与发货应在同一事务边界内保证一致性：任一订单出库失败的回滚/降级策略（整批回滚 or 单订单跳过）需在开发设计阶段明确。

---

## 6. 状态枚举对照表（统一口径）

### 6.1 订单作业状态（`w_wms_picking_orders.status`）

| 值 | 状态 | 发货管理列表表现 |
| ---- | ---- | ---- |
| 1 | 待揽货 | 推荐可见，不可发货 |
| 2 | 揽货中 | 推荐可见，不可发货 |
| 3 | 待打包 | 推荐可见，不可发货 |
| 4 | 待发货 | 可勾选发货 |
| 5 | 已发货 | 已发货页签 |
| 6 | 已收货 | 已完成页签 |
| 7 | 已取消 | 不展示/置灰 |

### 6.2 配送状态（`w_wms_delivery_orders.delivery_status`）

| 值 | 状态 | 本期是否展示 |
| ---- | ---- | ---- |
| 1 | 待接单 | ✅ 本期 |
| 2 | 已接单 | ✅ 本期 |
| 3 | 配送中 | ✅ 本期 |
| 4 | 重新派单 | 跟踪扩展 |
| 5 | 配送取消 | 跟踪扩展 |
| 6 | 配送异常 | 跟踪扩展 |
| 7 | 已送达 | ✅ 本期 |
| 8 | 已关闭 | 跟踪扩展 |

### 6.3 配送商类型（`w_wms_delivery_providers.is_offline`）

| 值 | 含义 | 发货分支 |
| ---- | ---- | ---- |
| 1 | 线下手动 | 手填物流单号 + 上传物流图（4.5） |
| 2 | 在线 API | Lalamove 报价/下单（4.4） |

---

## 7. 校验规则

| 场景 | 系统表现 |
| ---- | ---- |
| 未选订单 | 提示「请先选择待发货订单」 |
| 所选含非待发货订单 | 禁止提交，提示移除 |
| 所选含已拦截订单 | 禁止提交，提示前往拦截处理（拦截标识来源待产品确认，现表未见独立拦截字段，可由订单/退款状态或新增标识承载——**待确认**） |
| 未选物流公司 | 提示「请选择物流公司」 |
| 线下物流未填物流单号 | 禁止提交，提示「请填写物流单号」 |
| Lalamove 报价/下单失败 | 不完成发货，提示失败原因，允许重试 |
| 出库失败（库存不足） | 记录 `fail_reason`，按事务策略处理，不误置已发货 |

---

## 8. 与现有文档的边界

| 内容 | 归属文档 |
| ---- | ---- |
| 发货列表/合单选择/推荐发货/确认弹窗 UI 流程与视觉 | 00 / 01 文档 |
| 中英文文案口径 | 02 / 03 文档 |
| 数据模型、表字段、状态枚举落库 | **本文档** |
| Lalamove 报价/下单/状态映射数据流 | **本文档**（接口字段明细另出 API 文档） |
| 单/合单发货数据流转、出库与库存解冻落库 | **本文档** |
| 完整【物流跟踪】轨迹页、webhook 回调入库明细 | 后续独立需求文档 |
| 拦截订单处理任务、订单指派详情 | 后续独立需求文档 |

---

## 9. 待确认/待开发决定事项汇总

1. **物流单号落库方式**（线下物流）：复用 `provider_order_id` 还是新增 `tracking_no` 字段——交开发决定（需求方已确认）。
2. **拦截标识来源**：现表未见独立拦截字段，发货资格中的「已拦截」如何判定（订单状态/退款状态/新增标识）——待产品确认。
3. **「已完成」页签口径**：取 `status=6已收货` 还是另含物流已送达——待产品确认。
4. **物流公司按钮**：确认按钮组由 `w_wms_delivery_providers` 动态渲染；现网仅 Lalamove、J&T，其余截图中的配送商（Ninjavan/Grab/DHL/自配送等）是否补种子数据——待产品确认。
5. **出库事务策略**：合单批次内单订单出库失败时整批回滚还是单订单跳过——开发设计阶段明确。
6. **Lalamove 接口字段明细**（报价/下单/取消/webhook 字段映射）：另出专门 API 对接文档。

---

## 10. 附：本功能涉及表清单（速查）

```text
w_wms_picking_orders        订单维度揽货指令      —— 发货任务源/状态机
w_wms_outbound_orders       出库单头              —— 发货后生成
w_wms_outbound_order_items  出库单SKU明细         —— 库存解冻/释放
w_wms_delivery_providers    配送商配置            —— 物流公司/Lalamove密钥/钱包
w_wms_delivery_orders       三方配送订单主表      —— 发货批次/报价/三方单号/物流图
w_wms_delivery_order_items  三方配送订单子表      —— 合单一单多点(逐订单留痕)
w_wms_delivery_order_tracks 配送单流转记录        —— Lalamove轨迹节点
w_pay_orders                订单表                —— 支付/退款状态(辅助校验)
```
