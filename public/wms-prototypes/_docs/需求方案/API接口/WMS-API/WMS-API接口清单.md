# WMS 第三方开放 API 接口清单

## 1. 文档说明

本文用于整理 WMS 面向第三方电商系统开放的 API 接口目录。

本文件只维护接口清单，不展开请求字段、响应字段、状态规则、幂等规则、错误码、回调报文等细节。后续每个接口的详细设计，统一在单一接口文档中补充。

在 WMS 底层设计中，自营业务场景与第三方卖家业务场景统一抽象为“第三方电商系统”接入方，通过 `channel_id`、`business_type`、`owner_id` 区分业务来源与货主归属。

当前已生成以下云仓单接口设计：

- [创建云仓发货单接口](./创建云仓发货单接口.md)
- [查询规则可售库存接口](./查询规则可售库存接口.md)

当前文档统一采用以下订单发货履约规则：

- 一个 `order_id` 可对应多张 `shipment_order_id`
- 一张 `shipment_order_id` 只能对应一种 `fulfillment_mode`
- `fulfillment_mode` 标准值为 `INSTANT`（即时配送）或 `EXPRESS`（快递配送）
- 默认按商品行拆分，不按数量拆分
- 云仓规则显式启用 `split_mode=by_sku_qty` 时，可按数量拆入多个履约子单
- 未启用数量拆分时，一个 `order_line_no` 必须且只能归属一张发货履约单
- WMS 回调以发货履约单为主键，上游电商系统负责订单主单状态汇总

## 2. API 分组总览

| 分组        | 用途                                                      | 优先级 |
| --------- | ------------------------------------------------------- | --- |
| 接入认证与基础能力 | 鉴权、令牌、字典、健康检查、调用配额                                      | P0  |
| 货主、店铺与权限 | 查询授权货主、授权店铺、可用仓库、店铺绑定仓库、服务范围、仓容、货主配置                    | P0  |
| 商品与基础资料   | 商品、SKU、条码、包装规格、批次效期规则、组合商品、唯一码关系                        | P0  |
| 入库管理      | 入库单创建、确认、修改、取消、改约、查询、收货和上架结果                            | P0  |
| 库存管理      | 库存汇总、明细、可用库存、批次库存、渠道库存、流水、批号维护                          | P0  |
| 出库管理      | 普通出库单、调拨出库单、其他出库单、采购退货出库单的创建、确认、查询                      | P0  |
| 订单发货履约管理  | 一张订单拆分多张发货履约单后的创建、确认、取消、查询、拣货、出库、包裹查询、配拦截、订单异常通知、单据流水通知 | P0  |
| 物流服务      | 按发货履约单和履约模式提供物流轨迹、面单查询                                  | P2  |
| 售后与退货     | 退货入仓、退货确认、质检结果                                          | P2  |
| 调拨管理      | 调拨单创建、确认、查询                                             | P1  |
| 仓内作业      | 仓内加工单、库内转移单管理                                           | P3  |
| 异常与工单     | 仓内异常、物流异常、工单、责任结果查询                                     | P3  |
| 费用与对账     | 费用项目、账单、费用明细、对账单下载                                      | P3  |
| 回调通知      | 回调配置、回调测试、回调日志、失败重推                                     | P0  |

## 3. 接入认证与基础能力

| API 名称      | 方法     | 建议路径                       | 用途                       | 优先级 |
| ----------- | ------ | -------------------------- | ------------------------ | --- |
| 获取访问令牌      | `POST` | `/openapi/v1/auth/token`   | 获取接口访问令牌                 | P0  |
| 刷新访问令牌      | `POST` | `/openapi/v1/auth/refresh` | 刷新即将过期的访问令牌              | P0  |
| 查询 API 调用配额 | `GET`  | `/openapi/v1/rate-limits`  | 查询当前接口调用配额与限流信息          | P1  |
| 查询系统字典      | `GET`  | `/openapi/v1/dictionaries` | 查询单据状态、库存状态、物流状态、异常类型等字典 | P0  |
| 健康检查        | `GET`  | `/openapi/v1/ping`         | 检测 WMS OpenAPI 服务可用性     | P0  |

## 4. 货主、店铺与权限

