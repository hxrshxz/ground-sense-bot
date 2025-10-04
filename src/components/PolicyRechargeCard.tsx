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
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { IngresContextHeader } from "./IngresContextHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  TrendingUp,
  Layers,
  Droplets,
  Clock,
  Zap,
  CheckCircle,
  AlertCircle,
  Settings,
  Calendar,
  BarChart3,
  GitBranch,
  Target,
} from "lucide-react";

interface Measure {
  name: string;
  addedRecharge: number; // ham (relative index scaled)
  feasibility: number; // 1-5
  leadYears: number;
  priority: "High" | "Med" | "Low";
  costEffectiveness: number; // 1-5
  implementationComplexity: number; // 1-5
  annualMaintenance: number; // relative cost index
}

interface Props {
  region?: string;
  baselineRecharge?: number;
  measures?: Measure[];
}

const defaultMeasures: Measure[] = [
  {
    name: "Canal Lining Repair",
    addedRecharge: 18,
    feasibility: 4,
    leadYears: 2,
    priority: "High",
    costEffectiveness: 4,
    implementationComplexity: 3,
    annualMaintenance: 2,
  },
  {
    name: "Recharge Shafts (Public)",
    addedRecharge: 22,
    feasibility: 3,
    leadYears: 3,
    priority: "High",
    costEffectiveness: 3,
    implementationComplexity: 4,
    annualMaintenance: 3,
  },
  {
    name: "Check Dam Desilting",
    addedRecharge: 11,
    feasibility: 5,
    leadYears: 1,
    priority: "Med",
    costEffectiveness: 5,
    implementationComplexity: 2,
    annualMaintenance: 2,
  },
  {
    name: "Managed Aquifer Injection",
    addedRecharge: 15,
    feasibility: 2,
    leadYears: 4,
    priority: "Med",
    costEffectiveness: 2,
    implementationComplexity: 5,
    annualMaintenance: 4,
  },
  {
    name: "Stormwater Harvest Parks",
    addedRecharge: 9,
    feasibility: 3,
    leadYears: 3,
    priority: "Low",
    costEffectiveness: 3,
    implementationComplexity: 3,
    annualMaintenance: 2,
  },
  {
    name: "Wetland Restoration",
    addedRecharge: 14,
    feasibility: 4,
    leadYears: 2,
    priority: "Med",
    costEffectiveness: 4,
    implementationComplexity: 3,
    annualMaintenance: 1,
  },
];

