import { useEffect, useState } from "react";
import { AppShell } from "@/app/AppShell";
import { Panel } from "@/components/ui/Panel";
import { Column, Table } from "@/components/ui/Table";
import { api } from "@/lib/api";

interface Report {
  id: string;
  name: string;
  description: string;
  format: string;
  created_at: string;
}

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/", { params: { page_size: 100 } }).then((res) => {
      setReports(res.data.results);
      setLoading(false);
    });
  }, []);

  const columns: Column<Report>[] = [
    { header: "Name", render: (r) => r.name },
    { header: "Description", render: (r) => r.description || "—" },
    { header: "Format", render: (r) => r.format.toUpperCase() },
    { header: "Created", render: (r) => new Date(r.created_at).toLocaleDateString() },
  ];

  return (
    <AppShell breadcrumb={["Reports"]}>
      <Panel title="Reports" subtitle="Configure via the API - builder UI coming in a future pass">
        <Table columns={columns} rows={reports} keyFor={(r) => r.id} emptyLabel={loading ? "Loading..." : "No reports configured"} />
      </Panel>
    </AppShell>
  );
}
