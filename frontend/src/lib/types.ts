export type Role = "SUPER_ADMIN" | "ORG_ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export interface Membership {
  id: string;
  organization: Organization;
  role: Role;
  created_at: string;
  user_email?: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  active_organization: Organization | null;
  memberships: Membership[];
  created_at: string;
}

export type DataType = "integer" | "float" | "boolean" | "string" | "datetime";
export type Aggregation =
  | "raw"
  | "min"
  | "max"
  | "average"
  | "sum"
  | "count"
  | "last"
  | "first";

export interface MetricDefinition {
  id: string;
  device_type: string;
  key: string;
  display_name: string;
  data_type: DataType;
  unit: string;
  min_value: number | null;
  max_value: number | null;
  decimal_precision: number;
  description: string;
  aggregation: Aggregation;
  order: number;
}

export interface DeviceType {
  id: string;
  organization: string;
  name: string;
  description: string;
  icon: string;
  metrics: MetricDefinition[];
  created_at: string;
  updated_at: string;
}

export type DeviceStatus = "ONLINE" | "OFFLINE" | "UNKNOWN";

export interface Device {
  id: string;
  organization: string;
  device_id: string;
  name: string;
  device_type: string;
  device_type_detail: DeviceType;
  site: string | null;
  site_name: string | null;
  location: string;
  mqtt_topic: string;
  serial_number: string;
  firmware_version: string;
  status: DeviceStatus;
  last_seen: string | null;
  latitude: number | null;
  longitude: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  organization: string;
  name: string;
  address: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TelemetryReading {
  id: number;
  device: string;
  metric_key: string;
  value: number | boolean | string | null;
  recorded_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type WidgetType = "line_chart" | "area_chart" | "bar_chart" | "gauge" | "stat" | "table";

export interface WidgetDataSource {
  device: string;
  metric_key: string;
  aggregation?: Aggregation;
  time_range_minutes?: number;
}

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Widget {
  id: string;
  dashboard: string;
  type: WidgetType;
  title: string;
  data_source: WidgetDataSource;
  grid_position: GridPosition;
  options: Record<string, unknown>;
  order: number;
}

export interface Dashboard {
  id: string;
  organization: string;
  name: string;
  description: string;
  is_default: boolean;
  created_by: string | null;
  widgets: Widget[];
  created_at: string;
  updated_at: string;
}
