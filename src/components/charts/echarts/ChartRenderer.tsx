import React, { useCallback } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { useNavigate } from "react-router-dom";
import GroundwaterMetricsCard, { MetricsData } from "./GroundwaterMetricsCard";
import TrendAnalysisCard, { TrendData } from "./TrendAnalysisCard";
import ComparisonCard, { ComparisonData } from "./ComparisonCard";
import ComparisonChart, {
  ComparisonData as ComparisonChartData,
} from "./ComparisonChart";

// ============================================
// CHART DATA INTERFACES
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any;

interface SeriesData {
  name: string;
  data: number[] | { name: string; value: number }[];
  dataAny?: AnyData[]; // For styled data items with itemStyle
  stack?: string;
  type?: string;
}

export interface RiskData {
  factor: string;
  score: number;
  fullMark?: number;
}

export interface SectorData {
  sector: string;
  value: number;
}

export interface ChartData {
  type:
    | "stacked-area"
    | "gradient-area"
    | "rose-pie"
    | "timeline-bar"
    | "brush-bar"
    | "large-area"
    | "bar"
    | "line"
    | "area"
    | "pie"
    | "metrics-card"
    | "trend-card"
    | "comparison-card"
    | "comparison-card"
    | "stacked-bar"
    | "risk-radar"
    | "sector-stacked-bar"; // Horizontal stacked bar for rankings
  title: string;
  subtitle?: string;
  xAxis?: string[] | { data: string[]; name?: string };
  series: SeriesData[];
  timeline?: {
    data: string[];
    autoPlay?: boolean;
    playInterval?: number;
  };
  timelineOptions?: {
    title: string;
    series: { data: AnyData[] }[];
  }[];
  pieData?: {
    name: string;
    value: number;
    blockUuid?: string;
    districtUuid?: string;
  }[];
  echarts_option?: AnyData;
  // New metrics data for the metrics-card type
  metricsData?: MetricsData;
  // New trend data for the trend-card type
  trendData?: TrendData;
  // New comparison data for the comparison-card type
  comparisonData?: ComparisonData;
  // New risk data
  riskData?: RiskData[];
  // New sector data
  sectorData?: SectorData[];
}

interface ChartRendererProps {
  chart: ChartData;
  height?: string;
}

// ============================================
// 🔧 HELPER FUNCTIONS
// ============================================

const normalizeXAxis = (
  xAxis: string[] | { data: string[]; name?: string } | undefined
) => {
  if (!xAxis) return { data: [] };
  if (Array.isArray(xAxis)) return { data: xAxis };
  return xAxis;
};

// Helper to convert series data to pie data
const convertSeriesToPieData = (
  series: SeriesData[],
  xAxis: { data: string[] }
) => {
  if (!series || !series[0]?.data || !xAxis.data) return [];
  return xAxis.data.map((name, idx) => ({
    name,
    value:
      typeof series[0].data[idx] === "number"
        ? (series[0].data[idx] as number)
        : 0,
  }));
};

// ============================================
// 🎯 CHART RENDERER COMPONENT
// ============================================

