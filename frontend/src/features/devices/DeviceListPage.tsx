import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/app/AppShell";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input, Select } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { Column, Table } from "@/components/ui/Table";
import { apiErrorMessage } from "@/lib/api";
import { Device, DeviceType, Site } from "@/lib/types";
import {
  deleteDevice,
  exportDevicesCsvUrl,
  importDevicesCsv,
  listDeviceTypes,
  listDevices,
  listSites,
} from "./api";
import { DeviceFormModal } from "./DeviceFormModal";

export function DeviceListPage() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [deviceRes, types, siteList] = await Promise.all([
        listDevices({
          search: search || undefined,
          status: statusFilter || undefined,
          device_type: typeFilter || undefined,
        }),
        listDeviceTypes(),
        listSites(),
      ]);
      setDevices(deviceRes.results);
      setDeviceTypes(types);
      setSites(siteList);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, typeFilter]);

  async function onDelete(device: Device) {
    if (!confirm(`Delete device "${device.name}"?`)) return;
    await deleteDevice(device.id);
    load();
  }

  async function onImportFile(file: File) {
    setImportBusy(true);
    try {
      const result = await importDevicesCsv(file);
      alert(`Imported ${result.created.length} device(s). ${result.errors.length} error(s).`);
      load();
    } catch (err) {
      alert(apiErrorMessage(err));
    } finally {
      setImportBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const columns: Column<Device>[] = [
    {
      header: "Device",
      render: (d) => (
        <div>
          <div style={{ fontWeight: 500 }}>{d.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.device_id}</div>
        </div>
      ),
    },
    { header: "Type", render: (d) => d.device_type_detail?.name ?? "—" },
    { header: "Site", render: (d) => d.site_name ?? "—" },
    { header: "MQTT Topic", render: (d) => <code style={{ fontSize: 11 }}>{d.mqtt_topic}</code> },
    {
      header: "Status",
      render: (d) => <Badge tone={statusTone(d.status)}>{d.status}</Badge>,
    },
    {
      header: "Last seen",
      render: (d) => (d.last_seen ? new Date(d.last_seen).toLocaleString() : "Never"),
    },
    {
      header: "",
      render: (d) => (
        <Button variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(d); }}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <AppShell breadcrumb={["Devices"]}>
      <Panel
        title="Devices"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => window.open(exportDevicesCsvUrl(), "_blank")}>
              <Icon name="download" size={14} /> Export
            </Button>
            <Button variant="secondary" disabled={importBusy} onClick={() => fileInputRef.current?.click()}>
              <Icon name="upload" size={14} /> Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && onImportFile(e.target.files[0])}
            />
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Icon name="plus" size={14} /> Add device
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Icon
              name="search"
              size={14}
              style={{ position: "absolute", left: 10, top: 10, color: "var(--text-muted)" }}
            />
            <Input
              placeholder="Search device id, name, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 30 }}
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 160 }}>
            <option value="">All statuses</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
            <option value="UNKNOWN">Unknown</option>
          </Select>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: 180 }}>
            <option value="">All device types</option>
            {deviceTypes.map((dt) => (
              <option key={dt.id} value={dt.id}>
                {dt.name}
              </option>
            ))}
          </Select>
        </div>

        {error && <div style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>}

        <Table
          columns={columns}
          rows={devices}
          keyFor={(d) => d.id}
          onRowClick={(d) => navigate(`/devices/${d.id}`)}
          emptyLabel={loading ? "Loading..." : "No devices yet"}
        />
      </Panel>

      {modalOpen && (
        <DeviceFormModal
          device={editing}
          deviceTypes={deviceTypes}
          sites={sites}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </AppShell>
  );
}
