import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/app/AppShell";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { Column, Table } from "@/components/ui/Table";
import { useAuth } from "@/features/auth/AuthContext";
import { listDevices } from "@/features/devices/api";
import { Device } from "@/lib/types";

export function OverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDevices({}).then((res) => {
      setDevices(res.results);
      setLoading(false);
    });
  }, []);

  const online = devices.filter((d) => d.status === "ONLINE").length;
  const offline = devices.filter((d) => d.status === "OFFLINE").length;
  const unknown = devices.filter((d) => d.status === "UNKNOWN").length;

  const columns: Column<Device>[] = [
    { header: "Device", render: (d) => d.name },
    { header: "Type", render: (d) => d.device_type_detail?.name ?? "—" },
    { header: "Status", render: (d) => <Badge tone={statusTone(d.status)}>{d.status}</Badge> },
    {
      header: "Last seen",
      render: (d) => (d.last_seen ? new Date(d.last_seen).toLocaleString() : "Never"),
    },
  ];

  return (
    <AppShell breadcrumb={["Overview"]}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="widget-grid">
          <div style={{ gridColumn: "span 3" }}>
            <StatCard title="Total devices" value={devices.length} color="var(--accent)" />
          </div>
          <div style={{ gridColumn: "span 3" }}>
            <StatCard title="Online" value={online} color="var(--success)" />
          </div>
          <div style={{ gridColumn: "span 3" }}>
            <StatCard title="Offline" value={offline} color="var(--danger)" />
          </div>
          <div style={{ gridColumn: "span 3" }}>
            <StatCard title="Unknown" value={unknown} color="var(--text-muted)" />
          </div>
        </div>

        <Panel title={`Devices - ${user?.active_organization?.name ?? ""}`}>
          <Table
            columns={columns}
            rows={devices}
            keyFor={(d) => d.id}
            onRowClick={(d) => navigate(`/devices/${d.id}`)}
            emptyLabel={loading ? "Loading..." : "No devices yet - add one to get started"}
          />
        </Panel>
      </div>
    </AppShell>
  );
}