| API 名称   | 方法    | 建议路径                                                 | 用途             | 优先级 |
| -------- | ----- | ---------------------------------------------------- | -------------- | --- |
| 查询当前货主信息 | `GET` | `/openapi/v1/owner/profile`                          | 查询当前授权货主信息     | P0  |
| 查询授权店铺列表 | `GET` | `/openapi/v1/owner/stores`                           | 查询当前货主可使用店铺     | P0  |
| 查询店铺详情   | `GET` | `/openapi/v1/stores/{store_id}`                      | 查询店铺基础信息与状态     | P0  |
| 查询店铺服务能力 | `GET` | `/openapi/v1/stores/{store_id}/capabilities`         | 查询店铺支持的履约能力     | P0  |
| 查询店铺绑定仓库 | `GET` | `/openapi/v1/stores/{store_id}/warehouses`           | 查询店铺可服务仓库及优先级   | P0  |
| 查询可用仓库   | `GET` | `/openapi/v1/warehouses`                             | 查询当前货主可使用仓库    | P0  |
| 查询仓库服务能力 | `GET` | `/openapi/v1/warehouses/{warehouse_id}/capabilities` | 查询指定仓库服务能力     | P0  |
| 查询仓容信息   | `GET` | `/openapi/v1/warehouses/{warehouse_id}/capacity`     | 查询指定仓库仓容与可用容量  | P3  |
| 查询服务区域   | `GET` | `/openapi/v1/service-areas`                          | 查询仓库可服务区域和配送方式 | P3  |
| 查询货主配置   | `GET` | `/openapi/v1/owner/settings`                         | 查询当前货主基础配置     | P1  |

说明：销售发货/发货履约单、退货入库必须关联店铺；采购入库、调拨出入库、库存台账默认按货主+仓库执行，不要求选择店铺。

## 5. 商品与基础资料

| API 名称    | 方法     | 建议路径                                           | 用途                                   | 优先级 |
| --------- | ------ | ---------------------------------------------- | ------------------------------------ | --- |
| 创建/更新商品信息 | `POST` | `/openapi/v1/skus/upsert`                      | 同步商品、单个 SKU 资料、条码、箱码、批次与效期规则、预警信息、状态 | P0  |
| 维护组合商品    | `POST` | `/openapi/v1/skus/combos/upsert`               | 维护组合商品与子商品的关联                        | P1  |
| 同步唯一码关系   | `POST` | `/openapi/v1/skus/serial-numbers/batch-upsert` | 同步 SN/IMEI/唯一码与 SKU 关系               | P3  |

## 6. 入库管理

| API 名称  | 方法     | 建议路径                                                 | 用途           | 优先级 |
| ------- | ------ | ---------------------------------------------------- | ------------ | --- |
| 创建入库单   | `POST` | `/openapi/v1/inbounds`                               | 创建入库单        | P0  |
| 确认入库单   | `POST` | `/openapi/v1/inbounds/{inbound_order_id}/confirm`    | 确认入库单已受理     | P0  |
| 修改入库单   | `PUT`  | `/openapi/v1/inbounds/{inbound_order_id}`            | 修改入库单        | P0  |
| 取消入库单   | `POST` | `/openapi/v1/inbounds/{inbound_order_id}/cancel`     | 取消入库单        | P0  |
| 查询入库单列表 | `GET`  | `/openapi/v1/inbounds`                               | 查询、批量查询入库单列表 | P0  |
| 查询入库单详情 | `GET`  | `/openapi/v1/inbounds/{inbound_order_id}`            | 查询入库单详情      | P0  |
| 修改预约时间  | `POST` | `/openapi/v1/inbounds/{inbound_order_id}/reschedule` | 调整入库预约时间     | P2  |

## 7. 库存管理

