import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/features/auth/AuthContext";

export function Topbar({ breadcrumb }: { breadcrumb: string[] }) {
  const { user, logout, switchOrganization } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      style={{
        height: 48,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "var(--text-secondary)",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Link to="/" style={{ color: "var(--text-secondary)" }}>
          Home
        </Link>
        {breadcrumb.map((crumb, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="chevron-right" size={12} />
            <span
              style={{
                color: i === breadcrumb.length - 1 ? "var(--text-primary)" : "var(--text-secondary)",
                whiteSpace: "nowrap",
              }}
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "5px 10px",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "var(--accent)",
              color: "#0b0c0e",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {user?.email?.[0]?.toUpperCase() ?? "?"}
          </span>
          <span style={{ fontSize: 12 }}>
            {user?.active_organization?.name ?? "No organization"}
          </span>
        </button>

        {menuOpen && (
          <div
            onMouseLeave={() => setMenuOpen(false)}
            style={{
              position: "absolute",
              right: 0,
              top: 40,
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              minWidth: 220,
              zIndex: 30,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--text-primary)" }}>{user?.email}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user?.full_name}</div>
            </div>
            {user && user.memberships.length > 1 && (
              <div style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    padding: "2px 12px",
                    textTransform: "uppercase",
                  }}
                >
                  Switch organization
                </div>
                {user.memberships.map((m) => (
                  <button
                    key={m.id}
                    onClick={async () => {
                      await switchOrganization(m.organization.id);
                      setMenuOpen(false);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "6px 12px",
                      background: "transparent",
                      border: "none",
                      color:
                        m.organization.id === user.active_organization?.id
                          ? "var(--accent)"
                          : "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {m.organization.name}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "10px 12px",
                background: "transparent",
                border: "none",
                color: "var(--danger)",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              <Icon name="log-out" size={14} />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
