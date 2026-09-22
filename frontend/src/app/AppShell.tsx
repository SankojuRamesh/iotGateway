import { ReactNode } from "react";
import { BottomNav, Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({
  breadcrumb,
  children,
}: {
  breadcrumb: string[];
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar breadcrumb={breadcrumb} />
        <div className="app-content">{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
