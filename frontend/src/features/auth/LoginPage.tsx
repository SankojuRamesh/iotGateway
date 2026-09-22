import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { AuthLayout } from "./AuthLayout";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: string })?.from ?? "/";
      navigate(from, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="IoT Monitoring &amp; Analytics Platform">
      <form onSubmit={onSubmit}>
        <FormField label="Email">
          <Input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
        <FormField label="Password">
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}
        <Button type="submit" variant="primary" style={{ width: "100%" }} disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
        <Link to="/register">Create an organization</Link>
        <Link to="/password-reset">Forgot password?</Link>
      </div>
    </AuthLayout>
  );
}
