import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/app/AppShell";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Panel } from "@/components/ui/Panel";
import { Column, Table } from "@/components/ui/Table";
import { apiErrorMessage } from "@/lib/api";
import { DeviceType } from "@/lib/types";
import { createDeviceType, listDeviceTypes } from "./api";
import { MetricEditorModal } from "./MetricEditorModal";

export function DeviceTypesPage() {
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingMetrics, setEditingMetrics] = useState<DeviceType | null>(null);

  async function load() {
    setLoading(true);
    setTypes(await listDeviceTypes());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const columns: Column<DeviceType>[] = [
    { header: "Name", render: (t) => t.name },
    { header: "Description", render: (t) => t.description || "—" },
    {
      header: "Metrics",
      render: (t) => (t.metrics.length ? t.metrics.map((m) => m.key).join(", ") : "—"),
    },
    {
      header: "",
      render: (t) => (
        <Button variant="ghost" onClick={() => setEditingMetrics(t)}>
          Edit metrics
        </Button>
      ),
    },
  ];

  return (
    <AppShell breadcrumb={["Device Types"]}>
      <Panel
        title="Device Types"
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            + Add device type
          </Button>
        }
      >
        <Table
          columns={columns}
          rows={types}
          keyFor={(t) => t.id}
          emptyLabel={loading ? "Loading..." : "No device types yet"}
        />
      </Panel>

      {createOpen && (
        <CreateDeviceTypeModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />
      )}
      {editingMetrics && (
        <MetricEditorModal
          deviceType={editingMetrics}
          onClose={() => setEditingMetrics(null)}
          onSaved={() => {
            setEditingMetrics(null);
            load();
          }}
        />
      )}
    </AppShell>
  );
}

function CreateDeviceTypeModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createDeviceType({ name, description });
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Add device type" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <FormField label="Name">
          <Input required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Description">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
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
