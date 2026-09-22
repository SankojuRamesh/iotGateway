import { api } from "@/lib/api";
import { Device, DeviceType, PaginatedResponse, Site } from "@/lib/types";

export async function listDevices(params: {
  search?: string;
  status?: string;
  device_type?: string;
  page?: number;
}) {
  const response = await api.get<PaginatedResponse<Device>>("/devices/", { params });
  return response.data;
}

export async function getDevice(id: string) {
  const response = await api.get<Device>(`/devices/${id}/`);
  return response.data;
}

export async function createDevice(payload: Partial<Device>) {
  const response = await api.post<Device>("/devices/", payload);
  return response.data;
}

export async function updateDevice(id: string, payload: Partial<Device>) {
  const response = await api.patch<Device>(`/devices/${id}/`, payload);
  return response.data;
}

export async function deleteDevice(id: string) {
  await api.delete(`/devices/${id}/`);
}

export async function listDeviceTypes() {
  const response = await api.get<PaginatedResponse<DeviceType>>("/device-types/", {
    params: { page_size: 200 },
  });
  return response.data.results;
}

export async function createDeviceType(payload: { name: string; description?: string; icon?: string }) {
  const response = await api.post<DeviceType>("/device-types/", payload);
  return response.data;
}

export async function setDeviceTypeMetrics(
  deviceTypeId: string,
  metrics: Array<{
    key: string;
    display_name: string;
    data_type: string;
    unit?: string;
    min_value?: number | null;
    max_value?: number | null;
    decimal_precision?: number;
    aggregation: string;
    order?: number;
  }>,
) {
  const response = await api.put<DeviceType["metrics"]>(`/device-types/${deviceTypeId}/metrics/`, {
    metrics,
  });
  return response.data;
}

export async function listSites() {
  const response = await api.get<PaginatedResponse<Site>>("/sites/", { params: { page_size: 200 } });
  return response.data.results;
}

export async function createSite(payload: { name: string; address?: string; timezone?: string }) {
  const response = await api.post<Site>("/sites/", payload);
  return response.data;
}

export function exportDevicesCsvUrl(): string {
  return `${api.defaults.baseURL}/devices/export/`;
}

export async function importDevicesCsv(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/devices/import/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data as { created: string[]; errors: Array<{ row: number; errors: unknown }> };
}
