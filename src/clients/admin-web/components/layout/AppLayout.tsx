import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/clients/admin-web/components/layout/Sidebar";
import TopBar from "@/clients/admin-web/components/layout/TopBar";

const storageKey = "app_sidebar_collapsed_v1";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem(storageKey);
    setCollapsed(v === "1");
  }, []);

  function toggle() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(storageKey, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="flex h-screen w-full bg-zinc-50">
      <Sidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onToggleSidebar={toggle} />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

