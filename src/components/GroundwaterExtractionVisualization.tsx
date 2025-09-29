import React, { useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend,
  RadialLinearScale,
  Title,
} from "chart.js";
// React ChartJS wrapper
// Use the single <Chart> component pattern from react-chartjs-2 v5
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Chart as ReactChartJS } from "react-chartjs-2";
// Annotation plugin is optional but used for threshold bands
// You need chartjs-plugin-annotation in deps (already listed in package.json)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend,
  RadialLinearScale,
  Title,
  annotationPlugin
);

export interface ExtractionVisualizationProps {
  years: number[];
  ludhiana: number[];
  amritsar: number[];
  factorWeights: {
    paddyCropping: number;
    freeElectricity: number;
    privateTubewells: number;
    industryGrowth: number;
    urbanExpansion: number;
  };
  projectionYears?: number[]; // future projection years
  projectionLudhiana?: number[]; // optional projected values
  projectionAmritsar?: number[];
  showRadar?: boolean;
  className?: string;
  enableScenarios?: boolean; // show scenario selector
  enableExport?: boolean; // show export button
  enableRadarToggle?: boolean; // allow hiding radar
}

const band = (yMin: number, yMax: number, color: string, label: string) => ({
  type: "box",
  yMin,
  yMax,
  backgroundColor: color,
  borderWidth: 0,
  label: { content: label, enabled: false },
});

export const GroundwaterExtractionVisualization: React.FC<
  ExtractionVisualizationProps