const ChartRenderer: React.FC<ChartRendererProps> = ({
  chart,
  height = "480px",
}) => {
  const navigate = useNavigate();

  // Handle click events on chart elements (for navigation to detail pages)
  const handleChartClick = useCallback(
    (params: AnyData) => {
      console.log("Chart clicked:", params);

      // Check if this is a series element (pie, bar, etc.)
      if (params.componentType === "series") {
        // Try to get UUID from the data point
        let blockUuid = null;
        let districtUuid = null;

        // For pie/rose charts, UUIDs are directly in params.data
        if (params.data) {
          blockUuid = params.data.blockUuid;
          districtUuid = params.data.districtUuid;
        }

        // Navigate to block overview if blockUuid exists
        if (blockUuid) {
          console.log("Navigating to block:", blockUuid);
          navigate(`/block/${blockUuid}`);
          return;
        }

        // Navigate to district overview if districtUuid exists
        if (districtUuid) {
          console.log("Navigating to district:", districtUuid);
          navigate(`/district/${districtUuid}`);
          return;
        }

        // Log if no UUID found
        if (!blockUuid && !districtUuid) {
          console.log("No UUID found in clicked element. Data:", params.data);
        }
      }
    },
    [navigate]
  );

  // Handle metrics-card type separately (it's a React component, not ECharts)
  if (chart.type === "metrics-card" && chart.metricsData) {
    return <GroundwaterMetricsCard data={chart.metricsData} />;
  }

  // Handle trend-card type separately (it's a React component, not ECharts)
  if (chart.type === "trend-card" && chart.trendData) {
    return <TrendAnalysisCard data={chart.trendData} />;
  }

  // Handle comparison-card type separately (new comparison chart)
  if (chart.type === "comparison-card" && chart.comparisonData) {
    // Check if it's the new ComparisonChart format (has comparisonType field)
    if (
      "comparisonType" in chart.comparisonData &&
      chart.comparisonData.locations.length > 0
    ) {
      // Check if locations have 'name' field (new format) vs 'locationName' (old format)
      const firstLoc = chart.comparisonData.locations[0];
      if ("name" in firstLoc) {
        return (
          <ComparisonChart data={chart.comparisonData as ComparisonChartData} />
        );
      }
    }
    // Otherwise use the old ComparisonCard
    return <ComparisonCard data={chart.comparisonData} />;
  }

  const getOption = useCallback(() => {
    // We intentionally ignore `chart.echarts_option` to keep visuals hardcoded
    // to the approved templates. Only data (xAxis/series/pieData/timeline) stays dynamic.

    const { type, title, series } = chart;
    const xAxis = normalizeXAxis(chart.xAxis);

    console.log(
      "🎨 ChartRenderer - type:",
      type,
      "title:",
      title,
      "xAxis:",
      xAxis,
      "series:",
      series
    );

    // Smart chart type selection
    switch (type) {
      case "sector-stacked-bar": {
        // Create beautiful gradient stacked area chart for sector usage
        return createSectorGradientChart(title, chart.sectorData || []);
      }
      case "risk-radar":
        return createRiskRadarChart(title, chart.riskData || []);

      case "stacked-bar":
        return createStackedBarChart(title, series, xAxis);

      case "stacked-area":
      case "area":
        return createStackedAreaChart(title, series, xAxis);

      case "gradient-area":
      case "line":
        return createGradientAreaChart(title, series, xAxis);

      case "rose-pie":
      case "pie":
        return createRosePieChart(
          title,
          chart.pieData || convertSeriesToPieData(series, xAxis)
        );

      case "timeline-bar":
        return createTimelineBarChart(chart);

      case "brush-bar":
      case "bar":
        return createBrushBarChart(title, series, xAxis);

      case "large-area":
        return createLargeAreaChart(title, series, xAxis);

      default:
        // Smart default based on data (with null checks)
        if (series && series.length === 1 && xAxis.data.length <= 5) {
          return createBrushBarChart(title, series, xAxis);
        }
        // If no series data, return a simple placeholder
        if (!series || series.length === 0) {
          return createBrushBarChart(title, [], xAxis);
        }
        return createGradientAreaChart(title, series, xAxis);
    }
  }, [chart]);

  return (
    <div
      className="w-full rounded-xl overflow-hidden relative"
      style={{
        background: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        border: "1px solid #E5E5E5",
      }}
    >
      <ReactECharts
        option={getOption()}
        style={{ height, width: "100%", padding: "8px" }}
        opts={{ renderer: "canvas" }}
        notMerge={true}
        lazyUpdate={true}
        onEvents={{
          click: handleChartClick,
        }}
      />
    </div>
  );
};

// ============================================
// 1️⃣ STACKED AREA CHART (Exact ECharts Example)
// ============================================

