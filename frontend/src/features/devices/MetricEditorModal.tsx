import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiErrorMessage } from "@/lib/api";
import { DataType, DeviceType, Aggregation } from "@/lib/types";
import { setDeviceTypeMetrics } from "./api";

interface MetricRow {
  key: string;
  display_name: string;
  data_type: DataType;
  unit: string;
  min_value: string;
  max_value: string;
  aggregation: Aggregation;
}

const DATA_TYPES: DataType[] = ["integer", "float", "boolean", "string", "datetime"];
const AGGREGATIONS: Aggregation[] = [
  "raw",
  "min",
  "max",
  "average",
  "sum",
  "count",
  "last",
  "first",
];

function toRow(m: DeviceType["metrics"][number]): MetricRow {
  return {
    key: m.key,
    display_name: m.display_name,
    data_type: m.data_type,
    unit: m.unit,
    min_value: m.min_value?.toString() ?? "",
    max_value: m.max_value?.toString() ?? "",
    aggregation: m.aggregation,
  };
}

export function MetricEditorModal({
  deviceType,
  onClose,
  onSaved,
}: {
  deviceType: DeviceType;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<MetricRow[]>(deviceType.metrics.map(toRow));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addRow() {
    setRows((r) => [
      ...r,
      { key: "", display_name: "", data_type: "float", unit: "", min_value: "", max_value: "", aggregation: "last" },
    ]);
  }

  function updateRow(i: number, patch: Partial<MetricRow>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  async function save() {
    setError(null);
    setSubmitting(true);
    try {
      await setDeviceTypeMetrics(
        deviceType.id,
        rows.map((r, order) => ({
          key: r.key,
          display_name: r.display_name,
          data_type: r.data_type,
          unit: r.unit,
          min_value: r.min_value === "" ? null : Number(r.min_value),
          max_value: r.max_value === "" ? null : Number(r.max_value),
          aggregation: r.aggregation,
          order,
        })),
      );
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Metrics for ${deviceType.name}`} onClose={onClose} width={760}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 100px 70px 70px 70px 110px 28px",
              gap: 6,
              alignItems: "center",
            }}
          >
            <Input
              placeholder="key (snake_case)"
              value={row.key}
              onChange={(e) => updateRow(i, { key: e.target.value })}
            />
            <Input
              placeholder="Display name"
              value={row.display_name}
              onChange={(e) => updateRow(i, { display_name: e.target.value })}
            />
            <Select value={row.data_type} onChange={(e) => updateRow(i, { data_type: e.target.value as DataType })}>
              {DATA_TYPES.map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </Select>
            <Input placeholder="unit" value={row.unit} onChange={(e) => updateRow(i, { unit: e.target.value })} />
            <Input
              placeholder="min"
              type="number"
              value={row.min_value}
              onChange={(e) => updateRow(i, { min_value: e.target.value })}
            />
            <Input
              placeholder="max"
              type="number"
              value={row.max_value}
              onChange={(e) => updateRow(i, { max_value: e.target.value })}
            />
            <Select
              value={row.aggregation}
              onChange={(e) => updateRow(i, { aggregation: e.target.value as Aggregation })}
            >
              {AGGREGATIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
            <button
              onClick={() => removeRow(i)}
              style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}
            >
              ×
            </button>
          </div>
        ))}
        <Button variant="secondary" onClick={addRow} style={{ alignSelf: "flex-start" }}>
          + Add metric
        </Button>

        {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={submitting} onClick={save}>
            {submitting ? "Saving..." : "Save metrics"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
