import React from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { TrendingUp, TrendingDown, Minus, Calendar, MapPin, Droplets, Activity } from "lucide-react";

// ============================================
// TREND ANALYSIS CARD COMPONENT
// Displays groundwater trends over multiple years
// ============================================

export interface TrendDataPoint {
  year: string;
  recharge: number;
  extraction: number;
  stage: number;
  rainfall: number;
  category: string;
}

export interface TrendData {
  locationName: string;
  locationType: "block" | "district" | "state";
  startYear: string;
  endYear: string;
  dataPoints: TrendDataPoint[];
  // Calculated insights
  rechargeChange: number; // Percentage change from first to last year
  extractionChange: number;
  stageChange: number;
  overallTrend: "improving" | "stable" | "declining";
}

interface TrendAnalysisCardProps {
  data: TrendData;
}

// Helper to get trend icon and color
const getTrendStyle = (change: number, isStage: boolean = false) => {
  // For stage, higher is worse, so reverse the logic
  const effectiveChange = isStage ? -change : change;
  
  if (effectiveChange > 5) {
    return { icon: TrendingUp, color: "#10B981", label: "Improving" };
  } else if (effectiveChange < -5) {
    return { icon: TrendingDown, color: "#EF4444", label: "Declining" };
  }
  return { icon: Minus, color: "#6B7280", label: "Stable" };
};

// Format number with appropriate precision
const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return "N/A";
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toFixed(1);
};

// Format percentage change
const formatChange = (change: number): string => {
  if (isNaN(change)) return "N/A";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
};

// Get category color
const getCategoryColor = (category: string): string => {
  switch (category?.toLowerCase().replace(/[_-]/g, " ")) {
    case "safe": return "#10B981";
    case "semi critical": return "#F59E0B";
    case "critical": return "#F97316";
    case "over exploited": return "#EF4444";
    default: return "#6B7280";
  }
};

// Stat card component
const StatCard: React.FC<{
  label: string;
  value: string;
  change: number;
  unit: string;
  isStage?: boolean;
  icon: React.ReactNode;
}> = ({ label, value, change, unit, isStage = false, icon }) => {
  const trend = getTrendStyle(change, isStage);
  const TrendIcon = trend.icon;
  
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {value} <span className="text-sm font-normal text-gray-400">{unit}</span>
      </div>
      <div className="flex items-center gap-1" style={{ color: trend.color }}>
        <TrendIcon className="w-4 h-4" />
        <span className="text-sm">{formatChange(change)}</span>
        <span className="text-xs text-gray-500 ml-1">{trend.label}</span>
      </div>
    </div>
  );
};

