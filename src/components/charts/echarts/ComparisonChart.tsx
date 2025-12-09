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
  extractable: number;    // Annual Extractable GW Resources (MCM)
  extraction: number;     // Annual GW Extraction (MCM)
  stage: number;          // Stage of Extraction (%)
  category: string;       // Categorization (safe/critical/over_exploited)
}

export interface ComparisonData {
  year: string;
  locations: ComparisonDataPoint[];
  comparisonType: "state" | "district" | "block";
}

interface ComparisonChartProps {
  data: ComparisonData;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ data }) => {
  console.log("\n" + "=".repeat(80));
  console.log("📊 COMPARISON CHART - 4 KEY ATTRIBUTES (WCAG Compliant)");
  console.log(`├─ Type: ${data.comparisonType.toUpperCase()}`);
  console.log(`├─ Year: ${data.year}`);
  console.log(`├─ Locations: ${data.locations.length}`);
  console.log("=".repeat(80) + "\n");

  const option: echarts.EChartsOption = {
    backgroundColor: "transparent",
    title: {
      text: `${data.comparisonType.charAt(0).toUpperCase() + data.comparisonType.slice(1)} Comparison - ${data.year}`,
      subtext: "The 4 Key Groundwater Attributes",
      left: "center",
      top: 10,
      textStyle: { color: "#F8FAFC", fontSize: 18, fontWeight: "bold" },
      subtextStyle: { color: "#94A3B8", fontSize: 12 },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "rgba(148, 163, 184, 0.2)",
      textStyle: { color: "#F8FAFC" },
      formatter: (params: any) => {
        if (!Array.isArray(params)) return "";
        const location = params[0].name;
        const locData = data.locations.find(l => l.name === location);
        const colors = locData ? getCategoryColors(locData.category) : CATEGORY_COLORS.unknown;
        
        let result = `<div style="font-weight: bold; margin-bottom: 8px;">${location}</div>`;
        params.forEach((param: any) => {
          const unit = param.seriesName.includes("Stage") ? "%" : " ham";
          result += `<div style="margin: 4px 0;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${param.color};margin-right:8px;"></span>
            ${param.seriesName}: <strong>${param.value?.toFixed(1) || 0}${unit}</strong>
          </div>`;
        });
        if (locData) {
          result += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #475569;">
            Category: <strong style="color: ${colors.textOnDark}">${formatCategoryName(locData.category)}</strong>
          </div>`;
        }
        return result;
      },
    },
    legend: {
      data: ["Extractable GW (MCM)", "GW Extraction (MCM)", "Stage (%)"],
      top: 55,
      textStyle: { color: "#94A3B8", fontSize: 12 },
      itemGap: 20,
    },
    grid: {
      left: "18%",
      right: "10%",
      bottom: "10%",
      top: 110,
      containLabel: true,
    },
    xAxis: {
      type: "value",
      name: "Value",
      nameTextStyle: { color: "#94A3B8", fontSize: 12 },
      axisLabel: { color: "#94A3B8", fontSize: 11 },
      axisLine: { lineStyle: { color: "#475569" } },
      splitLine: { lineStyle: { color: "#334155" } },
    },
    yAxis: {
      type: "category",
      data: data.locations.map((loc) => loc.name),
      axisLabel: { 
        color: "#F8FAFC", 
        fontSize: 14, 
        fontWeight: "bold", 
        margin: 12,
        // Color code location names by category for blocks
        formatter: (value: string, index: number) => {
          const loc = data.locations[index];
          if (data.comparisonType === "block" && loc) {
            const colors = getCategoryColors(loc.category);
            return `{${loc.category}|${value}}`;
          }
          return value;
        },
        rich: {
          safe: { color: CATEGORY_COLORS.safe.textOnDark, fontWeight: "bold" },
          semi_critical: { color: CATEGORY_COLORS.semiCritical.textOnDark, fontWeight: "bold" },
          critical: { color: CATEGORY_COLORS.critical.textOnDark, fontWeight: "bold" },
          over_exploited: { color: CATEGORY_COLORS.overExploited.textOnDark, fontWeight: "bold" },
          unknown: { color: CATEGORY_COLORS.unknown.textOnDark, fontWeight: "bold" },
        },
      },
      axisLine: { lineStyle: { color: "#F8FAFC", width: 2 } },
      axisTick: { show: false },
    },
    series: [
      {
        name: "Extractable GW (MCM)",
        type: "bar",
        data: data.locations.map((loc) => (loc.extractable || 0) / 100),
        itemStyle: { color: ATTRIBUTE_COLORS.extractable.primary, borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: "right",
          color: "#F8FAFC",
          fontSize: 11,
          fontWeight: "bold",
          formatter: (params: any) => {
            const val = data.locations[params.dataIndex]?.extractable || 0;
            return val > 1000 ? `${(val/1000).toFixed(1)}K` : val.toFixed(0);
          },
        },
        barMaxWidth: 25,
      },
      {
        name: "GW Extraction (MCM)",
        type: "bar",
        data: data.locations.map((loc) => (loc.extraction || 0) / 100),
        itemStyle: { color: ATTRIBUTE_COLORS.extraction.primary, borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: "right",
          color: "#F8FAFC",
          fontSize: 11,
          fontWeight: "bold",
          formatter: (params: any) => {
            const val = data.locations[params.dataIndex]?.extraction || 0;
            return val > 1000 ? `${(val/1000).toFixed(1)}K` : val.toFixed(0);
          },
        },
        barMaxWidth: 25,
      },
      {
        name: "Stage (%)",
        type: "bar",
        data: data.locations.map((loc) => loc.stage || 0),
        itemStyle: {
          color: (params: any) => getCategoryColorsFromStage(params.value).primary,
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: "right",
          color: "#F8FAFC",
          fontSize: 11,
          fontWeight: "bold",
          formatter: (params: any) => `${params.value?.toFixed(1) || 0}%`,
        },
        barMaxWidth: 25,
      },
    ],
  };

  // Calculate summary metrics
  const totalExtractable = data.locations.reduce((sum, loc) => sum + (loc.extractable || 0), 0);
  const totalExtraction = data.locations.reduce((sum, loc) => sum + (loc.extraction || 0), 0);
  const avgStage = data.locations.reduce((sum, loc) => sum + (loc.stage || 0), 0) / data.locations.length;
  
  // Count categories
  const categoryCounts = data.locations.reduce((acc, loc) => {
    const cat = loc.category?.toLowerCase().replace(/[_\s-]/g, "") || "unknown";
    if (cat.includes("over") || cat.includes("exploited")) acc.overExploited++;
    else if (cat.includes("critical") && !cat.includes("semi")) acc.critical++;
    else if (cat.includes("semi")) acc.semiCritical++;
    else acc.safe++;
    return acc;
  }, { safe: 0, semiCritical: 0, critical: 0, overExploited: 0 });

  const dominantCategoryKey = 
    categoryCounts.overExploited > 0 ? "overExploited" :
    categoryCounts.critical > 0 ? "critical" :
    categoryCounts.semiCritical > 0 ? "semiCritical" : "safe";
  
  const dominantColors = CATEGORY_COLORS[dominantCategoryKey];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-white/10">
      {/* THE 4 KEY ATTRIBUTES SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* 1. Annual Extractable GW Resources */}
        <div 
          className="rounded-xl p-4 border"
          style={{ 
            backgroundColor: ATTRIBUTE_COLORS.extractable.backgroundDark,
            borderColor: `${ATTRIBUTE_COLORS.extractable.primary}33`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-5 h-5" style={{ color: ATTRIBUTE_COLORS.extractable.textOnDark }} />
            <span className="text-xs font-medium" style={{ color: ATTRIBUTE_COLORS.extractable.textOnDark }}>
              {FOUR_KEY_ATTRIBUTES.EXTRACTABLE.shortLabel}
            </span>
          </div>
          <div className="text-xl font-bold text-white">{formatNumber(totalExtractable)} ham</div>
          <div className="text-xs mt-1 opacity-60" style={{ color: ATTRIBUTE_COLORS.extractable.textOnDark }}>
            Annual Resources
          </div>
        </div>

        {/* 2. Annual GW Extraction */}
        <div 
          className="rounded-xl p-4 border"
          style={{ 
            backgroundColor: ATTRIBUTE_COLORS.extraction.backgroundDark,
            borderColor: `${ATTRIBUTE_COLORS.extraction.primary}33`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" style={{ color: ATTRIBUTE_COLORS.extraction.textOnDark }} />
            <span className="text-xs font-medium" style={{ color: ATTRIBUTE_COLORS.extraction.textOnDark }}>
              {FOUR_KEY_ATTRIBUTES.EXTRACTION.shortLabel}
            </span>
          </div>
          <div className="text-xl font-bold text-white">{formatNumber(totalExtraction)} ham</div>
          <div className="text-xs mt-1 opacity-60" style={{ color: ATTRIBUTE_COLORS.extraction.textOnDark }}>
            Annual Usage
          </div>
        </div>

        {/* 3. Stage of Extraction */}
        <div 
          className="rounded-xl p-4 border"
          style={{ 
            backgroundColor: getCategoryColorsFromStage(avgStage).backgroundDark,
            borderColor: `${getCategoryColorsFromStage(avgStage).primary}33`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5" style={{ color: getCategoryColorsFromStage(avgStage).textOnDark }} />
            <span className="text-xs font-medium" style={{ color: getCategoryColorsFromStage(avgStage).textOnDark }}>
              Avg {FOUR_KEY_ATTRIBUTES.STAGE.shortLabel}
            </span>
          </div>
          <div className="text-xl font-bold" style={{ color: getCategoryColorsFromStage(avgStage).textOnDark }}>
            {avgStage.toFixed(1)}%
          </div>
          <div className="text-xs mt-1 opacity-60" style={{ color: getCategoryColorsFromStage(avgStage).textOnDark }}>
            {getStageLabel(avgStage)}
          </div>
        </div>

        {/* 4. Categorization */}
        <div 
          className="rounded-xl p-4 border"
          style={{ 
            backgroundColor: dominantColors.backgroundDark,
            borderColor: `${dominantColors.primary}33`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-5 h-5" style={{ color: dominantColors.textOnDark }} />
            <span className="text-xs font-medium" style={{ color: dominantColors.textOnDark }}>
              {FOUR_KEY_ATTRIBUTES.CATEGORY.shortLabel}
            </span>
          </div>
          <div className="text-xl font-bold" style={{ color: dominantColors.textOnDark }}>
            {dominantColors.emoji} {formatCategoryName(dominantCategoryKey)}
          </div>
          <div className="text-xs mt-1" style={{ color: dominantColors.textOnDark }}>
            {CATEGORY_COLORS.overExploited.emoji} {categoryCounts.overExploited} | 
            {CATEGORY_COLORS.critical.emoji} {categoryCounts.critical} | 
            {CATEGORY_COLORS.semiCritical.emoji} {categoryCounts.semiCritical} | 
            {CATEGORY_COLORS.safe.emoji} {categoryCounts.safe}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <ReactECharts
          option={option}
          style={{ height: "450px" }}
          opts={{ renderer: "canvas" }}
        />
      </div>

      {/* Location Details - 4 ATTRIBUTES ONLY */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.locations.map((location, index) => {
          const locColors = getCategoryColors(location.category);
          return (
            <div
              key={index}
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">{location.name}</h3>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: locColors.backgroundDark,
                    color: locColors.textOnDark,
                    border: `1px solid ${locColors.primary}40`,
                  }}
                >
                  {locColors.emoji} {formatCategoryName(location.category)}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">1️⃣ Extractable:</span>
                  <span style={{ color: ATTRIBUTE_COLORS.extractable.textOnDark }} className="font-medium">
                    {formatNumber(location.extractable)} ham
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">2️⃣ Extraction:</span>
                  <span style={{ color: ATTRIBUTE_COLORS.extraction.textOnDark }} className="font-medium">
                    {formatNumber(location.extraction)} ham
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">3️⃣ Stage:</span>
                  <span style={{ color: getCategoryColorsFromStage(location.stage).textOnDark }} className="font-medium">
                    {(location.stage || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">4️⃣ Category:</span>
                  <span style={{ color: locColors.textOnDark }} className="font-medium">
                    {formatCategoryName(location.category)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComparisonChart;
