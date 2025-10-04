import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export interface KPIItem { label: string; value: string | number; change?: number; sparkline?: number[]; color?: string; }
interface Props { items: KPIItem[]; }

const KPIStatGroup: React.FC<Props> = ({ items }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((k)=> {
        const data = (k.sparkline || []).map((v,i)=> ({ i, v }));
        const positive = (k.change ?? 0) >= 0;
        return (
          <div key={k.label} className="relative group p-3 rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-sm overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[radial-gradient(circle_at_70%_30%,#0ea5e9,transparent_60%)] group-hover:opacity-20 transition-opacity" />
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">{k.label}</div>
              <span className="inline-block w-1.5 h-4 rounded bg-gradient-to-b from-slate-300 to-slate-400 group-hover:from-sky-400 group-hover:to-sky-600 transition-colors" />
            </div>
            <div className="text-base font-bold text-slate-800 tabular-nums leading-none mb-0.5">{k.value}</div>
            {k.change != null && (
              <div className={`text-[10px] font-medium ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>{positive? '+' : ''}{k.change}%</div>
            )}
            {data.length > 2 && (
              <div className="absolute bottom-1.5 right-1 left-1 opacity-55">
                <ResponsiveContainer width="100%" height={30}>
                  <AreaChart data={data}>
                    <Area dataKey="v" type="monotone" stroke={k.color || '#0ea5e9'} fill={k.color || '#0ea5e9'} fillOpacity={0.18} strokeWidth={1.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KPIStatGroup;
