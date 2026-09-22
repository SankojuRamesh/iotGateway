import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiErrorMessage } from "@/lib/api";
import { Device, DeviceType, Site } from "@/lib/types";
import { createDevice, updateDevice } from "./api";

export function DeviceFormModal({
  device,
  deviceTypes,
  sites,
  onClose,
  onSaved,
}: {
  device: Device | null;
  deviceTypes: DeviceType[];
  sites: Site[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    device_id: device?.device_id ?? "",
    name: device?.name ?? "",
    device_type: device?.device_type ?? deviceTypes[0]?.id ?? "",
    site: device?.site ?? "",
    location: device?.location ?? "",
    mqtt_topic: device?.mqtt_topic ?? "",
    serial_number: device?.serial_number ?? "",
    firmware_version: device?.firmware_version ?? "",
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
      const payload = { ...form, site: form.site || null };
      if (device) {
        await updateDevice(device.id, payload);
      } else {
        await createDevice(payload);
      }
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={device ? "Edit device" : "Add device"} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <FormField label="Device ID">
              <Input
                required
                placeholder="PUMP001"
                value={form.device_id}
                onChange={(e) => update("device_id", e.target.value)}
              />
            </FormField>
          </div>
          <div style={{ flex: 1 }}>
            <FormField label="Name">
              <Input
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </FormField>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <FormField label="Device type">
              <Select
                required
                value={form.device_type}
                onChange={(e) => update("device_type", e.target.value)}
              >
                {deviceTypes.map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div style={{ flex: 1 }}>
            <FormField label="Site">
              <Select value={form.site} onChange={(e) => update("site", e.target.value)}>
                <option value="">—</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>

        <FormField label="MQTT topic">
          <Input
            required
            placeholder="factory/pump/PUMP001"
            value={form.mqtt_topic}
            onChange={(e) => update("mqtt_topic", e.target.value)}
          />
        </FormField>

        <FormField label="Location">
          <Input value={form.location} onChange={(e) => update("location", e.target.value)} />
        </FormField>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <FormField label="Serial number">
              <Input
                value={form.serial_number}
                onChange={(e) => update("serial_number", e.target.value)}
              />
            </FormField>
          </div>
          <div style={{ flex: 1 }}>
            <FormField label="Firmware version">
              <Input
                value={form.firmware_version}
                onChange={(e) => update("firmware_version", e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
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
