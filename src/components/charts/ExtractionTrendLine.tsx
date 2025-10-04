import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend, Area } from "recharts";

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

const ExtractionTrendLine: React.FC<Props> = ({ data, height = 280, compact = false, accent = "#0ea5e9" }) => {
  const avg = data.length ? data.reduce((a, c) => a + c.extraction, 0) / data.length : 0;
  const gradientId = `grad-extraction-${accent.replace(/[^a-z0-9]/gi,'')}`;
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white/90 backdrop-blur-sm shadow-lg px-3 py-2 min-w-[140px]">
          <p className="text-[11px] font-semibold text-slate-700 mb-1">{label}</p>
          <div className="space-y-1">
            {payload.map((pl: any) => (
              <div key={pl.dataKey} className="flex items-center justify-between gap-4 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: pl.color }} />
                  <span className="text-slate-500">{pl.name}</span>
                </span>
                <span className="font-semibold text-slate-800 tabular-nums">{pl.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  return (
    <div className={`w-full ${compact ? "h-[200px]" : "h-auto"}`}>
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700 tracking-wide flex items-center gap-2">
            <span className="inline-block w-1.5 h-4 rounded bg-gradient-to-b from-sky-400 to-sky-600" />
            Extraction Trend
          </h4>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">HAM Indexed</span>
        </div>
      )}
      <div className={`relative rounded-2xl overflow-hidden ${compact ? "p-0" : "p-3 pt-4"} bg-gradient-to-br from-white via-slate-50 to-slate-100 border border-slate-200 shadow-sm`}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_70%_30%,#0ea5e9,transparent_60%)]" />
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accent} stopOpacity={0.35} />
                <stop offset="95%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 4" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={42} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: accent, strokeWidth: 0.6, strokeDasharray: '2 4' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
            <ReferenceLine y={avg} stroke={accent} strokeDasharray="4 5" label={{ value: 'Avg', fontSize: 10, position: 'right', fill: accent }} />
            <Area type="monotone" dataKey="extraction" stroke={accent} fill={`url(#${gradientId})`} strokeWidth={2.4} name="Extraction" />
            {data[0]?.recharge != null && <Line type="monotone" dataKey="recharge" name="Recharge" stroke="#10b981" strokeWidth={2} dot={{ r:2 }} activeDot={{ r:4 }} />}
            {data[0]?.net != null && <Line type="monotone" dataKey="net" name="Net" stroke="#6366f1" strokeDasharray="5 5" strokeWidth={2} dot={{ r:1 }} activeDot={{ r:4 }} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExtractionTrendLine;
