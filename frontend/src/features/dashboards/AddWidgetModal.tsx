import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiErrorMessage } from "@/lib/api";
import { Device, WidgetType } from "@/lib/types";
import { createWidget } from "./api";

const WIDGET_TYPES: { value: WidgetType; label: string; defaultSize: { w: number; h: number } }[] = [
  { value: "line_chart", label: "Line chart", defaultSize: { w: 6, h: 4 } },
  { value: "area_chart", label: "Area chart", defaultSize: { w: 6, h: 4 } },
  { value: "bar_chart", label: "Bar chart", defaultSize: { w: 6, h: 4 } },
  { value: "gauge", label: "Gauge", defaultSize: { w: 3, h: 4 } },
  { value: "stat", label: "Stat card", defaultSize: { w: 3, h: 3 } },
  { value: "table", label: "Table", defaultSize: { w: 5, h: 4 } },
];

const RANGE_OPTIONS = [30, 60, 360, 1440, 10080];

export function AddWidgetModal({
  dashboardId,
  devices,
  onClose,
  onSaved,
}: {
  dashboardId: string;
  devices: Device[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [widgetType, setWidgetType] = useState<WidgetType>("line_chart");
  const [deviceId, setDeviceId] = useState(devices[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [rangeMinutes, setRangeMinutes] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const device = devices.find((d) => d.id === deviceId);
  const metrics = device?.device_type_detail?.metrics ?? [];
  const [metricKey, setMetricKey] = useState(metrics[0]?.key ?? "");

  const availableMetrics = useMemo(() => metrics, [device]);
  const effectiveMetricKey = availableMetrics.some((m) => m.key === metricKey)
    ? metricKey
    : availableMetrics[0]?.key ?? "";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!device || !effectiveMetricKey) {
      setError("Select a device with at least one configured metric.");
      return;
    }
    setSubmitting(true);
    try {
      const spec = WIDGET_TYPES.find((w) => w.value === widgetType)!;
      const metric = availableMetrics.find((m) => m.key === effectiveMetricKey);
      await createWidget({
        dashboard: dashboardId,
        type: widgetType,
        title: title || `${device.name} - ${metric?.display_name ?? effectiveMetricKey}`,
        data_source: {
          device: device.id,
          metric_key: effectiveMetricKey,
          aggregation: metric?.aggregation ?? "last",
          time_range_minutes: rangeMinutes,
        },
        // y: 0 is intentional - react-grid-layout's vertical compaction will
        // push this below existing widgets on render rather than overlapping
        // them (Infinity isn't valid JSON, so it can't be sent as-is).
        grid_position: { x: 0, y: 0, w: spec.defaultSize.w, h: spec.defaultSize.h },
      });
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Add widget" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <FormField label="Plot / card type">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {WIDGET_TYPES.map((wt) => (
              <button
                key={wt.value}
                type="button"
                onClick={() => setWidgetType(wt.value)}
                style={{
                  padding: "10px 8px",
                  borderRadius: 6,
                  border: `1px solid ${widgetType === wt.value ? "var(--accent)" : "var(--border)"}`,
                  background: widgetType === wt.value ? "var(--surface-raised)" : "transparent",
                  color: widgetType === wt.value ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {wt.label}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Device">
          <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.device_id})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Metric">
          <Select value={effectiveMetricKey} onChange={(e) => setMetricKey(e.target.value)}>
            {availableMetrics.length === 0 && <option value="">No metrics configured</option>}
            {availableMetrics.map((m) => (
              <option key={m.key} value={m.key}>
                {m.display_name} ({m.unit || m.data_type})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Title (optional)">
          <Input
            placeholder="Defaults to device + metric name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>

        <FormField label="Time range">
          <Select value={rangeMinutes} onChange={(e) => setRangeMinutes(Number(e.target.value))}>
            {RANGE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} minutes` : m < 1440 ? `${m / 60} hours` : `${m / 1440} days`}
              </option>
            ))}
          </Select>
        </FormField>

        {error && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting || !device}>
            {submitting ? "Adding..." : "Add to dashboard"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
