(() => {
    const allWarehouseIds = ["whA", "whB", "whC"];
    const roleWarehouseMap = {
      operator: ["whA"],
      manager: allWarehouseIds.slice()
    };

    const roleMap = {
      operator: {
        label: "仓库作业员",
        scopeTag: "本人任务",
        contextHint: "以本人接单和执行为主，仅显示已授权作业菜单。",
        baseMenus: [
          "outbound_order",
          "outbound_wait_pick",
          "outbound_merge",
          "shipping_pending",
          "shipping_wait_order",
          "shipping_redispatch",
          "shipping_exception",
          "shipping_accepted",
          "shipping_delivering",
          "shipping_delivered_today",
          "shipping_tracking",
          "inventory_in_record"
        ]
      },
      manager: {
        label: "仓库管理员",
        scopeTag: "全仓协调",
        contextHint: "可见全仓工作台，支持跨仓协调、盘点与全量记录查询。",
        baseMenus: [
          "outbound_order",
          "outbound_wait_pick",
          "outbound_merge",
          "shipping_pending",
          "shipping_wait_order",
          "shipping_redispatch",
          "shipping_exception",
          "shipping_accepted",
          "shipping_delivering",
          "shipping_delivered_today",
          "shipping_tracking",
          "inventory_count",
          "inventory_in_record"
        ]
      }
    };

    const profileMap = {
      standard: {
        label: "标准作业",
        desc: "覆盖一线常用的出入库处理与基础库存查询。",
        menus: [
          "outbound_order",
          "outbound_wait_pick",
          "outbound_merge",
          "shipping_pending",
          "shipping_wait_order",
          "shipping_redispatch",
          "shipping_exception",
          "shipping_accepted",
          "shipping_delivering",
          "shipping_delivered_today",
          "shipping_tracking",
          "inventory_in_record"
        ]
      },
      outbound: {
        label: "出库优先",
        desc: "突出揽货、合单、发货履约相关入口。",
        menus: [
          "outbound_order",
          "outbound_wait_pick",
          "outbound_merge",
          "shipping_pending",
          "shipping_wait_order",
          "shipping_redispatch",
          "shipping_exception",
          "shipping_accepted",
          "shipping_delivering",
          "shipping_delivered_today",
          "shipping_tracking"
        ]
      },
      inbound: {
        label: "入库优先",
        desc: "突出采购收货、退货收货、调拨收货与上架。",
        menus: [
          "inventory_count",
          "inventory_in_record"
        ]
      },
      full: {
        label: "全功能",
        desc: "工作台展示全部业务菜单与库存记录能力。",
        menus: [
          "outbound_order",
          "outbound_wait_pick",
          "outbound_merge",
          "shipping_pending",
          "shipping_wait_order",
          "shipping_redispatch",
          "shipping_exception",
          "shipping_accepted",
          "shipping_delivering",
          "shipping_delivered_today",
          "shipping_tracking",
          "inventory_count",
          "inventory_in_record"
        ]
      }
    };

    const moduleMeta = {
      outbound: { label: "出库", desc: "接单、揽货与合单", className: "outbound" },
      shipping: { label: "发货", desc: "待发货、已发货、履约跟踪", className: "shipping" },
      packingReview: { label: "打包复核", desc: "打包后复核并确认待发货任务", className: "outbound" },
      inbound: { label: "入库", desc: "入库单创建与查看", className: "inbound" },
      inventory: { label: "其他", desc: "盘点和出入库记录", className: "inventory" }
    };

    const menuDefs = [
      { id: "outbound_order", module: "outbound", label: "揽货接单", code: "OB-01", desc: "按仓库接单并锁定处理人" },
      { id: "outbound_wait_pick", module: "outbound", label: "待揽货", code: "OB-02", desc: "查看待执行揽货任务" },
      { id: "outbound_merge", module: "packingReview", label: "打包复核", code: "OB-03", desc: "完成打包后的复核确认" },
      { id: "shipping_pending", module: "shipping", label: "待发货", code: "SH-01", desc: "复核后待交接待发货" },
      { id: "shipping_wait_order", module: "shipping", label: "待接单", code: "SH-02", desc: "等待骑手或承运方接单" },
      { id: "shipping_redispatch", module: "shipping", label: "重新派单", code: "SH-03", desc: "处理需重新派单的发货任务" },
      { id: "shipping_exception", module: "shipping", label: "物流异常", code: "SH-04", desc: "派送过程异常（如未找到客户）待人工处理" },
      { id: "shipping_accepted", module: "shipping", label: "已接单", code: "SH-05", desc: "配送任务已被接单待取货" },
      { id: "shipping_delivering", module: "shipping", label: "配送中", code: "SH-06", desc: "配送途中，等待送达签收" },
      { id: "shipping_delivered_today", module: "shipping", label: "当日已送达", code: "SH-07", desc: "当日内已完成送达签收" },
      { id: "shipping_tracking", module: "shipping", label: "发货履约跟踪", code: "SH-08", desc: "跟踪履约状态与异常" },
      { id: "inventory_count", module: "inventory", label: "盘点", code: "IV-02", desc: "发起盘点与差异复核" },
      { id: "inventory_in_record", module: "inventory", label: "入库记录", code: "IV-04", desc: "按入库任务回看结果" }
    ];

    const warehouseMap = {
      whA: {
        name: "吉隆坡仓库",
        code: "KL-001",
        short: "A",
        metrics: {
          peak: { todo: 24, done: 13, active: 5, exception: 3, messages: 5 },
          steady: { todo: 14, done: 19, active: 4, exception: 1, messages: 2 },
          night: { todo: 8, done: 7, active: 2, exception: 1, messages: 1 }
        },
        menuCounts: {
          peak: {
            outbound_order: 5,
            outbound_wait_pick: 8,
            outbound_merge: 3,
            transfer_out: 2,
            shipping_pending: 6,
            shipping_redispatch: 1,
            shipping_wait_order: 3,
            shipping_accepted: 5,
            shipping_exception: 4,
            shipping_delivering: 6,
            shipping_delivered_today: 12,
            shipping_tracking: 4,
            inbound_purchase: 7,
            inbound_return: 2,
            inbound_transfer: 3,
            inbound_putaway: 5,
            inventory_query: 18,
            inventory_count: 1,
            inventory_out_record: 11,
            inventory_in_record: 10
          },
          steady: {
            outbound_order: 2,
            outbound_wait_pick: 4,
            outbound_merge: 1,
            transfer_out: 1,
            shipping_pending: 3,
            shipping_redispatch: 1,
            shipping_wait_order: 2,
            shipping_accepted: 4,
            shipping_exception: 3,
            shipping_delivering: 5,
            shipping_delivered_today: 9,
            shipping_tracking: 2,
            inbound_purchase: 4,
            inbound_return: 1,
            inbound_transfer: 2,
            inbound_putaway: 2,
            inventory_query: 12,
            inventory_count: 1,
            inventory_out_record: 8,
            inventory_in_record: 7
          },
          night: {
            outbound_order: 1,
            outbound_wait_pick: 2,
            outbound_merge: 0,
            transfer_out: 1,
            shipping_pending: 1,
            shipping_redispatch: 0,
            shipping_wait_order: 1,
            shipping_accepted: 2,
            shipping_exception: 1,
            shipping_delivering: 2,
            shipping_delivered_today: 4,
            shipping_tracking: 1,
            inbound_purchase: 2,
            inbound_return: 0,
            inbound_transfer: 1,
            inbound_putaway: 1,
            inventory_query: 6,
            inventory_count: 1,
            inventory_out_record: 5,
            inventory_in_record: 4
          }
        },
        notices: {
          peak: [
            { title: "仓库A 待揽货任务集中增加", meta: "09:30 至 10:00 新增 5 笔销售出库单，请优先分派揽货。", side: "出库" },
            { title: "仓库A 采购收货波次已到仓", meta: "建议先完成 2 笔紧急采购收货，避免货位拥堵。", side: "入库" }
          ],
          steady: [
            { title: "仓库A 当前处理平稳", meta: "波次发货已完成一轮，暂无交接超时。", side: "运行" },
            { title: "仓库A 待上架任务可控", meta: "当前仅有 2 笔货物上架待确认。", side: "入库" }
          ],
          night: [
            { title: "仓库A 夜班巡仓中", meta: "建议优先查看盘点差异和待交接任务。", side: "夜班" },
            { title: "仓库A 网络同步正常", meta: "夜班提交成功率 100%，可继续作业。", side: "系统" }
          ]
        }
      },
      whB: {
        name: "槟城仓库",
        code: "PG-002",
        short: "B",
        metrics: {
          peak: { todo: 18, done: 10, active: 4, exception: 2, messages: 3 },
          steady: { todo: 11, done: 16, active: 3, exception: 1, messages: 2 },
          night: { todo: 6, done: 6, active: 2, exception: 0, messages: 1 }
        },
        menuCounts: {
          peak: {
            outbound_order: 4,
            outbound_wait_pick: 5,
            outbound_merge: 2,
            transfer_out: 1,
            shipping_pending: 4,
            shipping_redispatch: 1,
            shipping_wait_order: 2,
            shipping_accepted: 4,
            shipping_exception: 3,
            shipping_delivering: 5,
            shipping_delivered_today: 10,
            shipping_tracking: 3,
            inbound_purchase: 5,
            inbound_return: 1,
            inbound_transfer: 2,
            inbound_putaway: 4,
            inventory_query: 14,
            inventory_count: 1,
            inventory_out_record: 8,
            inventory_in_record: 7
          },
          steady: {
            outbound_order: 2,
            outbound_wait_pick: 3,
            outbound_merge: 1,
            transfer_out: 1,
            shipping_pending: 2,
            shipping_redispatch: 0,
            shipping_wait_order: 1,
            shipping_accepted: 3,
            shipping_exception: 2,
            shipping_delivering: 4,
            shipping_delivered_today: 8,
            shipping_tracking: 2,
            inbound_purchase: 3,
            inbound_return: 1,
            inbound_transfer: 1,
            inbound_putaway: 2,
            inventory_query: 10,
            inventory_count: 1,
            inventory_out_record: 7,
            inventory_in_record: 6
          },
          night: {
            outbound_order: 1,
            outbound_wait_pick: 1,
            outbound_merge: 0,
            transfer_out: 0,
            shipping_pending: 1,
            shipping_redispatch: 0,
            shipping_wait_order: 1,
            shipping_accepted: 1,
            shipping_exception: 1,
            shipping_delivering: 2,
            shipping_delivered_today: 3,
            shipping_tracking: 1,
            inbound_purchase: 1,
            inbound_return: 0,
            inbound_transfer: 1,
            inbound_putaway: 1,
            inventory_query: 5,
            inventory_count: 0,
            inventory_out_record: 4,
            inventory_in_record: 3
          }
        },
        notices: {
          peak: [
            { title: "仓库B 发货履约存在 2 笔延迟", meta: "建议先处理待发货与已揽货未发货任务。", side: "发货" },
            { title: "仓库B 调拨收货待处理", meta: "调拨调入单预计 10:20 到仓，请预留收货人员。", side: "调拨" }
          ],
          steady: [
            { title: "仓库B 当前无严重异常", meta: "仅保留 1 笔退货收货待确认。", side: "运行" },
            { title: "仓库B 库存查询高频", meta: "今日库存查询访问量较高，建议关注热销货位。", side: "库存" }
          ],
          night: [
            { title: "仓库B 夜班任务较少", meta: "当前以出入库记录回看与巡仓确认为主。", side: "夜班" },
            { title: "仓库B 交接完成", meta: "夜班前序发货任务已完成交接。", side: "交接" }
          ]
        }
      },
      whC: {
        name: "其他仓库名称，名称很长很长",
        code: "OT-003",
        short: "C",
        metrics: {
          peak: { todo: 9, done: 5, active: 2, exception: 1, messages: 2 },
          steady: { todo: 6, done: 8, active: 2, exception: 1, messages: 1 },
          night: { todo: 3, done: 4, active: 1, exception: 0, messages: 1 }
        },
        menuCounts: {
          peak: {
            outbound_order: 2,
            outbound_wait_pick: 3,
            outbound_merge: 1,
            transfer_out: 1,
            shipping_pending: 2,
            shipping_redispatch: 0,
            shipping_wait_order: 1,
            shipping_accepted: 2,
            shipping_exception: 2,
            shipping_delivering: 3,
            shipping_delivered_today: 5,
            shipping_tracking: 2,
            inbound_purchase: 2,
            inbound_return: 1,
            inbound_transfer: 1,
            inbound_putaway: 2,
            inventory_query: 9,
            inventory_count: 1,
            inventory_out_record: 5,
            inventory_in_record: 4
          },
          steady: {
            outbound_order: 1,
            outbound_wait_pick: 2,
            outbound_merge: 1,
            transfer_out: 0,
            shipping_pending: 1,
            shipping_redispatch: 0,
            shipping_wait_order: 1,
            shipping_accepted: 2,
            shipping_exception: 1,
            shipping_delivering: 2,
            shipping_delivered_today: 4,
            shipping_tracking: 1,
            inbound_purchase: 2,
            inbound_return: 1,
            inbound_transfer: 1,
            inbound_putaway: 1,
            inventory_query: 7,
            inventory_count: 1,
            inventory_out_record: 4,
            inventory_in_record: 4
          },
          night: {
            outbound_order: 1,
            outbound_wait_pick: 1,
            outbound_merge: 0,
            transfer_out: 0,
            shipping_pending: 1,
            shipping_redispatch: 0,
            shipping_wait_order: 0,
            shipping_accepted: 1,
            shipping_exception: 1,
            shipping_delivering: 1,
            shipping_delivered_today: 2,
            shipping_tracking: 1,
            inbound_purchase: 1,
            inbound_return: 0,
            inbound_transfer: 1,
            inbound_putaway: 1,
            inventory_query: 4,
            inventory_count: 0,
            inventory_out_record: 3,
            inventory_in_record: 2
          }
        },
        notices: {
          peak: [
            { title: "其他仓库存在超长仓库名场景", meta: "用于验证移动端多仓展示与文案截断效果。", side: "原型" },
            { title: "其他仓库待揽收需跟进", meta: "当前有 4 笔待揽收任务需尽快确认。", side: "发货" }
          ],
          steady: [
            { title: "其他仓库运行平稳", meta: "当前主要处理库存查询和入库记录回看。", side: "运行" },
            { title: "其他仓库待采购收货", meta: "建议优先安排 2 笔采购收货任务。", side: "入库" }
          ],
          night: [
            { title: "其他仓库夜班巡仓中", meta: "夜班以库存复核与记录回看为主。", side: "夜班" },
            { title: "其他仓库同步正常", meta: "当前网络与提交状态正常。", side: "系统" }
          ]
        }
      }
    };

    const sceneMap = {
      peak: {
        label: "高峰作业",
        key: "peak",
        todoDesc: "出入库并发高峰，优先清理待揽货与待收货任务",
        exceptionDesc: "库存差异、发货履约异常优先挂红",
        warningMain: "当前有 {count} 条异常待处理",
        warningSub: "其中发货履约与库存差异需优先处理。",
        syncTag: "2 分钟前更新"
      },
      steady: {
        label: "平峰运行",
        key: "steady",
        todoDesc: "波次运行平稳，可按模块顺序处理待办任务",
        exceptionDesc: "仅保留少量待跟进异常，可穿插完成记录回看",
        warningMain: "当前有 {count} 条异常待处理",
        warningSub: "建议仓库管理员在下一次波次前完成闭环。",
        syncTag: "刚刚更新"
      },
      night: {
        label: "夜班巡仓",
        key: "night",
        todoDesc: "夜班以巡仓、盘点复核和收尾任务为主",
        exceptionDesc: "夜班重点关注盘点差异与待交接任务",
        warningMain: "当前有 {count} 条夜班提醒",
        warningSub: "请优先完成交接确认和差异核对。",
        syncTag: "6 分钟前更新"
      }
    };

    const ongoingTaskMap = {
      operator: {
        peak: { type: "发货履约跟踪", no: "SO-WA-20260527-0018", status: "待发货", warehouse: "仓库A", time: "8 分钟前更新" },
        steady: { type: "采购收货", no: "PO-WB-20260527-0006", status: "待收货", warehouse: "仓库B", time: "12 分钟前更新" },
        night: { type: "库存查询复核", no: "IV-WA-20260527-0003", status: "处理中", warehouse: "仓库A", time: "5 分钟前更新" }
      },
      manager: {
        peak: { type: "跨仓作业协调", no: "MG-WAB-20260527-0005", status: "待跟进", warehouse: "仓库A+B", time: "2 分钟前更新" },
        steady: { type: "发货履约巡检", no: "SH-WAB-20260527-0004", status: "处理中", warehouse: "仓库A+B", time: "4 分钟前更新" },
        night: { type: "全仓夜班巡仓", no: "NG-WAB-20260527-0001", status: "巡仓中", warehouse: "仓库A+B", time: "刚刚更新" }
      }
    };


    const localeMap = {
      zh: {
        loginTitle: "欢迎进入 easy 大马生活仓配端",
        loginAccountPlaceholder: "请输入账号",
        loginPasswordPlaceholder: "请输入密码",
        loginButton: "登录",
        loginHelper: "高保真原型默认登录，退出登录后需重新登录",
        loginErrorEmpty: "账号或密码不能为空",
        headerTitle: "工作台",
        userName: "张三",
        avatar: "张",
        navHome: "工作台",
        navMine: "我的",
        mineTitle: "我的",
        mineUserLabel: "仓配账号",
        mineLanguageLabel: "语言",
        mineCountryLabel: "国家",
        mineCountryValue: "马来西亚",
        mineWarehouseLabel: "负责仓库",
        mineWarehouseCount: "共{count}个仓库",
        mineWarehouseHint: "按当前权限展示可作业仓库",
        mineAccountHint: "仓配员工号 {code}",
        mineLogout: "退出登录",
        roles: {
          operator: "仓库作业员",
          manager: "仓库管理员"
        },
        warehouses: {
          whA: "吉隆坡仓库",
          whB: "槟城仓库",
          whC: "其他仓库名称，名称很长很长"
        },
        warehouseSelectorTitle: "选择作业仓库",
        warehouseSelectorTip: "支持多选，数据按已选仓库汇总",
        warehouseSelectorSelectAll: "全选",
        warehouseSelectorDone: "完成",
        warehouseSelectedSuffix: "个仓库",
        modules: {
          outbound: "接单揽货",
          packingReview: "打包复核",
          shipping: "发货",
          inbound: "入库",
          other: "其他"
        },
        metrics: {
          outbound_order: "待接单",
          outbound_wait_pick: "待揽货",
          outbound_merge: "待打包复核",
          shipping_pending: "待发货",
          shipping_redispatch: "重新派单",
          shipping_wait_order: "待接单",
          shipping_accepted: "已接单",
          shipping_exception: "物流异常",
          shipping_delivering: "配送中",
          shipping_delivered_today: "当日已送达",
          shipping_tracking: "发货履约跟踪",
          create_inbound: "新建入库单"
        },
        shortcuts: {
          inventory_in_record: "入库记录",
          inventory_count: "库存盘点",
          order_tracking: "销售订单跟踪",
          shipping_tracking: "物流跟踪",
          create_inbound: "新建入库单",
          inbound_order_list: "入库单"
        },
        quickActions: {}
      },
      en: {
        loginTitle: "Welcome to Easy MY WMS",
        loginAccountPlaceholder: "Enter account",
        loginPasswordPlaceholder: "Enter password",
        loginButton: "Sign In",
        loginHelper: "Prototype opens signed in by default. Sign in again after logging out",
        loginErrorEmpty: "Account and password are required",
        headerTitle: "Dashboard",
        userName: "Zhang San",
        avatar: "ZS",
        navHome: "Dashboard",
        navMine: "My Account",
        mineTitle: "My Account",
        mineUserLabel: "WMS Profile",
        mineLanguageLabel: "Language",
        mineCountryLabel: "Country",
        mineCountryValue: "Malaysia",
        mineWarehouseLabel: "Assigned Warehouses",
        mineWarehouseCount: "{count} warehouses",
        mineWarehouseHint: "Shows warehouses available under current permissions",
        mineAccountHint: "Employee ID {code}",
        mineLogout: "Sign Out",
        roles: {
          operator: "Warehouse Operator",
          manager: "Warehouse Manager"
        },
        warehouses: {
          whA: "Jilongpo Warehouse",
          whB: "Penang Warehouse",
          whC: "Other Warehouse Name With A Very Long Title"
        },
        warehouseSelectorTitle: "Select Warehouses",
        warehouseSelectorTip: "Supports multi-select, cards follow selected warehouses",
        warehouseSelectorSelectAll: "Select All",
        warehouseSelectorDone: "Done",
        warehouseSelectedSuffix: "warehouses",
        modules: {
          outbound: "Order Pickup",
          packingReview: "Pack Review",
          shipping: "Shipping",
          inbound: "Inbound",
          other: "Others"
        },
        metrics: {
          outbound_order: "Pending Orders",
          outbound_wait_pick: "Pending Pickup",
          outbound_merge: "Pending Pack Review",
          shipping_pending: "Pending Shipment",
          shipping_redispatch: "Reschedule",
          shipping_wait_order: "Pending Acceptance",
          shipping_accepted: "Accepted",
          shipping_exception: "Delivery Exception",
          shipping_delivering: "In Transit",
          shipping_delivered_today: "Delivered Today",
          shipping_tracking: "Shipment Tracking",
          create_inbound: "Create Inbound Order"
        },
        shortcuts: {
          inventory_in_record: "Inbound Records",
          inventory_count: "Inventory Counting",
          order_tracking: "Order Tracking",
          shipping_tracking: "Logistics Tracking",
          create_inbound: "Create Inbound Order",
          inbound_order_list: "Inbound Orders"
        },
        quickActions: {}
      }
    };


    function getModuleCount(moduleId, enabledMenus, counts) {
      return menuDefs
        .filter((item) => item.module === moduleId && enabledMenus.includes(item.id))
        .reduce((sum, item) => sum + (counts[item.id] || 0), 0);
    }

    function getCount(counts, id) {
      return counts[id] || 0;
    }

    function metricItem(label, value) {
      return `
        <div class="replica-metric-item">
          <div class="replica-metric-label">${label}</div>
          <div class="replica-metric-value">${value}</div>
        </div>
      `;
    }

    function iconSvg(name) {
      const icons = {
        search: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="5.5"></circle>
            <path d="M16 16l4 4"></path>
          </svg>
        `,
        bell: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"></path>
            <path d="M10 19a2 2 0 004 0"></path>
          </svg>
        `,
        home: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 10.5L12 4l8 6.5"></path>
            <path d="M6.5 9.5V19h11V9.5"></path>
            <path d="M10 19v-5h4v5"></path>
          </svg>
        `,
        user: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="3.5"></circle>
            <path d="M5.5 19a6.5 6.5 0 0113 0"></path>
          </svg>
        `,
        outbound: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7.5h11"></path>
            <path d="M12 4.5l3 3-3 3"></path>
            <path d="M5 12.5v5h14v-10"></path>
          </svg>
        `,
        shipping: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3.5 7.5h10v7h-10z"></path>
            <path d="M13.5 10h3l2 2.5v2h-5z"></path>
            <circle cx="8" cy="18" r="1.5"></circle>
            <circle cx="16.5" cy="18" r="1.5"></circle>
          </svg>
        `,
        inbound: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 16.5h11"></path>
            <path d="M12 19.5l3-3-3-3"></path>
            <path d="M5 6.5v10h14v-10"></path>
          </svg>
        `,
        other: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4.5" y="4.5" width="6" height="6" rx="1.5"></rect>
            <rect x="13.5" y="4.5" width="6" height="6" rx="1.5"></rect>
            <rect x="4.5" y="13.5" width="6" height="6" rx="1.5"></rect>
            <rect x="13.5" y="13.5" width="6" height="6" rx="1.5"></rect>
          </svg>
        `,
        stock: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 8l6-3 6 3-6 3-6-3z"></path>
            <path d="M6 8v8l6 3 6-3V8"></path>
            <path d="M12 11v8"></path>
          </svg>
        `,
        outboundRecord: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 7h10v10H7z"></path>
            <path d="M9 12h6"></path>
            <path d="M12 9l3 3-3 3"></path>
          </svg>
        `,
        inboundRecord: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 7h10v10H7z"></path>
            <path d="M9 12h6"></path>
            <path d="M12 15l-3-3 3-3"></path>
          </svg>
        `,
        tracking: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="7"></circle>
            <path d="M12 8v4l2.5 2.5"></path>
          </svg>
        `,
        count: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 5.5h12"></path>
            <path d="M6 12h12"></path>
            <path d="M6 18.5h12"></path>
            <path d="M9 4v3"></path>
            <path d="M15 11v3"></path>
            <path d="M12 17v3"></path>
          </svg>
        `,
        addOutbound: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 7v10"></path>
            <path d="M7 12h10"></path>
            <path d="M5 5h14v14H5z"></path>
          </svg>
        `,
        addShipping: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 8h10v7H4z"></path>
            <path d="M14 10h3l2 2.5V15h-5z"></path>
            <path d="M12 5v4"></path>
            <path d="M10 7h4"></path>
          </svg>
        `,
        addInbound: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v4"></path>
            <path d="M10 7h4"></path>
            <path d="M5 8h14v11H5z"></path>
            <path d="M12 12v5"></path>
          </svg>
        `,
        eye: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"></path>
            <circle cx="12" cy="12" r="2.5"></circle>
          </svg>
        `,
        eyeOff: `
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3.5 3.5l17 17"></path>
            <path d="M10.5 6.3A9.7 9.7 0 0112 6c6 0 9.5 6 9.5 6a17.6 17.6 0 01-3.2 3.8"></path>
            <path d="M6.7 6.8C4 8.5 2.5 12 2.5 12s3.5 6 9.5 6c1.7 0 3.2-.5 4.5-1.2"></path>
            <path d="M10.6 10.6a2.5 2.5 0 003.1 3.1"></path>
          </svg>
        `
      };
      return icons[name] || "";
    }

    function shortcutItem(iconClass, iconName, label) {
      return `
        <div class="replica-shortcut">
          <div class="replica-shortcut-icon ${iconClass}">${iconSvg(iconName)}</div>
          <div class="replica-shortcut-label">${label}</div>
        </div>
      `;
    }



    window.WMSAppData = {
      allWarehouseIds,
      roleWarehouseMap,
      roleMap,
      profileMap,
      moduleMeta,
      menuDefs,
      warehouseMap,
      sceneMap,
      ongoingTaskMap,
      localeMap
    };

    window.WMSAppHelpers = {
      getModuleCount,
      getCount,
      metricItem,
      iconSvg,
      shortcutItem
    };
})();
