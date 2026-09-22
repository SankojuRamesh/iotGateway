import { useEffect, useState } from "react";
import { Layout, Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { AppShell } from "@/app/AppShell";
import { Button } from "@/components/ui/Button";
import { apiErrorMessage } from "@/lib/api";
import { Dashboard, Device } from "@/lib/types";
import { listDevices } from "@/features/devices/api";
import { AddWidgetModal } from "./AddWidgetModal";
import { WidgetCard } from "./WidgetCard";
import { createDashboard, deleteWidget, listDashboards, updateWidgetPosition } from "./api";

const ResponsiveGridLayout = WidthProvider(Responsive);

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [dashboards, deviceRes] = await Promise.all([listDashboards(), listDevices({})]);
      let dash = dashboards[0];
      if (!dash) {
        try {
          dash = await createDashboard({ name: "Main Dashboard", is_default: true });
        } catch {
          // Lost a race to create the default dashboard (e.g. React 18
          // StrictMode double-invoking this effect in dev, or another tab) -
          // the org's (organization, name) uniqueness constraint rejected
          // our duplicate, so just refetch and use whatever now exists.
          dash = (await listDashboards())[0];
        }
      }
      if (!dash) throw new Error("Could not load or create a dashboard.");
      setDashboard(dash);
      setDevices(deviceRes.results);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleLayoutChange(layout: Layout[]) {
    if (!dashboard) return;
    const changed = layout.filter((item) => {
      const widget = dashboard.widgets.find((w) => w.id === item.i);
      if (!widget) return false;
      const p = widget.grid_position;
      return p.x !== item.x || p.y !== item.y || p.w !== item.w || p.h !== item.h;
    });
    if (changed.length === 0) return;

    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.map((w) => {
        const item = layout.find((l) => l.i === w.id);
        return item ? { ...w, grid_position: { x: item.x, y: item.y, w: item.w, h: item.h } } : w;
      }),
    });

    await Promise.all(
      changed.map((item) =>
        updateWidgetPosition(item.i, { x: item.x, y: item.y, w: item.w, h: item.h }),
      ),
    ).catch((err) => setError(apiErrorMessage(err)));
  }

  async function handleDelete(widgetId: string) {
    if (!dashboard) return;
    if (!confirm("Remove this widget from the dashboard?")) return;
    await deleteWidget(widgetId);
    setDashboard({ ...dashboard, widgets: dashboard.widgets.filter((w) => w.id !== widgetId) });
  }

  const deviceMap = Object.fromEntries(devices.map((d) => [d.id, d]));
  const layout: Layout[] = (dashboard?.widgets ?? []).map((w) => ({
    i: w.id,
    x: w.grid_position.x ?? 0,
    y: w.grid_position.y ?? 0,
    w: w.grid_position.w ?? 4,
    h: w.grid_position.h ?? 4,
  }));

  return (
    <AppShell breadcrumb={["Dashboards", dashboard?.name ?? ""]}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Button variant="primary" onClick={() => setAddOpen(true)} disabled={!dashboard || devices.length === 0}>
          + Add widget
        </Button>
      </div>

      {error && <div style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>}

      {!loading && dashboard && dashboard.widgets.length === 0 && (
        <div
          style={{
            border: "1px dashed var(--border)",
            borderRadius: 8,
            padding: 48,
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          {devices.length === 0
            ? "Add a device first, then come back to build your dashboard."
            : "No widgets yet. Click \"Add widget\", pick a device + metric, and choose a plot or card type."}
        </div>
      )}

      {dashboard && dashboard.widgets.length > 0 && (
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout, md: layout, sm: layout }}
          breakpoints={{ lg: 996, md: 768, sm: 480 }}
          cols={{ lg: 12, md: 8, sm: 4 }}
          rowHeight={64}
          margin={[12, 12]}
          draggableHandle=".widget-drag-handle"
          onDragStop={handleLayoutChange}
          onResizeStop={handleLayoutChange}
        >
          {dashboard.widgets.map((widget, i) => (
            <div key={widget.id}>
              <WidgetCard
                widget={widget}
                device={deviceMap[widget.data_source.device]}
                colorIndex={i}
                onDelete={() => handleDelete(widget.id)}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      )}

      {addOpen && dashboard && (
        <AddWidgetModal
          dashboardId={dashboard.id}
          devices={devices}
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false);
            load();
          }}
        />
      )}
    </AppShell>
  );
}
