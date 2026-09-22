import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { seriesColor } from "@/styles/theme";
import { TelemetryReading } from "@/lib/types";

export type MetricChartType = "line" | "area" | "bar";

export function MetricChart({
  readings,
  colorIndex = 0,
  unit = "",
  type = "line",
  height = 220,
}: {
  readings: TelemetryReading[];
  colorIndex?: number;
  unit?: string;
  type?: MetricChartType;
  height?: number | string;
}) {
  const data = [...readings]
    .filter((r) => typeof r.value === "number")
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map((r) => ({
      time: new Date(r.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      value: r.value as number,
    }));

  const color = seriesColor(colorIndex);

  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: 12,
        }}
      >
        No data in this range yet
      </div>
    );
  }

  const axes = (
    <>
      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey="time"
        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
        axisLine={{ stroke: "var(--border)" }}
        tickLine={false}
      />
      <YAxis
        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
        axisLine={{ stroke: "var(--border)" }}
        tickLine={false}
        unit={unit ? ` ${unit}` : ""}
        width={54}
      />
      <Tooltip
        contentStyle={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          fontSize: 12,
        }}
        labelStyle={{ color: "var(--text-secondary)" }}
      />
    </>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === "area" ? (
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          {axes}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      ) : type === "bar" ? (
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          {axes}
          <Bar dataKey="value" fill={color} isAnimationActive={false} radius={[2, 2, 0, 0]} />
        </BarChart>
      ) : (
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          {axes}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
