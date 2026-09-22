import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import { api, apiErrorMessage } from "@/lib/api";
import { AuthLayout } from "./AuthLayout";

export function PasswordResetRequestPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/password-reset/", { email });
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Reset password" subtitle="We'll email you a reset link.">
      {sent ? (
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          If that email exists, a reset link has been sent.
        </div>
      ) : (
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
          {error && (
            <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 12 }}>{error}</div>
          )}
          <Button type="submit" variant="primary" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
      <div style={{ marginTop: 16, fontSize: 12 }}>
        <Link to="/login">Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}

export function PasswordResetConfirmPage() {
  const [params] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/password-reset/confirm/", {
        uid: params.get("uid"),
        token: params.get("token"),
        new_password: newPassword,
      });
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Set a new password">
      {done ? (
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Password updated. <Link to="/login">Sign in</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <FormField label="New password">
            <Input
              type="password"
              required
              minLength={8}
              autoFocus
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </FormField>
          {error && (
            <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 12 }}>{error}</div>
          )}
          <Button type="submit" variant="primary" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Saving..." : "Save new password"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
