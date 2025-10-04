import React, { useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend as ReLegend,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { IngresContextHeader } from "./IngresContextHeader";
import { ChartDepthWrapper } from "./ChartDepthWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  Droplets,
  Zap,
  TrendingUp,
  TrendingDown,
  Target,
  Sprout,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Radar as RadarIcon,
} from "lucide-react";

interface CropScenario {
  crop: string;
  waterUse: number; // m3/ha (relative)
  savingVsPaddy: number; // %
  grossMargin: number; // Rs/ha (relative index)
  adoptionEase: number; // 1-5
  riskFactor: number; // 1-5 (climate/market risk)
  yieldStability: number; // 1-5
  groundwaterSustainability: number; // 1-5 (INGRES compatibility)
  rechargeImpact: number; // mm/year potential impact
}

interface Props {
  region?: string;
  baselineCrop?: string;
  scenarios?: CropScenario[];
}

const defaultScenarios: CropScenario[] = [
  {
    crop: "Basmati Rice",
    waterUse: 120,
    savingVsPaddy: -8,
    grossMargin: 85,
    adoptionEase: 4,
    riskFactor: 2,
    yieldStability: 4,
    groundwaterSustainability: 2,
    rechargeImpact: -45,
  },
  {
    crop: "Maize",
    waterUse: 58,
    savingVsPaddy: 42,
    grossMargin: 92,
    adoptionEase: 4,
    riskFactor: 2,
    yieldStability: 4,
    groundwaterSustainability: 4,
    rechargeImpact: 20,
  },
  {
    crop: "Pulses",
    waterUse: 46,
    savingVsPaddy: 54,
    grossMargin: 78,
    adoptionEase: 3,
    riskFactor: 3,
    yieldStability: 3,
    groundwaterSustainability: 5,
    rechargeImpact: 40,
  },
  {
    crop: "Cotton (Short)",
    waterUse: 64,
    savingVsPaddy: 36,
    grossMargin: 110,
    adoptionEase: 2,
    riskFactor: 4,
    yieldStability: 2,
    groundwaterSustainability: 3,
    rechargeImpact: -10,
  },
  {
    crop: "Oilseeds",
    waterUse: 70,
    savingVsPaddy: 30,
    grossMargin: 95,
    adoptionEase: 3,
    riskFactor: 3,
    yieldStability: 3,
    groundwaterSustainability: 4,
    rechargeImpact: 15,
  },
];

