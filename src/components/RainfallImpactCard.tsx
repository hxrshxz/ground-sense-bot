import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend as ReLegend,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ChartDepthWrapper } from "./ChartDepthWrapper";
import { ParticleField } from "./ParticleField";
import { IngresContextHeader } from "./IngresContextHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CloudRain, 
  Droplets, 
  Waves, 
  AlertTriangle, 
  Cloud,
  Sun,
  CloudDrizzle,
  Zap,
  TrendingDown,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Thermometer
} from "lucide-react";

interface SourceSplit {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentType<any>;
  efficiency: number; // 1-5 rating
  seasonalVariation: number; // % variation
}

interface MonthlyData {
  month: string;
  rainfall: number;
  recharge: number;
  temperature: number;
  evaporation: number;
}

interface Props {
  region?: string;
  season?: string;
  sources?: SourceSplit[];
  stressIndex?: number;
  monthlyData?: MonthlyData[];
}

const defaultSources: SourceSplit[] = [
  { 
    label: "Direct Rainfall Infiltration", 
    value: 34, 
    color: "#0ea5e9", 
    icon: CloudRain,
    efficiency: 4,
    seasonalVariation: 85
  },
  { 
    label: "Canal Seepage", 
    value: 22, 
    color: "#6366f1", 
    icon: Waves,
    efficiency: 3,
    seasonalVariation: 25
  },
  { 
    label: "Field Percolation", 
    value: 28, 
    color: "#10b981", 
    icon: Droplets,
    efficiency: 4,
    seasonalVariation: 60
  },
  { 
    label: "Return Flow (Irrigation)", 
    value: 11, 
    color: "#f59e0b", 
    icon: TrendingUp,
    efficiency: 2,
    seasonalVariation: 40
  },
  { 
    label: "Urban Runoff Capture", 
    value: 5, 
    color: "#ec4899", 
    icon: Cloud,
    efficiency: 3,
    seasonalVariation: 70
  },
];

const defaultMonthlyData: MonthlyData[] = [
  { month: "Jan", rainfall: 15, recharge: 12, temperature: 18, evaporation: 45 },
  { month: "Feb", rainfall: 25, recharge: 20, temperature: 22, evaporation: 55 },
  { month: "Mar", rainfall: 35, recharge: 28, temperature: 28, evaporation: 75 },
  { month: "Apr", rainfall: 45, recharge: 35, temperature: 35, evaporation: 95 },
  { month: "May", rainfall: 20, recharge: 15, temperature: 40, evaporation: 120 },
  { month: "Jun", rainfall: 65, recharge: 45, temperature: 38, evaporation: 110 },
  { month: "Jul", rainfall: 180, recharge: 125, temperature: 32, evaporation: 85 },
  { month: "Aug", rainfall: 220, recharge: 155, temperature: 30, evaporation: 80 },
  { month: "Sep", rainfall: 140, recharge: 95, temperature: 31, evaporation: 85 },
  { month: "Oct", rainfall: 25, recharge: 18, temperature: 29, evaporation: 70 },
  { month: "Nov", rainfall: 8, recharge: 6, temperature: 24, evaporation: 50 },
  { month: "Dec", rainfall: 10, recharge: 8, temperature: 19, evaporation: 40 },
];