const createStackedAreaChart = (
  title: string,
  series: SeriesData[],
  xAxis: { data: string[]; name?: string }
) => ({
  // Match the original ECharts sample as closely as possible
  title: {
    text: title,
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      label: {
        backgroundColor: "#6a7985",
      },
    },
  },
  legend: {
    data: series.map((s) => s.name),
  },
  toolbox: {
    feature: {
      saveAsImage: {},
    },
  },
  xAxis: [
    {
      type: "category",
      boundaryGap: false,
      data: xAxis.data,
    },
  ],
  yAxis: [
    {
      type: "value",
    },
  ],
  series: series.map((s, idx) => ({
    name: s.name,
    type: "line",
    stack: "Total",
    areaStyle: {},
    emphasis: { focus: "series" },
    label:
      idx === series.length - 1 ? { show: true, position: "top" } : undefined,
    data: s.data,
  })),
});

// ============================================
// 2️⃣ GRADIENT STACKED AREA CHART (Exact ECharts Example)
// ============================================

const createGradientAreaChart = (
  title: string,
  series: SeriesData[],
  xAxis: { data: string[]; name?: string }
) => {
  // Neutral color palette - professional grays and muted blues
  const neutralColors = ["#0055A4", "#6B7280", "#9CA3AF", "#D1D5DB", "#374151"];

  return {
    backgroundColor: "transparent",
    color: neutralColors,
    title: {
      text: title,
      left: "center",
      top: 10,
      textStyle: {
        color: "#333333",
        fontSize: 16,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        lineStyle: {
          color: "#9CA3AF",
          width: 1,
          type: "dashed",
        },
        crossStyle: {
          color: "#9CA3AF",
        },
        label: {
          backgroundColor: "#0055A4",
          color: "#fff",
        },
      },
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E5E5",
      borderWidth: 1,
      textStyle: { color: "#333333", fontSize: 12 },
      padding: 10,
    },
    legend: {
      data: series.map((s) => s.name),
      bottom: 5,
      textStyle: { color: "#333333", fontSize: 11 },
    },
    toolbox: {
      feature: {
        saveAsImage: {
          iconStyle: { borderColor: "#9CA3AF" },
        },
      },
      right: 20,
      top: 10,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "15%",
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        boundaryGap: false,
        data: xAxis.data,
        axisLine: { lineStyle: { color: "#E5E5E5" } },
        axisLabel: { color: "#666666", fontSize: 11 },
      },
    ],
    yAxis: [
      {
        type: "value",
        axisLine: { lineStyle: { color: "#E5E5E5" } },
        axisLabel: { color: "#666666", fontSize: 11 },
        splitLine: { lineStyle: { color: "#F3F4F6" } },
      },
    ],
    series: series.map((s, idx) => {
      const color = neutralColors[idx % neutralColors.length];

      return {
        name: s.name,
        type: "line",
        stack: "Total",
        smooth: true,
        smoothMonotone: "x",
        lineStyle: {
          width: 2,
          color: color,
        },
        showSymbol: true,
        symbol: "circle",
        symbolSize: 6,
        itemStyle: {
          color: color,
          borderColor: "#fff",
          borderWidth: 1,
        },
        areaStyle: {
          opacity: 0.15,
          color: color,
        },
        emphasis: {
          focus: "series",
        },
        data: s.data,
      };
    }),
  };
};

// ============================================
// 3️⃣ ROSE PIE CHART (Nightingale - God-Level Graphics)
// ============================================

