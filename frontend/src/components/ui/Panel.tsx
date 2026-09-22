import { ReactNode } from "react";

interface PanelProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  noPadding?: boolean;
}

/** The bordered panel-card primitive: title bar + body, modeled directly on
 * the Grafana dashboard reference screenshot's panel chrome. Every widget
 * and content block in the app sits inside one of these. */
export function Panel({
  title,
  subtitle,
  actions,
  children,
  style,
  bodyStyle,
  noPadding,
}: PanelProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        ...style,
      }}
    >
      {title && (
        <div
          className="widget-drag-handle"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{subtitle}</div>
            )}
          </div>
          {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
        </div>
      )}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: noPadding ? 0 : 12,
          ...bodyStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
