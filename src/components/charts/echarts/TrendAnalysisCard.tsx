import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { Calendar, MapPin } from "lucide-react";

// ============================================
// TREND ANALYSIS CARD COMPONENT
// Interactive timeline-based visualization matching ECharts timeline example
// Uses baseOption + options array structure with autoplay
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
  rechargeChange: number;
  extractionChange: number;
  stageChange: number;
  overallTrend: "improving" | "stable" | "declining";
}

interface TrendAnalysisCardProps {
  data: TrendData;
}

const TrendAnalysisCard: React.FC<TrendAnalysisCardProps> = ({ data }) => {
  // Build ECharts timeline option matching the example structure
  const timelineOption: echarts.EChartsOption = useMemo(() => {
    const years = data.dataPoints.map((d) => d.year);

    // Category color mapping
    const getCategoryColor = (cat: string) => {
      const colors: Record<string, string> = {
        safe: "#10b981",
        semicritical: "#3b82f6",
        critical: "#f59e0b",
        overcritical: "#ef4444",
        saline: "#8b5cf6",
        aggregated: "#64748b",
      };
      return colors[cat.toLowerCase().replace(/[_\s-]/g, "")] || "#6b7280";
    };

    // Get category label for display
    const getCategoryLabel = (cat: string) => {
      const labels: Record<string, string> = {
        safe: "Safe",
        semicritical: "Semi-Critical",
        critical: "Critical",
        overcritical: "Over-Critical",
        saline: "Saline",
        aggregated: "Multiple Categories",
      };
      return labels[cat.toLowerCase().replace(/[_\s-]/g, "")] || cat;
    };

    // Build options array - one per year
    const options = data.dataPoints.map((point) => ({
      title: [
        {
          text: `${data.locationName} Groundwater Status (${point.year})`,
          left: "center",
          top: 20,
          textStyle: {
            color: "#fff",
            fontSize: 20,
            fontWeight: "bold",
          },
        },
        {
          text: `Recharge: ${point.recharge.toFixed(
            1
          )} ham  |  Extraction: ${point.extraction.toFixed(
            1
          )} ham  |  Stage: ${point.stage.toFixed(
            1
          )}%  |  Rainfall: ${point.rainfall.toFixed(0)}mm`,
          left: "center",
          top: 50,
          textStyle: {
            color: "#94a3b8",
            fontSize: 13,
            fontWeight: "normal",
          },
        },
      ],
      series: [
        // Bar series for Recharge
        {
          name: "Recharge",
          type: "bar",
          data: [point.recharge],
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
        // Bar series for Extraction
        {
          name: "Extraction",
          type: "bar",
          data: [point.extraction],
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
        // Bar series for Stage
        {
          name: "Stage",
          type: "bar",
          data: [point.stage],
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
        // Bar series for Rainfall
        {
          name: "Rainfall",
          type: "bar",
          data: [point.rainfall],
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
        // Pie chart for category status
        {
          data: [
            {
              name: getCategoryLabel(point.category),
              value: 1,
              itemStyle: {
                color: getCategoryColor(point.category),
              },
            },
          ],
        },
      ],
    }));

    // baseOption - defines the static structure
    return {
      baseOption: {
        backgroundColor: "transparent",
        timeline: {
          axisType: "category",
          autoPlay: true,
          playInterval: 2000,
          data: years,
          bottom: 20,
          label: {
            color: "#94a3b8",
            fontSize: 13,
            fontWeight: "normal",
          },
          lineStyle: {
            color: "#475569",
          },
          itemStyle: {
            color: "#3b82f6",
            borderColor: "#1e40af",
          },
          checkpointStyle: {
            color: "#22c55e",
            borderColor: "#16a34a",
            borderWidth: 2,
          },
          controlStyle: {
            showNextBtn: true,
            showPrevBtn: true,
            color: "#94a3b8",
            borderColor: "#475569",
          },
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(17, 24, 39, 0.95)",
          borderColor: "rgba(255, 255, 255, 0.1)",
          textStyle: {
            color: "#fff",
          },
          axisPointer: {
            type: "shadow",
          },
        },
        legend: {
          left: "right",
          top: 70,
          textStyle: {
            color: "#94a3b8",
          },
          data: ["Recharge", "Extraction", "Stage", "Rainfall"],
        },
        grid: {
          top: 140,
          left: 80,
          right: "30%",
          bottom: 100,
        },
        xAxis: [
          {
            type: "category",
            data: ["Metrics"],
            axisLabel: {
              color: "#94a3b8",
            },
            axisLine: {
              lineStyle: {
                color: "#475569",
              },
            },
            splitLine: {
              show: false,
            },
          },
        ],
        yAxis: [
          {
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
        ],
        series: [
          {
            name: "Recharge",
            type: "bar",
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
          {
            name: "Category Status",
            type: "pie",
            center: ["80%", "30%"],
            radius: ["15%", "25%"],
            z: 100,
            label: {
              show: true,
              color: "#fff",
              formatter: "{b}\n{d}%",
            },
            itemStyle: {
              color: (params: any) => {
                const categoryColors: Record<string, string> = {
                  safe: "#10b981",
                  semicritical: "#3b82f6",
                  critical: "#f59e0b",
                  overcritical: "#ef4444",
                  saline: "#8b5cf6",
                };
                const cat = params.name.toLowerCase().replace(/[_\s-]/g, "");
                return categoryColors[cat] || "#6b7280";
              },
            },
          },
        ],
      },
      options,
    };
  }, [data]);

  const years = data.dataPoints.map((d) => d.year);
  const firstYear = years[0];
  const lastYear = years[years.length - 1];

  return (
    <div className="bg-white rounded border border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-xl font-bold text-white">
              {data.locationName}
            </h3>
            <p className="text-sm text-gray-400 capitalize">
              {data.locationType} • {data.startYear} - {data.endYear}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-300">{years.length} Years</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-sm text-gray-400 mb-1">Recharge Change</div>
          <div
            className={`text-2xl font-bold ${
              data.rechargeChange > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {data.rechargeChange > 0 ? "+" : ""}
            {data.rechargeChange.toFixed(1)}%
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-sm text-gray-400 mb-1">Extraction Change</div>
          <div
            className={`text-2xl font-bold ${
              data.extractionChange > 0 ? "text-red-400" : "text-green-400"
            }`}
          >
            {data.extractionChange > 0 ? "+" : ""}
            {data.extractionChange.toFixed(1)}%
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-sm text-gray-400 mb-1">Overall Trend</div>
          <div
            className={`text-2xl font-bold capitalize ${
              data.overallTrend === "improving"
                ? "text-green-400"
                : data.overallTrend === "declining"
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          >
            {data.overallTrend}
          </div>
        </div>
      </div>

      {/* Interactive Timeline Chart */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <ReactECharts
          option={timelineOption}
          style={{ height: "500px", width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      </div>

      {/* AI Insights Section */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">💡</span>
          <h3 className="text-lg font-semibold text-white">Key Insights</h3>
        </div>

        <div className="space-y-4">
          {/* Recharge Analysis */}
          <div>
            <h4 className="text-sm font-semibold text-blue-400 mb-2">
              Groundwater Recharge Trend
            </h4>
            <p className="text-sm text-gray-300">
              {data.rechargeChange > 10 ? (
                <>
                  Recharge levels have shown a{" "}
                  <span className="text-green-400 font-semibold">
                    significant improvement of {data.rechargeChange.toFixed(1)}%
                  </span>{" "}
                  from {firstYear} to {lastYear}. This positive trend indicates
                  effective water conservation measures and favorable monsoon
                  conditions contributing to aquifer replenishment.
                </>
              ) : data.rechargeChange > 0 ? (
                <>
                  Recharge levels have increased by{" "}
                  <span className="text-green-400 font-semibold">
                    {data.rechargeChange.toFixed(1)}%
                  </span>{" "}
                  over the {years.length}-year period. While this shows
                  improvement, continued monitoring and enhanced conservation
                  efforts will help maintain sustainable groundwater levels.
                </>
              ) : data.rechargeChange > -10 ? (
                <>
                  Recharge levels have declined by{" "}
                  <span className="text-yellow-400 font-semibold">
                    {Math.abs(data.rechargeChange).toFixed(1)}%
                  </span>{" "}
                  from {firstYear} to {lastYear}. This moderate decline warrants
                  attention through improved rainwater harvesting and watershed
                  management initiatives.
                </>
              ) : (
                <>
                  Recharge levels have experienced a{" "}
                  <span className="text-red-400 font-semibold">
                    concerning decline of{" "}
                    {Math.abs(data.rechargeChange).toFixed(1)}%
                  </span>{" "}
                  over the analysis period. Immediate intervention through
                  artificial recharge structures and stricter water conservation
                  policies is essential to prevent further depletion.
                </>
              )}
            </p>
          </div>

          {/* Extraction Analysis */}
          <div>
            <h4 className="text-sm font-semibold text-amber-400 mb-2">
              Groundwater Extraction Pattern
            </h4>
            <p className="text-sm text-gray-300">
              {data.extractionChange > 10 ? (
                <>
                  Extraction rates have surged by{" "}
                  <span className="text-red-400 font-semibold">
                    {data.extractionChange.toFixed(1)}%
                  </span>{" "}
                  since {firstYear}, signaling{" "}
                  <span className="text-red-400 font-semibold">
                    urgent concern
                  </span>
                  . This increased demand from agriculture, industry, and urban
                  consumption is outpacing natural recharge rates and requires
                  immediate regulatory measures and demand management
                  strategies.
                </>
              ) : data.extractionChange > 0 ? (
                <>
                  Extraction has increased by{" "}
                  <span className="text-yellow-400 font-semibold">
                    {data.extractionChange.toFixed(1)}%
                  </span>{" "}
                  over {years.length} years. While extraction growth is
                  moderate, it's crucial to balance consumption with recharge
                  through efficient irrigation techniques and industrial water
                  recycling programs.
                </>
              ) : data.extractionChange > -10 ? (
                <>
                  Extraction levels have decreased slightly by{" "}
                  <span className="text-green-400 font-semibold">
                    {Math.abs(data.extractionChange).toFixed(1)}%
                  </span>
                  , reflecting controlled water usage. Continuing these
                  conservation practices while monitoring seasonal variations
                  will help maintain this positive trajectory.
                </>
              ) : (
                <>
                  Extraction has reduced by{" "}
                  <span className="text-green-400 font-semibold">
                    {Math.abs(data.extractionChange).toFixed(1)}%
                  </span>{" "}
                  from {firstYear} to {lastYear}, demonstrating excellent
                  progress in sustainable water management. This reduction
                  through efficiency measures and alternative water sources
                  should be maintained and expanded.
                </>
              )}
            </p>
          </div>

          {/* Overall Assessment */}
          <div>
            <h4 className="text-sm font-semibold text-purple-400 mb-2">
              Overall Water Security Assessment
            </h4>
            <p className="text-sm text-gray-300">
              {data.overallTrend === "improving" ? (
                <>
                  The region shows an{" "}
                  <span className="text-green-400 font-semibold">
                    improving groundwater situation
                  </span>{" "}
                  with positive recharge trends or controlled extraction rates.
                  Continue implementing best practices including
                  micro-irrigation, rainwater harvesting, and aquifer recharge
                  projects. Regular monitoring through water budgeting and
                  community engagement will ensure long-term sustainability.
                </>
              ) : data.overallTrend === "declining" ? (
                <>
                  Analysis indicates a{" "}
                  <span className="text-red-400 font-semibold">
                    declining groundwater trend
                  </span>{" "}
                  requiring immediate attention. Priority actions should
                  include: enforcing extraction limits, promoting drip
                  irrigation and sprinkler systems, constructing check dams and
                  percolation tanks, incentivizing crop diversification to less
                  water-intensive varieties, and strengthening groundwater
                  monitoring networks.
                </>
              ) : (
                <>
                  The groundwater situation shows a{" "}
                  <span className="text-yellow-400 font-semibold">
                    stable but cautious outlook
                  </span>
                  . While current levels are manageable, proactive measures are
                  recommended: enhance recharge infrastructure during monsoons,
                  optimize agricultural water use through precision irrigation,
                  develop alternative water sources where feasible, and
                  establish community-based water management committees to
                  ensure equitable distribution and sustainable practices.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Data Source Note */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-500 italic">
            Analysis based on {years.length} years of groundwater assessment
            data spanning {firstYear}-{lastYear}. Trends calculated using
            comparative analysis of recharge rates, extraction patterns, stage
            of development, and rainfall correlations.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-400 text-center">
        Use timeline controls to navigate through years • Click play to animate
        transitions
      </div>
    </div>
  );
};

export default TrendAnalysisCard;
