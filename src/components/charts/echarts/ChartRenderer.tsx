import React, { useCallback } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
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
  stack?: string;
  type?: string;
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
    | "stacked-bar"; // Horizontal stacked bar for rankings
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
  pieData?: { name: string; value: number }[];
  echarts_option?: AnyData;
  // New metrics data for the metrics-card type
  metricsData?: MetricsData;
  // New trend data for the trend-card type
  trendData?: TrendData;
  // New comparison data for the comparison-card type
  comparisonData?: ComparisonData;
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
  if (!series[0]?.data || !xAxis.data) return [];
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
        // Smart default based on data
        if (series.length === 1 && xAxis.data.length <= 5) {
          return createBrushBarChart(title, series, xAxis);
        }
        return createGradientAreaChart(title, series, xAxis);
    }
  }, [chart]);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden relative"
      style={{
        background:
          "linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.92) 100%)",
        boxShadow:
          "0 20px 40px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(16px)",
      }}
    >
      <ReactECharts
        option={getOption()}
        style={{ height, width: "100%", padding: "8px" }}
        opts={{ renderer: "canvas" }}
        notMerge={true}
        lazyUpdate={true}
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
) => ({
  backgroundColor: "transparent",
  color: ["#80FFA5", "#00DDFF", "#37A2FF", "#FF0087", "#FFBF00"],
  title: {
    text: title,
    left: "center",
    top: 10,
    textStyle: {
      color: "#fff",
      fontSize: 16,
      fontWeight: 600,
    },
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      label: {
        backgroundColor: "#6a7985",
      },
    },
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderColor: "rgba(99, 102, 241, 0.3)",
    borderWidth: 1,
    textStyle: { color: "#e2e8f0" },
  },
  legend: {
    data: series.map((s) => s.name),
    bottom: 5,
    textStyle: { color: "rgba(255, 255, 255, 0.8)", fontSize: 11 },
  },
  toolbox: {
    feature: {
      saveAsImage: {
        iconStyle: { borderColor: "rgba(255,255,255,0.5)" },
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
      axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.2)" } },
      axisLabel: { color: "rgba(255, 255, 255, 0.7)", fontSize: 11 },
    },
  ],
  yAxis: [
    {
      type: "value",
      axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.2)" } },
      axisLabel: { color: "rgba(255, 255, 255, 0.7)", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.08)" } },
    },
  ],
  series: series.map((s, idx) => {
    // Gradient colors exactly from ECharts example
    const gradientConfigs = [
      [
        { offset: 0, color: "rgb(128, 255, 165)" },
        { offset: 1, color: "rgb(1, 191, 236)" },
      ],
      [
        { offset: 0, color: "rgb(0, 221, 255)" },
        { offset: 1, color: "rgb(77, 119, 255)" },
      ],
      [
        { offset: 0, color: "rgb(55, 162, 255)" },
        { offset: 1, color: "rgb(116, 21, 219)" },
      ],
      [
        { offset: 0, color: "rgb(255, 0, 135)" },
        { offset: 1, color: "rgb(135, 0, 157)" },
      ],
      [
        { offset: 0, color: "rgb(255, 191, 0)" },
        { offset: 1, color: "rgb(224, 62, 76)" },
      ],
    ];

    return {
      name: s.name,
      type: "line",
      stack: "Total",
      smooth: true,
      lineStyle: {
        width: 0,
      },
      showSymbol: false,
      areaStyle: {
        opacity: 0.8,
        color: new echarts.graphic.LinearGradient(
          0,
          0,
          0,
          1,
          gradientConfigs[idx % 5]
        ),
      },
      emphasis: {
        focus: "series",
      },
      data: s.data,
    };
  }),
});

// ============================================
// 3️⃣ ROSE PIE CHART (Nightingale - Exact ECharts Example)
// ============================================

