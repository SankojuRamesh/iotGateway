import { useEffect, useState } from "react";
import { Gauge } from "@/components/ui/Gauge";
import { Panel } from "@/components/ui/Panel";
import { getTelemetryHistory } from "@/features/telemetry/api";
import { MetricChart } from "@/features/telemetry/MetricChart";
import { Device, TelemetryReading, Widget } from "@/lib/types";

const CHART_TYPE: Record<string, "line" | "area" | "bar"> = {
  line_chart: "line",
  area_chart: "area",
  bar_chart: "bar",
};

export function WidgetCard({
  widget,
  device,
  colorIndex,
  onDelete,
}: {
  widget: Widget;
  device: Device | undefined;
  colorIndex: number;
  onDelete: () => void;
}) {
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!device) return;
    setLoading(true);
    const rangeMinutes = widget.data_source.time_range_minutes ?? 60;
    const start = new Date(Date.now() - rangeMinutes * 60_000).toISOString();
    getTelemetryHistory({ device: device.id, metric_key: widget.data_source.metric_key, start })
      .then(setReadings)
      .finally(() => setLoading(false));
  }, [device, widget.data_source.metric_key, widget.data_source.time_range_minutes]);

  const actions = (
    <button
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      title="Remove widget"
      style={{
        background: "none",
        border: "none",
        color: "var(--text-muted)",
        cursor: "pointer",
        fontSize: 15,
        lineHeight: 1,
      }}
    >
      ×
    </button>
  );

  if (!device) {
    return (
      <Panel title={widget.title} actions={actions} style={{ height: "100%" }}>
        <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Device not found</div>
      </Panel>
    );
  }

  const metric = device.device_type_detail?.metrics.find((m) => m.key === widget.data_source.metric_key);
  const latest = readings[0];
  const latestNumeric = typeof latest?.value === "number" ? latest.value : 0;

  return (
    <Panel
      title={widget.title}
      subtitle={`${device.name} · ${metric?.display_name ?? widget.data_source.metric_key}`}
      actions={actions}
      style={{ height: "100%" }}
      bodyStyle={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {loading ? (
        <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</div>
      ) : widget.type === "gauge" ? (
        <Gauge
          value={latestNumeric}
          min={metric?.min_value ?? 0}
          max={metric?.max_value ?? 100}
          unit={metric?.unit}
          size={130}
        />
      ) : widget.type === "stat" ? (
        <div style={{ fontSize: 32, fontWeight: 600, color: "var(--text-primary)" }}>
          {latest ? String(latest.value) : "—"}
          {metric?.unit && (
            <span style={{ fontSize: 15, color: "var(--text-secondary)", marginLeft: 6 }}>{metric.unit}</span>
          )}
        </div>
      ) : widget.type === "table" ? (
        <div style={{ width: "100%", maxHeight: "100%", overflow: "auto", fontSize: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {readings.slice(0, 20).map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "4px 6px", color: "var(--text-secondary)" }}>
                    {new Date(r.recorded_at).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "right" }}>{String(r.value)}</td>
                </tr>
              ))}
              {readings.length === 0 && (
                <tr>
                  <td style={{ padding: "8px", color: "var(--text-muted)" }}>No data yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <MetricChart
          readings={readings}
          type={CHART_TYPE[widget.type] ?? "line"}
          unit={metric?.unit}
          colorIndex={colorIndex}
          height="100%"
        />
      )}
    </Panel>
  );
}