const createRosePieChart = (
  title: string,
  pieData: { name: string; value: number }[]
) => {
  // Neutral solid colors - professional palette
  const neutralColors = [
    "#0055A4", // Deep Blue
    "#6B7280", // Gray
    "#9CA3AF", // Light Gray
    "#4B5563", // Dark Gray
    "#374151", // Charcoal
    "#D1D5DB", // Silver
    "#1F2937", // Near Black
    "#E5E7EB", // Light Silver
  ];

  return {
    title: {
      text: title,
      left: "center",
      top: 20,
      textStyle: {
        color: "#333333",
        fontSize: 16,
        fontWeight: "600",
      },
    },
    legend: {
      show: false,
    },
    tooltip: {
      trigger: "item",
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E5E5",
      borderWidth: 1,
      textStyle: {
        color: "#333333",
        fontSize: 12,
      },
      formatter: (params: AnyData) => {
        return `<div style="padding: 6px;">
                  <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #333333;">${params.name}</div>
                  <div style="font-size: 13px;">Blocks: <strong>${Math.round(params.value)}</strong></div>
                </div>`;
      },
    },
    series: [
      {
        name: title || "Distribution Chart",
        type: "pie",
        radius: [60, 180],
        center: ["50%", "52%"],
        roseType: "area",
        itemStyle: {
          borderRadius: 4,
          borderColor: "#FFFFFF",
          borderWidth: 2,
        },
        label: {
          show: true,
          color: "#333333",
          fontSize: 11,
          fontWeight: "500",
          formatter: (params: AnyData) => {
            if (params.dataIndex < 8) {
              return `${params.name}\n${Math.round(params.value)}`;
            }
            return "";
          },
          position: "outside",
          alignTo: "edge",
          margin: 15,
        },
        labelLine: {
          show: true,
          length: 20,
          length2: 15,
          lineStyle: {
            color: "#9CA3AF",
            width: 1,
          },
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 13,
            fontWeight: "bold",
            color: "#333333",
          },
          itemStyle: {
            shadowBlur: 8,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
        },
        animationType: "scale",
        animationEasing: "cubicOut",
        data: pieData.map((item, index) => ({
          name: item.name,
          value: item.value,
          blockUuid: item.blockUuid,
          districtUuid: item.districtUuid,
          itemStyle: {
            color: neutralColors[index % neutralColors.length],
          },
        })),
      },
    ],
  };
};

// ============================================
// 4️⃣ TIMELINE BAR CHART (Finance Style - Simplified)
// ============================================

