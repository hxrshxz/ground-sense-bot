import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export interface RechargeSlice { name: string; value: number; color?: string; }
interface Props { data: RechargeSlice[]; height?: number; innerRadius?: number; }

const defaultPalette = [
  '#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#84cc16', '#d946ef'
];

const RechargeCompositionDonut: React.FC<Props> = ({ data, height = 260, innerRadius = 62 }) => {
  const total = data.reduce((a,c)=> a + c.value, 0) || 1;
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      return (
        <div className="rounded-lg border border-slate-200 bg-white/90 backdrop-blur-sm shadow px-3 py-2 text-[10px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background:p.color }} />
            <span className="font-semibold text-slate-700">{p.name}</span>
          </div>
          <div className="text-slate-600 space-y-0.5">
            <div>Value: <span className="font-semibold text-slate-800 tabular-nums">{p.value}</span></div>
            <div>Share: <span className="font-semibold text-slate-800 tabular-nums">{((p.value/total)*100).toFixed(1)}%</span></div>
          </div>
        </div>
      );
    }
    return null;
  };
  const centerTotal = `${total}`;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-700 tracking-wide flex items-center gap-2">
          <span className="inline-block w-1.5 h-4 rounded bg-gradient-to-b from-indigo-400 to-indigo-600" />
          Recharge Composition
        </h4>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Indexed</span>
      </div>
      <div className="relative rounded-2xl p-4 bg-gradient-to-br from-white via-slate-50 to-slate-100 border border-slate-200 shadow-sm overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_30%_70%,#6366f1,transparent_60%)]" />
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={innerRadius} outerRadius={94} strokeWidth={2} paddingAngle={2} cornerRadius={4}>
              {data.map((s, idx) => (
                <Cell key={s.name} fill={s.color || defaultPalette[idx % defaultPalette.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">Total</div>
            <div className="text-sm font-bold text-slate-700 tabular-nums">{centerTotal}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RechargeCompositionDonut;