export const CropRecommendationCard: React.FC<Props> = ({
  region = "Central Punjab",
  baselineCrop = "Paddy",
  scenarios = defaultScenarios,
}) => {
  const [activeView, setActiveView] = useState<
    "overview" | "scatter" | "radar"
  >("overview");

  const maxMargin = Math.max(...scenarios.map((s) => s.grossMargin));
  const maxWaterSaving = Math.max(...scenarios.map((s) => s.savingVsPaddy));

  // Enhanced scenarios with INGRES groundwater sustainability scoring
  const enhancedScenarios = scenarios
    .map((s, index) => ({
      ...s,
      efficiencyScore:
        s.savingVsPaddy * 0.25 +
        s.grossMargin * 0.15 +
        s.adoptionEase * 6 +
        s.yieldStability * 5 +
        s.groundwaterSustainability * 10 +
        s.rechargeImpact * 0.1 -
        s.riskFactor * 4,
      costEffectiveness: Math.round((s.grossMargin / s.waterUse) * 10) / 10,
      ingresSustainabilityIndex: Math.round(
        (s.groundwaterSustainability * 20 +
          (s.rechargeImpact > 0 ? s.rechargeImpact : 0) +
          (s.savingVsPaddy > 0 ? s.savingVsPaddy : 0)) /
          3
      ),
      color:
        s.groundwaterSustainability >= 4
          ? "#10b981"
          : s.groundwaterSustainability >= 3
          ? "#f59e0b"
          : "#ef4444", // Green for sustainable, amber for moderate, red for unsustainable
    }))
    .sort((a, b) => b.efficiencyScore - a.efficiencyScore);

  const bestAlternatives = enhancedScenarios
    .filter((s) => !s.crop.includes("Paddy"))
    .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="w-full overflow-hidden bg-white shadow-lg">
        <IngresContextHeader
          title="INGRES ChatBOT · Crop Water Transition Intelligence"
          subtitle={`Assessment unit: ${region}. AI-assisted optimization of cropping pattern vs groundwater stress baseline (reference: ${baselineCrop}). Aligns with national dynamic groundwater resource estimation workflow.`}
          moduleTag="Crop Module"
          stage={"Over-Exploited"}
          accent="emerald"
          extraBadges={
            <>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                {scenarios.length} Scenarios
              </Badge>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                AI Ranked
              </Badge>
            </>
          }
        />

        <CardContent className="space-y-8">
          {/* Contextual introduction */}
          <div className="text-xs text-slate-600 leading-relaxed bg-emerald-50/40 border border-emerald-100 rounded-md p-3">
            This module evaluates crop alternatives using INGRES-aligned
            sustainability indices combining relative water demand, economic
            viability, adoption ease, recharge interaction (±mm), and risk
            normalization. Higher ranked options reduce abstraction pressure and
            improve groundwater stage trajectory.
          </div>

          {/* KPI Summary for Top 3 Alternatives */}
          <div className="grid md:grid-cols-3 gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-white to-green-50 border border-emerald-200/60">
            {bestAlternatives.map((crop, index) => (
              <motion.div
                key={crop.crop}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-lg border border-emerald-200/70 bg-white/70 backdrop-blur-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-emerald-50/40 to-white/10" />
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-md bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-sm">
                      <Leaf className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-medium tracking-wide text-slate-600 uppercase">
                      INGRES Rank #{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-600">
                      {crop.efficiencyScore.toFixed(0)}% Score
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-sm font-bold text-slate-800 mb-1">
                    {crop.crop}
                  </div>
                  <div className="text-xs text-slate-600">
                    {crop.savingVsPaddy}% water saved vs paddy · GW Index{" "}
                    {crop.groundwaterSustainability}/5 · Impact{" "}
                    {crop.rechargeImpact > 0 ? "+" : ""}
                    {crop.rechargeImpact}mm
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Margin:</span>
                    <span className="ml-1 font-semibold">
                      {crop.grossMargin}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Ease:</span>
                    <span className="ml-1 font-semibold">
                      {crop.adoptionEase}/5
                    </span>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-slate-100 overflow-hidden mt-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${crop.efficiencyScore}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-600"
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div
            className="flex bg-slate-100 rounded-lg p-1"
            role="tablist"
            aria-label="Crop analysis views"
          >
            {[
              { key: "overview", label: "Overview", icon: BarChart3 },
              { key: "scatter", label: "Risk vs Reward", icon: Target },
              { key: "radar", label: "Multi-Factor", icon: RadarIcon },
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
            {/* Overview Tab */}
            {activeView === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-12 gap-3 text-[11px] font-medium text-slate-600 px-2">
                  <div className="col-span-3">Crop</div>
                  <div className="col-span-4">Water Use vs Baseline</div>
                  <div className="col-span-2 text-center">Saving%</div>
                  <div className="col-span-3 text-center">Economic Margin</div>
                </div>
                <div className="space-y-3">
                  {enhancedScenarios.map((s, index) => (
                    <motion.div
                      key={s.crop}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg hover:bg-slate-50/80 border border-slate-100/60 group"
                    >
                      <div className="col-span-3 flex items-center gap-2 font-medium text-slate-700">
                        {s.crop.includes("Paddy") ? (
                          <Droplets className="h-4 w-4 text-sky-500" />
                        ) : (
                          <Leaf className="h-4 w-4 text-emerald-600" />
                        )}
                        <span className="text-sm">{s.crop}</span>
                      </div>
                      <div className="col-span-4">
                        <div className="h-4 w-full bg-slate-100/80 rounded-full relative overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.waterUse}%` }}
                            transition={{
                              duration: 1,
                              delay: 0.2 + index * 0.05,
                            }}
                            className="h-full rounded-full shadow-inner"
                            style={{
                              background: `linear-gradient(90deg, ${s.color} 0%, ${s.color}CC 60%, ${s.color}99 100%)`,
                              boxShadow:
                                "0 0 0 1px rgba(255,255,255,0.15) inset",
                            }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white drop-shadow">
                            {s.waterUse}%
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {s.savingVsPaddy > 0 ? (
                            <TrendingDown className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <span className="w-3 h-3" />
                          )}
                          <span className="font-semibold tabular-nums text-slate-700 text-sm">
                            {s.savingVsPaddy > 0 ? `-${s.savingVsPaddy}` : "0"}%
                          </span>
                        </div>
                      </div>
                      <div className="col-span-3 text-center">
                        <div className="h-4 w-full bg-slate-100/80 rounded-full relative overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(s.grossMargin / maxMargin) * 100}%`,
                            }}
                            transition={{
                              duration: 1,
                              delay: 0.4 + index * 0.05,
                            }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-inner"
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white drop-shadow">
                            {s.grossMargin}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Scatter Plot Tab */}
            {activeView === "scatter" && (
              <motion.div
                key="scatter"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-500" />
                  Risk vs Economic Return Analysis
                </h4>
                <ChartDepthWrapper
                  glowColor="#10b981"
                  className="bg-transparent"
                >
                  <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_30%_70%,rgba(16,185,129,0.25),transparent_75%)]" />
                  <ResponsiveContainer width="100%" height={380}>
                    <ScatterChart
                      margin={{ top: 30, right: 30, left: 10, bottom: 20 }}
                    >
                      <XAxis
                        dataKey="riskFactor"
                        domain={[1, 5]}
                        tick={{ fontSize: 12, fill: "#475569" }}
                        axisLine={false}
                        tickLine={false}
                        label={{
                          value: "Risk Factor →",
                          position: "insideBottom",
                          offset: -5,
                          style: {
                            textAnchor: "middle",
                            fontSize: "11px",
                            fill: "#64748b",
                          },
                        }}
                      />
                      <YAxis
                        dataKey="grossMargin"
                        tick={{ fontSize: 11, fill: "#475569" }}
                        axisLine={false}
                        tickLine={false}
                        label={{
                          value: "Economic Margin →",
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
                        content={({ active, payload }) => {
                          if (!active || !payload?.[0]) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-md border bg-white/80 backdrop-blur-xl shadow-xl px-4 py-3 text-[11px] text-slate-700 min-w-[170px]">
                              <div className="font-semibold text-slate-800 text-xs mb-2 tracking-wide">
                                {data.crop}
                              </div>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                                <span className="text-emerald-600 font-medium">
                                  Risk
                                </span>
                                <span>{data.riskFactor}/5</span>
                                <span className="text-indigo-600 font-medium">
                                  Margin
                                </span>
                                <span>{data.grossMargin}%</span>
                                <span className="text-sky-600 font-medium">
                                  Saving
                                </span>
                                <span>{data.savingVsPaddy}%</span>
                                <span className="text-amber-600 font-medium">
                                  Adopt
                                </span>
                                <span>{data.adoptionEase}/5</span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Scatter
                        data={enhancedScenarios.filter(
                          (s) => !s.crop.includes("Paddy")
                        )}
                      >
                        {enhancedScenarios
                          .filter((s) => !s.crop.includes("Paddy"))
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="#fff"
                              strokeWidth={1.2}
                              style={{
                                filter:
                                  "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
                              }}
                            />
                          ))}
                      </Scatter>
                      <defs>
                        <linearGradient
                          id="scatterOverlayGradient"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#10b981"
                            stopOpacity={0.18}
                          />
                          <stop
                            offset="50%"
                            stopColor="#6366f1"
                            stopOpacity={0.07}
                          />
                          <stop
                            offset="100%"
                            stopColor="#0ea5e9"
                            stopOpacity={0.18}
                          />
                        </linearGradient>
                      </defs>
                      <motion.rect
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.2 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        x={0}
                        y={0}
                        width={4000}
                        height={4000}
                        fill="url(#scatterOverlayGradient)"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                  <div className="absolute left-5 top-5 text-[11px] font-medium text-slate-600 uppercase tracking-wide bg-white/60 backdrop-blur px-2 py-1 rounded shadow-sm">
                    Lower Risk →
                  </div>
                </ChartDepthWrapper>
              </motion.div>
            )}

            {/* Radar Chart Tab */}
            {activeView === "radar" && (
              <motion.div
                key="radar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <RadarIcon className="h-5 w-5 text-emerald-500" />
                  Multi-Factor Crop Profile
                </h4>
                <ChartDepthWrapper
                  glowColor="#6366f1"
                  className="bg-transparent"
                >
                  <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.35),transparent_78%)]" />
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart
                      data={bestAlternatives.map((s) => ({
                        crop: s.crop,
                        WaterEfficiency: s.savingVsPaddy,
                        EconomicReturn: (s.grossMargin / maxMargin) * 100,
                        AdoptionEase: s.adoptionEase * 20,
                        YieldStability: s.yieldStability * 20,
                        LowRisk: (6 - s.riskFactor) * 20,
                      }))}
                    >
                      <PolarGrid
                        radialLines={false}
                        stroke="#cbd5e1"
                        strokeOpacity={0.45}
                      />
                      <PolarAngleAxis
                        dataKey="crop"
                        tick={{ fontSize: 11, fill: "#475569" }}
                      />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} />
                      <Radar
                        name="Water Efficiency"
                        dataKey="WaterEfficiency"
                        stroke="url(#radarWater)"
                        fill="url(#radarWaterFill)"
                        fillOpacity={0.55}
                        strokeWidth={2}
                      />
                      <Radar
                        name="Economic Return"
                        dataKey="EconomicReturn"
                        stroke="url(#radarEco)"
                        fill="url(#radarEcoFill)"
                        fillOpacity={0.45}
                        strokeWidth={2}
                      />
                      <Radar
                        name="Adoption Ease"
                        dataKey="AdoptionEase"
                        stroke="url(#radarAdopt)"
                        fill="url(#radarAdoptFill)"
                        fillOpacity={0.35}
                        strokeWidth={2}
                      />
                      <ReLegend />
                      <defs>
                        <linearGradient
                          id="radarWater"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                        <linearGradient
                          id="radarEco"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                        <linearGradient
                          id="radarAdopt"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>
                        <radialGradient
                          id="radarWaterFill"
                          cx="50%"
                          cy="50%"
                          r="65%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#10b981"
                            stopOpacity={0.55}
                          />
                          <stop
                            offset="100%"
                            stopColor="#10b981"
                            stopOpacity={0.05}
                          />
                        </radialGradient>
                        <radialGradient
                          id="radarEcoFill"
                          cx="50%"
                          cy="50%"
                          r="65%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#6366f1"
                            stopOpacity={0.5}
                          />
                          <stop
                            offset="100%"
                            stopColor="#6366f1"
                            stopOpacity={0.04}
                          />
                        </radialGradient>
                        <radialGradient
                          id="radarAdoptFill"
                          cx="50%"
                          cy="50%"
                          r="65%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#f59e0b"
                            stopOpacity={0.45}
                          />
                          <stop
                            offset="100%"
                            stopColor="#f59e0b"
                            stopOpacity={0.03}
                          />
                        </radialGradient>
                      </defs>
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartDepthWrapper>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Smart Recommendations */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/80 rounded-lg p-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>INGRES transition advisory:</strong>{" "}
              {bestAlternatives[0].crop} ranks highest on sustainability score
              with {bestAlternatives[0].savingVsPaddy}% consumptive use
              reduction and groundwater recharge interaction of{" "}
              {bestAlternatives[0].rechargeImpact > 0 ? "+" : ""}
              {bestAlternatives[0].rechargeImpact}mm equivalent. Recommended
              staged adoption:{" "}
              {Math.round(bestAlternatives[0].adoptionEase * 15)}–
              {Math.round(bestAlternatives[0].adoptionEase * 20)}% area in Year
              1 to reduce over-extraction trajectory.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              Economic Analysis
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Droplets className="h-3 w-3 mr-1" />
              Water Impact Model
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Implementation Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CropRecommendationCard;
