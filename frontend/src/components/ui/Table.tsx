import { ReactNode } from "react";

export interface Column<T> {
  header: string;
  width?: string;
  render: (row: T) => ReactNode;
}

export function Table<T>({
  columns,
  rows,
  keyFor,
  onRowClick,
  emptyLabel = "No data",
}: {
  columns: Column<T>[];
  rows: T[];
  keyFor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyLabel?: string;
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.header}
              style={{
                textAlign: "left",
                padding: "8px 10px",
                borderBottom: "1px solid var(--border)",
                color: "var(--text-secondary)",
                fontWeight: 500,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                width: col.width,
              }}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td
              colSpan={columns.length}
              style={{ padding: "24px 10px", textAlign: "center", color: "var(--text-muted)" }}
            >
              {emptyLabel}
            </td>
          </tr>
        )}
        {rows.map((row) => (
          <tr
            key={keyFor(row)}
            onClick={() => onRowClick?.(row)}
            style={{
              cursor: onRowClick ? "pointer" : "default",
              borderBottom: "1px solid var(--border)",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-raised)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {columns.map((col) => (
              <td key={col.header} style={{ padding: "9px 10px" }}>
                {col.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
