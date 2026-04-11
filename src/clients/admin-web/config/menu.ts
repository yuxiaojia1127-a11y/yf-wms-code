import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Car,
  ClipboardList,
  FileSignature,
  Package,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Table,
  Users,
  Wrench,
  MenuSquare,
} from "lucide-react";

export type MenuItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  children?: MenuItem[];
};

export const menuItems: MenuItem[] = [
  {
    key: "product",
    label: "商品管理",
    icon: ShoppingBag,
    children: [
      { key: "product_models", label: "车型产品管理", icon: Car, path: "/product/models" },
      { key: "product_addons", label: "附加产品管理", icon: Package, path: "/product/addons" },
      { key: "product_packages", label: "套餐产品管理", icon: Package, path: "/product/packages" },
      { key: "product_insurance", label: "保险管理", icon: ShieldCheck, path: "/product/insurance" },
    ],
  },
  {
    key: "order",
    label: "订单管理",
    icon: ClipboardList,
    children: [
      { key: "order_manage", label: "订单管理", icon: ClipboardList, path: "/order/manage" },
      { key: "order_pick_return", label: "车辆取还日历", icon: CalendarDays, path: "/order/pick-return" },
    ],
  },
  {
    key: "dispatch",
    label: "车辆调度",
    icon: CalendarDays,
    children: [
      { key: "dispatch_schedule", label: "车辆排单日历", icon: CalendarDays, path: "/dispatch/schedule" },
      { key: "dispatch_revenue_calendar", label: "收益管理日历", icon: CalendarDays, path: "/dispatch/revenue-calendar" },
    ],
  },
  {
    key: "driver",
    label: "司机管理",
    icon: Users,
    children: [
      { key: "driver_profile", label: "司机信息", icon: Users, path: "/driver/profile" },
      { key: "driver_vehicle", label: "车辆信息", icon: Car, path: "/driver/vehicle" },
      { key: "driver_contract", label: "合同管理", icon: FileSignature, path: "/driver/contract" },
      { key: "driver_alert", label: "自动报警提醒", icon: Bell, path: "/driver/alert" },
    ],
  },
  {
    key: "analytics",
    label: "数据分析",
    icon: BarChart3,
    children: [
      { key: "analytics_detail", label: "数据详情", icon: Table, path: "/analytics/detail" },
      { key: "analytics_profit", label: "利润核算表", icon: Table, path: "/analytics/profit" },
    ],
  },
  {
    key: "system",
    label: "系统管理",
    icon: Wrench,
    children: [
      { key: "system_users", label: "用户管理", icon: Users, path: "/system/users" },
      { key: "system_roles", label: "角色管理", icon: Shield, path: "/system/roles" },
      { key: "system_menus", label: "菜单管理", icon: MenuSquare, path: "/system/menus" },
      { key: "system_logs", label: "操作日志", icon: ClipboardList, path: "/system/logs" },
    ],
  },
];

export function findBreadcrumbByPath(pathname: string): { parent?: MenuItem; item?: MenuItem } {
  for (const parent of menuItems) {
    if (parent.path && parent.path === pathname) return { item: parent };
    if (parent.children) {
      for (const child of parent.children) {
        if (child.path === pathname) return { parent, item: child };
      }
    }
  }
  return {};
}
