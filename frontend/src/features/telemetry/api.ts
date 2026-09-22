import { api } from "@/lib/api";
import { PaginatedResponse, TelemetryReading } from "@/lib/types";

export async function getTelemetryHistory(params: {
  device: string;
  metric_key: string;
  start?: string;
  end?: string;
}) {
  const response = await api.get<PaginatedResponse<TelemetryReading>>("/telemetry/history/", {
    params: { ...params, page_size: 500 },
  });
  return response.data.results;
}
