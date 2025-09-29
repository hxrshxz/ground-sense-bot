import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Droplets,
  BarChart3,
  Activity,
  TrendingDown,
  Gauge,
  Flame,
  Sprout,
  Home,
  Factory,
  Building,
  AlertTriangle,
  Info,
  Target,
  BarChart2,
  Database,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// Data shape for the component
export interface StateGroundwaterProfile {
  key: string;
  name: string;
  color: string;
  gradient: string; // tailwind gradient tail
  category: "Safe" | "Semi-Critical" | "Critical" | "Over-Exploited";
  extractionStage: number; // %
  annualDeclineM: number; // m/year
  rechargeComponents: { name: string; value: number }[]; // for radar
  sectors: { name: string; value: number; icon: any; color: string }[]; // percentage
  drivers: { name: string; impact: number }[]; // impact 0-100
  timeSeries: {
    year: number;
    extraction: number;
    recharge: number;
    net: number;
  }[];
  riskFactors: { factor: string; score: number; weight: number }[]; // risk scoring
  recommendations: string[];
  notes?: string;
}

// Minimal sample icons map
const sectorIconFallback: Record<string, any> = {
  Agriculture: Sprout,
  Domestic: Home,
  Industrial: Factory,
  Commercial: Building,
};

interface StateDeepDiveCardProps {
  state: StateGroundwaterProfile;
  compact?: boolean;
}

const tabs: { key: TabKey; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "sectors", label: "Sectors", icon: BarChart3 },
  { key: "trends", label: "Trends", icon: TrendingDown },
  { key: "recharge", label: "Recharge", icon: Droplets },
  { key: "drivers", label: "Drivers", icon: Flame },
  { key: "risk", label: "Risk", icon: Target },
  { key: "actions", label: "Actions", icon: Database },
];

type TabKey =
  | "overview"
  | "sectors"
  | "trends"
  | "recharge"
  | "drivers"
  | "risk"
  | "actions";

const categoryColors: Record<string, string> = {
  Safe: "from-green-500 to-emerald-600",
  "Semi-Critical": "from-yellow-500 to-amber-600",
  Critical: "from-orange-500 to-red-500",
  "Over-Exploited": "from-red-600 to-rose-600",
};