| API 名称   | 方法     | 建议路径                                      | 用途                | 优先级 |
| -------- | ------ | ----------------------------------------- | ----------------- | --- |
| 查询库存汇总   | `GET`  | `/openapi/v1/inventory/summary`           | 查询 SKU 维度库存汇总     | P0  |
| 查询库存明细   | `GET`  | `/openapi/v1/inventory/details`           | 查询仓库、库区、货位、批次维度库存 | P0  |
| 查询可用库存   | `GET`  | `/openapi/v1/inventory/available`         | 查询可用于发货的库存        | P0  |
| 查询规则可售库存 | `POST` | `/openapi/v1/inventory/rule-saleable/query` | 按渠道、履约规则和仓配路由查询 SKU 可售库存 | P0  |
| 查询批次库存   | `GET`  | `/openapi/v1/inventory/batches`           | 查询批次库存            | P0  |
| 查询渠道库存   | `GET`  | `/openapi/v1/inventory/channel-available` | 查询渠道/店铺维度可用库存     | P1  |
| 查询库存流水   | `GET`  | `/openapi/v1/inventory/transactions`      | 查询库存变动流水          | P1  |
| 维护批号信息   | `POST` | `/openapi/v1/inventory/batches/update`    | 更新批号、批次属性信息       | P2  |
| 查询库存冻结记录 | `GET`  | `/openapi/v1/inventory/holds`             | 查询库存冻结记录          | P1  |
| 查询库存预警   | `GET`  | `/openapi/v1/inventory/alerts`            | 查询低库存、临期、过期等预警    | P1  |

## 8. 出库管理

| API 名称  | 方法     | 建议路径                                                | 用途                          | 优先级 |
| ------- | ------ | --------------------------------------------------- | --------------------------- | --- |
| 创建出库单   | `POST` | `/openapi/v1/stockouts`                             | 创建普通出库单、调拨出库单、其他出库单、采购退货出库单 | P0  |
| 确认出库单   | `POST` | `/openapi/v1/stockouts/{stockout_order_id}/confirm` | 确认出库单已受理                    | P0  |
| 查询出库单列表 | `GET`  | `/openapi/v1/stockouts`                             | 查询出库单列表                     | P0  |
| 查询出库单详情 | `GET`  | `/openapi/v1/stockouts/{stockout_order_id}`         | 查询出库单详情                     | P0  |

## 9. 订单发货履约管理

说明：

- 第三方电商系统在订单源头维护 `order_id` 与 `order_line_no` 结构，并完成商品行履约分组。
- 一个 `order_id` 可对应多张 `shipment_order_id`，每张发货履约单只允许一种 `fulfillment_mode`。
- 默认商品行与发货履约单的关系为：一个 `order_line_no` 只归属一张发货履约单。
- 云仓规则显式启用 `split_mode=by_sku_qty` 时，按子单返回同一订单行的拆分数量。
- `fulfillment_mode` 建议标准值为 `INSTANT`（即时配送）与 `EXPRESS`（快递配送）。
- 发货单查询、包裹查询、异常通知、单据流水均以 `shipment_order_id` 为主键，同时需返回 `parent_order_id`、`order_line_refs`、`fulfillment_mode` 等关联信息。

| API 名称   | 方法     | 建议路径                                                         | 用途                                                                                       | 优先级 |
| -------- | ------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | --- |
| 创建发货单    | `POST` | `/openapi/v1/shipments`                                      | 创建发货履约单，需关联履约店铺并传入订单行映射与履约模式 | P0  |
| 确认发货单    | `POST` | `/openapi/v1/shipments/{shipment_order_id}/confirm`          | 确认发货单已受理                                                                                 | P0  |
| 取消发货单    | `POST` | `/openapi/v1/shipments/{shipment_order_id}/cancel`           | 取消发货单                                                                                    | P0  |
| 修改收货信息   | `PUT`  | `/openapi/v1/shipments/{shipment_order_id}/receiver`         | 修改发货单收货信息                                                                                | P1  |
| 查询发货单列表  | `GET`  | `/openapi/v1/shipments`                                      | 按订单主单、发货履约单或履约模式查询发货单列表                                                                  | P0  |
| 查询发货单详情  | `GET`  | `/openapi/v1/shipments/{shipment_order_id}`                  | 查询发货单详情、父订单信息、商品行映射与履约模式                                                                 | P0  |
| 查询拣货结果   | `GET`  | `/openapi/v1/shipments/{shipment_order_id}/picking-result`   | 查询发货单拣货结果                                                                                | P0  |
| 查询出库结果   | `GET`  | `/openapi/v1/shipments/{shipment_order_id}/shipping-result`  | 查询发货单出库结果                                                                                | P0  |
| 查询包裹列表   | `GET`  | `/openapi/v1/shipments/{shipment_order_id}/packages`         | 查询包裹、拆单、合单后的包裹结果，并返回包裹关联商品行与履约模式                                                         | P2  |
| 配拦截接口    | `POST` | `/openapi/v1/shipments/{shipment_order_id}/intercept`        | 对发货单执行配拦截操作                                                                              | P1  |
| 订单异常通知接口 | `POST` | `/openapi/v1/shipments/{shipment_order_id}/exception-notify` | 通知发货单履约异常信息，异常类型按履约模式区分，并返回影响商品行                                                         | P1  |
| 单据流水通知   | `POST` | `/openapi/v1/shipments/{shipment_order_id}/process-notify`   | 通知发货单关键状态流水，流水节点按履约模式区分，并返回父订单号                                                          | P1  |

