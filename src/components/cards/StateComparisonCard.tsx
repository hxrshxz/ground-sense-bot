import React, { useState } from "react";
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

        <CardContent className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            {[
              { key: "overview", label: "Overview", icon: MapPin },
              { key: "sectors", label: "Sector Usage", icon: BarChart3 },
              { key: "decline", label: "Water Table", icon: TrendingDown },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
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
              >
                {/* Extraction vs Recharge Comparison */}
                <div className="grid md:grid-cols-2 gap-6">
                  {[punjab, rajasthan].map((state) => (
                    <div key={state.name} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
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
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Extraction</span>
                          <span className="font-medium">
                            {state.extraction} BCM
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                (state.extraction / maxExtraction) * 100
                              }%`,
                            }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: state.color }}
                          />
                        </div>
                      </div>

                      {/* Recharge Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Recharge</span>
                          <span className="font-medium">
                            {state.recharge} BCM
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(state.recharge / maxRecharge) * 100}%`,
                            }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"
                          />
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div
                          className={`p-2 ${state.bgColor} rounded-lg text-center`}
                        >
                          <div
                            className="font-bold text-lg"
                            style={{ color: state.color }}
                          >
                            {state.decline}m
                          </div>
                          <div className="text-slate-600">Annual Decline</div>
                        </div>
                        <div
                          className={`p-2 ${state.bgColor} rounded-lg text-center`}
                        >
                          <div
                            className="font-bold text-lg"
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
                <div className="grid md:grid-cols-2 gap-6">
                  {[punjab, rajasthan].map((state) => (
                    <div key={`${state.name}-drivers`} className="space-y-3">
                      <h5 className="font-medium text-slate-700">
                        Key Drivers - {state.name}
                      </h5>
                      <div className="space-y-2">
                        {state.drivers.map((driver, index) => (
                          <div
                            key={driver.name}
                            className="flex items-center gap-3"
                          >
                            <div className="w-24 text-xs text-slate-600 truncate">
                              {driver.name}
                            </div>
                            <div className="flex-1 bg-slate-100 rounded-full h-2 relative">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${driver.impact}%` }}
                                transition={{
                                  duration: 0.8,
                                  delay: 0.6 + index * 0.1,
                                }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: state.color }}
                              />
                            </div>
                            <div className="text-xs font-medium text-slate-700 w-8">
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
                              <div className="flex-1 bg-slate-100 rounded-full h-4 relative">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${sector.value}%` }}
                                  transition={{
                                    duration: 1,
                                    delay: index * 0.1,
                                  }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: sector.color }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-medium text-white">
                                    {sector.value}%
                                  </span>
                                </div>
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
              >
                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Cumulative Water Table Decline (2015-2025)
                </h4>

                {/* Timeline Chart */}
                <div className="bg-slate-50 rounded-lg p-6 border">
                  <div className="h-64 relative">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between">
                      {[0, 2.5, 5, 7.5, 10].map((value) => (
                        <div
                          key={value}
                          className="border-b border-slate-200/50 flex-1 relative"
                        >
                          <span className="absolute -left-8 -top-2 text-xs text-slate-500">
                            -{value}m
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Chart bars */}
                    <div className="absolute inset-0 flex items-end justify-between px-8">
                      {stateComparisonData.timeSeriesDecline.years.map(
                        (year, index) => (
                          <div
                            key={year}
                            className="flex flex-col items-center flex-1"
                          >
                            {/* Bars container */}
                            <div className="flex items-end gap-1 h-52 mb-2">
                              {/* Punjab bar */}
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{
                                  height: `${
                                    (stateComparisonData.timeSeriesDecline
                                      .punjab[index] /
                                      10) *
                                    100
                                  }%`,
                                }}
                                transition={{
                                  duration: 1.2,
                                  delay: index * 0.15,
                                }}
                                className="w-4 bg-gradient-to-t from-red-600 to-red-400 rounded-t shadow-sm relative"
                                title={`Punjab: -${stateComparisonData.timeSeriesDecline.punjab[index]}m`}
                              >
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-red-700">
                                  {
                                    stateComparisonData.timeSeriesDecline
                                      .punjab[index]
                                  }
                                </div>
                              </motion.div>

                              {/* Rajasthan bar */}
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{
                                  height: `${
                                    (stateComparisonData.timeSeriesDecline
                                      .rajasthan[index] /
                                      10) *
                                    100
                                  }%`,
                                }}
                                transition={{
                                  duration: 1.2,
                                  delay: index * 0.15 + 0.1,
                                }}
                                className="w-4 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t shadow-sm relative"
                                title={`Rajasthan: -${stateComparisonData.timeSeriesDecline.rajasthan[index]}m`}
                              >
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-amber-700">
                                  {
                                    stateComparisonData.timeSeriesDecline
                                      .rajasthan[index]
                                  }
                                </div>
                              </motion.div>
                            </div>

                            {/* Year label */}
                            <div className="text-xs font-medium text-slate-700 mt-1">
                              {year}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Enhanced Legend */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm border">
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gradient-to-t from-red-600 to-red-400 rounded"></div>
                          <span className="font-medium text-slate-700">
                            Punjab
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gradient-to-t from-amber-600 to-amber-400 rounded"></div>
                          <span className="font-medium text-slate-700">
                            Rajasthan
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
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