const createTimelineBarChart = (chart: ChartData) => {
  const xAxis = normalizeXAxis(chart.xAxis);
  const { title, series, timeline, timelineOptions } = chart;

  // If no timeline data, create a simple animated bar chart
  if (!timeline?.data || !timelineOptions) {
    return createBrushBarChart(title, series, xAxis);
  }

  // Neutral color palette
  const neutralColors = ["#0055A4", "#6B7280", "#9CA3AF", "#374151", "#4B5563"];

  return {
    baseOption: {
      backgroundColor: "transparent",
      timeline: {
        axisType: "category",
        autoPlay: timeline.autoPlay ?? true,
        playInterval: timeline.playInterval ?? 1500,
        data: timeline.data,
        bottom: 10,
        label: {
          color: "#333333",
          fontSize: 11,
          fontWeight: 500,
        },
        lineStyle: {
          color: "#E5E5E5",
          width: 1,
        },
        itemStyle: {
          color: "#E5E5E5",
          borderColor: "#9CA3AF",
          borderWidth: 1,
        },
        controlStyle: {
          color: "#0055A4",
          borderColor: "#0055A4",
          borderWidth: 1,
        },
        emphasis: {
          controlStyle: {
            color: "#004488",
            borderColor: "#004488",
          },
          itemStyle: {
            color: "#D1D5DB",
            borderColor: "#0055A4",
          },
        },
        checkpointStyle: {
          color: "#0055A4",
          borderColor: "#0055A4",
          borderWidth: 2,
          animation: true,
          animationDuration: 200,
        },
      },
      title: {
        text: title,
        left: "center",
        top: 10,
        textStyle: {
          color: "#333333",
          fontSize: 16,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#FFFFFF",
        borderColor: "#E5E5E5",
        borderWidth: 1,
        textStyle: { color: "#333333", fontSize: 12 },
        padding: 10,
      },
      legend: {
        left: "right",
        top: 40,
        textStyle: { color: "#333333", fontSize: 11 },
      },
      grid: {
        top: 80,
        bottom: 100,
        left: "10%",
        right: "10%",
      },
      xAxis: [
        {
          type: "category",
          data: xAxis.data,
          axisLabel: {
            color: "#666666",
            fontSize: 10,
            interval: 0,
            rotate: 30,
          },
          axisLine: { lineStyle: { color: "#E5E5E5" } },
          splitLine: { show: false },
        },
      ],
      yAxis: [
        {
          type: "value",
          axisLabel: { color: "#666666", fontSize: 11 },
          axisLine: { lineStyle: { color: "#E5E5E5" } },
          splitLine: { lineStyle: { color: "#F3F4F6" } },
        },
      ],
      series: series.map((s, idx) => ({
        name: s.name,
        type: "bar",
        itemStyle: {
          color: neutralColors[idx % neutralColors.length],
          borderRadius: [4, 4, 0, 0],
        },
      })),
    },
    options: timelineOptions.map((opt) => ({
      title: { text: opt.title },
      series: opt.series,
    })),
  };
};

// ============================================
// 5️⃣ BRUSH BAR CHART (Exact ECharts Example)
// ============================================

const createBrushBarChart = (
  title: string,
  series: SeriesData[],
  xAxis: { data: string[]; name?: string }
) => {
  // Neutral color palette
  const neutralColors = ["#0055A4", "#6B7280", "#9CA3AF", "#374151", "#4B5563"];

  const emphasisStyle = {
    itemStyle: {
      shadowBlur: 8,
      shadowColor: "rgba(0, 0, 0, 0.2)",
      shadowOffsetY: 2,
    },
  };

  return {
    backgroundColor: "transparent",
    title: {
      text: title,
      left: "center",
      top: 10,
      textStyle: {
        color: "#333333",
        fontSize: 16,
        fontWeight: 600,
      },
    },
    legend: {
      data: series.map((s) => s.name),
      left: "10%",
      top: 45,
      textStyle: {
        color: "#333333",
        fontSize: 11,
        fontWeight: 500,
      },
      itemWidth: 20,
      itemHeight: 12,
    },
    brush: {
      toolbox: ["rect", "polygon", "lineX", "lineY", "keep", "clear"],
      xAxisIndex: 0,
      brushStyle: {
        borderWidth: 1,
        color: "rgba(0, 85, 164, 0.1)",
        borderColor: "#0055A4",
      },
    },
    toolbox: {
      feature: {
        magicType: {
          type: ["stack"],
          iconStyle: { borderColor: "#9CA3AF" },
        },
        dataView: {
          backgroundColor: "#FFFFFF",
          textColor: "#333333",
          iconStyle: { borderColor: "#9CA3AF" },
        },
        saveAsImage: {
          iconStyle: { borderColor: "#9CA3AF" },
        },
      },
      right: 20,
      top: 10,
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E5E5",
      borderWidth: 1,
      textStyle: { color: "#333333", fontSize: 12 },
      padding: 10,
      axisPointer: {
        type: "shadow",
        shadowStyle: {
          color: "rgba(0, 85, 164, 0.08)",
        },
      },
    },
    xAxis: {
      data: xAxis.data,
      name: xAxis.name || "",
      axisLine: {
        onZero: true,
        lineStyle: { color: "#E5E5E5" },
      },
      axisLabel: {
        color: "#666666",
        fontSize: 10,
        interval: 0,
        rotate: xAxis.data.length > 6 ? 30 : 0,
      },
      splitLine: { show: false },
      splitArea: { show: false },
    },
    yAxis: {
      axisLine: { lineStyle: { color: "#E5E5E5" } },
      axisLabel: { color: "#666666", fontSize: 11 },
      splitLine: { lineStyle: { color: "#F3F4F6" } },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: 80,
      top: 80,
      containLabel: true,
    },
    series: series.map((s, idx) => {
      const hasStyledData = s.dataAny && s.dataAny.length > 0;
      const color = neutralColors[idx % neutralColors.length];

      return {
        name: s.name,
        type: s.type || "bar",
        stack: s.stack || (idx < 2 ? "one" : "two"),
        emphasis: emphasisStyle,
        data: hasStyledData ? s.dataAny : s.data,
        smooth: s.type === "line",
        lineStyle:
          s.type === "line"
            ? {
                width: 2,
                color: color,
              }
            : undefined,
        itemStyle: hasStyledData
          ? {
              borderRadius: [4, 4, 0, 0],
              borderColor: "#FFFFFF",
              borderWidth: 1,
            }
          : {
              color: color,
              borderRadius: [4, 4, 0, 0],
              borderColor: "#FFFFFF",
              borderWidth: 1,
            },
        animationType: "scale",
        animationEasing: "cubicOut",
      };
    }),
  };
};

// ============================================
// 6️⃣ LARGE AREA CHART (Exact ECharts Example with DataZoom)
// ============================================

const createLargeAreaChart = (
  title: string,
  series: SeriesData[],
  xAxis: { data: string[]; name?: string }
) => {
  // Neutral color palette
  const neutralColors = ["#0055A4", "#6B7280", "#9CA3AF", "#374151", "#4B5563"];

  return {
    backgroundColor: "transparent",
    title: {
      left: "center",
      text: title,
      top: 10,
      textStyle: {
        color: "#333333",
        fontSize: 16,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: "axis",
      position: function (pt: number[]) {
        return [pt[0], "10%"];
      },
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E5E5",
      borderWidth: 1,
      textStyle: { color: "#333333", fontSize: 12 },
      padding: 10,
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: "none",
          iconStyle: {
            borderColor: "#9CA3AF",
            borderWidth: 1,
          },
        },
        restore: {
          iconStyle: {
            borderColor: "#9CA3AF",
            borderWidth: 1,
          },
        },
        saveAsImage: {
          iconStyle: {
            borderColor: "#9CA3AF",
            borderWidth: 1,
          },
        },
      },
      right: 20,
      top: 10,
      emphasis: {
        iconStyle: {
          borderColor: "#0055A4",
        },
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: xAxis.data,
      axisLine: { lineStyle: { color: "#E5E5E5" } },
      axisLabel: { color: "#666666", fontSize: 10 },
    },
    yAxis: {
      type: "value",
      boundaryGap: [0, "100%"],
      axisLine: { lineStyle: { color: "#E5E5E5" } },
      axisLabel: { color: "#666666", fontSize: 11 },
      splitLine: { lineStyle: { color: "#F3F4F6" } },
    },
    dataZoom: [
      {
        type: "inside",
        start: 0,
        end: 50,
      },
      {
        start: 0,
        end: 50,
        handleSize: "100%",
        handleStyle: {
          color: "#0055A4",
        },
        textStyle: {
          color: "#666666",
        },
        borderColor: "#E5E5E5",
        backgroundColor: "#F9FAFB",
        dataBackground: {
          lineStyle: { color: "#9CA3AF" },
          areaStyle: { color: "rgba(156, 163, 175, 0.2)" },
        },
        selectedDataBackground: {
          lineStyle: { color: "#0055A4" },
          areaStyle: { color: "rgba(0, 85, 164, 0.2)" },
        },
      },
    ],
    grid: {
      left: "3%",
      right: "4%",
      bottom: "18%",
      top: "15%",
      containLabel: true,
    },
    series: series.map((s, idx) => {
      const color = neutralColors[idx % neutralColors.length];
      return {
        name: s.name,
        type: "line",
        symbol: "circle",
        symbolSize: 5,
        sampling: "lttb",
        smooth: true,
        lineStyle: {
          width: 2,
          color: color,
        },
        itemStyle: {
          color: color,
          borderColor: "#fff",
          borderWidth: 1,
        },
        areaStyle: {
          opacity: 0.15,
          color: color,
        },
        data: s.data,
      };
    }),
  };
};

// ============================================
// 🎯 HORIZONTAL STACKED BAR CHART (For Rankings)
// ============================================

const createStackedBarChart = (
  title: string,
  series: SeriesData[],
  xAxis: { data: string[]; name?: string }
) => {
  // Neutral professional color palette
  const colorPalette = [
    "#0055A4", // Deep Blue
    "#6B7280", // Gray
    "#374151", // Dark Gray
    "#9CA3AF", // Light Gray
    "#4B5563", // Charcoal
  ];

  const getColor = (name: string, index: number) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("stage")) {
      return "#DC2626"; // Red for stage (critical metric)
    }
    if (nameLower.includes("deficit")) {
      return "#D97706"; // Amber for deficit
    }
    if (nameLower.includes("extraction")) {
      return "#0055A4"; // Deep Blue for extraction
    }
    if (nameLower.includes("recharge")) {
      return "#0284C7"; // Sky Blue for recharge
    }
    return colorPalette[index % colorPalette.length];
  };

  return {
    title: {
      text: title,
      left: "center",
      top: 20,
      textStyle: {
        color: "#333333",
        fontSize: 16,
        fontWeight: "600",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E5E5",
      borderWidth: 1,
      textStyle: {
        color: "#333333",
      },
      formatter: (params: AnyData) => {
        if (!Array.isArray(params)) return "";
        const locationName = params[0]?.name || "";
        let tooltip = `<div style="font-weight: 600; margin-bottom: 8px; color: #333;">${locationName}</div>`;
        params.forEach((param: AnyData) => {
          const marker = `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background-color:${param.color};margin-right:6px;"></span>`;
          tooltip += `<div>${marker}${
            param.seriesName
          }: <strong>${param.value.toFixed(2)}</strong></div>`;
        });
        return tooltip;
      },
    },
    legend: {
      data: series.map((s) => s.name),
      top: 60,
      textStyle: {
        color: "#333333",
        fontSize: 12,
      },
      itemWidth: 20,
      itemHeight: 14,
      itemGap: 12,
    },
    grid: {
      left: "20%",
      right: "10%",
      top: 110,
      bottom: 40,
      containLabel: true,
    },
    xAxis: {
      type: "value",
      axisLine: {
        show: true,
        lineStyle: {
          color: "#E5E5E5",
        },
      },
      axisLabel: {
        color: "#666666",
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: "#F3F4F6",
          type: "dashed",
        },
      },
    },
    yAxis: {
      type: "category",
      data: xAxis.data,
      axisLine: {
        show: true,
        lineStyle: {
          color: "#E5E5E5",
        },
      },
      axisLabel: {
        color: "#333333",
        fontSize: 12,
        fontWeight: "500",
        width: 180,
        overflow: "truncate",
        ellipsis: "...",
      },
      splitLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
    },
    series: series.map((s, idx) => ({
      name: s.name,
      type: "bar",
      stack: "total",
      data: s.data,
      barMaxWidth: 30,
      itemStyle: {
        color: getColor(s.name, idx),
        borderRadius: [0, 4, 4, 0],
        borderWidth: 0,
      },
      emphasis: {
        focus: "series",
        itemStyle: {
          shadowBlur: 4,
          shadowColor: "rgba(0, 0, 0, 0.15)",
        },
      },
      label: {
        show: true,
        position: "inside",
        formatter: (params: AnyData) => {
          const val = params.value as number;
          return val > 30 ? val.toFixed(0) : "";
        },
        color: "#fff",
        fontSize: 10,
        fontWeight: "500",
      },
    })),
  };
};

