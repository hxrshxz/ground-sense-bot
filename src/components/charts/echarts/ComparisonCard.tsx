import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Droplets,
  Factory,
} from "lucide-react";

// ============================================
// COMPARISON CARD COMPONENT
// Multi-location comparison with grouped bar charts
// ============================================

export interface ComparisonDataPoint {
  locationName: string;
  locationType: "block" | "district" | "state";
  recharge: number;
  extraction: number;
  stage: number;
  rainfall: number;
  category: string;
  safeBlocks?: number;
  criticalBlocks?: number;
}

export interface ComparisonData {
  year: string;
  locations: ComparisonDataPoint[];
}

interface ComparisonCardProps {
  data: ComparisonData;
}

interface EChartsParam {
  componentType: "series";
  seriesType: string;
  seriesName: string;
  name: string;
  dataIndex: number;
  data: number;
  value: number;
  color: string;
  axisValue: string;
  marker: string;
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({ data }) => {
  // Build ECharts grouped bar chart option
  const chartOption: echarts.EChartsOption = useMemo(() => {
    const locationNames = data.locations.map((loc) => loc.locationName);

    // Category color mapping
    const getCategoryColor = (cat: string) => {
      const colors: Record<string, string> = {
        safe: "#10b981",
        semicritical: "#3b82f6",
        critical: "#f59e0b",
        overcritical: "#ef4444",
        overexploited: "#ef4444",
        saline: "#8b5cf6",
      };
      return colors[cat.toLowerCase().replace(/[_\s-]/g, "")] || "#6b7280";
    };

    const getCategoryLabel = (cat: string) => {
      const labels: Record<string, string> = {
        safe: "Safe",
        semicritical: "Semi-Critical",
        critical: "Critical",
        overcritical: "Over-Exploited",
        overexploited: "Over-Exploited",
        saline: "Saline",
      };
      return labels[cat.toLowerCase().replace(/[_\s-]/g, "")] || cat;
    };

    return {
      backgroundColor: "transparent",
      title: {
        text: `Groundwater Comparison (${data.year})`,
        left: "center",
        top: 10,
        textStyle: {
          color: "#fff",
          fontSize: 20,
          fontWeight: "bold",
        },
        subtextStyle: {
          color: "#94a3b8",
          fontSize: 14,
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
        formatter: (params: unknown) => {
          const p = params as EChartsParam[];
          const location = p[0].axisValue;
          let result = `<div style="font-weight: bold; margin-bottom: 8px;">${location}</div>`;
          p.forEach((param) => {
            const value = param.value;
            const unit =
              param.seriesName === "Rainfall"
                ? "mm"
                : param.seriesName === "Stage"
                ? "%"
                : "MCM";
            result += `<div style="display: flex; align-items: center; margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${
                param.color
              }; border-radius: 50%; margin-right: 8px;"></span>
              <span style="flex: 1;">${param.seriesName}:</span>
              <span style="font-weight: bold; margin-left: 12px;">${value.toFixed(
                1
              )} ${unit}</span>
            </div>`;
          });
          return result;
        },
      },
      legend: {
        data: ["Recharge", "Extraction", "Stage", "Rainfall"],
        top: 50,
        textStyle: {
          color: "#94a3b8",
        },
        itemGap: 20,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        top: 100,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: locationNames,
        axisLabel: {
          color: "#94a3b8",
          rotate: 30,
          interval: 0,
        },
        axisLine: {
          lineStyle: {
            color: "#475569",
          },
        },
      },
      yAxis: {
        type: "value",
        name: "Value (MCM / mm / %)",
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
          type: "bar" as const,
          data: data.locations.map((loc) => loc.recharge),
          itemStyle: {
            color: "#3b82f6",
          },
          label: {
            show: true,
            position: "top" as const,
            color: "#fff",
            formatter: (params: unknown) => (params as EChartsParam).value.toFixed(1),
          },
          emphasis: {
            focus: "series",
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(59, 130, 246, 0.5)",
            },
          },
        },
        {
          name: "Extraction",
          type: "bar" as const,
          data: data.locations.map((loc) => loc.extraction),
          itemStyle: {
            color: "#f59e0b",
          },
          label: {
            show: true,
            position: "top" as const,
            color: "#fff",
            formatter: (params: unknown) => (params as EChartsParam).value.toFixed(1),
          },
          emphasis: {
            focus: "series",
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(245, 158, 11, 0.5)",
            },
          },
        },
        {
          name: "Stage",
          type: "bar" as const,
          data: data.locations.map((loc) => loc.stage),
          itemStyle: {
            color: "#8b5cf6",
          },
          label: {
            show: true,
            position: "top" as const,
            color: "#fff",
            formatter: (params: unknown) => (params as EChartsParam).value.toFixed(1) + "%",
          },
          emphasis: {
            focus: "series",
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(139, 92, 246, 0.5)",
            },
          },
        },
        {
          name: "Rainfall",
          type: "bar" as const,
          data: data.locations.map((loc) => loc.rainfall),
          itemStyle: {
            color: "#22c55e",
          },
          label: {
            show: true,
            position: "top" as const,
            color: "#fff",
            formatter: (params: unknown) => (params as EChartsParam).value.toFixed(0) + "mm",
          },
          emphasis: {
            focus: "series",
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(34, 197, 94, 0.5)",
            },
          },
        },
      ],
    };
  }, [data]);

  return (
    <div className="bg-white rounded border border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-xl font-bold text-white">
              Location Comparison
            </h3>
            <p className="text-sm text-gray-400">
              Comparing {data.locations.length} locations for {data.year}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {data.locations.map((location, idx) => (
          <div
            key={idx}
            className="bg-white/5 rounded-lg p-4 border border-white/10"
          >
            <div className="text-xs text-gray-400 mb-1">
              {location.locationName}
            </div>
            <div
              className={`text-lg font-bold capitalize ${
                location.category.toLowerCase().includes("safe")
                  ? "text-green-400"
                  : location.category.toLowerCase().includes("critical") ||
                    location.category.toLowerCase().includes("exploited")
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              {location.category.replace(/_/g, " ")}
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              {location.extraction > location.recharge ? (
                <>
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  <span className="text-red-400">Deficit</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">Surplus</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Comparison Chart */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <ReactECharts
          option={chartOption}
          style={{ height: "500px", width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      </div>

      {/* Detailed Comparison Table */}
      <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10 overflow-x-auto">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Factory className="w-4 h-4 text-blue-400" />
          Detailed Metrics
        </h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-gray-400 font-medium">
                Location
              </th>
              <th className="text-right py-2 px-3 text-gray-400 font-medium">
                Recharge (MCM)
              </th>
              <th className="text-right py-2 px-3 text-gray-400 font-medium">
                Extraction (MCM)
              </th>
              <th className="text-right py-2 px-3 text-gray-400 font-medium">
                Net (MCM)
              </th>
              <th className="text-right py-2 px-3 text-gray-400 font-medium">
                Stage (%)
              </th>
              <th className="text-right py-2 px-3 text-gray-400 font-medium">
                Rainfall (mm)
              </th>
            </tr>
          </thead>
          <tbody>
            {data.locations.map((location, idx) => {
              const net = location.recharge - location.extraction;
              return (
                <tr
                  key={idx}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="py-3 px-3 text-white font-medium">
                    {location.locationName}
                  </td>
                  <td className="py-3 px-3 text-right text-blue-400">
                    {location.recharge.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-orange-400">
                    {location.extraction.toFixed(2)}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-medium ${
                      net >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {net >= 0 ? "+" : ""}
                    {net.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-purple-400">
                    {location.stage.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right text-green-400">
                    {location.rainfall.toFixed(0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Key Insights */}
      <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">💡</span>
          <h4 className="text-sm font-semibold text-white">Key Insights</h4>
        </div>
        <div className="space-y-2 text-sm text-gray-300">
          {(() => {
            const deficitLocations = data.locations.filter(
              (loc) => loc.extraction > loc.recharge
            );
            const surplusLocations = data.locations.filter(
              (loc) => loc.recharge >= loc.extraction
            );
            const highestExtraction = data.locations.reduce((max, loc) =>
              loc.extraction > max.extraction ? loc : max
            );
            const lowestStage = data.locations.reduce((min, loc) =>
              loc.stage < min.stage ? loc : min
            );

            return (
              <>
                {deficitLocations.length > 0 && (
                  <p>
                    <span className="text-red-400 font-semibold">
                      {deficitLocations.length}
                    </span>{" "}
                    location(s) showing groundwater deficit (extraction exceeds
                    recharge).
                  </p>
                )}
                {surplusLocations.length > 0 && (
                  <p>
                    <span className="text-green-400 font-semibold">
                      {surplusLocations.length}
                    </span>{" "}
                    location(s) have positive groundwater balance.
                  </p>
                )}
                <p>
                  <span className="text-orange-400 font-semibold">
                    {highestExtraction.locationName}
                  </span>{" "}
                  has the highest extraction rate at{" "}
                  {highestExtraction.extraction.toFixed(1)} ham.
                </p>
                <p>
                  <span className="text-purple-400 font-semibold">
                    {lowestStage.locationName}
                  </span>{" "}
                  has the lowest stage of development at{" "}
                  {lowestStage.stage.toFixed(1)}%, indicating better
                  sustainability.
                </p>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default ComparisonCard;
