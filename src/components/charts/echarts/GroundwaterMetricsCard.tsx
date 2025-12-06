import React, { useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import {
  ChevronDown,
  ChevronUp,
  Droplets,
  CloudRain,
  Gauge,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

// ============================================
// GROUNDWATER METRICS CARD COMPONENT
// Displays key groundwater metrics like the INGRES portal
// ============================================

export interface MetricsData {
  locationName: string;
  locationType: "block" | "district" | "state";
  year: string;
  category: string;
  rainfall: number;
  totalRecharge: number;
  totalExtraction: number;
  totalExtractable: number;
  naturalDischarge: number;
  stage: number;
  availability?: number;
  // Breakdown data (optional)
  rechargeBreakdown?: Array<{ source: string; value: number }>;
  extractionBreakdown?: Array<{ source: string; value: number }>;
  // For aggregated data (district/state)
  totalBlocks?: number;
  safeBlocks?: number;
  semiCriticalBlocks?: number;
  criticalBlocks?: number;
  overExploitedBlocks?: number;
}

interface GroundwaterMetricsCardProps {
  data: MetricsData;
  height?: string;
}

// Helper to get category styling
const getCategoryStyle = (category: string) => {
  switch (category?.toLowerCase().replace(/[_-]/g, " ")) {
    case "safe":
      return {
        color: "#10B981",
        bg: "rgba(16, 185, 129, 0.15)",
        icon: CheckCircle2,
        label: "Safe",
      };
    case "semi critical":
      return {
        color: "#F59E0B",
        bg: "rgba(245, 158, 11, 0.15)",
        icon: AlertTriangle,
        label: "Semi-Critical",
      };
    case "critical":
      return {
        color: "#F97316",
        bg: "rgba(249, 115, 22, 0.15)",
        icon: AlertTriangle,
        label: "Critical",
      };
    case "over exploited":
      return {
        color: "#EF4444",
        bg: "rgba(239, 68, 68, 0.15)",
        icon: AlertTriangle,
        label: "Over-Exploited",
      };
    case "salinity":
      return {
        color: "#8B5CF6",
        bg: "rgba(139, 92, 246, 0.15)",
        icon: Droplets,
        label: "Salinity",
      };
    default:
      return {
        color: "#6B7280",
        bg: "rgba(107, 114, 128, 0.15)",
        icon: Gauge,
        label: category || "Unknown",
      };
  }
};

// Format number with 2 decimal places
const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return "N/A";
  return num.toFixed(2);
};

// Expandable metric row component
const MetricRow: React.FC<{
  label: string;
  value: string;
  unit: string;
  color: string;
  icon?: React.ReactNode;
  expandable?: boolean;
  breakdownData?: Array<{ source: string; value: number }>;
}> = ({
  label,
  value,
  unit,
  color,
  icon,
  expandable = false,
  breakdownData,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <div
        className={`flex items-center justify-between py-3 px-4 ${
          expandable ? "cursor-pointer hover:bg-white/5" : ""
        }`}
        onClick={() => expandable && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className="text-slate-300 text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold" style={{ color }}>
            {value}
          </span>
          <span className="text-slate-500 text-sm">{unit}</span>
          {expandable && (
            <span className="text-slate-500 ml-2">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          )}
        </div>
      </div>
      {expandable && isExpanded && breakdownData && (
        <div className="bg-slate-900/50 px-4 py-2">
          {breakdownData.map((item, idx) => (
            <div key={idx} className="flex justify-between py-1.5 text-sm">
              <span className="text-slate-400 pl-8">{item.source}</span>
              <span className="text-slate-300">
                {formatNumber(item.value)} MCM
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Mini gauge chart for stage
const StageGauge: React.FC<{ stage: number }> = ({ stage }) => {
  const getStageColor = (value: number) => {
    if (value > 100) return "#EF4444";
    if (value > 90) return "#F97316";
    if (value > 70) return "#F59E0B";
    return "#10B981";
  };

  const option = {
    series: [
      {
        type: "gauge",
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: Math.max(150, stage + 20),
        splitNumber: 5,
        radius: "100%",
        center: ["50%", "70%"],
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [0.47, "#10B981"], // Safe: 0-70%
              [0.6, "#F59E0B"], // Semi-critical: 70-90%
              [0.67, "#F97316"], // Critical: 90-100%
              [1, "#EF4444"], // Over-exploited: >100%
            ],
          },
        },
        pointer: {
          icon: "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z",
          length: "75%",
          width: 8,
          offsetCenter: [0, "-45%"],
          itemStyle: {
            color: getStageColor(stage),
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: "rgba(255,255,255,0.5)",
          fontSize: 10,
          distance: -35,
          formatter: (value: number) => {
            if (value === 0) return "0%";
            if (value === 70) return "70%";
            if (value === 100) return "100%";
            return "";
          },
        },
        detail: {
          fontSize: 24,
          fontWeight: "bold",
          color: getStageColor(stage),
          offsetCenter: [0, "10%"],
          formatter: "{value}%",
        },
        data: [{ value: Math.round(stage * 10) / 10 }],
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "140px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
};

// Block distribution pie chart (for district/state)
const BlockDistributionChart: React.FC<{
  safe: number;
  semiCritical: number;
  critical: number;
  overExploited: number;
}> = ({ safe, semiCritical, critical, overExploited }) => {
  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} blocks ({d}%)",
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "rgba(99, 102, 241, 0.3)",
      textStyle: { color: "#e2e8f0" },
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: "#1e293b",
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: "{b}\n{c}",
          color: "rgba(255,255,255,0.8)",
          fontSize: 11,
        },
        labelLine: {
          lineStyle: { color: "rgba(255,255,255,0.3)" },
        },
        data: [
          { value: safe, name: "Safe", itemStyle: { color: "#10B981" } },
          {
            value: semiCritical,
            name: "Semi-Critical",
            itemStyle: { color: "#F59E0B" },
          },
          {
            value: critical,
            name: "Critical",
            itemStyle: { color: "#F97316" },
          },
          {
            value: overExploited,
            name: "Over-Exploited",
            itemStyle: { color: "#EF4444" },
          },
        ].filter((d) => d.value > 0),
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "200px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
};

// Water balance bar chart
const WaterBalanceChart: React.FC<{
  recharge: number;
  extraction: number;
  extractable: number;
}> = ({ recharge, extraction, extractable }) => {
  const option = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "rgba(99, 102, 241, 0.3)",
      textStyle: { color: "#e2e8f0" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: { seriesName: string; value: number }[]) => {
        return params
          .map((p) => `${p.seriesName}: ${p.value.toFixed(2)} BCM`)
          .join("<br/>");
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: [
        "Ground Water\nRecharge",
        "Extractable\nResources",
        "Ground Water\nExtraction",
      ],
      axisLabel: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 10,
        interval: 0,
      },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.2)" } },
    },
    yAxis: {
      type: "value",
      name: "BCM",
      nameTextStyle: { color: "rgba(255,255,255,0.5)", fontSize: 10 },
      axisLabel: { color: "rgba(255,255,255,0.7)", fontSize: 10 },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.2)" } },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
    },
    series: [
      {
        name: "Value",
        type: "bar",
        barWidth: "50%",
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: (params: { dataIndex: number }) => {
            const colors = [
              new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#00DDFF" },
                { offset: 1, color: "#37A2FF" },
              ]),
              new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#80FFA5" },
                { offset: 1, color: "#01BF8C" },
              ]),
              new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#FF6B6B" },
                { offset: 1, color: "#EF4444" },
              ]),
            ];
            return colors[params.dataIndex];
          },
        },
        data: [recharge, extractable, extraction],
        label: {
          show: true,
          position: "top",
          formatter: "{c}",
          color: "rgba(255,255,255,0.8)",
          fontSize: 12,
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "200px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
};

// Main component
const GroundwaterMetricsCard: React.FC<GroundwaterMetricsCardProps> = ({
  data,
}) => {
  const categoryStyle = getCategoryStyle(data.category);
  const CategoryIcon = categoryStyle.icon;
  const isAggregated =
    data.locationType === "district" || data.locationType === "state";
  const hasBlockDistribution = isAggregated && (data.totalBlocks ?? 0) > 0;

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.92) 100%)",
        boxShadow:
          "0 20px 40px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-semibold">
              {data.locationName}
            </h2>
            <p className="text-slate-400 text-sm capitalize">
              {data.locationType} • {data.year}
            </p>
          </div>
          <div
            className="px-3 py-1.5 rounded-full flex items-center gap-2"
            style={{ backgroundColor: categoryStyle.bg }}
          >
            <CategoryIcon size={16} style={{ color: categoryStyle.color }} />
            <span
              style={{ color: categoryStyle.color }}
              className="text-sm font-medium"
            >
              {categoryStyle.label}
            </span>
          </div>
        </div>
      </div>

      {/* Main metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-white/5">
        {/* Left column - Primary metrics */}
        <div className="bg-slate-900/40">
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider">
              Key Metrics
            </h3>
          </div>

          <MetricRow
            label="Annual Extractable Ground Water Resources (BCM)"
            value={formatNumber(data.totalExtractable)}
            unit=""
            color="#00DDFF"
            icon={<Droplets size={18} />}
          />

          <MetricRow
            label="Ground Water Extraction for all uses (BCM)"
            value={formatNumber(data.totalExtraction)}
            unit=""
            color="#FF6B6B"
            icon={<Activity size={18} />}
          />

          <MetricRow
            label="Rainfall (mm)"
            value={formatNumber(data.rainfall)}
            unit=""
            color="#37A2FF"
            icon={<CloudRain size={18} />}
            expandable={false}
          />

          <MetricRow
            label="Ground Water Recharge (BCM)"
            value={formatNumber(data.totalRecharge)}
            unit=""
            color="#80FFA5"
            icon={<Droplets size={18} />}
            expandable={!!data.rechargeBreakdown?.length}
            breakdownData={data.rechargeBreakdown}
          />

          <MetricRow
            label="Natural Discharges (BCM)"
            value={formatNumber(data.naturalDischarge)}
            unit=""
            color="#FFBF00"
            icon={<Activity size={18} />}
          />

          <MetricRow
            label="Ground Water Extraction (BCM)"
            value={formatNumber(data.totalExtraction)}
            unit=""
            color="#FF6B6B"
            icon={<Activity size={18} />}
            expandable={!!data.extractionBreakdown?.length}
            breakdownData={data.extractionBreakdown}
          />
        </div>

        {/* Right column - Visualizations */}
        <div className="bg-slate-900/40">
          {/* Stage gauge */}
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider">
              Stage of Extraction
            </h3>
          </div>
          <div className="px-4">
            <StageGauge stage={data.stage || 0} />
            <p className="text-center text-slate-400 text-xs pb-3">
              {data.stage > 100
                ? "⚠️ Over-extraction detected"
                : data.stage > 70
                ? "⚡ Approaching critical levels"
                : "✅ Sustainable extraction"}
            </p>
          </div>

          {/* Block distribution or water balance */}
          {hasBlockDistribution ? (
            <>
              <div className="px-4 py-3 border-t border-white/10">
                <h3 className="text-slate-400 text-xs uppercase tracking-wider">
                  Block Distribution ({data.totalBlocks} blocks)
                </h3>
              </div>
              <div className="px-4 pb-4">
                <BlockDistributionChart
                  safe={data.safeBlocks || 0}
                  semiCritical={data.semiCriticalBlocks || 0}
                  critical={data.criticalBlocks || 0}
                  overExploited={data.overExploitedBlocks || 0}
                />
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-t border-white/10">
                <h3 className="text-slate-400 text-xs uppercase tracking-wider">
                  Water Balance
                </h3>
              </div>
              <div className="px-4 pb-4">
                <WaterBalanceChart
                  recharge={data.totalRecharge || 0}
                  extraction={data.totalExtraction || 0}
                  extractable={data.totalExtractable || 0}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer with insights */}
      <div className="px-6 py-4 border-t border-white/10 bg-slate-900/30">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <p className="text-slate-300 text-sm">
              {data.stage > 100
                ? `This ${data.locationType} is extracting ${(
                    data.stage - 100
                  ).toFixed(
                    1
                  )}% more groundwater than the natural recharge rate. Immediate conservation measures are recommended.`
                : data.stage > 70
                ? `Groundwater extraction is at ${data.stage.toFixed(
                    1
                  )}% of recharge capacity. Consider monitoring closely and implementing water-saving practices.`
                : `Groundwater situation is sustainable with extraction at ${data.stage.toFixed(
                    1
                  )}% of recharge. Continue current practices to maintain this balance.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroundwaterMetricsCard;
