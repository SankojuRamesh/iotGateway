import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "var(--accent)",
    color: "#0b0c0e",
    border: "1px solid var(--accent)",
  },
  secondary: {
    background: "var(--surface-raised)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
  },
  danger: {
    background: "var(--danger)",
    color: "#0b0c0e",
    border: "1px solid var(--danger)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent",
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", style, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      style={{
        padding: "7px 14px",
        borderRadius: 4,
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "filter 0.1s ease",
        ...VARIANT_STYLES[variant],
        ...style,
      }}
      onMouseOver={(e) => !disabled && (e.currentTarget.style.filter = "brightness(1.12)")}
      onMouseOut={(e) => (e.currentTarget.style.filter = "none")}
      {...rest}
    />
  ),
);
Button.displayName = "Button";
