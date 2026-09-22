import { ReactNode } from "react";

type Tone = "success" | "danger" | "warning" | "neutral" | "accent";

const TONE_COLORS: Record<Tone, string> = {
  success: "var(--success)",
  danger: "var(--danger)",
  warning: "var(--warning)",
  neutral: "var(--text-muted)",
  accent: "var(--accent)",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  const color = TONE_COLORS[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.2,
        color,
        background: `${color}22`,
        border: `1px solid ${color}55`,
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
        }}
      />
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  if (status === "ONLINE") return "success";
  if (status === "OFFLINE") return "danger";
  return "neutral";
}

export function roleTone(role: string): Tone {
  if (role === "SUPER_ADMIN" || role === "ORG_ADMIN") return "accent";
  if (role === "MANAGER") return "warning";
  if (role === "OPERATOR") return "success";
  return "neutral";
}