export const PolicyRechargeCard: React.FC<Props> = ({
  region = "Target Over-Exploited Blocks",
  baselineRecharge = 100,
  measures = defaultMeasures,
}) => {
  const [activeView, setActiveView] = useState<
    "impact" | "timeline" | "matrix"
  >("impact");

  const maxRecharge = Math.max(...measures.map((m) => m.addedRecharge));
  const totalPotentialRecharge = measures.reduce(
    (sum, m) => sum + m.addedRecharge,
    0
  );

  // Calculate implementation timeline data
  const timelineData = Array.from({ length: 5 }, (_, year) => ({
    year: 2025 + year,
    cumulative: measures
      .filter((m) => m.leadYears <= year + 1)
      .reduce((sum, m) => sum + m.addedRecharge, 0),
    annual: measures
      .filter((m) => m.leadYears === year + 1)
      .reduce((sum, m) => sum + m.addedRecharge, 0),
  }));

  // Priority-based enhancements
  const enhancedMeasures = measures
    .map((m) => ({
      ...m,
      priorityScore:
        m.addedRecharge * 0.3 +
        m.feasibility * 10 +
        m.costEffectiveness * 8 +
        (6 - m.leadYears) * 5,
      color:
        m.priority === "High"
          ? "#10b981"
          : m.priority === "Med"
          ? "#f59e0b"
          : "#64748b",
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const quickWins = enhancedMeasures.filter(
    (m) => m.leadYears <= 2 && m.feasibility >= 4
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="w-full overflow-hidden bg-white shadow-lg">
        <IngresContextHeader
          title="INGRES ChatBOT · Recharge Intervention Prioritization"
          subtitle={`Portfolio evaluation for ${region}. AI ranks structural & nature-based options by modeled recharge uplift, feasibility, latency and complexity to support movement away from Over-Exploited classification.`}
          moduleTag="Recharge Module"
          stage={"Over-Exploited"}
          accent="sky"
          extraBadges={
            <>
              <Badge
                variant="outline"
                className="bg-sky-50 text-sky-700 border-sky-200"
              >
                {measures.length} Measures
              </Badge>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                +{totalPotentialRecharge}% Potential
              </Badge>
            </>
          }
        />

        <CardContent className="space-y-8">
          <div className="text-xs text-slate-600 leading-relaxed bg-sky-50/40 border border-sky-100 rounded-md p-3">
            Scoring model: Added recharge (30% weight), feasibility,
            cost-effectiveness, and inverted latency weighting. Early
            acceleration targets short-cycle uplift to stabilize extraction
            imbalance in high stress assessment units.
          </div>

          {/* KPI Summary for Quick Wins */}
          <div className="grid md:grid-cols-3 gap-4 p-4 rounded-xl bg-gradient-to-r from-sky-50 via-white to-blue-50 border border-sky-200/60">
            {quickWins.slice(0, 3).map((measure, index) => (
              <motion.div
                key={measure.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-lg border border-sky-200/70 bg-white/70 backdrop-blur-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-sky-50/40 to-white/10" />
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-md bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm">
                      <CheckCircle className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-medium tracking-wide text-slate-600 uppercase">
                      Quick Win #{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold">
                    <Clock className="h-3 w-3 text-sky-500" />
                    <span className="text-sky-600">{measure.leadYears}y</span>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-sm font-bold text-slate-800 mb-1">
                    {measure.name}
                  </div>
                  <div className="text-xs text-slate-600">
                    +{measure.addedRecharge}% recharge potential
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Feasibility:</span>
                    <span className="ml-1 font-semibold">
                      {measure.feasibility}/5
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Cost-Eff:</span>
                    <span className="ml-1 font-semibold">
                      {measure.costEffectiveness}/5
                    </span>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-slate-100 overflow-hidden mt-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        (measure.priorityScore /
                          Math.max(
                            ...enhancedMeasures.map((m) => m.priorityScore)
                          )) *
                        100
                      }%`,
                    }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    className="h-full bg-gradient-to-r from-sky-500 to-blue-600"
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div
            className="flex bg-slate-100 rounded-lg p-1"
            role="tablist"
            aria-label="Policy analysis views"
          >
            {[
              { key: "impact", label: "Impact Analysis", icon: BarChart3 },
              {
                key: "timeline",
                label: "Implementation Timeline",
                icon: Calendar,
              },
              { key: "matrix", label: "Priority Matrix", icon: Target },
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
            {/* Impact Analysis Tab */}
            {activeView === "impact" && (
              <motion.div
                key="impact"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-12 gap-3 text-[11px] font-medium text-slate-600 px-2">
                  <div className="col-span-4">Policy Measure</div>
                  <div className="col-span-3">Recharge Impact</div>
                  <div className="col-span-2 text-center">Feasibility</div>
                  <div className="col-span-2 text-center">Timeline</div>
                  <div className="col-span-1 text-center">Priority</div>
                </div>
                <div className="space-y-3">
                  {enhancedMeasures.map((m, index) => (
                    <motion.div
                      key={m.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg hover:bg-slate-50/80 border border-slate-100/60 group"
                    >
                      <div className="col-span-4 flex items-center gap-2 font-medium text-slate-700">
                        <Layers className="h-4 w-4 text-sky-500" />
                        <span className="text-sm">{m.name}</span>
                      </div>
                      <div className="col-span-3">
                        <div className="h-4 w-full bg-slate-100/80 rounded-full relative overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                (m.addedRecharge / maxRecharge) * 100
                              }%`,
                            }}
                            transition={{
                              duration: 1,
                              delay: 0.2 + index * 0.05,
                            }}
                            className="h-full rounded-full shadow-inner"
                            style={{
                              background: `linear-gradient(90deg, ${m.color} 0%, ${m.color}CC 60%, ${m.color}99 100%)`,
                              boxShadow:
                                "0 0 0 1px rgba(255,255,255,0.15) inset",
                            }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white drop-shadow">
                            +{m.addedRecharge}%
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {m.feasibility >= 4 ? (
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                          ) : m.feasibility >= 3 ? (
                            <AlertCircle className="h-3 w-3 text-amber-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span className="font-semibold text-sm">
                            {m.feasibility}/5
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span className="font-semibold text-sm">
                            {m.leadYears} years
                          </span>
                        </div>
                      </div>
                      <div className="col-span-1 text-center">
                        <Badge
                          className={`text-xs ${
                            m.priority === "High"
                              ? "bg-emerald-500"
                              : m.priority === "Med"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                          } text-white`}
                        >
                          {m.priority}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Timeline Tab */}
            {activeView === "timeline" && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-sky-500" />
                  5-Year Implementation Roadmap
                </h4>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/70 relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(circle_at_30%_70%,rgba(56,189,248,0.1),transparent_70%)]" />
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart
                      data={timelineData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="year"
                        tick={{ fontSize: 12, fill: "#475569" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#475569" }}
                        axisLine={false}
                        tickLine={false}
                        label={{
                          value: "Recharge Potential %",
                          angle: -90,
                          position: "insideLeft",
                          style: {
                            textAnchor: "middle",
                            fontSize: "11px",
                            fill: "#64748b",
                          },
                        }}
                      />
                      <ReTooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="rounded-md border bg-white/90 backdrop-blur-md shadow-sm px-3 py-2 text-[11px] text-slate-700">
                              <div className="font-semibold text-slate-800 text-xs mb-1">
                                Year {label}
                              </div>
                              <div>
                                Annual Addition: +
                                {
                                  payload.find((p) => p.dataKey === "annual")
                                    ?.value
                                }
                                %
                              </div>
                              <div>
                                Cumulative: +
                                {
                                  payload.find(
                                    (p) => p.dataKey === "cumulative"
                                  )?.value
                                }
                                %
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="annual"
                        fill="#0ea5e9"
                        name="Annual Addition"
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="Cumulative Impact"
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Priority Matrix Tab */}
            {activeView === "matrix" && (
              <motion.div
                key="matrix"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Target className="h-5 w-5 text-sky-500" />
                  Feasibility vs Impact Matrix
                </h4>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold text-slate-600 uppercase flex items-center gap-2">
                      <span className="h-1 w-6 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
                      High Priority Actions
                    </h5>
                    <div className="space-y-3">
                      {enhancedMeasures
                        .filter((m) => m.priority === "High")
                        .map((measure, index) => (
                          <motion.div
                            key={measure.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-emerald-800">
                                {measure.name}
                              </span>
                              <Badge className="bg-emerald-500 text-white">
                                +{measure.addedRecharge}%
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-emerald-700">
                              <div>Feasibility: {measure.feasibility}/5</div>
                              <div>Lead Time: {measure.leadYears}y</div>
                              <div>Cost-Eff: {measure.costEffectiveness}/5</div>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold text-slate-600 uppercase flex items-center gap-2">
                      <span className="h-1 w-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                      Strategic Considerations
                    </h5>
                    <div className="space-y-3">
                      {enhancedMeasures
                        .filter((m) => m.priority === "Med")
                        .slice(0, 3)
                        .map((measure, index) => (
                          <motion.div
                            key={measure.name}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-amber-800">
                                {measure.name}
                              </span>
                              <Badge className="bg-amber-500 text-white">
                                +{measure.addedRecharge}%
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-amber-700">
                              <div>Feasibility: {measure.feasibility}/5</div>
                              <div>Lead Time: {measure.leadYears}y</div>
                              <div>
                                Complexity: {measure.implementationComplexity}/5
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Strategic Insights */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200/80 rounded-lg p-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>INGRES portfolio advisory:</strong> Execute{" "}
              {quickWins[0]?.name} & {quickWins[1]?.name} first for{" "}
              {quickWins.slice(0, 2).reduce((s, m) => s + m.addedRecharge, 0)}%
              modeled uplift ≤24 months. Staging{" "}
              {enhancedMeasures.find((m) => m.leadYears >= 4)?.name ||
                "long-latency asset"}{" "}
              post early uplift avoids capital inertia. Indicative trajectory
              shift (if abstraction moderates): Over-Exploited → Critical within
              first cycle.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Policy Details
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <GitBranch className="h-3 w-3 mr-1" />
              Implementation Plan
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Impact Projections
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PolicyRechargeCard;