const StateDeepDiveCard: React.FC<StateDeepDiveCardProps> = ({
  state,
  compact,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const stageStatus = (() => {
    if (state.extractionStage >= 150)
      return { label: "Severe Stress", color: "text-rose-600" };
    if (state.extractionStage >= 120)
      return { label: "High Stress", color: "text-red-600" };
    if (state.extractionStage >= 100)
      return { label: "Threshold", color: "text-orange-600" };
    if (state.extractionStage >= 80)
      return { label: "Watch", color: "text-yellow-600" };
    return { label: "Stable", color: "text-green-600" };
  })();

  // Derived metrics
  const latest = state.timeSeries[state.timeSeries.length - 1];
  const first = state.timeSeries[0];
  const extractionGrowthPct = (
    ((latest.extraction - first.extraction) / first.extraction) *
    100
  ).toFixed(1);
  const rechargeChangePct = (
    ((latest.recharge - first.recharge) / first.recharge) *
    100
  ).toFixed(1);

  const netSeries = state.timeSeries.map((d) => ({ year: d.year, net: d.net }));

  // Shared chart tooltip
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white/95 backdrop-blur-sm rounded-lg border shadow-sm text-xs space-y-1">
          <div className="font-semibold text-slate-800">{label}</div>
          {payload.map((p: any) => (
            <div key={p.dataKey} className="flex justify-between gap-4">
              <span className="text-slate-500">{p.name}</span>
              <span className="font-medium text-slate-800">{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full"
    >
      <Card className="w-full overflow-hidden bg-white shadow-xl border border-slate-200">
        {/* Accent bar */}
        <div
          className={`h-2 bg-gradient-to-r ${categoryColors[state.category]}`}
        ></div>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-3 items-start">
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${state.gradient} text-white shadow`}
              >
                <Gauge className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  {state.name} Groundwater Profile
                  <Badge
                    variant="outline"
                    className="border-slate-300 text-slate-600 bg-slate-50"
                  >
                    {state.category}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Extraction Stage {state.extractionStage}% ·{" "}
                  {stageStatus.label} · Decline {state.annualDeclineM} m/yr
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-slate-800 text-white">
                Net {latest.net.toFixed(1)} HAM
              </Badge>
              <Badge variant="outline" className="border-slate-300">
                Growth {extractionGrowthPct}%
              </Badge>
              <Badge variant="outline" className="border-slate-300">
                Recharge {rechargeChangePct}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2 space-y-6">
          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-medium">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-md transition-all ${
                  activeTab === t.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-3 gap-6"
              >
                <div className="md:col-span-2 space-y-4">
                  <div className="h-64 bg-slate-50 rounded-lg border p-4 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={state.timeSeries}
                        margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                      >
                        <defs>
                          <linearGradient
                            id="extractionGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={state.color}
                              stopOpacity={0.45}
                            />
                            <stop
                              offset="95%"
                              stopColor={state.color}
                              stopOpacity={0.05}
                            />
                          </linearGradient>
                          <linearGradient
                            id="rechargeGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#0ea5e9"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor="#0ea5e9"
                              stopOpacity={0.05}
                            />
                          </linearGradient>
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
                          tick={{ fontSize: 11, fill: "#64748b" }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: "#64748b" }}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="recharge"
                          name="Recharge"
                          stroke="#0284c7"
                          strokeWidth={2}
                          fill="url(#rechargeGrad)"
                        />
                        <Area
                          type="monotone"
                          dataKey="extraction"
                          name="Extraction"
                          stroke={state.color}
                          strokeWidth={2}
                          fill="url(#extractionGrad)"
                        />
                        <Line
                          type="monotone"
                          dataKey="net"
                          name="Net"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={{ r: 4, fill: "#6366f1" }}
                          strokeDasharray="5 4"
                        />
                        <Bar
                          dataKey="extraction"
                          name="Extraction Bars"
                          opacity={0}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-slate-50 to-white border">
                      <p className="text-slate-500">Stage</p>
                      <p className="text-lg font-bold text-slate-800">
                        {state.extractionStage}%
                      </p>
                      <p
                        className={`text-[10px] mt-1 font-medium ${stageStatus.color}`}
                      >
                        {stageStatus.label}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-slate-50 to-white border">
                      <p className="text-slate-500">Decline</p>
                      <p className="text-lg font-bold text-slate-800">
                        {state.annualDeclineM} m/yr
                      </p>
                      <p className="text-[10px] mt-1 text-slate-500">
                        Latest trend
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-slate-50 to-white border">
                      <p className="text-slate-500">Extraction Growth</p>
                      <p className="text-lg font-bold text-slate-800">
                        {extractionGrowthPct}%
                      </p>
                      <p className="text-[10px] mt-1 text-slate-500">
                        Since {first.year}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-slate-50 to-white border">
                      <p className="text-slate-500">Recharge Change</p>
                      <p className="text-lg font-bold text-slate-800">
                        {rechargeChangePct}%
                      </p>
                      <p className="text-[10px] mt-1 text-slate-500">
                        Since {first.year}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-white border text-xs space-y-3">
                    <div className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
                      <Info className="h-4 w-4" /> Snapshot
                    </div>
                    <p className="leading-relaxed text-slate-600">
                      {state.notes ||
                        `${state.name} shows an extraction stage of ${
                          state.extractionStage
                        }% indicating ${stageStatus.label.toLowerCase()} conditions. Annual decline is ${
                          state.annualDeclineM
                        } m and net balance is ${latest.net.toFixed(1)} HAM.`}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-white border text-xs space-y-3">
                    <div className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
                      <BarChart2 className="h-4 w-4" /> Recharge Composition
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={state.rechargeComponents}>
                          <PolarGrid />
                          <PolarAngleAxis
                            dataKey="name"
                            tick={{ fontSize: 10 }}
                          />
                          <PolarRadiusAxis
                            angle={30}
                            domain={[
                              0,
                              Math.max(
                                ...state.rechargeComponents.map((r) => r.value)
                              ),
                            ]}
                            tick={false}
                          />
                          <Radar
                            dataKey="value"
                            stroke={state.color}
                            fill={state.color}
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "sectors" && (
              <motion.div
                key="sectors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                      <BarChart3 className="h-4 w-4" /> Sector Distribution
                    </h4>
                    <div className="space-y-2">
                      {state.sectors.map((s, idx) => {
                        const Icon =
                          s.icon || sectorIconFallback[s.name] || Activity;
                        return (
                          <div key={s.name} className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-24">
                              <Icon
                                className="h-3.5 w-3.5"
                                style={{ color: s.color }}
                              />
                              <span className="text-xs text-slate-600 truncate">
                                {s.name}
                              </span>
                            </div>
                            <div className="flex-1 bg-slate-100 rounded-full h-4 relative overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${s.value}%` }}
                                transition={{ duration: 1, delay: idx * 0.05 }}
                                className="h-full rounded-full"
                                style={{ background: s.color }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-medium text-white drop-shadow-sm">
                                  {s.value}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-[11px] text-slate-500 pt-2">
                      Agriculture share dominance highlights irrigation
                      dependency. Diversification & efficiency tech could reduce
                      pressure.
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4" /> Extraction Drivers
                    </h4>
                    <div className="space-y-2">
                      {state.drivers.map((d, idx) => (
                        <div key={d.name} className="flex items-center gap-3">
                          <div className="w-28 text-xs text-slate-600 truncate">
                            {d.name}
                          </div>
                          <div className="flex-1 bg-slate-100 rounded-full h-3 relative overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${d.impact}%` }}
                              transition={{
                                duration: 0.9,
                                delay: 0.3 + idx * 0.06,
                              }}
                              className="h-full rounded-full bg-gradient-to-r from-slate-600 to-slate-400"
                            />
                          </div>
                          <div className="text-[10px] font-medium text-slate-700 w-8">
                            {d.impact}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-500 pt-2">
                      High-impact structural drivers require policy & incentive
                      realignment for sustainable withdrawal.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "trends" && (
              <motion.div
                key="trends"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="h-72 bg-slate-50 border rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={state.timeSeries}
                      margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
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
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="recharge"
                        name="Recharge"
                        stroke="#0284c7"
                        strokeWidth={2}
                        fill="#0284c7"
                        fillOpacity={0.15}
                      />
                      <Area
                        type="monotone"
                        dataKey="extraction"
                        name="Extraction"
                        stroke={state.color}
                        strokeWidth={2}
                        fill={state.color}
                        fillOpacity={0.15}
                      />
                      <Line
                        type="monotone"
                        dataKey="net"
                        name="Net"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#6366f1" }}
                        strokeDasharray="4 3"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-slate-50 to-white border">
                    <p className="text-slate-500">Net Latest</p>
                    <p className="text-lg font-bold text-slate-800">
                      {latest.net.toFixed(1)} HAM
                    </p>
                    <p className="text-[10px] mt-1 text-slate-500">Balance</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-slate-50 to-white border">
                    <p className="text-slate-500">Peak Extraction</p>
                    <p className="text-lg font-bold text-slate-800">
                      {Math.max(...state.timeSeries.map((d) => d.extraction))}
                    </p>
                    <p className="text-[10px] mt-1 text-slate-500">
                      Yearly Max
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-slate-50 to-white border">
                    <p className="text-slate-500">Lowest Recharge</p>
                    <p className="text-lg font-bold text-slate-800">
                      {Math.min(...state.timeSeries.map((d) => d.recharge))}
                    </p>
                    <p className="text-[10px] mt-1 text-slate-500">
                      Sensitivity
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-slate-50 to-white border">
                    <p className="text-slate-500">Extraction Δ</p>
                    <p className="text-lg font-bold text-slate-800">
                      {(+extractionGrowthPct).toFixed(1)}%
                    </p>
                    <p className="text-[10px] mt-1 text-slate-500">
                      Since {first.year}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "recharge" && (
              <motion.div
                key="recharge"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-slate-50 border">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                      <Droplets className="h-4 w-4" /> Composition Radar
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={state.rechargeComponents}>
                          <PolarGrid />
                          <PolarAngleAxis
                            dataKey="name"
                            tick={{ fontSize: 10 }}
                          />
                          <PolarRadiusAxis
                            angle={30}
                            domain={[
                              0,
                              Math.max(
                                ...state.rechargeComponents.map((r) => r.value)
                              ),
                            ]}
                            tick={false}
                          />
                          <Radar
                            dataKey="value"
                            stroke={state.color}
                            fill={state.color}
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border space-y-3">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4" /> Component Breakdown
                    </h4>
                    <div className="space-y-2 text-xs">
                      {state.rechargeComponents.map((rc) => (
                        <div key={rc.name} className="flex items-center gap-2">
                          <div className="w-28 text-slate-600 truncate">
                            {rc.name}
                          </div>
                          <div className="flex-1 bg-slate-200/60 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${
                                  (rc.value /
                                    Math.max(
                                      ...state.rechargeComponents.map(
                                        (r) => r.value
                                      )
                                    )) *
                                  100
                                }%`,
                              }}
                              transition={{ duration: 0.8 }}
                              className="h-full bg-gradient-to-r from-slate-600 to-slate-400"
                            />
                          </div>
                          <div className="w-10 text-right font-medium text-slate-700">
                            {rc.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500 pt-2">
                      Higher rainfall recharge dominance suggests vulnerability
                      to climate variability if monsoon weakens.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "drivers" && (
              <motion.div
                key="drivers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                    <Flame className="h-4 w-4" /> Pressure Drivers
                  </h4>
                  <div className="space-y-3">
                    {state.drivers.map((d, idx) => (
                      <div key={d.name} className="flex items-center gap-3">
                        <div className="w-28 text-xs text-slate-600 truncate">
                          {d.name}
                        </div>
                        <div className="flex-1 bg-slate-100 rounded-full h-3 relative overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${d.impact}%` }}
                            transition={{ duration: 1, delay: idx * 0.08 }}
                            className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500"
                          />
                        </div>
                        <div className="text-[10px] font-medium text-slate-700 w-8">
                          {d.impact}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Drivers with &gt;75 impact require structural or
                    policy-based mitigation to bend trajectory.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "risk" && (
              <motion.div
                key="risk"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" /> Composite Risk Matrix
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {state.riskFactors.map((rf) => (
                      <div
                        key={rf.factor}
                        className="p-3 bg-slate-50 rounded-lg border text-xs space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-700 truncate">
                            {rf.factor}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Weight {rf.weight}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-200/60 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${rf.score}%` }}
                              transition={{ duration: 0.8 }}
                              className="h-full bg-gradient-to-r from-rose-600 to-orange-500"
                            />
                          </div>
                          <div className="w-8 text-right font-semibold text-slate-700">
                            {rf.score}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Composite risk integrates hydroclimatic variability,
                    structural overuse, and adaptive capacity limitations.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "actions" && (
              <motion.div
                key="actions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4" /> Strategic Intervention
                    Stack
                  </h4>
                  <ol className="space-y-2 list-decimal list-inside text-xs text-slate-700">
                    {state.recommendations.map((rec, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {rec}
                      </li>
                    ))}
                  </ol>
                  <p className="text-[11px] text-slate-500">
                    Prioritize quick wins (efficiency tech, monitoring) while
                    phasing structural changes (cropping pattern shifts).{" "}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-xs">
              Export State Report
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Compare with Another State
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Drill into Districts
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StateDeepDiveCard;
