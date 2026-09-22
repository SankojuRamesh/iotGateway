import { NavLink } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS } from "./navItems";

export function Sidebar() {
  return (
    <nav
      className="app-sidebar"
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "12px 0",
        gap: 4,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: "var(--accent)",
          color: "#0b0c0e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 13,
          marginBottom: 12,
        }}
      >
        IG
      </div>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          title={item.label}
          style={({ isActive }) => ({
            width: 40,
            height: 40,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isActive ? "var(--accent)" : "var(--text-secondary)",
            background: isActive ? "var(--surface-raised)" : "transparent",
            textDecoration: "none",
          })}
        >
          <Icon name={item.icon} />
        </NavLink>
      ))}
    </nav>
  );
}

export function BottomNav() {
  return (
    <nav
      className="app-bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        justifyContent: "space-around",
        padding: "6px 0",
        zIndex: 20,
      }}
    >
      {NAV_ITEMS.slice(0, 5).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          style={({ isActive }) => ({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            fontSize: 10,
            color: isActive ? "var(--accent)" : "var(--text-secondary)",
            textDecoration: "none",
          })}
        >
          <Icon name={item.icon} size={20} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