const createRosePieChart = (
  title: string,
  pieData: { name: string; value: number }[]
) => {
  // Beautiful color palette from ECharts rose chart example
  const roseColors = [
    "#5470c6", // Blue (rose 1)
    "#91cc75", // Lime Green (rose 2)
    "#5d6d7e", // Dark Gray/Purple (rose 3)
    "#ee9a49", // Orange (rose 4)
    "#73c0de", // Cyan (rose 5)
    "#fac858", // Yellow (rose 6)
    "#ea7ccc", // Pink (rose 7)
    "#9a60b4", // Purple (rose 8)
  ];

  return {
    title: {
      text: title,
      left: "center",
      top: 20,
      textStyle: {
        color: "#e2e8f0",
        fontSize: 20,
        fontWeight: "600",
      },
    },
    legend: {
      top: "bottom",
      textStyle: {
        color: "#cbd5e1",
        fontSize: 12,
      },
      itemWidth: 18,
      itemHeight: 14,
    },
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      textStyle: {
        color: "#e2e8f0",
      },
      formatter: (params: AnyData) => {
        return `<div style="font-weight: 600; margin-bottom: 4px;">${
          params.name
        }</div>
                <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${
                  params.color
                };margin-right:6px;"></span>
                Value: <strong>${params.value.toFixed(2)}</strong> (${
          params.percent
        }%)</div>`;
      },
    },
    series: [
      {
        name: title || "Nightingale Chart",
        type: "pie",
        radius: [60, 200],
        center: ["50%", "50%"],
        roseType: "area",
        itemStyle: {
          borderRadius: 8,
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 2,
        },
        label: {
          show: true,
          color: "#f1f5f9",
          fontSize: 12,
          fontWeight: "500",
          formatter: (params: AnyData) => {
            return `${params.name}\n${params.value.toFixed(1)}`;
          },
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold",
          },
          itemStyle: {
            shadowBlur: 20,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        data: pieData.map((item, index) => ({
          ...item,
          itemStyle: {
            color: roseColors[index % roseColors.length],
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
          color: "rgba(255, 255, 255, 0.7)",
          fontSize: 11,
        },
        lineStyle: { color: "rgba(255, 255, 255, 0.2)" },
        controlStyle: {
          color: "#80FFA5",
          borderColor: "#80FFA5",
        },
        emphasis: {
          controlStyle: {
            color: "#00DDFF",
            borderColor: "#00DDFF",
          },
        },
        checkpointStyle: {
          color: "#80FFA5",
          borderColor: "#80FFA5",
        },
      },
      title: {
        text: title,
        left: "center",
        top: 10,
        textStyle: { color: "#fff", fontSize: 16, fontWeight: 600 },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderColor: "rgba(99, 102, 241, 0.3)",
        borderWidth: 1,
        textStyle: { color: "#e2e8f0" },
      },
      legend: {
        left: "right",
        top: 40,
        textStyle: { color: "rgba(255, 255, 255, 0.8)", fontSize: 11 },
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
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: 10,
            interval: 0,
            rotate: 30,
          },
          axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.2)" } },
          splitLine: { show: false },
        },
      ],
      yAxis: [
        {
          type: "value",
          axisLabel: { color: "rgba(255, 255, 255, 0.7)", fontSize: 11 },
          axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.2)" } },
          splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.08)" } },
        },
      ],
      series: series.map((s, idx) => ({
        name: s.name,
        type: "bar",
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: ["#80FFA5", "#00DDFF", "#37A2FF", "#FF0087", "#FFBF00"][
                idx % 5
              ],
            },
            {
              offset: 1,
              color: [
                "rgba(128,255,165,0.3)",
                "rgba(0,221,255,0.3)",
                "rgba(55,162,255,0.3)",
                "rgba(255,0,135,0.3)",
                "rgba(255,191,0,0.3)",
              ][idx % 5],
            },
          ]),
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
  const emphasisStyle = {
    itemStyle: {
      shadowBlur: 10,
      shadowColor: "rgba(0,0,0,0.3)",
    },
  };

  // Generate colors with gradients
  const barColors = ["#80FFA5", "#00DDFF", "#37A2FF", "#FF0087", "#FFBF00"];

  return {
    backgroundColor: "transparent",
    title: {
      text: title,
      left: "center",
      top: 10,
      textStyle: { color: "#fff", fontSize: 16, fontWeight: 600 },
    },
    legend: {
      data: series.map((s) => s.name),
      left: "10%",
      top: 40,
      textStyle: { color: "rgba(255, 255, 255, 0.8)", fontSize: 11 },
    },
    brush: {
      toolbox: ["rect", "polygon", "lineX", "lineY", "keep", "clear"],
      xAxisIndex: 0,
      brushStyle: {
        borderWidth: 1,
        color: "rgba(99, 102, 241, 0.2)",
        borderColor: "rgba(99, 102, 241, 0.8)",
      },
    },
    toolbox: {
      feature: {
        magicType: {
          type: ["stack"],
          iconStyle: { borderColor: "rgba(255,255,255,0.5)" },
        },
        dataView: {
          backgroundColor: "#1e293b",
          textColor: "#fff",
          iconStyle: { borderColor: "rgba(255,255,255,0.5)" },
        },
        saveAsImage: {
          iconStyle: { borderColor: "rgba(255,255,255,0.5)" },
        },
      },
      right: 20,
      top: 10,
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "rgba(99, 102, 241, 0.3)",
      borderWidth: 1,
      textStyle: { color: "#e2e8f0" },
    },
    xAxis: {
      data: xAxis.data,
      name: xAxis.name || "",
      axisLine: {
        onZero: true,
        lineStyle: { color: "rgba(255, 255, 255, 0.2)" },
      },
      axisLabel: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 10,
        interval: 0,
        rotate: xAxis.data.length > 6 ? 30 : 0,
      },
      splitLine: { show: false },
      splitArea: { show: false },
    },
    yAxis: {
      axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.2)" } },
      axisLabel: { color: "rgba(255, 255, 255, 0.7)", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.08)" } },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: 80,
      top: 80,
      containLabel: true,
    },
    series: series.map((s, idx) => ({
      name: s.name,
      type: "bar",
      stack: s.stack || (idx < 2 ? "one" : "two"),
      emphasis: emphasisStyle,
      data: s.data,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: barColors[idx % 5] },
          { offset: 1, color: barColors[idx % 5] + "66" }, // Add transparency
        ]),
        borderRadius: [4, 4, 0, 0],
      },
    })),
  };
};