> = ({
  years,
  ludhiana,
  amritsar,
  factorWeights,
  projectionYears = [],
  projectionLudhiana = [],
  projectionAmritsar = [],
  showRadar = true,
  className,
  enableScenarios = true,
  enableExport = true,
  enableRadarToggle = true,
}) => {
  const chartRef = useRef<any>(null);
  const [scenario, setScenario] = useState<
    "baseline" | "intervention" | "aggressive"
  >("baseline");
  const [radarVisible, setRadarVisible] = useState(showRadar);

  // Scenario adjustments (simple illustrative multipliers)
  const scenarioAdjusted = useMemo(() => {
    const applyScenario = (base: number[], type: "l" | "a") => {
      if (scenario === "baseline") return base;
      if (scenario === "intervention") {
        // flatten growth slightly
        return base.map((v, i) => (i > base.length - 4 ? v - 2 : v));
      }
      // aggressive demand management / recharge augmentation
      return base.map((v, i) => (i > base.length - 5 ? v - 4 : v));
    };
    return {
      ludhiana: applyScenario(ludhiana.concat(projectionLudhiana), "l"),
      amritsar: applyScenario(amritsar.concat(projectionAmritsar), "a"),
    };
  }, [scenario, ludhiana, amritsar, projectionLudhiana, projectionAmritsar]);

  const allYears = [...years, ...projectionYears];

  const lineData = {
    labels: allYears,
    datasets: [
      {
        label: "Ludhiana",
        data: scenarioAdjusted.ludhiana,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: "#ef4444",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointHoverBackgroundColor: "#dc2626",
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 3,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 8,
        shadowColor: "rgba(239, 68, 68, 0.3)",
      },
      {
        label: "Amritsar",
        data: scenarioAdjusted.amritsar,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointHoverBackgroundColor: "#2563eb",
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 3,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 8,
        shadowColor: "rgba(59, 130, 246, 0.3)",
      },
      projectionYears.length > 0 && {
        label: "Projection Boundary",
        data: new Array(years.length - 1)
          .fill(null)
          .concat([ludhiana[ludhiana.length - 1]]),
        borderColor: "rgba(100,116,139,0.8)",
        borderDash: [8, 4],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ].filter(Boolean),
  };

  const lineOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Groundwater Extraction (% of Recharge)" },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
        },
      },
      annotation: {
        annotations: {
          sustainable: band(0, 100, "rgba(34,197,94,0.08)", "Sustainable"),
          stressed: band(100, 150, "rgba(234,179,8,0.08)", "Stressed"),
          critical: band(150, 180, "rgba(249,115,22,0.08)", "Critical"),
          over: band(180, 260, "rgba(239,68,68,0.08)", "Over-Exploited"),
        },
      },
    },
    scales: {
      y: {
        title: { display: true, text: "% of Recharge" },
        suggestedMin: 80,
        suggestedMax: 240,
        grid: { color: "rgba(148,163,184,0.2)" },
      },
      x: { grid: { display: false } },
    },
  };

  const radarData = {
    labels: [
      "Paddy Cropping Intensity",
      "Free Electricity Incentive",
      "Private Tubewell Density",
      "Industry Growth",
      "Urban Expansion",
    ],
    datasets: [
      {
        label: "Relative Pressure Factors",
        data: [
          factorWeights.paddyCropping,
          factorWeights.freeElectricity,
          factorWeights.privateTubewells,
          factorWeights.industryGrowth,
          factorWeights.urbanExpansion,
        ],
        backgroundColor: "rgba(34, 197, 94, 0.15)",
        borderColor: "#22c55e",
        borderWidth: 3,
        pointBackgroundColor: "#22c55e",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: "#16a34a",
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 3,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 10,
        ticks: {
          stepSize: 2,
          color: "#64748b",
          font: { weight: "bold" },
        },
        grid: {
          color: "rgba(148, 163, 184, 0.3)",
          lineWidth: 1,
        },
        angleLines: {
          color: "rgba(148, 163, 184, 0.3)",
          lineWidth: 1,
        },
        pointLabels: {
          color: "#475569",
          font: { size: 12, weight: "bold" },
        },
      },
    },
    plugins: { legend: { display: false } },
  };

  const handleExportPNG = () => {
    if (!chartRef.current) return;
    const canvas: HTMLCanvasElement | undefined =
      chartRef.current.firstChild?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `extraction-${scenario}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className={className || "space-y-6"}>
      <div className="p-6 border rounded-xl bg-gradient-to-br from-white to-slate-50 dark:bg-neutral-900 shadow-xl border-slate-200/50">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg text-slate-800">
              Extraction Trajectory
            </h3>
            <span className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-red-100 to-red-200 text-red-700 font-semibold border border-red-300/50">
              Over-Exploited
            </span>
            {enableScenarios && (
              <select
                className="text-xs border rounded px-2 py-1 bg-white dark:bg-neutral-800"
                value={scenario}
                onChange={(e) => setScenario(e.target.value as any)}
              >
                <option value="baseline">Baseline</option>
                <option value="intervention">Intervention</option>
                <option value="aggressive">Aggressive</option>
              </select>
            )}
          </div>
          <div className="flex items-center gap-2">
            {enableRadarToggle && (
              <button
                onClick={() => setRadarVisible((v) => !v)}
                className="text-xs px-2 py-1 rounded border hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                {radarVisible ? "Hide Drivers" : "Show Drivers"}
              </button>
            )}
            {enableExport && (
              <button
                onClick={handleExportPNG}
                className="text-xs px-2 py-1 rounded border hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Export PNG
              </button>
            )}
          </div>
        </div>
        <div
          className="h-80 bg-gradient-to-br from-slate-50 to-white rounded-lg p-4 shadow-inner border border-slate-200/50"
          ref={chartRef}
        >
          <ReactChartJS type="line" data={lineData} options={lineOptions} />
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[rgba(34,197,94,0.4)] border border-green-600"></span>
            <span>Sustainable (&lt; 100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[rgba(234,179,8,0.35)] border border-amber-500"></span>
            <span>Stressed (100–150%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[rgba(249,115,22,0.35)] border border-orange-500"></span>
            <span>Critical (150–180%)</span>
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <span className="w-3 h-3 rounded-sm bg-[rgba(239,68,68,0.35)] border border-red-500"></span>
            <span>Over-Exploited (&gt; 180%)</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Scenario: <strong>{scenario}</strong>.{" "}
          {scenario === "baseline" &&
            "Continuation of present abstraction behaviour with modest efficiency gains."}
          {scenario === "intervention" &&
            "Implements moderate demand management (crop shifts, partial power rationalisation) flattening late-series growth."}
          {scenario === "aggressive" &&
            "Strong policy + recharge push producing measurable decline in trajectory versus baseline."}
        </p>
      </div>

      {radarVisible && (
        <div className="p-6 border rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:bg-neutral-900 shadow-xl border-green-200/50">
          <h4 className="font-bold text-lg text-slate-800 mb-3">
            Primary Drivers (Relative Weight)
          </h4>
          <div className="h-72 bg-gradient-to-br from-white to-green-50/50 rounded-lg p-4 shadow-inner border border-green-200/50">
            <ReactChartJS
              type="radar"
              data={radarData}
              options={radarOptions}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Agricultural incentives and groundwater access dynamics dominate
            pressure. Targeted crop diversification and regulated abstraction
            could flatten the trajectory.
          </p>
        </div>
      )}
    </div>
  );
};

export default GroundwaterExtractionVisualization;
