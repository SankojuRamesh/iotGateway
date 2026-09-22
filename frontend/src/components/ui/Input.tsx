import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, forwardRef } from "react";

const fieldBase: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  color: "var(--text-primary)",
  outline: "none",
};

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ style, ...rest }, ref) => (
    <input
      ref={ref}
      style={{ ...fieldBase, ...style }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      {...rest}
    />
  ),
);
Input.displayName = "Input";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ style, children, ...rest }, ref) => (
  <select ref={ref} style={{ ...fieldBase, ...style }} {...rest}>
    {children}
  </select>
));
Select.displayName = "Select";

export function FormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 5 }}>
        {label}
      </div>
      {children}
      {error && (
        <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 4 }}>{error}</div>
      )}
    </label>
  );
}
