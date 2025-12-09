import React from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import {
  Droplets,
  TrendingUp,
  Activity,
  Tag,
} from "lucide-react";
import {
  CATEGORY_COLORS,
  ATTRIBUTE_COLORS,
  getCategoryColors,
  getCategoryColorsFromStage,
  formatCategoryName,
  getStageLabel,
  formatNumber,
  FOUR_KEY_ATTRIBUTES,
} from "@/lib/designSystem";

// ============================================================================
// GROUNDWATER METRICS CARD COMPONENT
// Displays THE 4 KEY GROUNDWATER ATTRIBUTES with WCAG-compliant colors
// ============================================================================

export interface MetricsData {
  locationName: string;
  locationType: "block" | "district" | "state";
  year: string;
  // THE 4 KEY ATTRIBUTES
  totalExtractable: number;
  totalExtraction: number;
  stage: number;
  category: string;
  // For aggregated data
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

// Stage gauge chart
const StageGauge: React.FC<{ stage: number }> = ({ stage }) => {
  const colors = getCategoryColorsFromStage(stage);

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
              [0.47, CATEGORY_COLORS.safe.primary],
              [0.60, CATEGORY_COLORS.semiCritical.primary],
              [0.67, CATEGORY_COLORS.critical.primary],
              [1, CATEGORY_COLORS.overExploited.primary],
            ],
          },
        },
        pointer: {
          icon: "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z",
          length: "75%",
          width: 8,
          offsetCenter: [0, "-45%"],
          itemStyle: { color: colors.primary },
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
          color: colors.textOnDark,
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

// Category distribution pie chart
const CategoryDistributionChart: React.FC<{
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
      borderColor: "rgba(148, 163, 184, 0.2)",
      textStyle: { color: "#F8FAFC" },
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
        labelLine: { lineStyle: { color: "rgba(255,255,255,0.3)" } },
        data: [
          { value: safe, name: "Safe", itemStyle: { color: CATEGORY_COLORS.safe.primary } },
          { value: semiCritical, name: "Semi-Critical", itemStyle: { color: CATEGORY_COLORS.semiCritical.primary } },
          { value: critical, name: "Critical", itemStyle: { color: CATEGORY_COLORS.critical.primary } },
          { value: overExploited, name: "Over-Exploited", itemStyle: { color: CATEGORY_COLORS.overExploited.primary } },
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
  extractable: number;
  extraction: number;
}> = ({ extractable, extraction }) => {
  const option = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "rgba(148, 163, 184, 0.2)",
      textStyle: { color: "#F8FAFC" },
      formatter: (params: { seriesName: string; value: number }[]) =>
        params.map((p) => `${p.seriesName}: ${formatNumber(p.value)} ham`).join("<br/>"),
    },
    grid: {
      left: "5%",
      right: "5%",
      bottom: "5%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: ["Extractable\nGW Resources", "GW\nExtraction"],
      axisLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, interval: 0 },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.2)" } },
    },
    yAxis: {
      type: "value",
      name: "MCM",
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
                { offset: 0, color: ATTRIBUTE_COLORS.extractable.primary },
                { offset: 1, color: "#1D4ED8" },
              ]),
              new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: ATTRIBUTE_COLORS.extraction.primary },
                { offset: 1, color: "#EA580C" },
              ]),
            ];
            return colors[params.dataIndex];
          },
        },
        data: [extractable, extraction],
        label: {
          show: true,
          position: "top",
          formatter: (params: { value: number }) => formatNumber(params.value),
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
const GroundwaterMetricsCard: React.FC<GroundwaterMetricsCardProps> = ({ data }) => {
  const categoryColors = getCategoryColors(data.category);
  const stageColors = getCategoryColorsFromStage(data.stage);
  const isAggregated = data.locationType === "district" || data.locationType === "state";
  const hasBlockDistribution = isAggregated && (data.totalBlocks ?? 0) > 0;

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.92) 100%)",
        boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-semibold">{data.locationName}</h2>
            <p className="text-slate-400 text-sm capitalize">
              {data.locationType} • {data.year}
            </p>
          </div>
          <div
            className="px-3 py-1.5 rounded-full flex items-center gap-2"
            style={{ backgroundColor: categoryColors.backgroundDark }}
          >
            <span style={{ color: categoryColors.textOnDark }} className="text-sm font-medium">
              {categoryColors.emoji} {formatCategoryName(data.category)}
            </span>
          </div>
        </div>
      </div>

      {/* THE 4 KEY ATTRIBUTES CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
        {/* 1. Extractable GW Resources */}
        <div 
          className="rounded-xl p-4 border"
          style={{ 
            backgroundColor: ATTRIBUTE_COLORS.extractable.backgroundDark,
            borderColor: `${ATTRIBUTE_COLORS.extractable.primary}33`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4" style={{ color: ATTRIBUTE_COLORS.extractable.textOnDark }} />
            <span className="text-xs" style={{ color: ATTRIBUTE_COLORS.extractable.textOnDark }}>
              {FOUR_KEY_ATTRIBUTES.EXTRACTABLE.shortLabel}
            </span>
          </div>
          <div className="text-lg font-bold text-white">
            {formatNumber(data.totalExtractable)} ham
          </div>
          <div className="text-xs opacity-60" style={{ color: ATTRIBUTE_COLORS.extractable.textOnDark }}>
            Annual Resources
          </div>
        </div>

        {/* 2. GW Extraction */}
        <div 
          className="rounded-xl p-4 border"
          style={{ 
            backgroundColor: ATTRIBUTE_COLORS.extraction.backgroundDark,
            borderColor: `${ATTRIBUTE_COLORS.extraction.primary}33`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: ATTRIBUTE_COLORS.extraction.textOnDark }} />
            <span className="text-xs" style={{ color: ATTRIBUTE_COLORS.extraction.textOnDark }}>
              {FOUR_KEY_ATTRIBUTES.EXTRACTION.shortLabel}
            </span>
          </div>
          <div className="text-lg font-bold text-white">
            {formatNumber(data.totalExtraction)} ham
          </div>
          <div className="text-xs opacity-60" style={{ color: ATTRIBUTE_COLORS.extraction.textOnDark }}>
            Annual Usage
          </div>
        </div>

        {/* 3. Stage of Extraction */}
        <div 
          className="rounded-xl p-4 border"
          style={{ 
            backgroundColor: stageColors.backgroundDark,
            borderColor: `${stageColors.primary}33`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4" style={{ color: stageColors.textOnDark }} />
            <span className="text-xs" style={{ color: stageColors.textOnDark }}>
              {FOUR_KEY_ATTRIBUTES.STAGE.shortLabel}
            </span>
          </div>
          <div className="text-lg font-bold" style={{ color: stageColors.textOnDark }}>
            {data.stage?.toFixed(1) || 0}%
          </div>
          <div className="text-xs opacity-60" style={{ color: stageColors.textOnDark }}>
            {getStageLabel(data.stage)}
          </div>
        </div>

        {/* 4. Category */}
        <div 
          className="rounded-xl p-4 border"
          style={{ 
            backgroundColor: categoryColors.backgroundDark,
            borderColor: `${categoryColors.primary}33`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4" style={{ color: categoryColors.textOnDark }} />
            <span className="text-xs" style={{ color: categoryColors.textOnDark }}>
              {FOUR_KEY_ATTRIBUTES.CATEGORY.shortLabel}
            </span>
          </div>
          <div className="text-lg font-bold" style={{ color: categoryColors.textOnDark }}>
            {categoryColors.emoji} {formatCategoryName(data.category)}
          </div>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-white/5">
        {/* Stage Gauge */}
        <div className="bg-slate-900/40 p-4">
          <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">
            Stage of Extraction
          </h3>
          <StageGauge stage={data.stage || 0} />
          <p className="text-center text-xs mt-2" style={{ color: stageColors.textOnDark }}>
            {data.stage > 100 ? "⚠️ Over-extraction detected" :
             data.stage > 90 ? "⚡ Approaching critical levels" :
             data.stage > 70 ? "📊 Monitor closely" :
             "✅ Sustainable extraction"}
          </p>
        </div>

        {/* Block distribution OR Water balance */}
        <div className="bg-slate-900/40 p-4">
          {hasBlockDistribution ? (
            <>
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                Category Distribution ({data.totalBlocks} blocks)
              </h3>
              <CategoryDistributionChart
                safe={data.safeBlocks || 0}
                semiCritical={data.semiCriticalBlocks || 0}
                critical={data.criticalBlocks || 0}
                overExploited={data.overExploitedBlocks || 0}
              />
            </>
          ) : (
            <>
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                Extractable vs Extraction
              </h3>
              <WaterBalanceChart
                extractable={data.totalExtractable || 0}
                extraction={data.totalExtraction || 0}
              />
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10 bg-slate-900/30">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📊</div>
          <div>
            <p className="text-slate-300 text-sm font-medium mb-1">
              The 4 Key Groundwater Attributes
            </p>
            <p className="text-slate-400 text-xs">
              {data.stage > 100
                ? `${data.locationName} is extracting ${(data.stage - 100).toFixed(1)}% more than available. Category: ${formatCategoryName(data.category)}.`
                : data.stage > 70
                ? `Extraction at ${data.stage.toFixed(1)}% of available resources. Close monitoring recommended.`
                : `Sustainable extraction at ${data.stage.toFixed(1)}% of available resources.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroundwaterMetricsCard;
