import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area,
  ComposedChart,
  Brush,
} from "recharts";

const AnnualTrendsChart = ({ data }: { data: any }) => {
  const [metricsActive, setMetricsActive] = useState<{[k:string]: boolean}>({
    extraction: true,
    recharge: true,
    decline_rate: true,
    sustainability_index: true,
  });
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  
  // Sample annual trends data
  const trendsData = data?.annual_trends || [
    {
      year: 2019,
      extraction: 152.1,
      recharge: 121.8,
      decline_rate: 0.28,
      sustainability_index: 80.1,
    },
    {
      year: 2020,
      extraction: 154.3,
      recharge: 119.5,
      decline_rate: 0.31,
      sustainability_index: 77.5,
    },
    {
      year: 2021,
      extraction: 155.8,
      recharge: 120.5,
      decline_rate: 0.33,
      sustainability_index: 77.3,
    },
    {
      year: 2022,
      extraction: 158.2,
      recharge: 119.8,
      decline_rate: 0.35,
      sustainability_index: 75.7,
    },
    {
      year: 2023,
      extraction: 160.5,
      recharge: 118.2,
      decline_rate: 0.38,
      sustainability_index: 73.6,
    },
    {
      year: 2024,
      extraction: 162.1,
      recharge: 117.5,
      decline_rate: 0.41,
      sustainability_index: 72.5,
    },
    {
      year: 2025,
      extraction: 164.8,
      recharge: 116.1,
      decline_rate: 0.45,
      sustainability_index: 70.4,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const yearData = payload[0]?.payload;
      return (
        <div className="p-4 bg-white/95 backdrop-blur-sm border border-purple-200 rounded-xl shadow-lg w-80 font-sans">
          <p className="font-bold text-slate-800 text-lg mb-3">
            📅 Year {label} Analysis
          </p>
          <div className="space-y-2">
            {payload.map((pld: any) => (
              <div
                key={pld.dataKey}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: pld.stroke || pld.fill }}
                  ></div>
                  <span className="text-slate-600">{pld.name}:</span>
                </div>
                <span className="font-semibold text-slate-800">
                  {pld.dataKey === "decline_rate"
                    ? `${pld.value} m/year`
                    : pld.dataKey === "sustainability_index"
                    ? `${pld.value}%`
                    : `${pld.value} HAM`}
                </span>
              </div>
            ))}
            {yearData && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <div className="text-xs text-slate-500">
                  <div className="flex justify-between mb-1">
                    <span>Net Balance:</span>
                    <span className={`font-semibold ${
                      (yearData.extraction - yearData.recharge) < 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {yearData.extraction > yearData.recharge ? "-" : "+"}
                      {Math.abs(yearData.extraction - yearData.recharge).toFixed(1)} HAM
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Status:</span>
                    <span className={`font-semibold ${
                      yearData.sustainability_index > 75 ? "text-green-600" :
                      yearData.sustainability_index > 60 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {yearData.sustainability_index > 75 ? "Low Risk" :
                       yearData.sustainability_index > 60 ? "Medium Risk" : "High Risk"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const indicators = useMemo(() => {
    const first = trendsData[0];
    const last = trendsData[trendsData.length - 1];
    const pct = (a:number,b:number) => (((b-a)/a)*100).toFixed(1);
    return {
      extraction: pct(first.extraction, last.extraction),
      recharge: pct(first.recharge, last.recharge),
      decline_rate: pct(first.decline_rate, last.decline_rate),
      sustainability_index: pct(first.sustainability_index, last.sustainability_index),
    };
  }, [trendsData]);

  const toggleMetric = (key:string) => setMetricsActive(prev => ({...prev, [key]: !prev[key]}));
  const activeHoverData = hoverYear ? trendsData.find(d => d.year === hoverYear) : null;

  return (
    <div className="relative overflow-hidden w-full bg-white/80 p-6 rounded-2xl border my-4 backdrop-blur-md shadow-xl font-sans">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-600 animate-pulse"></div>
      <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_40%,rgba(168,85,247,0.18),transparent_60%)]" />

      <div>
        <h3 className="font-bold text-xl text-slate-800 mb-1 ml-2">
          📈 Annual Groundwater Trends Analysis
        </h3>
        <p className="text-sm text-slate-500 mb-4 ml-2">
          Multi-year Analysis of Extraction, Recharge & Sustainability (2019-2025)
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-slate-100 rounded-2xl flex-wrap">
        {[
          { key: 'extraction', label: '🏭 Extraction', on: 'bg-red-500 text-white', off: 'text-red-700 hover:bg-red-100' },
          { key: 'recharge', label: '🌧️ Recharge', on: 'bg-green-500 text-white', off: 'text-green-700 hover:bg-green-100' },
          { key: 'decline_rate', label: '📉 Decline', on: 'bg-orange-500 text-white', off: 'text-orange-700 hover:bg-orange-100' },
          { key: 'sustainability_index', label: '🎯 Sustainability', on: 'bg-purple-500 text-white', off: 'text-purple-700 hover:bg-purple-100' },
        ].map(b => (
          <button
            key={b.key}
            onClick={() => toggleMetric(b.key)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 shadow-sm ${metricsActive[b.key] ? b.on + ' shadow' : b.off + ' opacity-70'} relative`}
          >
            {b.label}
            <span className={`ml-2 inline-block w-2 h-2 rounded-full ${metricsActive[b.key] ? 'bg-white' : 'bg-slate-400'}`}></span>
          </button>
        ))}
        <button
          onClick={() => setMetricsActive({ extraction:true, recharge:true, decline_rate:true, sustainability_index:true })}
          className="px-3 py-1.5 text-[10px] font-semibold rounded-full bg-slate-800 text-white hover:bg-slate-700"
        >Reset</button>
      </div>

      <div className="w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={trendsData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onMouseMove={(s:any)=>{ if (s?.activePayload?.length) setHoverYear(s.activePayload[0].payload.year); }}
            onMouseLeave={()=> setHoverYear(null)}
          >
            <defs>
              <linearGradient id="extractionArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="rechargeArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
            
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              label={{ 
                value: 'HAM (Hectare Meter)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: '12px', fill: '#64748b' }
              }}
            />
            
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              label={{ 
                value: 'Rate / Index', 
                angle: 90, 
                position: 'insideRight',
                style: { textAnchor: 'middle', fontSize: '12px', fill: '#64748b' }
              }}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }} />
            
            {/* Reference line for sustainability threshold */}
            <ReferenceLine yAxisId="right" y={70} stroke="#f59e0b" strokeDasharray="5 5" />

            {metricsActive.extraction && (
              <Area yAxisId="left" type="natural" dataKey="extraction" name="Groundwater Extraction" stroke="#ef4444" strokeWidth={3} fill="url(#extractionArea)" dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }} strokeLinejoin="round" strokeLinecap="round" filter="url(#glow)" isAnimationActive animationDuration={900} />
            )}
            {metricsActive.recharge && (
              <Area yAxisId="left" type="natural" dataKey="recharge" name="Groundwater Recharge" stroke="#22c55e" strokeWidth={3} fill="url(#rechargeArea)" dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }} strokeLinejoin="round" strokeLinecap="round" filter="url(#glow)" isAnimationActive animationDuration={900} />
            )}
            {metricsActive.decline_rate && (
              <Line yAxisId="right" type="natural" dataKey="decline_rate" name="Water Level Decline Rate" stroke="#f97316" strokeWidth={2.5} strokeDasharray="6 4" dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }} strokeLinecap="round" filter="url(#glow)" isAnimationActive animationDuration={950} />
            )}
            {metricsActive.sustainability_index && (
              <Line yAxisId="right" type="natural" dataKey="sustainability_index" name="Sustainability Index" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }} strokeLinecap="round" filter="url(#glow)" isAnimationActive animationDuration={1000} />
            )}
            <Brush height={24} travellerWidth={10} stroke="#6366f1" fill="#f1f5f9" />
            {hoverYear && <ReferenceLine x={hoverYear} stroke="#6366f1" strokeDasharray="3 3" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <IndicatorCard title="Extraction" icon="📈" value={`${indicators.extraction}%`} period={`${trendsData[0].year}-${trendsData[trendsData.length-1].year}`} color="red" />
        <IndicatorCard title="Recharge" icon="📉" value={`${indicators.recharge}%`} period={`${trendsData[0].year}-${trendsData[trendsData.length-1].year}`} color="green" />
        <IndicatorCard title="Decline Rate" icon="⚠️" value={`${indicators.decline_rate}%`} period={`${trendsData[0].year}-${trendsData[trendsData.length-1].year}`} color="orange" />
        <IndicatorCard title="Sustainability" icon="🎯" value={`${indicators.sustainability_index}%`} period={`${trendsData[0].year}-${trendsData[trendsData.length-1].year}`} color="purple" />
      </div>

      {activeHoverData && (
        <div className="mt-4 p-4 rounded-xl border bg-gradient-to-br from-slate-50 to-white shadow-inner grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="col-span-2 md:col-span-4 text-slate-700 font-semibold flex items-center gap-2">
            <span className="text-sm">Year Focus:</span>
            <span className="text-base text-slate-900">{activeHoverData.year}</span>
          </div>
          <HoverMetric label="Extraction" value={activeHoverData.extraction + ' HAM'} color="text-red-600" />
          <HoverMetric label="Recharge" value={activeHoverData.recharge + ' HAM'} color="text-green-600" />
          <HoverMetric label="Decline Rate" value={activeHoverData.decline_rate + ' m/yr'} color="text-orange-600" />
          <HoverMetric label="Sustainability" value={activeHoverData.sustainability_index + '%'} color="text-purple-600" />
          <div className="col-span-2 md:col-span-4 text-[10px] text-slate-500 border-t pt-2 flex flex-wrap gap-4">
            <span>Net Balance: <strong className={activeHoverData.extraction>activeHoverData.recharge? 'text-red-600':'text-green-600'}>{(activeHoverData.extraction - activeHoverData.recharge).toFixed(1)} HAM</strong></span>
            <span>Risk Tier: <strong className={activeHoverData.sustainability_index>75?'text-green-600':activeHoverData.sustainability_index>60?'text-yellow-600':'text-red-600'}>{activeHoverData.sustainability_index>75?'Low':activeHoverData.sustainability_index>60?'Medium':'High'}</strong></span>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 via-pink-50 to-fuchsia-50 rounded-lg border border-purple-200">
        <h4 className="font-semibold text-sm text-slate-800 mb-2 flex items-center gap-2">🔍 Smart Insight Engine</h4>
        <InsightGrid data={trendsData} />
      </div>
    </div>
  );
};

interface IndicatorProps { title:string; icon:string; value:string; period:string; color:string }
const IndicatorCard = ({ title, icon, value, period, color }: IndicatorProps) => {
  const palette: Record<string, string> = {
    red: 'from-red-50 to-red-100 border-red-200 text-red-800',
    green: 'from-green-50 to-green-100 border-green-200 text-green-800',
    orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-800',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-800',
  };
  return (
    <div className={`p-3 bg-gradient-to-br rounded-lg border ${palette[color] || 'from-slate-50 to-slate-100 border-slate-200 text-slate-700'} relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold tracking-wide">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] opacity-70">{period}</div>
      <div className="absolute inset-0 pointer-events-none opacity-15 bg-[radial-gradient(circle_at_70%_30%,white,transparent_60%)]" />
    </div>
  );
};

const HoverMetric = ({ label, value, color }: { label:string; value:string; color?:string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
    <span className={`text-xs font-semibold ${color}`}>{value}</span>
  </div>
);

const InsightGrid = ({ data }: { data:any[] }) => {
  if (!data?.length) return null;
  const first = data[0];
  const last = data[data.length-1];
  const years = (last.year - first.year) || 1;
  const annual = (a:number,b:number)=> ((b-a)/years).toFixed(2);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
      <div>• Extraction rising ~{annual(first.extraction,last.extraction)} HAM / yr</div>
      <div>• Recharge falling ~{Math.abs(parseFloat(annual(first.recharge,last.recharge)))} HAM / yr</div>
      <div>• Decline rate accelerating (+{annual(first.decline_rate,last.decline_rate)} m/yr² proxy)</div>
      <div>• Sustainability dropping {Math.abs(parseFloat(annual(first.sustainability_index,last.sustainability_index)))} pts / yr</div>
    </div>
  );
};

export default AnnualTrendsChart;