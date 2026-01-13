import React from "react";
import ReactECharts from "echarts-for-react";
import { Droplets, TrendingUp, Activity, Tag } from "lucide-react";
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

// THE 4 KEY GROUNDWATER ATTRIBUTES ONLY
export interface ComparisonDataPoint {
  name: string;
  extractable: number; // Annual Extractable GW Resources (MCM)
  extraction: number; // Annual GW Extraction (MCM)
  stage: number; // Stage of Extraction (%)
  category: string; // Categorization (safe/critical/over_exploited)
}

export interface ComparisonData {
  year: string;
  locations: ComparisonDataPoint[];
  comparisonType: "state" | "district" | "block";
}

interface ComparisonChartProps {
  data: ComparisonData;
}

interface EChartsTooltipParam {
  componentType: "series";
  seriesType: string;
  seriesName: string;
  name: string;
  dataIndex: number;
  data: number;
  value: number;
  color: string;
  marker: string;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ data }) => {
  const option: echarts.EChartsOption = {
    backgroundColor: "transparent",
    title: {
      text: `${
        data.comparisonType.charAt(0).toUpperCase() +
        data.comparisonType.slice(1)
      } Comparison - ${data.year}`,
      subtext: "The 4 Key Groundwater Attributes",
      left: "center",
      top: 10,
      textStyle: { color: "#333333", fontSize: 16, fontWeight: 600 },
      subtextStyle: { color: "#666666", fontSize: 11 },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#E5E5E5",
      textStyle: { color: "#333333" },
      formatter: (params: unknown) => {
        if (!Array.isArray(params)) return "";
        const tooltipParams = params as EChartsTooltipParam[];
        const location = tooltipParams[0].name;
        const locData = data.locations.find((l) => l.name === location);
        const colors = locData
          ? getCategoryColors(locData.category)
          : CATEGORY_COLORS.unknown;

        let result = `<div style="font-weight: 600; margin-bottom: 6px; color: #333333;">${location}</div>`;
        tooltipParams.forEach((param) => {
          const unit = param.seriesName.includes("Stage") ? "%" : " ham";
          result += `<div style="margin: 3px 0; font-size: 12px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${
              param.color
            };margin-right:6px;"></span>
            ${param.seriesName}: <strong>${
            param.value?.toFixed(1) || 0
          }${unit}</strong>
          </div>`;
        });
        if (locData) {
          result += `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #E5E5E5; font-size: 11px; color: #666666;">
            Category: <strong style="color: ${
              colors.textOnDark
            }">${formatCategoryName(locData.category)}</strong>
          </div>`;
        }
        return result;
      },
    },
    legend: {
      data: ["Extractable GW (ham)", "GW Extraction (ham)", "Stage (%)"],
      top: 48,
      textStyle: { color: "#666666", fontSize: 11 },
      itemGap: 16,
    },
    grid: {
      left: "15%",
      right: "8%",
      bottom: "8%",
      top: 90,
      containLabel: true,
    },
    xAxis: {
      type: "value",
      name: "Value",
      nameTextStyle: { color: "#666666", fontSize: 11 },
      axisLabel: { color: "#666666", fontSize: 10 },
      axisLine: { lineStyle: { color: "#E5E5E5" } },
      splitLine: { lineStyle: { color: "#F5F5F5" } },
    },
    yAxis: {
      type: "category",
      data: data.locations.map((loc) => loc.name),
      axisLabel: {
        color: "#333333",
        fontSize: 12,
        fontWeight: 500,
        margin: 10,
      },
      axisLine: { lineStyle: { color: "#333333", width: 1 } },
      axisTick: { show: false },
    },
    series: [
      {
        name: "Extractable GW (ham)",
        type: "bar",
        data: data.locations.map((loc) => (loc.extractable || 0) / 100),
        itemStyle: {
          color: "#0055A4",
          borderRadius: [0, 2, 2, 0],
        },
        label: {
          show: true,
          position: "right",
          color: "#333333",
          fontSize: 10,
          fontWeight: 500,
          formatter: (params: unknown) => {
            const p = params as EChartsTooltipParam;
            const val = data.locations[p.dataIndex]?.extractable || 0;
            return val > 1000 ? `${(val / 1000).toFixed(1)}K` : String(val);
          },
        },
        barMaxWidth: 25,
      },
      {
        name: "GW Extraction (ham)",
        type: "bar",
        data: data.locations.map((loc) => (loc.extraction || 0) / 100),
        itemStyle: {
          color: ATTRIBUTE_COLORS.extraction.primary,
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: "right",
          color: "#333333",
          fontSize: 10,
          fontWeight: 500,
          formatter: (params: unknown) => {
             const p = params as EChartsTooltipParam;
            const val = data.locations[p.dataIndex]?.extraction || 0;
            return val > 1000 ? `${(val / 1000).toFixed(1)}K` : String(val);
          },
        },
        barMaxWidth: 20,
      },
      {
        name: "Stage (%)",
        type: "bar",
        data: data.locations.map((loc) => loc.stage || 0),
        itemStyle: {
          color: (params: unknown) =>
            getCategoryColorsFromStage((params as EChartsTooltipParam).value).primary,
          borderRadius: [0, 2, 2, 0],
        },
        label: {
          show: true,
          position: "right",
          color: "#333333",
          fontSize: 10,
          fontWeight: 500,
          formatter: (params: unknown) => `${(params as EChartsTooltipParam).value?.toFixed(1) || 0}%`,
        },
        barMaxWidth: 20,
      },
    ],
  };

  // Calculate summary metrics
  const totalExtractable = data.locations.reduce(
    (sum, loc) => sum + (loc.extractable || 0),
    0
  );
  const totalExtraction = data.locations.reduce(
    (sum, loc) => sum + (loc.extraction || 0),
    0
  );
  const avgStage =
    data.locations.reduce((sum, loc) => sum + (loc.stage || 0), 0) /
    data.locations.length;

  // Count categories
  const categoryCounts = data.locations.reduce(
    (acc, loc) => {
      const cat =
        loc.category?.toLowerCase().replace(/[_\s-]/g, "") || "unknown";
      if (cat.includes("over") || cat.includes("exploited"))
        acc.overExploited++;
      else if (cat.includes("critical") && !cat.includes("semi"))
        acc.critical++;
      else if (cat.includes("semi")) acc.semiCritical++;
      else acc.safe++;
      return acc;
    },
    { safe: 0, semiCritical: 0, critical: 0, overExploited: 0 }
  );

  const dominantCategoryKey =
    categoryCounts.overExploited > 0
      ? "overExploited"
      : categoryCounts.critical > 0
      ? "critical"
      : categoryCounts.semiCritical > 0
      ? "semiCritical"
      : "safe";

  const dominantColors = CATEGORY_COLORS[dominantCategoryKey];

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border" style={{ borderColor: "#E5E5E5" }}>
      {/* THE 4 KEY ATTRIBUTES SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* 1. Annual Extractable GW Resources */}
        <div
          className="rounded p-3 border"
          style={{
            backgroundColor: "#F0F7FF",
            borderColor: "#0055A4",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Droplets
              className="w-4 h-4"
              style={{ color: "#0055A4" }}
            />
            <span
              className="text-xs"
              style={{ color: "#0055A4" }}
            >
              {FOUR_KEY_ATTRIBUTES.EXTRACTABLE.shortLabel}
            </span>
          </div>
          <div className="text-base font-semibold" style={{ color: "#333333" }}>
            {formatNumber(totalExtractable)} ham
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "#666666" }}
          >
            Annual Resources
          </div>
        </div>

        {/* 2. Annual GW Extraction */}
        <div
          className="rounded p-3 border"
          style={{
            backgroundColor: "#FFF4E6",
            borderColor: "#FF6B00",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp
              className="w-4 h-4"
              style={{ color: "#FF6B00" }}
            />
            <span
              className="text-xs"
              style={{ color: "#FF6B00" }}
            >
              {FOUR_KEY_ATTRIBUTES.EXTRACTION.shortLabel}
            </span>
          </div>
          <div className="text-base font-semibold" style={{ color: "#333333" }}>
            {formatNumber(totalExtraction)} ham
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "#666666" }}
          >
            Annual Usage
          </div>
        </div>

        {/* 3. Stage of Extraction */}
        <div
          className="rounded p-3 border"
          style={{
            backgroundColor: "#FFF0F0",
            borderColor: getCategoryColorsFromStage(avgStage).primary,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Activity
              className="w-4 h-4"
              style={{ color: getCategoryColorsFromStage(avgStage).primary }}
            />
            <span
              className="text-xs"
              style={{ color: getCategoryColorsFromStage(avgStage).primary }}
            >
              Avg {FOUR_KEY_ATTRIBUTES.STAGE.shortLabel}
            </span>
          </div>
          <div
            className="text-base font-semibold"
            style={{ color: "#333333" }}
          >
            {avgStage.toFixed(1)}%
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "#666666" }}
          >
            {getStageLabel(avgStage)}
          </div>
        </div>

        {/* 4. Categorization */}
        <div
          className="rounded p-3 border"
          style={{
            backgroundColor: "#F5F5F5",
            borderColor: dominantColors.primary,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Tag
              className="w-4 h-4"
              style={{ color: dominantColors.primary }}
            />
            <span
              className="text-xs"
              style={{ color: dominantColors.primary }}
            >
              {FOUR_KEY_ATTRIBUTES.CATEGORY.shortLabel}
            </span>
          </div>
          <div
            className="text-base font-semibold"
            style={{ color: "#333333" }}
          >
            {formatCategoryName(dominantCategoryKey)}
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "#666666" }}
          >
            {categoryCounts.overExploited} | {categoryCounts.critical} | {categoryCounts.semiCritical} | {categoryCounts.safe}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded p-3 border" style={{ borderColor: "#E5E5E5" }}>
        <ReactECharts
          option={option}
          style={{ height: "400px" }}
          opts={{ renderer: "canvas" }}
        />
      </div>
    </div>
  );
};

export default ComparisonChart;
