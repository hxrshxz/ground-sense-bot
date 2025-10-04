import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export interface SectorUsage { sector: string; value: number; }
interface Props { data: SectorUsage[]; height?: number; }

const SectorUsageStackedBar: React.FC<Props> = ({ data, height = 260 }) => {
  const chartData = [data.reduce((acc, s)=> { acc[s.sector] = s.value; return acc; }, {} as any)];
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-200 bg-white/95 backdrop-blur-sm shadow px-3 py-2 text-[10px] space-y-1">
          {payload.map((p:any)=>(
            <div key={p.name} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{ background:p.color }} />{p.name}</span>
              <span className="font-semibold text-slate-700 tabular-nums">{p.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-700 tracking-wide flex items-center gap-2">
          <span className="inline-block w-1.5 h-4 rounded bg-gradient-to-b from-emerald-400 to-emerald-600" />
          Sectoral Extraction Share
        </h4>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">% Total</span>
      </div>
      <div className="relative rounded-2xl p-4 bg-gradient-to-br from-white via-slate-50 to-slate-100 border border-slate-200 shadow-sm overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.10] bg-[radial-gradient(circle_at_80%_20%,#10b981,transparent_60%)]" />
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} stackOffset="expand" margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <XAxis dataKey={() => ''} tick={false} axisLine={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
            {data.map((s, idx) => (
              <Bar key={s.sector} dataKey={s.sector} stackId="a" fill={`hsl(${(idx*57)%360} 70% 52%)`} radius={idx === data.length -1 ? [0,8,8,0] : 0} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SectorUsageStackedBar;
