import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { AuthLayout } from "./AuthLayout";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    organization_name: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your organization" subtitle="You'll be the first Org Admin.">
      <form onSubmit={onSubmit}>
        <FormField label="Organization name">
          <Input
            required
            autoFocus
            value={form.organization_name}
            onChange={(e) => update("organization_name", e.target.value)}
          />
        </FormField>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <FormField label="First name">
              <Input
                value={form.first_name}
                onChange={(e) => update("first_name", e.target.value)}
              />
            </FormField>
          </div>
          <div style={{ flex: 1 }}>
            <FormField label="Last name">
              <Input
                value={form.last_name}
                onChange={(e) => update("last_name", e.target.value)}
              />
            </FormField>
          </div>
        </div>
        <FormField label="Email">
          <Input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </FormField>
        <FormField label="Password">
          <Input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
        </FormField>
        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}
        <Button type="submit" variant="primary" style={{ width: "100%" }} disabled={submitting}>
          {submitting ? "Creating..." : "Create organization"}
        </Button>
      </form>
      <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-secondary)" }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </div>
    </AuthLayout>
  );
}
