import { ReactNode } from "react";
import { Panel } from "./Panel";

export function StatCard({
  title,
  value,
  unit,
  color = "var(--accent)",
  sparkline,
}: {
  title: string;
  value: string | number;
  unit?: string;
  color?: string;
  sparkline?: ReactNode;
}) {
  return (
    <Panel title={title}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ fontSize: 28, fontWeight: 600, color }}>
          {value}
          {unit && (
            <span style={{ fontSize: 14, color: "var(--text-secondary)", marginLeft: 4 }}>
              {unit}
            </span>
          )}
        </div>
      </div>
      {sparkline && <div style={{ marginTop: 6 }}>{sparkline}</div>}
    </Panel>
  );
}
