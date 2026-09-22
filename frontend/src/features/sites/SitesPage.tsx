import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/app/AppShell";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Panel } from "@/components/ui/Panel";
import { Column, Table } from "@/components/ui/Table";
import { apiErrorMessage } from "@/lib/api";
import { Site } from "@/lib/types";
import { createSite, listSites } from "@/features/devices/api";

export function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  async function load() {
    setLoading(true);
    setSites(await listSites());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const columns: Column<Site>[] = [
    { header: "Name", render: (s) => s.name },
    { header: "Address", render: (s) => s.address || "—" },
    { header: "Timezone", render: (s) => s.timezone },
    { header: "Coordinates", render: (s) => (s.latitude && s.longitude ? `${s.latitude}, ${s.longitude}` : "—") },
  ];

  return (
    <AppShell breadcrumb={["Sites"]}>
      <Panel
        title="Sites"
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            + Add site
          </Button>
        }
      >
        <Table columns={columns} rows={sites} keyFor={(s) => s.id} emptyLabel={loading ? "Loading..." : "No sites yet"} />
      </Panel>

      {createOpen && (
        <CreateSiteModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />
      )}
    </AppShell>
  );
}

function CreateSiteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", address: "", timezone: "UTC" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createSite(form);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Add site" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <FormField label="Name">
          <Input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <FormField label="Address">
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </FormField>
        <FormField label="Timezone">
          <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
        </FormField>
        {error && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