// ============================================
// 5️⃣ RISK POLAR BAR CHART (Radial Polar Bar - Premium)
// ============================================

const createRiskRadarChart = (title: string, data: RiskData[]) => {
  // Neutral color palette
  const neutralColors = ["#0055A4", "#6B7280", "#9CA3AF", "#374151"];

  return {
    title: {
      text: title,
      left: "center",
      top: 15,
      textStyle: {
        color: "#333333",
        fontSize: 16,
        fontWeight: 600,
      },
    },
    polar: {
      radius: [40, "75%"],
    },
    radiusAxis: {
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#666666",
        fontSize: 10,
      },
      splitLine: {
        lineStyle: {
          color: "#E5E5E5",
          type: "dashed",
        },
      },
    },
    angleAxis: {
      type: "category",
      data: data.map((d) => d.factor),
      startAngle: 90,
      axisLine: {
        lineStyle: { color: "#E5E5E5" },
      },
      axisTick: { show: false },
      axisLabel: {
        color: "#333333",
        fontSize: 11,
        fontWeight: 500,
        padding: [0, 0, 0, 0],
      },
      splitLine: {
        lineStyle: {
          color: "#F3F4F6",
        },
      },
    },
    tooltip: {
      trigger: "item",
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E5E5",
      borderWidth: 1,
      textStyle: { color: "#333333", fontSize: 12 },
      formatter: (params: AnyData) => {
        return `<b>${params.name}</b><br/>Risk Score: <span style="color:#DC2626;font-weight:bold">${params.value.toFixed(1)}%</span>`;
      },
    },
    series: {
      type: "bar",
      data: data.map((d, idx) => ({
        value: d.score,
        itemStyle: {
          color: neutralColors[idx % neutralColors.length],
          borderRadius: [4, 4, 0, 0],
        },
      })),
      coordinateSystem: "polar",
      barWidth: 25,
      label: {
        show: true,
        position: "middle",
        formatter: "{c}%",
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 8,
          shadowColor: "rgba(0, 0, 0, 0.2)",
        },
      },
    },
    animationDuration: 1000,
    animationEasing: "cubicOut",
  };
};

