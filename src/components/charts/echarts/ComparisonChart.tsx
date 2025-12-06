import React from "react";
import ReactECharts from "echarts-for-react";
import { TrendingUp, TrendingDown, Droplets, Activity } from "lucide-react";

export interface ComparisonDataPoint {
  name: string;
  recharge: number;
  extraction: number;
  stage: number;
  rainfall: number;
  category: string;
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
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      safe: "#10b981",
      semicritical: "#3b82f6",
      critical: "#f59e0b",
      overcritical: "#ef4444",
      saline: "#8b5cf6",
    };
    return colors[category.toLowerCase().replace(/[_\s-]/g, "")] || "#6b7280";
  };

  const option: echarts.EChartsOption = {
    backgroundColor: "transparent",
    title: {
      text: `${
        data.comparisonType.charAt(0).toUpperCase() +
        data.comparisonType.slice(1)
      } Comparison - ${data.year}`,
      left: "center",
      top: 20,
      textStyle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      backgroundColor: "rgba(17, 24, 39, 0.95)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      textStyle: {
        color: "#fff",
      },
      formatter: (params: any) => {
        if (!Array.isArray(params)) return "";
        const location = params[0].name;
        let result = `<div style="font-weight: bold; margin-bottom: 8px;">${location}</div>`;
        params.forEach((param: any) => {
          const unit =
            param.seriesName === "Recharge" || param.seriesName === "Extraction"
              ? " MCM"
              : param.seriesName === "Stage"
              ? "%"
              : "mm";
          result += `<div style="margin: 4px 0;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${param.color};margin-right:8px;"></span>
            ${param.seriesName}: <strong>${param.value}${unit}</strong>
          </div>`;
        });
        return result;
      },
    },
    legend: {
      data: ["Recharge", "Extraction", "Stage", "Rainfall"],
      top: 60,
      textStyle: {
        color: "#94a3b8",
      },
      itemGap: 20,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: 120,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.locations.map((loc) => loc.name),
      axisLabel: {
        color: "#94a3b8",
        interval: 0,
        rotate: data.locations.length > 5 ? 45 : 0,
      },
      axisLine: {
        lineStyle: {
          color: "#475569",
        },
      },
    },
    yAxis: {
      type: "value",
      name: "Value",
      nameTextStyle: {
        color: "#94a3b8",
      },
      axisLabel: {
        color: "#94a3b8",
      },
      axisLine: {
        lineStyle: {
          color: "#475569",
        },
      },
      splitLine: {
        lineStyle: {
          color: "#334155",
        },
      },
    },
    series: [
      {
        name: "Recharge",
        type: "bar",
        data: data.locations.map((loc) => loc.recharge),
        itemStyle: {
          color: "#3b82f6",
        },
        label: {
          show: true,
          position: "top",
          color: "#fff",
          formatter: (params: any) => params.value.toFixed(1),
        },
      },
      {
        name: "Extraction",
        type: "bar",
        data: data.locations.map((loc) => loc.extraction),
        itemStyle: {
          color: "#f59e0b",
        },
        label: {
          show: true,
          position: "top",
          color: "#fff",
          formatter: (params: any) => params.value.toFixed(1),
        },
      },
      {
        name: "Stage",
        type: "bar",
        data: data.locations.map((loc) => loc.stage),
        itemStyle: {
          color: "#8b5cf6",
        },
        label: {
          show: true,
          position: "top",
          color: "#fff",
          formatter: (params: any) => params.value.toFixed(1) + "%",
        },
      },
      {
        name: "Rainfall",
        type: "bar",
        data: data.locations.map((loc) => loc.rainfall),
        itemStyle: {
          color: "#22c55e",
        },
        label: {
          show: true,
          position: "top",
          color: "#fff",
          formatter: (params: any) => params.value.toFixed(0) + "mm",
        },
      },
    ],
  };

  // Calculate summary metrics
  const totalRecharge = data.locations.reduce(
    (sum, loc) => sum + loc.recharge,
    0
  );
  const totalExtraction = data.locations.reduce(
    (sum, loc) => sum + loc.extraction,
    0
  );
  const avgStage =
    data.locations.reduce((sum, loc) => sum + loc.stage, 0) /
    data.locations.length;
  const avgRainfall =
    data.locations.reduce((sum, loc) => sum + loc.rainfall, 0) /
    data.locations.length;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-white/10">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-blue-300">Total Recharge</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {totalRecharge.toFixed(1)} MCM
          </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-orange-300">Total Extraction</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {totalExtraction.toFixed(1)} MCM
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-purple-300">Avg Stage</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {avgStage.toFixed(1)}%
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-300">Avg Rainfall</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {avgRainfall.toFixed(0)}mm
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <ReactECharts
          option={option}
          style={{ height: "500px" }}
          opts={{ renderer: "canvas" }}
        />
      </div>

      {/* Location Details */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.locations.map((location, index) => (
          <div
            key={index}
            className="bg-white/5 rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">{location.name}</h3>
              <span
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: getCategoryColor(location.category) + "20",
                  color: getCategoryColor(location.category),
                  border: `1px solid ${getCategoryColor(location.category)}40`,
                }}
              >
                {location.category}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Recharge:</span>
                <span className="text-blue-400 font-medium">
                  {location.recharge.toFixed(1)} MCM
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Extraction:</span>
                <span className="text-orange-400 font-medium">
                  {location.extraction.toFixed(1)} MCM
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Stage:</span>
                <span className="text-purple-400 font-medium">
                  {location.stage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rainfall:</span>
                <span className="text-green-400 font-medium">
                  {location.rainfall.toFixed(0)}mm
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComparisonChart;