## 10. 物流服务

说明：

- `查询物流轨迹` 同时支持即时配送与快递配送，但两类履约模式的轨迹节点定义不同。
- `获取面单` 主要适用于快递配送场景；即时配送场景如无标准电子面单，可返回空值或不适用标识。
- 所有物流服务查询均以 `shipment_order_id` 为上级对象，不直接以订单主单作为执行主键。

| API 名称 | 方法    | 建议路径                                               | 用途                     | 优先级 |
| ------ | ----- | -------------------------------------------------- | ---------------------- | --- |
| 查询物流轨迹 | `GET` | `/openapi/v1/shipments/{shipment_order_id}/tracks` | 查询发货单对应物流轨迹，并按履约模式返回节点 | P2  |
| 获取面单   | `GET` | `/openapi/v1/shipments/{shipment_order_id}/label`  | 获取发货单对应物流面单，主要适用于快递配送  | P2  |

## 11. 售后与退货

| API 名称  | 方法     | 建议路径                                                      | 用途         | 优先级 |
| ------- | ------ | --------------------------------------------------------- | ---------- | --- |
| 创建退货入库单 | `POST` | `/openapi/v1/returns`                                     | 创建退货回仓单，必须关联履约店铺    | P2  |
| 确认退货入库单 | `POST` | `/openapi/v1/returns/{return_order_id}/confirm`           | 确认退货单已入仓受理 | P2  |
| 取消退货单   | `POST` | `/openapi/v1/returns/{return_order_id}/cancel`            | 取消退货单      | P2  |
| 查询退货单列表 | `GET`  | `/openapi/v1/returns`                                     | 查询退货单列表    | P2  |
| 查询退货单详情 | `GET`  | `/openapi/v1/returns/{return_order_id}`                   | 查询退货单详情    | P2  |
| 查询质检结果  | `GET`  | `/openapi/v1/returns/{return_order_id}/inspection-result` | 查询退货质检结果   | P2  |

## 12. 调拨管理

| API 名称  | 方法     | 建议路径                                                | 用途        | 优先级 |
| ------- | ------ | --------------------------------------------------- | --------- | --- |
| 创建调拨单   | `POST` | `/openapi/v1/transfers`                             | 创建调拨单     | P1  |
| 确认调拨单   | `POST` | `/openapi/v1/transfers/{transfer_order_id}/confirm` | 确认调拨单处理状态 | P1  |
| 查询调拨单列表 | `GET`  | `/openapi/v1/transfers`                             | 查询调拨单列表   | P1  |
| 查询调拨单详情 | `GET`  | `/openapi/v1/transfers/{transfer_order_id}`         | 查询调拨单详情   | P1  |

## 13. 仓内作业

