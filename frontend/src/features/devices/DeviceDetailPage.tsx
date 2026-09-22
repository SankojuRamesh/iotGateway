import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/app/AppShell";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Gauge } from "@/components/ui/Gauge";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Input";
import { apiErrorMessage } from "@/lib/api";
import { useTelemetrySocket } from "@/lib/useTelemetrySocket";
import { Device, MetricDefinition, TelemetryReading } from "@/lib/types";
import { getDevice } from "./api";
import { getTelemetryHistory } from "@/features/telemetry/api";
import { MetricChart } from "@/features/telemetry/MetricChart";

const RANGE_OPTIONS = [
  { label: "Last 30 minutes", minutes: 30 },
  { label: "Last hour", minutes: 60 },
  { label: "Last 6 hours", minutes: 360 },
  { label: "Last 24 hours", minutes: 1440 },
  { label: "Last 7 days", minutes: 10080 },
];

export function DeviceDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rangeMinutes, setRangeMinutes] = useState(60);
  const [selectedMetric, setSelectedMetric] = useState<string>("");
  const [history, setHistory] = useState<TelemetryReading[]>([]);
  const [latestByMetric, setLatestByMetric] = useState<Record<string, number>>({});

  const { lastMessage, connected } = useTelemetrySocket(device?.id ?? null);

  useEffect(() => {
    if (!deviceId) return;
    getDevice(deviceId)
      .then((d) => {
        setDevice(d);
        const firstNumeric = d.device_type_detail?.metrics.find((m) =>
          ["integer", "float"].includes(m.data_type),
        );
        setSelectedMetric(firstNumeric?.key ?? d.device_type_detail?.metrics[0]?.key ?? "");
      })
      .catch((err) => setError(apiErrorMessage(err)));
  }, [deviceId]);

  useEffect(() => {
    if (!device || !selectedMetric) return;
    const start = new Date(Date.now() - rangeMinutes * 60_000).toISOString();
    getTelemetryHistory({ device: device.id, metric_key: selectedMetric, start })
      .then(setHistory)
      .catch((err) => setError(apiErrorMessage(err)));
  }, [device, selectedMetric, rangeMinutes]);

  useEffect(() => {
    if (!lastMessage) return;
    setLatestByMetric((prev) => {
      const next = { ...prev };
      for (const r of lastMessage.readings) {
        if (typeof r.value === "number") next[r.metric_key] = r.value;
      }
      return next;
    });
    if (device) {
      setDevice({ ...device, status: lastMessage.status as Device["status"] });
    }
    if (lastMessage.readings.some((r) => r.metric_key === selectedMetric)) {
      setHistory((prev) => [
        ...prev,
        ...lastMessage.readings
          .filter((r) => r.metric_key === selectedMetric)
          .map((r, i) => ({
            id: Date.now() + i,
            device: lastMessage.device_id,
            metric_key: r.metric_key,
            value: r.value,
            recorded_at: r.recorded_at,
          })),
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  if (error) {
    return (
      <AppShell breadcrumb={["Devices", "Error"]}>
        <Panel title="Error">{error}</Panel>
      </AppShell>
    );
  }

  if (!device) {
    return (
      <AppShell breadcrumb={["Devices", "..."]}>
        <Panel title="Loading device...">&nbsp;</Panel>
      </AppShell>
    );
  }

  const metrics: MetricDefinition[] = device.device_type_detail?.metrics ?? [];
  const numericMetrics = metrics.filter((m) => ["integer", "float"].includes(m.data_type));

  return (
    <AppShell breadcrumb={["Devices", device.name]}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Panel
          title={device.name}
          subtitle={`${device.device_id} · ${device.device_type_detail?.name ?? ""}`}
          actions={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Badge tone={connected ? "success" : "neutral"}>
                {connected ? "Live" : "Connecting"}
              </Badge>
              <Badge tone={statusTone(device.status)}>{device.status}</Badge>
              <Button variant="ghost" onClick={() => navigate("/devices")}>
                Back
              </Button>
            </div>
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, fontSize: 12 }}>
            <InfoRow label="MQTT topic" value={device.mqtt_topic} mono />
            <InfoRow label="Location" value={device.location || "—"} />
            <InfoRow label="Site" value={device.site_name || "—"} />
            <InfoRow label="Serial number" value={device.serial_number || "—"} />
            <InfoRow label="Firmware" value={device.firmware_version || "—"} />
            <InfoRow
              label="Last seen"
              value={device.last_seen ? new Date(device.last_seen).toLocaleString() : "Never"}
            />
          </div>
        </Panel>

        {numericMetrics.length > 0 && (
          <div className="widget-grid">
            {numericMetrics.map((m) => (
              <div key={m.key} style={{ gridColumn: "span 3" }}>
                <Panel title={m.display_name}>
                  <Gauge
                    value={latestByMetric[m.key] ?? 0}
                    min={m.min_value ?? 0}
                    max={m.max_value ?? 100}
                    unit={m.unit}
                    size={130}
                  />
                </Panel>
              </div>
            ))}
          </div>
        )}

        <Panel
          title="Telemetry history"
          actions={
            <div style={{ display: "flex", gap: 8 }}>
              <Select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
                {metrics.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.display_name}
                  </option>
                ))}
              </Select>
              <Select
                value={rangeMinutes}
                onChange={(e) => setRangeMinutes(Number(e.target.value))}
              >
                {RANGE_OPTIONS.map((r) => (
                  <option key={r.minutes} value={r.minutes}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>
          }
        >
          <MetricChart
            readings={history}
            unit={metrics.find((m) => m.key === selectedMetric)?.unit}
          />
        </Panel>
      </div>
    </AppShell>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: mono ? "monospace" : undefined }}>{value}</div>
    </div>
  );
}