// ============================================
// 6️⃣ LARGE AREA CHART (Exact ECharts Example with DataZoom)
// ============================================

const createLargeAreaChart = (
  title: string,
  series: SeriesData[],
  xAxis: { data: string[]; name?: string }
) => ({
  backgroundColor: "transparent",
  title: {
    left: "center",
    text: title,
    top: 10,
    textStyle: { color: "#fff", fontSize: 16, fontWeight: 600 },
  },
  tooltip: {
    trigger: "axis",
    position: function (pt: number[]) {
      return [pt[0], "10%"];
    },
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderColor: "rgba(99, 102, 241, 0.3)",
    borderWidth: 1,
    textStyle: { color: "#e2e8f0" },
  },
  toolbox: {
    feature: {
      dataZoom: {
        yAxisIndex: "none",
        iconStyle: { borderColor: "rgba(255,255,255,0.5)" },
      },
      restore: {
        iconStyle: { borderColor: "rgba(255,255,255,0.5)" },
      },
      saveAsImage: {
        iconStyle: { borderColor: "rgba(255,255,255,0.5)" },
      },
    },
    right: 20,
    top: 10,
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: xAxis.data,
    axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.2)" } },
    axisLabel: { color: "rgba(255, 255, 255, 0.7)", fontSize: 10 },
  },
  yAxis: {
    type: "value",
    boundaryGap: [0, "100%"],
    axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.2)" } },
    axisLabel: { color: "rgba(255, 255, 255, 0.7)", fontSize: 11 },
    splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.08)" } },
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
        color: "#80FFA5",
      },
      textStyle: {
        color: "rgba(255, 255, 255, 0.7)",
      },
      borderColor: "rgba(255, 255, 255, 0.2)",
      backgroundColor: "rgba(30, 41, 59, 0.8)",
      dataBackground: {
        lineStyle: { color: "rgba(128, 255, 165, 0.5)" },
        areaStyle: { color: "rgba(128, 255, 165, 0.2)" },
      },
      selectedDataBackground: {
        lineStyle: { color: "#80FFA5" },
        areaStyle: { color: "rgba(128, 255, 165, 0.4)" },
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
  series: series.map((s, idx) => ({
    name: s.name,
    type: "line",
    symbol: "none",
    sampling: "lttb",
    itemStyle: {
      color: [
        "rgb(255, 70, 131)",
        "rgb(128, 255, 165)",
        "rgb(0, 221, 255)",
        "rgb(55, 162, 255)",
        "rgb(255, 191, 0)",
      ][idx % 5],
    },
    areaStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        {
          offset: 0,
          color: [
            "rgb(255, 158, 68)",
            "rgb(128, 255, 165)",
            "rgb(0, 221, 255)",
            "rgb(55, 162, 255)",
            "rgb(255, 191, 0)",
          ][idx % 5],
        },
        {
          offset: 1,
          color: [
            "rgb(255, 70, 131)",
            "rgb(1, 191, 236)",
            "rgb(77, 119, 255)",
            "rgb(116, 21, 219)",
            "rgb(224, 62, 76)",
          ][idx % 5],
        },
      ]),
    },
    data: s.data,
  })),
});

