import { ReactNode } from "react";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 28,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "var(--accent)",
            color: "#0b0c0e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          IG
        </div>
        <h1 style={{ fontSize: 18, margin: "0 0 4px" }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" }}>
            {subtitle}
          </p>
        )}
        {!subtitle && <div style={{ marginBottom: 16 }} />}
        {children}
      </div>
    </div>
  );
}
