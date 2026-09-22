import { useEffect, useState } from "react";
import { AppShell } from "@/app/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { Column, Table } from "@/components/ui/Table";
import { api } from "@/lib/api";

interface AlertRule {
  id: string;
  name: string;
  metric_key: string;
  condition: string;
  threshold: number;
  severity: string;
  is_active: boolean;
}

interface AlertEvent {
  id: string;
  rule_name: string;
  device_name: string;
  severity: string;
  value: number;
  triggered_at: string;
  resolved_at: string | null;
}

const SEVERITY_TONE: Record<string, "danger" | "warning" | "accent"> = {
  critical: "danger",
  warning: "warning",
  info: "accent",
};

export function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/alert-rules/", { params: { page_size: 100 } }),
      api.get("/alert-events/", { params: { page_size: 50 } }),
    ]).then(([rulesRes, eventsRes]) => {
      setRules(rulesRes.data.results);
      setEvents(eventsRes.data.results);
      setLoading(false);
    });
  }, []);

  const ruleColumns: Column<AlertRule>[] = [
    { header: "Name", render: (r) => r.name },
    { header: "Condition", render: (r) => `${r.metric_key} ${r.condition} ${r.threshold}` },
    { header: "Severity", render: (r) => <Badge tone={SEVERITY_TONE[r.severity] ?? "accent"}>{r.severity}</Badge> },
    { header: "Active", render: (r) => (r.is_active ? "Yes" : "No") },
  ];

  const eventColumns: Column<AlertEvent>[] = [
    { header: "Rule", render: (e) => e.rule_name },
    { header: "Device", render: (e) => e.device_name },
    { header: "Severity", render: (e) => <Badge tone={SEVERITY_TONE[e.severity] ?? "accent"}>{e.severity}</Badge> },
    { header: "Value", render: (e) => e.value },
    { header: "Triggered", render: (e) => new Date(e.triggered_at).toLocaleString() },
    { header: "Status", render: (e) => (e.resolved_at ? "Resolved" : "Active") },
  ];

  return (
    <AppShell breadcrumb={["Alerts"]}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Panel title="Alert Rules" subtitle="Configure thresholds via the API - builder UI coming in a future pass">
          <Table columns={ruleColumns} rows={rules} keyFor={(r) => r.id} emptyLabel={loading ? "Loading..." : "No alert rules configured"} />
        </Panel>
        <Panel title="Recent Alert Events">
          <Table columns={eventColumns} rows={events} keyFor={(e) => e.id} emptyLabel={loading ? "Loading..." : "No alert events yet"} />
        </Panel>
      </div>
    </AppShell>
  );
}