export const RainfallImpactCard: React.FC<Props> = ({
  region = "Punjab Core",
  season = "Monsoon 2024",
  sources = defaultSources,
  stressIndex = 208,
  monthlyData = defaultMonthlyData,
}) => {
  const [activeView, setActiveView] = useState<"pathways" | "seasonal" | "efficiency">("pathways");
  
  const total = sources.reduce((a, s) => a + s.value, 0) || 1;
  const totalRainfall = monthlyData.reduce((sum, m) => sum + m.rainfall, 0);
  const totalRecharge = monthlyData.reduce((sum, m) => sum + m.recharge, 0);
  const rechargeEfficiency = Math.round((totalRecharge / totalRainfall) * 100);
  
  // Calculate monsoon vs non-monsoon split
  const monsoonMonths = monthlyData.slice(5, 9); // Jun-Sep
  const monsoonRecharge = monsoonMonths.reduce((sum, m) => sum + m.recharge, 0);
  const monsoonShare = Math.round((monsoonRecharge / totalRecharge) * 100);

  // Enhanced sources with animations
  const enhancedSources = sources.map(s => ({
    ...s,
    contributionScore: (s.value * 0.4) + (s.efficiency * 10) + ((100 - s.seasonalVariation) * 0.2),
  })).sort((a, b) => b.contributionScore - a.contributionScore);

  const topPerformers = enhancedSources.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="w-full overflow-hidden bg-white shadow-lg">
        <IngresContextHeader
          title="INGRES ChatBOT · Rainfall → Recharge Dynamics"
          subtitle={`Seasonal recharge pathway decomposition for ${region} (${season}). AI interprets observed rainfall partitioning into infiltration, seepage and return flows to contextualize extraction stress.`}
          moduleTag="Rainfall Module"
          stage={stressIndex > 200 ? 'Over-Exploited' : stressIndex > 150 ? 'Critical' : 'Semi-Critical'}
          accent="sky"
          extraBadges={<>
            <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">Monsoon {monsoonShare}%</Badge>
            <Badge variant="outline" className={`${stressIndex > 200 ? 'bg-red-50 text-red-700 border-red-200' : 
              stressIndex > 150 ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>Stress {stressIndex}%</Badge>
          </>}
        />

        <CardContent className="space-y-8">
          <div className="text-xs text-slate-600 leading-relaxed bg-sky-50/40 border border-sky-100 rounded-md p-3">
            Recharge efficiency = (annual modeled recharge / cumulative rainfall). Monsoon concentration indicates vulnerability to intra-seasonal variability. Pathway ranking incorporates efficiency, stability, and seasonal dispersion to guide adaptive capture interventions.
          </div>

          {/* KPI Summary for Top Recharge Pathways */}
          <div className="grid md:grid-cols-3 gap-4 p-4 rounded-xl bg-gradient-to-r from-sky-50 via-white to-blue-50 border border-sky-200/60">
            {topPerformers.map((source, index) => {
              const Icon = source.icon;
              return (
                <motion.div
                  key={source.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-lg border border-sky-200/70 bg-white/70 backdrop-blur-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-sky-50/40 to-white/10" />
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-md text-white shadow-sm" style={{ background: source.color }}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-medium tracking-wide text-slate-600 uppercase">
                        Top #{index + 1} Source
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-semibold">
                      <Droplets className="h-3 w-3 text-sky-500" />
                      <span className="text-sky-600">
                        {source.value}%
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-sm font-bold text-slate-800 mb-1">{source.label}</div>
                    <div className="text-xs text-slate-600">Efficiency: {source.efficiency}/5 · Variation: ±{source.seasonalVariation}%</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500">Contribution:</span>
                      <span className="ml-1 font-semibold">{source.value}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Reliability:</span>
                      <span className="ml-1 font-semibold">{Math.round((100 - source.seasonalVariation) / 20)}/5</span>
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-slate-100 overflow-hidden mt-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${source.contributionScore / Math.max(...enhancedSources.map(s => s.contributionScore)) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      className="h-full"
                      style={{ background: source.color }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-slate-100 rounded-lg p-1" role="tablist" aria-label="Rainfall analysis views">
            {[
              { key: "pathways", label: "Recharge Pathways", icon: PieChartIcon },
              { key: "seasonal", label: "Seasonal Patterns", icon: Calendar },
              { key: "efficiency", label: "Efficiency Analysis", icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as any)}
                role="tab"
                aria-selected={activeView === tab.key}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  activeView === tab.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Pathways Tab */}
            {activeView === "pathways" && (
              <motion.div
                key="pathways"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold text-slate-600 uppercase flex items-center gap-2">
                      <span className="h-1 w-6 rounded-full bg-gradient-to-r from-sky-400 to-blue-600" />
                      Recharge Source Breakdown
                    </h5>
                    <div className="space-y-3">
                      {enhancedSources.map((s, index) => {
                        const Icon = s.icon;
                        return (
                          <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50/80 border border-slate-100/60 group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="p-2 rounded-md text-white shadow-sm" style={{ background: s.color }}>
                                <Icon className="h-4 w-4" />
                              </span>
                              <div>
                                <div className="text-sm font-medium text-slate-700">{s.label}</div>
                                <div className="text-xs text-slate-500">Efficiency: {s.efficiency}/5</div>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="h-4 w-full bg-slate-100/80 rounded-full relative overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(s.value / total) * 100}%` }}
                                  transition={{ duration: 1, delay: 0.2 + index * 0.05 }}
                                  className="h-full rounded-full shadow-inner"
                                  style={{ 
                                    background: `linear-gradient(90deg, ${s.color} 0%, ${s.color}CC 60%, ${s.color}99 100%)`,
                                    boxShadow: "0 0 0 1px rgba(255,255,255,0.15) inset"
                                  }}
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white drop-shadow">
                                  {s.value}%
                                </span>
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-slate-600 w-12 text-right">
                              ±{s.seasonalVariation}%
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                  <ChartDepthWrapper glowColor="#0ea5e9" className="bg-transparent">
                    <ParticleField count={32} color="rgba(14,165,233,0.55)" />
                    <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_70%_30%,rgba(56,189,248,0.3),transparent_75%)]" />
                    <ResponsiveContainer width="100%" height={380}>
                      <PieChart>
                        <defs>
                          <radialGradient id="donutGlow" cx="50%" cy="50%" r="65%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
                            <stop offset="55%" stopColor="#ffffff" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity={0.02} />
                          </radialGradient>
                          <linearGradient id="innerRing" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#0ea5e9" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                          <linearGradient id="volRing" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                        {/* Outer: contribution share */}
                        <Pie
                          data={sources}
                          cx="50%"
                          cy="50%"
                          outerRadius={135}
                          innerRadius={78}
                          paddingAngle={3}
                          cornerRadius={6}
                          dataKey="value"
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        >
                          {sources.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))' }} />
                          ))}
                        </Pie>
                        {/* Middle: efficiency weighting */}
                        <Pie
                          data={sources.map(s => ({ ...s, effWeighted: s.value * (s.efficiency / 5) }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          innerRadius={54}
                          paddingAngle={2}
                          dataKey="effWeighted"
                          stroke="none"
                        >
                          {sources.map((entry, index) => (
                            <Cell key={`eff-${index}`} fill={entry.color + 'AA'} />
                          ))}
                        </Pie>
                        {/* Inner: seasonal stability (inverse variation) */}
                        <Pie
                          data={sources.map(s => ({ ...s, stableScore: (100 - s.seasonalVariation) }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={50}
                          innerRadius={36}
                          paddingAngle={1}
                          dataKey="stableScore"
                          stroke="none"
                        >
                          {sources.map((entry, index) => (
                            <Cell key={`st-${index}`} fill={entry.color + '66'} />
                          ))}
                        </Pie>
                        {/* Rotating inner halo */}
                        <foreignObject x="40%" y="40%" width="20%" height="20%">
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="relative w-full h-full">
                              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,#0ea5e9AA,#0ea5e900_70%)] animate-pulse" />
                            </div>
                          </div>
                        </foreignObject>
                        <ReTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-md border bg-white/80 backdrop-blur-xl shadow-xl px-4 py-3 text-[11px] text-slate-700 min-w-[170px]">
                                <div className="font-semibold text-slate-800 text-xs mb-1 tracking-wide">{data.label}</div>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                                  <span className="text-sky-600 font-medium">Share</span><span>{data.value}%</span>
                                  <span className="text-emerald-600 font-medium">Eff</span><span>{data.efficiency}/5</span>
                                  <span className="text-amber-600 font-medium">Variation</span><span>±{data.seasonalVariation}%</span>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <ReLegend 
                          verticalAlign="bottom" 
                          height={40}
                          formatter={(value) => <span className="text-[11px] tracking-wide text-slate-600">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartDepthWrapper>
                </div>
              </motion.div>
            )}

            {/* Seasonal Tab */}
            {activeView === "seasonal" && (
              <motion.div
                key="seasonal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-sky-500" />
                  Monthly Rainfall vs Recharge Patterns
                </h4>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/70 relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(circle_at_30%_70%,rgba(56,189,248,0.1),transparent_70%)]" />
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id="rainfallGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="rechargeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12, fill: "#475569" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: "#475569" }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'mm', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '11px', fill: '#64748b' } }}
                      />
                      <ReTooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="rounded-md border bg-white/90 backdrop-blur-md shadow-sm px-3 py-2 text-[11px] text-slate-700">
                              <div className="font-semibold text-slate-800 text-xs mb-1">{label}</div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                                <span>Rainfall: {payload.find(p => p.dataKey === 'rainfall')?.value}mm</span>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <span>Recharge: {payload.find(p => p.dataKey === 'recharge')?.value}mm</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Thermometer className="w-3 h-3 text-orange-500" />
                                <span>Temp: {payload.find(p => p.dataKey === 'temperature')?.value}°C</span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="rainfall"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        fill="url(#rainfallGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="recharge"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#rechargeGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Efficiency Tab */}
            {activeView === "efficiency" && (
              <motion.div
                key="efficiency"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-sky-500" />
                  Recharge Efficiency Analysis
                </h4>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <span className="font-semibold text-emerald-800">Overall Efficiency</span>
                      </div>
                      <div className="text-2xl font-bold text-emerald-700 mb-1">{rechargeEfficiency}%</div>
                      <div className="text-sm text-emerald-600">of rainfall converted to recharge</div>
                    </div>
                    <div className="p-4 rounded-lg border border-sky-200 bg-sky-50/50">
                      <div className="flex items-center gap-2 mb-2">
                        <CloudRain className="h-4 w-4 text-sky-600" />
                        <span className="font-semibold text-sky-800">Monsoon Dependency</span>
                      </div>
                      <div className="text-2xl font-bold text-sky-700 mb-1">{monsoonShare}%</div>
                      <div className="text-sm text-sky-600">of annual recharge from monsoon</div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/70 relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(circle_at_70%_30%,rgba(56,189,248,0.1),transparent_70%)]" />
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={monthlyData.map(m => ({ 
                        ...m, 
                        efficiency: Math.round((m.recharge / m.rainfall) * 100) || 0 
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 10, fill: "#475569" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 10, fill: "#475569" }}
                          axisLine={false}
                          tickLine={false}
                          label={{ value: 'Efficiency %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '10px', fill: '#64748b' } }}
                        />
                        <ReTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-md border bg-white/90 backdrop-blur-md shadow-sm px-3 py-2 text-[11px] text-slate-700">
                                <div className="font-semibold text-slate-800 text-xs mb-1">{data.month}</div>
                                <div>Efficiency: {data.efficiency}%</div>
                                <div>Rainfall: {data.rainfall}mm</div>
                                <div>Recharge: {data.recharge}mm</div>
                                <div>Evaporation: {data.evaporation}mm</div>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="efficiency" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Climate Insights */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200/80 rounded-lg p-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>INGRES seasonal diagnostic:</strong> {monsoonShare}% of recharge concentrated in monsoon window; peak conversion efficiency in {monthlyData.reduce((max, m) => m.recharge > max.recharge ? m : max).month}. Dominant pathway: {enhancedSources[0].label} ({enhancedSources[0].value}%, efficiency {enhancedSources[0].efficiency}/5). Stress {stressIndex}% reflects {stressIndex > 200 ? 'acute overdraft – urgent demand management required' : stressIndex > 150 ? 'critical stress – targeted augmentation + moderation' : 'emerging pressures – monitor & optimize allocation'}.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-xs">
              <CloudRain className="h-3 w-3 mr-1" />
              Weather Forecast
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Efficiency Optimization
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Waves className="h-3 w-3 mr-1" />
              Capture Enhancement
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RainfallImpactCard;