| API 名称    | 方法     | 建议路径                                                                | 用途          | 优先级 |
| --------- | ------ | ------------------------------------------------------------------- | ----------- | --- |
| 创建仓内加工单   | `POST` | `/openapi/v1/work-orders/processings`                               | 创建仓内加工单     | P3  |
| 确认仓内加工单   | `POST` | `/openapi/v1/work-orders/processings/{processing_order_id}/confirm` | 确认仓内加工单处理状态 | P3  |
| 查询仓内加工单列表 | `GET`  | `/openapi/v1/work-orders/processings`                               | 查询仓内加工单列表   | P3  |
| 查询仓内加工单详情 | `GET`  | `/openapi/v1/work-orders/processings/{processing_order_id}`         | 查询仓内加工单详情   | P3  |
| 创建库内转移单   | `POST` | `/openapi/v1/work-orders/movements`                                 | 创建库内转移单     | P3  |
| 确认库内转移单   | `POST` | `/openapi/v1/work-orders/movements/{movement_order_id}/confirm`     | 确认库内转移单处理状态 | P3  |
| 查询库内转移单列表 | `GET`  | `/openapi/v1/work-orders/movements`                                 | 查询库内转移单列表   | P3  |
| 查询库内转移单详情 | `GET`  | `/openapi/v1/work-orders/movements/{movement_order_id}`             | 查询库内转移单详情   | P3  |

## 14. 异常与工单

| API 名称    | 方法     | 建议路径                                              | 用途          | 优先级 |
| --------- | ------ | ------------------------------------------------- | ----------- | --- |
| 查询异常列表    | `GET`  | `/openapi/v1/exceptions`                          | 查询异常列表      | P3  |
| 查询异常详情    | `GET`  | `/openapi/v1/exceptions/{exception_id}`           | 查询异常详情      | P3  |
| 创建异常工单    | `POST` | `/openapi/v1/tickets`                             | 创建异常工单      | P3  |
| 回复异常工单    | `POST` | `/openapi/v1/tickets/{ticket_id}/comments`        | 回复异常工单      | P3  |
| 关闭异常工单    | `POST` | `/openapi/v1/tickets/{ticket_id}/close`           | 关闭异常工单      | P3  |
| 查询赔付/责任结果 | `GET`  | `/openapi/v1/exceptions/{exception_id}/liability` | 查询赔付或责任认定结果 | P3  |

## 15. 费用与对账

| API 名称 | 方法    | 建议路径                                           | 用途       | 优先级 |
| ------ | ----- | ---------------------------------------------- | -------- | --- |
| 查询费用项目 | `GET` | `/openapi/v1/billing/fee-items`                | 查询费用项目目录 | P3  |
| 查询账单列表 | `GET` | `/openapi/v1/billing/bills`                    | 查询账单列表   | P3  |
| 查询账单详情 | `GET` | `/openapi/v1/billing/bills/{bill_id}`          | 查询账单详情   | P3  |
| 查询费用明细 | `GET` | `/openapi/v1/billing/fee-details`              | 查询费用明细   | P3  |
| 下载对账单  | `GET` | `/openapi/v1/billing/bills/{bill_id}/download` | 下载对账单    | P3  |

## 16. 回调通知

| API 名称 | 方法     | 建议路径                                           | 用途       | 优先级 |
| ------ | ------ | ---------------------------------------------- | -------- | --- |
| 配置回调地址 | `POST` | `/openapi/v1/webhooks`                         | 配置回调地址   | P0  |
| 查询回调配置 | `GET`  | `/openapi/v1/webhooks`                         | 查询回调配置   | P0  |
| 修改回调配置 | `PUT`  | `/openapi/v1/webhooks/{webhook_id}`            | 修改回调配置   | P0  |
| 回调测试   | `POST` | `/openapi/v1/webhooks/{webhook_id}/test`       | 测试回调连通性  | P0  |
| 查询回调日志 | `GET`  | `/openapi/v1/webhooks/events`                  | 查询回调日志   | P1  |
| 重推回调事件 | `POST` | `/openapi/v1/webhooks/events/{event_id}/retry` | 重推失败回调事件 | P1  |

说明：

- 回调通知用于承接标准业务事件推送，具体事件报文、字段定义、触发时机与重试规则在单一接口文档中另行展开。
- 所有与订单发货履约相关的回调事件均应包含 `parent_order_id`、`shipment_order_id`、`fulfillment_mode`。
- 如回调事件涉及商品行级影响范围，还应返回 `order_line_refs`。
- 标准事件范围建议至少包括：入库单状态变更、收货完成、上架完成、出库单状态变更、发货单状态变更、拣货完成、出库完成、包裹状态变更、订单异常通知、单据流水通知、退货单状态变更、退货质检完成。