// ============================================
// 🎯 HORIZONTAL STACKED BAR CHART (For Rankings)
// ============================================

const createStackedBarChart = (
  title: string,
  series: SeriesData[],
  xAxis: { data: string[]; name?: string }
) => {
  // Professional color palette from ECharts example - highly distinct colors
  const colorPalette = [
    "#007BFF", // Vivid Blue
    "#FFA500", // Standard Orange
    "#4F5868", // Dark Slate Gray
    "#9ACD32", // Yellow Green
    "#4169E1", // Royal Blue
    "#FF6B6B", // Coral Red
    "#20C997", // Teal
    "#6F42C1", // Purple
  ];

  // Color mapping for groundwater metrics with distinct colors from the example
  const getColor = (name: string, index: number) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("stage")) {
      return "#FF6B6B"; // Coral Red for stage (critical metric)
    }
    if (nameLower.includes("deficit")) {
      return "#FFA500"; // Orange for deficit
    }
    if (nameLower.includes("extraction")) {
      return "#007BFF"; // Vivid Blue for extraction
    }
    if (nameLower.includes("recharge")) {
      return "#4169E1"; // Royal Blue for recharge
    }
    if (nameLower.includes("rainfall")) {
      return "#9ACD32"; // Yellow Green for rainfall
    }
    return colorPalette[index % colorPalette.length];
  };

  return {
    title: {
      text: title,
      left: "center",
      top: 20,
      textStyle: {
        color: "#e2e8f0",
        fontSize: 18,
        fontWeight: "600",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      textStyle: {
        color: "#e2e8f0",
      },
      formatter: (params: AnyData) => {
        if (!Array.isArray(params)) return "";
        const locationName = params[0]?.name || "";
        let tooltip = `<div style="font-weight: 600; margin-bottom: 8px;">${locationName}</div>`;
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
        color: "#cbd5e1",
        fontSize: 13,
      },
      itemWidth: 24,
      itemHeight: 16,
      itemGap: 16,
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
          color: "rgba(148, 163, 184, 0.3)",
        },
      },
      axisLabel: {
        color: "#94a3b8",
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: "rgba(148, 163, 184, 0.15)",
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
          color: "rgba(148, 163, 184, 0.3)",
        },
      },
      axisLabel: {
        color: "#f1f5f9",
        fontSize: 13,
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
      barMaxWidth: 35,
      itemStyle: {
        color: getColor(s.name, idx),
        borderRadius: [0, 4, 4, 0],
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      emphasis: {
        focus: "series",
        itemStyle: {
          shadowBlur: 10,
          shadowColor: "rgba(0, 0, 0, 0.5)",
          borderColor: "rgba(255, 255, 255, 0.3)",
        },
      },
      label: {
        show: true,
        position: "inside",
        formatter: (params: AnyData) => {
          const val = params.value as number;
          return val > 30 ? val.toFixed(0) : ""; // Show label if value is large enough
        },
        color: "#fff",
        fontSize: 11,
        fontWeight: "600",
      },
    })),
  };
};

export default ChartRenderer;
