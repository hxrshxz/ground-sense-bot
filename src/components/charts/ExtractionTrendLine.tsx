import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
  Area,
  Brush,
  Dot,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Droplets, Activity } from "lucide-react";

export interface ExtractionTrendPoint {
  year: number | string;
  extraction: number;
  recharge?: number;
  net?: number;
}

interface Props {
  data: ExtractionTrendPoint[];
  height?: number;
  compact?: boolean;
  accent?: string;
}

const ExtractionTrendLine: React.FC<Props> = ({
  data,
  height = 280,
  compact = false,
  accent = "#0ea5e9",
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [activeLines, setActiveLines] = useState({
    extraction: true,
    recharge: true,
    net: true,
  });

  const avg = data.length
    ? data.reduce((a, c) => a + c.extraction, 0) / data.length
    : 0;

  const gradientId = `grad-extraction-${accent.replace(/[^a-z0-9]/gi, "")}`;
  const glowId = `glow-${accent.replace(/[^a-z0-9]/gi, "")}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-slate-300 bg-gradient-to-br from-white via-slate-50 to-white backdrop-blur-xl shadow-2xl px-4 py-3 min-w-[180px]"
          style={{
            boxShadow: `0 20px 60px -10px ${accent}40, 0 0 0 1px ${accent}20`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500">
              <Activity className="w-3 h-3 text-white" />
            </div>
            <p className="text-xs font-bold text-slate-800">Year {label}</p>
          </div>
          <div className="space-y-2">
            {payload.map((pl: any, idx: number) => {
              const isPositive = pl.value >= 0;
              const Icon =
                pl.dataKey === "extraction"
                  ? TrendingUp
                  : pl.dataKey === "recharge"
                  ? Droplets
                  : isPositive
                  ? TrendingUp
                  : TrendingDown;
              return (
                <motion.div
                  key={pl.dataKey}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between gap-4 text-xs group"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shadow-lg animate-pulse"
                      style={{
                        background: pl.color,
                        boxShadow: `0 0 10px ${pl.color}80`,
                      }}
                    />
                    <Icon className="w-3 h-3" style={{ color: pl.color }} />
                    <span className="text-slate-600 font-medium">
                      {pl.name}
                    </span>
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums text-sm">
                    {typeof pl.value === "number"
                      ? pl.value.toFixed(1)
                      : pl.value}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    if (!activeLines[dataKey as keyof typeof activeLines]) return null;

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill={props.fill}
          className="transition-all duration-300 hover:r-6"
        />
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill={props.fill}
          opacity={0.2}
          className="animate-ping"
        />
      </g>
    );
  };
  return (
    <div className={`w-full ${compact ? "h-[200px]" : "h-auto"}`}>
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700 tracking-wide flex items-center gap-2">
            <span className="inline-block w-1.5 h-4 rounded bg-gradient-to-b from-sky-400 to-sky-600" />
            Extraction Trend
          </h4>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
            HAM Indexed
          </span>
        </div>
      )}
      <div
        className={`relative rounded-2xl overflow-hidden ${
          compact ? "p-0" : "p-3 pt-4"
        } bg-gradient-to-br from-white via-slate-50 to-slate-100 border border-slate-200 shadow-sm`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_70%_30%,#0ea5e9,transparent_60%)]" />
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accent} stopOpacity={0.35} />
                <stop offset="95%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 4"
              stroke="#e2e8f0"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
              width={42}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: accent,
                strokeWidth: 0.6,
                strokeDasharray: "2 4",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
            <ReferenceLine
              y={avg}
              stroke={accent}
              strokeDasharray="4 5"
              label={{
                value: "Avg",
                fontSize: 10,
                position: "right",
                fill: accent,
              }}
            />
            <Area
              type="monotone"
              dataKey="extraction"
              stroke={accent}
              fill={`url(#${gradientId})`}
              strokeWidth={2.4}
              name="Extraction"
            />
            {data[0]?.recharge != null && (
              <Line
                type="monotone"
                dataKey="recharge"
                name="Recharge"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            )}
            {data[0]?.net != null && (
              <Line
                type="monotone"
                dataKey="net"
                name="Net"
                stroke="#6366f1"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={{ r: 1 }}
                activeDot={{ r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExtractionTrendLine;
