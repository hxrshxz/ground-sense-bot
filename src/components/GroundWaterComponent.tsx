"use client";

import React, { useMemo, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartEvent,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  TrendingUp,
  Scale,
  MapPin,
  Lightbulb,
  Info,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart,
} from "lucide-react";
import { DownloadReport } from "./DownloadReport";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

// --- NEW: Type definition for our metrics for better code safety ---
type Metric = "extraction" | "recharge" | "net";
interface MetricConfig {
  label: string;
  unit: string;
  icon: React.ElementType;
  colors: string[];
}

const METRIC_CONFIGS: Record<Metric, MetricConfig> = {
  extraction: {
    label: "Extraction",
    unit: "BCM",
    icon: ArrowUpCircle,
    colors: ["#ef4444", "#f97316"],
  }, // Red, Orange
  recharge: {
    label: "Recharge",
    unit: "BCM",
    icon: ArrowDownCircle,
    colors: ["#22c55e", "#14b8a6"],
  }, // Green, Teal
  net: {
    label: "Net Availability",
    unit: "BCM",
    icon: BarChart,
    colors: ["#8b5cf6", "#6366f1"],
  }, // Purple, Indigo
};

// ... (DynamicChartHeader can remain as is) ...

export const GroundwaterComparisonChart: React.FC<any> = ({
  locations,
  years,
  data,
  summary,
  onFollowUp,
}) => {
  const chartRef = useRef<ChartJS<"line">>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // --- INTERACTIVE STEP 1: State to manage the currently selected metric ---
  const [activeMetric, setActiveMetric] = useState<Metric>("extraction");

  // Make sure we handle both string and object summaries for backward compatibility
  const summaryText =
    typeof summary === "string"
      ? { extraction: summary, recharge: summary, net: summary }
      : summary;

  const chartData = useMemo(() => {
    const createGradient = (ctx: CanvasRenderingContext2D, color: string) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, `${color}33`);
      gradient.addColorStop(1, `${color}00`);
      return gradient;
    };
    const colors = METRIC_CONFIGS[activeMetric].colors;

    return {
      labels: years.map(String),
      datasets: locations.map((loc, index) => ({
        label: loc,
        data: data[loc]?.[activeMetric] || [],
        borderColor: colors[index % colors.length],
        backgroundColor: (context: any) => {
          if (!context.chart.chartArea) return;
          return createGradient(
            context.chart.ctx,
            colors[index % colors.length]
          );
        },
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: colors[index % colors.length],
        pointBorderWidth: 2,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: colors[index % colors.length],
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 3,
        fill: true,
      })),
    };
  }, [locations, years, data, activeMetric]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      animation: {
        duration: 1000,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: true,
          position: "top" as const,
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            padding: 20,
            font: {
              size: 12,
              weight: "bold" as const,
            },
          },
        },
        title: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          titleColor: "#334155",
          bodyColor: "#334155",
          bodyFont: { size: 12 },
          titleFont: { size: 14, weight: "bold" },
          padding: 12,
          borderColor: "rgba(203, 213, 225, 0.5)",
          borderWidth: 1,
          caretSize: 8,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            title: (items: any) => `Year: ${items[0].label}`,
            label: (context: any) => {
              const value = context.raw.toFixed(2);
              return `${context.dataset.label}: ${value} ${METRIC_CONFIGS[activeMetric].unit}`;
            },
          },
        },
        // --- INTERACTIVE STEP 3: Dynamically update titles and labels ---
        annotation: {
          annotations: {
            title: {
              type: "label" as const,
              content: `${METRIC_CONFIGS[activeMetric].label} Trends`,
              font: { size: 16, weight: "bold" },
              color: "#334155",
              x: "5%",
              y: "5%",
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#64748b" },
          border: { color: "#e2e8f0" },
        },
        y: {
          beginAtZero: false,
          grid: { color: "#f1f5f9" },
          ticks: { color: "#64748b", callback: (value: any) => `${value}` },
          title: {
            display: true,
            text: `Volume (${METRIC_CONFIGS[activeMetric].unit})`,
            color: "#475569",
          },
        },
      },
    }),
    [activeMetric]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="w-full overflow-hidden bg-white shadow-lg" ref={cardRef}>
        {/* Add a decorative header gradient band */}
        <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100/70">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl md:text-2xl font-bold text-slate-800">
                Groundwater Analysis
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Interactive comparison of {locations.join(" and ")} groundwater
                data
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-4 sm:px-4">
          {/* --- INTERACTIVE STEP 4: The Metric Switcher UI --- */}
          <div className="p-1 mb-4 flex justify-center gap-2 bg-slate-100 rounded-full">
            <LayoutGroup>
              {(Object.keys(METRIC_CONFIGS) as Metric[]).map((metric) => (
                <motion.button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  className={`relative flex-1 text-sm font-semibold py-1.5 rounded-full focus:outline-none`}
                >
                  {activeMetric === metric && (
                    <motion.div
                      layoutId="active-metric-pill"
                      className="absolute inset-0 bg-white shadow-md rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {(() => {
                      const Icon = METRIC_CONFIGS[metric].icon;
                      return (
                        <Icon
                          className={`h-4 w-4 ${
                            activeMetric === metric
                              ? `text-[${METRIC_CONFIGS[metric].colors[0]}]`
                              : "text-slate-500"
                          }`}
                        />
                      );
                    })()}
                    {METRIC_CONFIGS[metric].label}
                  </span>
                </motion.button>
              ))}
            </LayoutGroup>
          </div>

          <div className="h-80 relative">
            <Line
              ref={chartRef}
              data={chartData}
              options={chartOptions as any}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeMetric}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 text-sm text-slate-700 mt-6"
            >
              <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                <Info className="h-4 w-4 text-purple-600" /> AI Insight for{" "}
                {METRIC_CONFIGS[activeMetric].label}
              </h4>
              <p>{summaryText[activeMetric]}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-wrap gap-2 pt-4">
            <h4 className="w-full text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-amber-500" /> Suggested
              follow-ups:
            </h4>
            {/* Dynamic follow-up suggestions based on current context */}
            {(() => {
              // Get all locations not currently in the comparison
              const otherLocations = [
                "Amritsar",
                "Ludhiana",
                "Jalandhar",
              ].filter((loc) => !locations.includes(loc));

              const followUps = [
                // Add missing locations for comparison
                ...otherLocations.map((loc) => ({
                  label: `Add ${loc} to comparison`,
                  query: `compare ${locations.join(", ")} and ${loc}`,
                })),
                // Explanation prompts specific to the current metric
                {
                  label: `Why is ${activeMetric} ${
                    activeMetric === "extraction" ? "increasing" : "decreasing"
                  }?`,
                  query: `Why is groundwater ${activeMetric} ${
                    activeMetric === "extraction" ? "increasing" : "decreasing"
                  } in ${locations.join(" and ")}?`,
                },
                // Regional specific prompts
                {
                  label: "Impact of rainfall patterns",
                  query: `How do rainfall patterns affect groundwater ${activeMetric} in Punjab?`,
                },
                {
                  label: "Compare with Rajasthan",
                  query: `How does Punjab's groundwater situation compare to Rajasthan?`,
                },
                {
                  label: "Policy recommendations",
                  query: `What policy changes could improve groundwater ${activeMetric} rates?`,
                },
              ];

              return followUps.slice(0, 4).map((item, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="bg-white/50 hover:bg-white text-slate-700 border-slate-300/50"
                  onClick={() => onFollowUp(item.query)}
                >
                  {item.label}
                </Button>
              ));
            })()}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
            <DownloadReport
              targetRef={cardRef}
              fileName={`groundwater-comparison-${locations.join("-vs-")}`}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
