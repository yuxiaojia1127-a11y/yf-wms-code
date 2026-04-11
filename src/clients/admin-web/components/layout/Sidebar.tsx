import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { CarFront, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { menuItems } from "@/clients/admin-web/config/menu";
import type { MenuItem } from "@/clients/admin-web/config/menu";

function isPathActive(current: string, itemPath?: string) {
  if (!itemPath) return false;
  if (itemPath === "/") return current === "/";
  return current === itemPath;
}

export default function Sidebar(props: { collapsed: boolean }) {
  const { pathname } = useLocation();

  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const filteredMenu = useMemo((): MenuItem[] => {
    if (!query) return menuItems;

    const out: MenuItem[] = [];
    for (const parent of menuItems) {
      const parentMatch = parent.label.toLowerCase().includes(query);
      if (!parent.children?.length) {
        if (parentMatch) out.push(parent);
        continue;
      }
      const matchedChildren = parent.children.filter((c) => c.label.toLowerCase().includes(query));
      if (parentMatch) {
        out.push(parent);
        continue;
      }
      if (matchedChildren.length > 0) out.push({ ...parent, children: matchedChildren });
    }
    return out;
  }, [query]);

  const defaultExpanded = useMemo(() => {
    const expanded: Record<string, boolean> = {};
    for (const m of menuItems) {
      if (!m.children) continue;
      expanded[m.key] = m.children.some((c) => c.path === pathname);
    }
    return expanded;
  }, [pathname]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(defaultExpanded);

  useEffect(() => {
    if (query) return;
    setExpanded(() => {
      const next: Record<string, boolean> = {};
      for (const m of menuItems) {
        if (!m.children?.length) continue;
        next[m.key] = m.children.some((c) => c.path === pathname);
      }
      return next;
    });
  }, [pathname, query]);

  function toggleParent(key: string) {
    setExpanded((prev) => {
      const nextOpen = !(prev[key] ?? false);
      const next: Record<string, boolean> = {};
      for (const m of menuItems) {
        if (!m.children?.length) continue;
        next[m.key] = false;
      }
      next[key] = nextOpen;
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-white text-zinc-800",
        props.collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <div className={cn("flex h-14 items-center gap-3 px-4", props.collapsed ? "justify-center" : "")}>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900">
          <CarFront className="h-5 w-5 text-white" />
        </div>
        {props.collapsed ? null : <div className="text-sm font-semibold tracking-wide text-zinc-900">Trippal</div>}
      </div>

      {props.collapsed ? null : (
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索菜单"
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-300"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        <div className="space-y-1">
          {filteredMenu.map((m) => {
            const hasChildren = Boolean(m.children?.length);
            const parentActive = isPathActive(pathname, m.path) || Boolean(m.children?.some((c) => c.path === pathname));
            const Icon = m.icon;

            if (!hasChildren && m.path) {
              return (
                <NavLink
                  key={m.key}
                  to={m.path}
                  className={({ isActive }) =>
                    cn(
                      "flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-zinc-700 hover:bg-zinc-50",
                      isActive ? "bg-zinc-100 text-zinc-900" : "",
                      props.collapsed ? "justify-center px-0" : "",
                    )
                  }
                  title={props.collapsed ? m.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                  {props.collapsed ? null : <span className="truncate">{m.label}</span>}
                </NavLink>
              );
            }

            return (
              <div key={m.key} className="rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    if (query) return;
                    toggleParent(m.key);
                  }}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-zinc-700 hover:bg-zinc-50",
                    parentActive ? "bg-zinc-100 text-zinc-900" : "",
                    props.collapsed ? "justify-center px-0" : "",
                  )}
                  title={props.collapsed ? m.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                  {props.collapsed ? null : (
                    <>
                      <span className="flex-1 truncate">{m.label}</span>
                      <ChevronDown
                        className={cn("h-4 w-4 transition-transform", (query ? true : expanded[m.key]) ? "rotate-180" : "rotate-0")}
                      />
                    </>
                  )}
                </button>

                {props.collapsed ? null : (query ? true : expanded[m.key]) ? (
                  <div className="mt-1 space-y-1 pl-2">
                    {(m.children ?? []).map((c) => {
                      const ChildIcon = c.icon;
                      return (
                        <NavLink
                          key={c.key}
                          to={c.path ?? "#"}
                          className={({ isActive }) =>
                            cn(
                              "flex h-9 items-center gap-3 rounded-lg px-3 text-sm text-zinc-700 hover:bg-zinc-50",
                              isActive ? "bg-zinc-100 text-zinc-900" : "",
                            )
                          }
                        >
                          <ChildIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                          <span className="truncate">{c.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </nav>

      <div className={cn("px-4 py-3 text-xs text-zinc-400", props.collapsed ? "text-center" : "")}>v2.0</div>
    </aside>
  );
}