// ============================================
// 6️⃣ SECTOR GRADIENT CHART (Gradient Stacked Area - Premium)
// ============================================

const createSectorGradientChart = (title: string, data: SectorData[]) => {
  // Neutral color palette
  const neutralColors = ["#0055A4", "#6B7280", "#9CA3AF", "#374151", "#4B5563"];

  // Calculate total and percentages
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return {
    color: neutralColors,
    title: {
      text: title,
      left: "center",
      top: 15,
      textStyle: {
        color: "#333333",
        fontSize: 16,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        lineStyle: {
          color: "#9CA3AF",
          width: 1,
          type: "dashed",
        },
        label: {
          backgroundColor: "#0055A4",
          color: "#fff",
        },
      },
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E5E5",
      borderWidth: 1,
      textStyle: { color: "#333333", fontSize: 12 },
      formatter: (params: AnyData) => {
        if (!Array.isArray(params)) return "";
        let result = `<div style="padding: 4px;"><b>Sector Distribution</b><br/>`;
        params.forEach((p: AnyData) => {
          const pct = ((p.value / total) * 100).toFixed(1);
          result += `${p.marker} ${p.seriesName}: <b>${pct}%</b> (${(
            p.value / 1000
          ).toFixed(0)}K ham)<br/>`;
        });
        return result + "</div>";
      },
    },
    legend: {
      data: data.map((d) => d.sector),
      bottom: 10,
      textStyle: {
        color: "#333333",
        fontSize: 11,
        fontWeight: 500,
      },
      itemWidth: 16,
      itemHeight: 10,
    },
    grid: {
      left: "5%",
      right: "5%",
      bottom: "15%",
      top: "18%",
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        boundaryGap: false,
        data: ["Share"],
        axisLine: { lineStyle: { color: "#E5E5E5" } },
        axisLabel: { color: "#666666", fontSize: 11 },
      },
    ],
    yAxis: [
      {
        type: "value",
        axisLine: { lineStyle: { color: "#E5E5E5" } },
        axisLabel: {
          color: "#666666",
          fontSize: 11,
          formatter: (val: number) => `${(val / 1000000).toFixed(1)}M`,
        },
        splitLine: { lineStyle: { color: "#F3F4F6" } },
      },
    ],
    series: data.map((sector, idx) => ({
      name: sector.sector,
      type: "line",
      stack: "Total",
      smooth: true,
      lineStyle: { width: 0 },
      showSymbol: false,
      areaStyle: {
        opacity: 0.6,
        color: neutralColors[idx % neutralColors.length],
      },
      emphasis: { focus: "series" },
      label:
        idx === data.length - 1
          ? {
              show: true,
              position: "top",
              formatter: (params: AnyData) =>
                `${((params.value / total) * 100).toFixed(0)}%`,
              color: "#333333",
              fontSize: 12,
              fontWeight: "bold",
            }
          : undefined,
      data: [sector.value],
    })),
    animationDuration: 1000,
    animationEasing: "cubicOut",
  };
};
export default ChartRenderer;

