import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend as ReLegend,
  CartesianGrid,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingDown,
  MapPin,
  Download,
  BarChart3,
  Droplets,
  AlertTriangle,
  Factory,
  Sprout,
  Home,
  Building,
  Zap,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

// Static illustrative dataset (could be replaced by fetched analytics or AI-derived comparative insights)
const stateComparisonData = {
  states: {
    punjab: {
      name: "Punjab",
      color: "#ef4444",
      gradient: "from-red-500 to-orange-500",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      extraction: 85.2,
      recharge: 52.8,
      stage: 161, // % extraction
      decline: 0.75, // meters per year
      category: "Over-Exploited",
      sectors: [
        { name: "Agriculture", value: 78, color: "#10b981", icon: Sprout },
        { name: "Domestic", value: 15, color: "#3b82f6", icon: Home },
        { name: "Industrial", value: 5, color: "#8b5cf6", icon: Factory },
        { name: "Commercial", value: 2, color: "#f59e0b", icon: Building },
      ],
      drivers: [
        { name: "Paddy Cultivation", impact: 92 },
        { name: "Free Electricity", impact: 85 },
        { name: "Dense Tubewell Network", impact: 78 },
        { name: "MSP Policy", impact: 65 },
      ],
    },
    rajasthan: {
      name: "Rajasthan",
      color: "#f59e0b",
      gradient: "from-amber-500 to-yellow-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      extraction: 62.4,
      recharge: 45.2,
      stage: 138, // % extraction
      decline: 0.45, // meters per year
      category: "Critical",
      sectors: [
        { name: "Agriculture", value: 65, color: "#10b981", icon: Sprout },
        { name: "Domestic", value: 22, color: "#3b82f6", icon: Home },
        { name: "Industrial", value: 8, color: "#8b5cf6", icon: Factory },
        { name: "Commercial", value: 5, color: "#f59e0b", icon: Building },
      ],
      drivers: [
        { name: "Low Rainfall", impact: 88 },
        { name: "Expanding Irrigation", impact: 72 },
        { name: "Water Quality Issues", impact: 68 },
        { name: "Desert Agriculture", impact: 55 },
      ],
    },
  },
  timeSeriesDecline: {
    years: [2015, 2017, 2019, 2021, 2023, 2025],
    punjab: [2.1, 3.8, 5.2, 6.9, 8.1, 9.5],
    rajasthan: [1.8, 2.5, 3.1, 3.8, 4.2, 4.7],
  },
};

const StateComparisonCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "sectors" | "decline"
  >("overview");

  const { punjab, rajasthan } = stateComparisonData.states;
  const maxExtraction = Math.max(punjab.extraction, rajasthan.extraction);
  const maxRecharge = Math.max(punjab.recharge, rajasthan.recharge);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="w-full overflow-hidden bg-white shadow-lg">
        <div className="h-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"></div>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-red-100 to-amber-100">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">
                  State Comparison: Punjab vs Rajasthan
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Comprehensive groundwater crisis analysis
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200"
              >
                Punjab: Over-Exploited
              </Badge>
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200"
              >
                Rajasthan: Critical
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* KPI Summary Strip: immediate comparative deltas for executive glance */}
          <div className="grid md:grid-cols-4 gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-200/60">
            {[
              {
                label: "Total Extraction",
                punjab: `${punjab.extraction} BCM`,
                rajasthan: `${rajasthan.extraction} BCM`,
                delta: punjab.extraction - rajasthan.extraction,
                icon: BarChart3,
                accent: "from-red-500 to-orange-500",
              },
              {
                label: "Total Recharge",
                punjab: `${punjab.recharge} BCM`,
                rajasthan: `${rajasthan.recharge} BCM`,
                delta: punjab.recharge - rajasthan.recharge,
                icon: Droplets,
                accent: "from-cyan-500 to-blue-500",
              },
              {
                label: "Stage of Dev.",
                punjab: `${punjab.stage}%`,
                rajasthan: `${rajasthan.stage}%`,
                delta: punjab.stage - rajasthan.stage,
                icon: Zap,
                accent: "from-purple-500 to-violet-500",
              },
              {
                label: "Annual Decline",
                punjab: `${punjab.decline} m/yr`,
                rajasthan: `${rajasthan.decline} m/yr`,
                delta: punjab.decline - rajasthan.decline,
                icon: TrendingDown,
                accent: "from-rose-500 to-red-500",
              },
            ].map((kpi) => {
              const Icon = kpi.icon;
              const worse = kpi.delta > 0; // positive means Punjab higher
              return (
                <div
                  key={kpi.label}
                  className="group relative overflow-hidden rounded-lg border border-slate-200/70 bg-white/70 backdrop-blur-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-slate-50/40 to-white/10" />
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`p-2 rounded-md bg-gradient-to-br ${kpi.accent} text-white shadow-sm`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-medium tracking-wide text-slate-600 uppercase">
                        {kpi.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-semibold">
                      {worse ? (
                        <ArrowUp className="h-3 w-3 text-red-500" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-green-500" />
                      )}
                      <span className={worse ? "text-red-600" : "text-green-600"}>
                        {worse ? "+" : ""}
                        {kpi.delta.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] font-medium text-slate-500 mb-1">Punjab</div>
                      <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent leading-none">
                        {kpi.punjab}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-slate-500 mb-1">Rajasthan</div>
                      <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent leading-none">
                        {kpi.rajasthan}
                      </div>
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                    {/* small relative bar comparing Punjab vs Rajasthan */}
                    {(() => {
                      const p = Math.abs(kpi.delta);
                      const total = Math.max(punjab.extraction, rajasthan.extraction);
                      // Fallback simple percentage for generic KPI (not exact for stage/decline but conveys delta visually)
                      const ratio = Math.min(100, (p / total) * 100);
                      return (
                        <div
                          className="h-full bg-gradient-to-r from-slate-400/40 via-slate-500/50 to-slate-600/60"
                          style={{ width: `${ratio}%` }}
                        />
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Tab Navigation */}
          <div className="flex bg-slate-100 rounded-lg p-1" role="tablist" aria-label="State comparison sections">
            {[
              { key: "overview", label: "Overview", icon: MapPin },
              { key: "sectors", label: "Sector Usage", icon: BarChart3 },
              { key: "decline", label: "Water Table", icon: TrendingDown },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`panel-${tab.key}`}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.key
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
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                role="tabpanel"
                id="panel-overview"
                aria-labelledby="panel-overview"
              >
                {/* Extraction vs Recharge Comparison */}
                <div className="grid md:grid-cols-2 gap-8">
                  {[punjab, rajasthan].map((state) => (
                    <div key={state.name} className="space-y-5">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100/70">
                        <h4 className="text-base md:text-lg font-semibold text-slate-800 flex items-center gap-2 tracking-tight">
                          <MapPin
                            className="h-4 w-4"
                            style={{ color: state.color }}
                          />
                          {state.name}
                        </h4>
                        <Badge
                          className={`${state.bgColor} ${state.textColor} border-0`}
                        >
                          {state.stage}% Stage
                        </Badge>
                      </div>

                      {/* Extraction Bar */}
                      <div className="space-y-2" aria-label={`${state.name} extraction volume`}>
                        <div className="flex justify-between text-xs md:text-sm font-medium tracking-wide">
                          <span className="text-slate-500 uppercase">Extraction</span>
                          <span className="text-slate-800">
                            {state.extraction} <span className="text-[10px] font-normal text-slate-500">BCM</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100/80 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                (state.extraction / maxExtraction) * 100
                              }%`,
                            }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="h-full rounded-full bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 shadow-inner"
                            style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.15) inset` }}
                          />
                        </div>
                      </div>

                      {/* Recharge Bar */}
                      <div className="space-y-2" aria-label={`${state.name} recharge volume`}>
                        <div className="flex justify-between text-xs md:text-sm font-medium tracking-wide">
                          <span className="text-slate-500 uppercase">Recharge</span>
                          <span className="text-slate-800">
                            {state.recharge} <span className="text-[10px] font-normal text-slate-500">BCM</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100/80 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(state.recharge / maxRecharge) * 100}%`,
                            }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-400 shadow-inner"
                          />
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div
                          className={`p-2.5 ${state.bgColor} rounded-md text-center border border-white/60 shadow-sm`}
                        >
                          <div
                            className="font-bold text-base md:text-lg tracking-tight"
                            style={{ color: state.color }}
                          >
                            {state.decline}m
                          </div>
                          <div className="text-slate-600">Annual Decline</div>
                        </div>
                        <div
                          className={`p-2.5 ${state.bgColor} rounded-md text-center border border-white/60 shadow-sm`}
                        >
                          <div
                            className="font-bold text-base md:text-lg tracking-tight"
                            style={{ color: state.color }}
                          >
                            {state.category.split("-")[0]}
                          </div>
                          <div className="text-slate-600">Category</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Drivers Comparison */}
                <div className="grid md:grid-cols-2 gap-8">
                  {[punjab, rajasthan].map((state) => (
                    <div key={`${state.name}-drivers`} className="space-y-4">
                      <h5 className="text-sm font-semibold tracking-wide text-slate-600 uppercase flex items-center gap-2">
                        <span className="h-1 w-6 rounded-full bg-gradient-to-r from-slate-400 to-slate-600" />
                        Key Drivers – {state.name}
                      </h5>
                      <div className="space-y-2.5">
                        {state.drivers.map((driver, index) => (
                          <div
                            key={driver.name}
                            className="flex items-center gap-3 group"
                          >
                            <div className="w-28 text-[11px] text-slate-500 truncate font-medium group-hover:text-slate-700 transition-colors">
                              {driver.name}
                            </div>
                            <div className="flex-1 bg-slate-100 rounded-full h-2.5 relative overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${driver.impact}%` }}
                                transition={{
                                  duration: 0.8,
                                  delay: 0.6 + index * 0.1,
                                }}
                                className="h-full rounded-full bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500"
                                style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.15) inset" }}
                              />
                            </div>
                            <div className="text-[11px] font-semibold text-slate-700 w-8 tabular-nums">
                              {driver.impact}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Sectors Tab */}
            {activeTab === "sectors" && (
              <motion.div
                key="sectors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                role="tabpanel"
                id="panel-sectors"
                aria-labelledby="panel-sectors"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {[punjab, rajasthan].map((state) => (
                    <div key={`${state.name}-sectors`} className="space-y-4">
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Droplets
                          className="h-4 w-4"
                          style={{ color: state.color }}
                        />
                        {state.name} Usage by Sector
                      </h4>

                      {/* Sector Breakdown */}
                      <div className="space-y-3">
                        {state.sectors.map((sector, index) => {
                          const Icon = sector.icon;
                          return (
                            <div
                              key={sector.name}
                              className="flex items-center gap-3"
                              aria-label={`${state.name} ${sector.name} usage ${sector.value}%`}
                            >
                              <div className="flex items-center gap-2 w-20">
                                <Icon
                                  className="h-3 w-3"
                                  style={{ color: sector.color }}
                                />
                                <span className="text-xs text-slate-600 truncate">
                                  {sector.name}
                                </span>
                              </div>
                              <div className="flex-1 bg-slate-100/80 rounded-full h-4 relative overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${sector.value}%` }}
                                  transition={{
                                    duration: 1,
                                    delay: index * 0.1,
                                  }}
                                  className="h-full rounded-full shadow-inner"
                                  style={{
                                    background: `linear-gradient(90deg, ${sector.color} 0%, ${sector.color}CC 60%, ${sector.color}99 100%)`,
                                    boxShadow: "0 0 0 1px rgba(255,255,255,0.15) inset",
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[10px] font-semibold tracking-wide text-white drop-shadow">{sector.value}%</span>
                                </div>
                                <div className="absolute inset-0 opacity-0 animate-pulse group-hover:opacity-40 transition-opacity bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.9),transparent_70%)]" />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Agriculture Dominance Alert */}
                      <div
                        className={`p-3 ${state.bgColor} rounded-lg flex items-center gap-2`}
                      >
                        <AlertTriangle
                          className="h-4 w-4"
                          style={{ color: state.color }}
                        />
                        <div className="text-xs">
                          <span className="font-medium">
                            Agriculture dominates:
                          </span>
                          <span className="ml-1">
                            {state.sectors[0].value}% of total usage
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Water Table Decline Tab */}
            {activeTab === "decline" && (
              <motion.div
                key="decline"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                role="tabpanel"
                id="panel-decline"
                aria-labelledby="panel-decline"
              >
                <h4 className="text-lg md:text-xl font-semibold text-slate-800 flex items-center gap-2 tracking-tight">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Cumulative Water Table Decline <span className="text-slate-400 text-sm font-normal">2015–2025</span>
                </h4>

                {/* Grouped bar visualization using Recharts for cumulative decline over time */}
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/70 relative overflow-hidden" aria-label="Cumulative water table decline grouped bar chart" role="group">
                  <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.8),transparent_70%)]" />
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={stateComparisonData.timeSeriesDecline.years.map((year, i) => ({
                        year,
                        Punjab: stateComparisonData.timeSeriesDecline.punjab[i],
                        Rajasthan: stateComparisonData.timeSeriesDecline.rajasthan[i],
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient id="pgBar" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#b91c1c" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="rjBar" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#b45309" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.85} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="year"
                        tick={{ fontSize: 12, fill: "#475569" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `-${v}m`}
                        domain={[0, 10]}
                        ticks={[0, 2.5, 5, 7.5, 10]}
                        tick={{ fontSize: 11, fill: "#475569" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <ReTooltip
                        cursor={{ fill: "rgba(0,0,0,0.04)" }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="rounded-md border bg-white/90 backdrop-blur-md shadow-sm px-3 py-2 text-[11px] text-slate-700">
                              <div className="font-semibold text-slate-800 text-xs mb-1">{label}</div>
                              {payload.map((p) => (
                                <div key={p.dataKey} className="flex items-center gap-2">
                                  <span
                                    className="inline-block w-2.5 h-2.5 rounded-sm"
                                    style={{ background: p.color }}
                                  />
                                  <span className="font-medium w-16">{p.dataKey}</span>
                                  <span className="tabular-nums">-{p.value} m</span>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      />
                      <ReLegend
                        wrapperStyle={{ fontSize: 12 }}
                        formatter={(v) => <span className="text-slate-600 font-medium">{v}</span>}
                        iconType="circle"
                      />
                      <Bar
                        dataKey="Punjab"
                        fill="url(#pgBar)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        dataKey="Rajasthan"
                        fill="url(#rjBar)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="absolute left-4 top-4 text-[10px] font-medium text-slate-500 uppercase tracking-wide">Cumulative Decline</div>
                </div>

                {/* Decline Rate Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-700 flex items-center justify-center gap-1">
                      <ArrowDown className="h-5 w-5" />
                      0.75m/yr
                    </div>
                    <div className="text-sm text-red-600">
                      Punjab Decline Rate
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      67% faster than Rajasthan
                    </div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-amber-700 flex items-center justify-center gap-1">
                      <ArrowDown className="h-5 w-5" />
                      0.45m/yr
                    </div>
                    <div className="text-sm text-amber-600">
                      Rajasthan Decline Rate
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      More regional variation
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Summary */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200/80 rounded-lg p-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Crisis comparison:</strong> Punjab's rapid depletion
              (0.75m/yr) stems from water-intensive agriculture in naturally
              water-rich areas, while Rajasthan's slower but persistent decline
              (0.45m/yr) reflects natural scarcity amplified by expanding
              irrigation. Both require urgent but tailored intervention
              strategies.
            </p>
          </div>

          {/* Follow-up Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-xs">
              District-level breakdown
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Quality comparison
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="h-3 w-3 mr-1" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StateComparisonCard;