const TrendAnalysisCard: React.FC<TrendAnalysisCardProps> = ({ data }) => {
  const { locationName, locationType, startYear, endYear, dataPoints, rechargeChange, extractionChange, stageChange, overallTrend } = data;
  
  // Prepare chart data
  const years = dataPoints.map(d => d.year);
  const rechargeData = dataPoints.map(d => d.recharge);
  const extractionData = dataPoints.map(d => d.extraction);
  const stageData = dataPoints.map(d => d.stage);
  const rainfallData = dataPoints.map(d => d.rainfall);
  
  // Get latest values
  const latestData = dataPoints[dataPoints.length - 1] || { recharge: 0, extraction: 0, stage: 0, rainfall: 0 };

  // Main trend chart options
  const mainChartOption: echarts.EChartsOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(17, 24, 39, 0.95)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      textStyle: { color: "#fff" },
      axisPointer: {
        type: "cross",
        lineStyle: { color: "rgba(255, 255, 255, 0.2)" }
      },
      formatter: (params: unknown) => {
        const data = params as Array<{
          axisValue: string;
          marker: string;
          seriesName: string;
          value: number;
        }>;
        if (!Array.isArray(data) || data.length === 0) return "";
        
        let result = `<div style="font-weight: 600; margin-bottom: 8px;">${data[0].axisValue}</div>`;
        data.forEach(item => {
          const unit = item.seriesName.includes("Stage") ? "%" : " MCM";
          result += `<div style="display: flex; justify-content: space-between; gap: 16px;">
            ${item.marker}
            <span style="color: #9CA3AF;">${item.seriesName}</span>
            <span style="font-weight: 600;">${item.value?.toFixed(2)}${unit}</span>
          </div>`;
        });
        return result;
      }
    },
    legend: {
      data: ["Recharge", "Extraction", "Stage of Extraction"],
      top: 10,
      textStyle: { color: "#9CA3AF" },
      itemGap: 20
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: 60,
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: years,
      axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.2)" } },
      axisLabel: { color: "#9CA3AF" },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: "value",
        name: "Volume (MCM)",
        nameTextStyle: { color: "#9CA3AF" },
        axisLine: { show: false },
        axisLabel: { color: "#9CA3AF" },
        splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.1)" } }
      },
      {
        type: "value",
        name: "Stage (%)",
        nameTextStyle: { color: "#9CA3AF" },
        axisLine: { show: false },
        axisLabel: { color: "#9CA3AF" },
        splitLine: { show: false },
        max: 200
      }
    ],
    series: [
      {
        name: "Recharge",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { width: 3, color: "#10B981" },
        itemStyle: { color: "#10B981" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(16, 185, 129, 0.3)" },
            { offset: 1, color: "rgba(16, 185, 129, 0)" }
          ])
        },
        data: rechargeData
      },
      {
        name: "Extraction",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { width: 3, color: "#F59E0B" },
        itemStyle: { color: "#F59E0B" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(245, 158, 11, 0.3)" },
            { offset: 1, color: "rgba(245, 158, 11, 0)" }
          ])
        },
        data: extractionData
      },
      {
        name: "Stage of Extraction",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        symbol: "diamond",
        symbolSize: 10,
        lineStyle: { width: 2, color: "#EF4444", type: "dashed" },
        itemStyle: { color: "#EF4444" },
        data: stageData
      }
    ]
  };

  // Rainfall chart options
  const rainfallChartOption: echarts.EChartsOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(17, 24, 39, 0.95)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      textStyle: { color: "#fff" },
      formatter: (params: unknown) => {
        const data = params as Array<{ axisValue: string; value: number }>;
        if (!Array.isArray(data) || data.length === 0) return "";
        return `<div style="font-weight: 600;">${data[0].axisValue}</div>
                <div>Rainfall: <span style="font-weight: 600;">${data[0].value?.toFixed(1)} mm</span></div>`;
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: 30,
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: years,
      axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.2)" } },
      axisLabel: { color: "#9CA3AF", fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisLabel: { color: "#9CA3AF", fontSize: 10 },
      splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.1)" } }
    },
    series: [
      {
        type: "bar",
        data: rainfallData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#3B82F6" },
            { offset: 1, color: "#1D4ED8" }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: "60%"
      }
    ]
  };

  // Category timeline
  const categoryTimelineOption: echarts.EChartsOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(17, 24, 39, 0.95)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      textStyle: { color: "#fff" }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: 10,
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: years,
      axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.2)" } },
      axisLabel: { color: "#9CA3AF", fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      max: 1,
      min: 0,
      show: false
    },
    series: [
      {
        type: "scatter",
        symbolSize: 24,
        data: dataPoints.map((d, idx) => ({
          value: [idx, 0.5],
          itemStyle: { color: getCategoryColor(d.category) },
          name: d.category
        })),
        label: {
          show: true,
          formatter: (params: unknown) => {
            const p = params as { data: { name: string } };
            const cat = p.data?.name?.toLowerCase().replace(/[_-]/g, " ");
            if (cat === "safe") return "✓";
            if (cat === "semi critical") return "!";
            if (cat === "critical") return "!!";
            if (cat === "over exploited") return "✗";
            return "?";
          },
          fontSize: 12,
          color: "#fff"
        }
      }
    ]
  };

  // Overall trend badge
  const overallTrendStyle = {
    improving: { color: "#10B981", bg: "rgba(16, 185, 129, 0.15)", icon: TrendingUp },
    stable: { color: "#6B7280", bg: "rgba(107, 114, 128, 0.15)", icon: Minus },
    declining: { color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)", icon: TrendingDown }
  }[overallTrend] || { color: "#6B7280", bg: "rgba(107, 114, 128, 0.15)", icon: Minus };

  const OverallIcon = overallTrendStyle.icon;

  return (
    <div className="w-full bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <MapPin className="w-4 h-4" />
              <span className="capitalize">{locationType}</span>
            </div>
            <h2 className="text-2xl font-bold text-white">{locationName}</h2>
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
              <Calendar className="w-4 h-4" />
              <span>Trend Analysis: {startYear} → {endYear}</span>
            </div>
          </div>
          <div 
            className="px-4 py-2 rounded-xl flex items-center gap-2"
            style={{ backgroundColor: overallTrendStyle.bg }}
          >
            <OverallIcon className="w-5 h-5" style={{ color: overallTrendStyle.color }} />
            <span className="font-semibold capitalize" style={{ color: overallTrendStyle.color }}>
              {overallTrend}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-white/10">
        <StatCard
          label="Total Recharge"
          value={formatNumber(latestData.recharge)}
          change={rechargeChange}
          unit="MCM"
          icon={<Droplets className="w-4 h-4" />}
        />
        <StatCard
          label="Total Extraction"
          value={formatNumber(latestData.extraction)}
          change={extractionChange}
          unit="MCM"
          icon={<Activity className="w-4 h-4" />}
        />
        <StatCard
          label="Stage of Extraction"
          value={formatNumber(latestData.stage)}
          change={stageChange}
          unit="%"
          isStage={true}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Avg. Rainfall"
          value={formatNumber(latestData.rainfall)}
          change={0}
          unit="mm"
          icon={<Calendar className="w-4 h-4" />}
        />
      </div>

      {/* Main Trend Chart */}
      <div className="p-6 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">📈 Recharge vs Extraction Trends</h3>
        <ReactECharts
          option={mainChartOption}
          style={{ height: "320px", width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      </div>

      {/* Secondary Charts Row */}
      <div className="grid md:grid-cols-2 gap-6 p-6">
        {/* Rainfall Chart */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="text-sm font-semibold text-white mb-3">🌧️ Annual Rainfall</h4>
          <ReactECharts
            option={rainfallChartOption}
            style={{ height: "180px", width: "100%" }}
            opts={{ renderer: "canvas" }}
          />
        </div>

        {/* Category Timeline */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="text-sm font-semibold text-white mb-3">📊 Category Evolution</h4>
          <ReactECharts
            option={categoryTimelineOption}
            style={{ height: "100px", width: "100%" }}
            opts={{ renderer: "canvas" }}
          />
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {[
              { label: "Safe", color: "#10B981" },
              { label: "Semi-Critical", color: "#F59E0B" },
              { label: "Critical", color: "#F97316" },
              { label: "Over-Exploited", color: "#EF4444" }
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1 text-xs">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights Footer */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-t border-white/10">
        <p className="text-sm text-gray-400">
          <span className="text-white font-medium">💡 Insight:</span>{" "}
          {overallTrend === "improving" && (
            <>Groundwater conditions have improved with recharge rates increasing by {Math.abs(rechargeChange).toFixed(1)}%. Continue sustainable practices.</>
          )}
          {overallTrend === "declining" && (
            <>Groundwater stress is increasing. Extraction has changed by {Math.abs(extractionChange).toFixed(1)}%. Immediate intervention recommended.</>
          )}
          {overallTrend === "stable" && (
            <>Groundwater levels are relatively stable. Monitor seasonal variations and maintain current management practices.</>
          )}
        </p>
      </div>
    </div>
  );
};

export default TrendAnalysisCard;
