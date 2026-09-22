import { api } from "@/lib/api";
import { Dashboard, GridPosition, PaginatedResponse, Widget, WidgetDataSource, WidgetType } from "@/lib/types";

export async function listDashboards() {
  const response = await api.get<PaginatedResponse<Dashboard>>("/dashboards/", {
    params: { page_size: 50 },
  });
  return response.data.results;
}

export async function createDashboard(payload: { name: string; description?: string; is_default?: boolean }) {
  const response = await api.post<Dashboard>("/dashboards/", payload);
  return response.data;
}

export async function createWidget(payload: {
  dashboard: string;
  type: WidgetType;
  title: string;
  data_source: WidgetDataSource;
  grid_position: GridPosition;
  options?: Record<string, unknown>;
  order?: number;
}) {
  const response = await api.post<Widget>("/widgets/", payload);
  return response.data;
}

export async function updateWidgetPosition(id: string, grid_position: GridPosition) {
  const response = await api.patch<Widget>(`/widgets/${id}/`, { grid_position });
  return response.data;
}

export async function deleteWidget(id: string) {
  await api.delete(`/widgets/${id}/`);
}
