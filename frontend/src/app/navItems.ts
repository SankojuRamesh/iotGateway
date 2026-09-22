export interface NavItem {
  to: string;
  label: string;
  icon: "grid" | "cpu" | "layers" | "map-pin" | "bell" | "file-text" | "users" | "activity";
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Overview", icon: "grid" },
  { to: "/dashboards", label: "Dashboards", icon: "activity" },
  { to: "/devices", label: "Devices", icon: "cpu" },
  { to: "/device-types", label: "Device Types", icon: "layers" },
  { to: "/sites", label: "Sites", icon: "map-pin" },
  { to: "/alerts", label: "Alerts", icon: "bell" },
  { to: "/reports", label: "Reports", icon: "file-text" },
  { to: "/members", label: "Members", icon: "users" },
];
