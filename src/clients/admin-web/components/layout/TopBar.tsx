import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronRight, Expand, Globe, HelpCircle, Menu, MoreHorizontal, Settings, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { findBreadcrumbByPath } from "@/clients/admin-web/config/menu";

export default function TopBar(props: { onToggleSidebar: () => void }) {
  const { pathname } = useLocation();
  const bc = findBreadcrumbByPath(pathname);

  return (
    <header className="sticky top-0 z-30 border-b bg-white">
      <div className="flex h-14 items-center gap-3 px-4">
        <button
          type="button"
          onClick={props.onToggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-zinc-700 hover:bg-zinc-50"
          aria-label="菜单"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex flex-1 items-center gap-2 text-sm text-zinc-600">
          <Link to="/" className="text-zinc-500 hover:text-zinc-900">
            三
          </Link>
          <ChevronRight className="h-4 w-4 text-zinc-400" />
          {bc.parent ? (
            <>
              <span className="text-zinc-500">{bc.parent.label}</span>
              <ChevronRight className="h-4 w-4 text-zinc-400" />
              <span className="font-medium text-zinc-900">{bc.item?.label ?? ""}</span>
            </>
          ) : bc.item ? (
            <span className="font-medium text-zinc-900">{bc.item.label}</span>
          ) : (
            <span className="font-medium text-zinc-900">车辆排单日历</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-zinc-600">
          <button
            type="button"
            className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-50")}
            aria-label="通知"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm hover:bg-zinc-50"
            aria-label="语言"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">简体中文</span>
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm hover:bg-zinc-50"
            aria-label="用户"
          >
            <UserCircle2 className="h-5 w-5" />
            <span className="hidden sm:inline">cherryo</span>
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-50"
            aria-label="更多"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-50"
            aria-label="全屏"
          >
            <Expand className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-50"
            aria-label="设置"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-50"
            aria-label="帮助"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

