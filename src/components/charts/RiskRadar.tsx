import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

export interface RiskFactor { factor: string; score: number; }
interface Props { data: RiskFactor[]; height?: number; }

const RiskRadar: React.FC<Props> = ({ data, height = 300 }) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      return (
        <div className="rounded-lg border border-slate-200 bg-white/95 backdrop-blur-sm shadow px-3 py-2 text-[10px]">
          <div className="font-semibold text-slate-700 mb-1">{p.payload.factor}</div>
          <div className="text-slate-600 flex justify-between"><span>Score</span><span className="font-semibold text-slate-800 tabular-nums">{p.payload.score}</span></div>
        </div>
      );
    }
    return null;
  };
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-700 tracking-wide flex items-center gap-2">
          <span className="inline-block w-1.5 h-4 rounded bg-gradient-to-b from-fuchsia-400 to-fuchsia-600" />
          Risk Profile
        </h4>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">0–100</span>
      </div>
      <div className="relative rounded-2xl p-4 bg-gradient-to-br from-white via-slate-50 to-slate-100 border border-slate-200 shadow-sm overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_50%_50%,#6366f1,transparent_70%)]" />
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={data} outerRadius={105} margin={{ top: 16, right: 30, bottom: 16, left: 30 }}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="factor" tick={{ fontSize: 10, fill: '#64748b' }} />
            <PolarRadiusAxis angle={24} domain={[0, 100]} tick={{ fontSize: 9, fill:'#64748b' }} stroke="#94a3b8" />
            <Tooltip content={<CustomTooltip />} />
            <Radar dataKey="score" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.35} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RiskRadar;
