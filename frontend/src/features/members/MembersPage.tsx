import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/app/AppShell";
import { Badge, roleTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Panel } from "@/components/ui/Panel";
import { Column, Table } from "@/components/ui/Table";
import { api, apiErrorMessage } from "@/lib/api";
import { Membership, Role } from "@/lib/types";

const ROLES: Role[] = ["ORG_ADMIN", "MANAGER", "OPERATOR", "VIEWER"];

export function MembersPage() {
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  async function load() {
    setLoading(true);
    const response = await api.get("/auth/members/", { params: { page_size: 200 } });
    setMembers(response.data.results);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const columns: Column<Membership>[] = [
    { header: "Email", render: (m) => m.user_email ?? "—" },
    { header: "Role", render: (m) => <Badge tone={roleTone(m.role)}>{m.role}</Badge> },
    { header: "Since", render: (m) => new Date(m.created_at).toLocaleDateString() },
  ];

  return (
    <AppShell breadcrumb={["Members"]}>
      <Panel
        title="Members"
        actions={
          <Button variant="primary" onClick={() => setInviteOpen(true)}>
            + Invite member
          </Button>
        }
      >
        <Table columns={columns} rows={members} keyFor={(m) => m.id} emptyLabel={loading ? "Loading..." : "No members yet"} />
      </Panel>

      {inviteOpen && (
        <InviteMemberModal onClose={() => setInviteOpen(false)} onSaved={() => { setInviteOpen(false); load(); }} />
      )}
    </AppShell>
  );
}

function InviteMemberModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ email: "", role: "VIEWER" as Role, temporary_password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/invite/", form);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Invite member" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <FormField label="Email">
          <Input
            type="email"
            required
            autoFocus
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </FormField>
        <FormField label="Role">
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Temporary password">
          <Input
            type="text"
            required
            minLength={8}
            value={form.temporary_password}
            onChange={(e) => setForm({ ...form, temporary_password: e.target.value })}
          />
        </FormField>
        {error && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Inviting..." : "Invite"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
