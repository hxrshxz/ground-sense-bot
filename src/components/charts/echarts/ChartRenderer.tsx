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
  pieData?: { name: string; value: number }[];
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
      color: "#ffffff",
      fontSize: 22,
      fontWeight: 700,
      textShadowColor: "rgba(0, 0, 0, 0.5)",
      textShadowBlur: 10,
      textShadowOffsetX: 2,
      textShadowOffsetY: 2,
    },
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      lineStyle: {
        color: "rgba(138, 43, 226, 0.6)",
        width: 2,
        type: "dashed",
      },
      crossStyle: {
        color: "rgba(138, 43, 226, 0.6)",
      },
      label: {
        backgroundColor: "rgba(99, 102, 241, 0.9)",
        borderColor: "rgba(138, 43, 226, 0.8)",
        borderWidth: 2,
        color: "#fff",
        fontWeight: 600,
      },
    },
    backgroundColor: "rgba(10, 15, 30, 0.98)",
    borderColor: "rgba(138, 43, 226, 0.6)",
    borderWidth: 2,
    textStyle: { color: "#ffffff", fontSize: 13 },
    padding: 12,
    extraCssText: "box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);",
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
      smoothMonotone: "x",
      lineStyle: {
        width: 3,
        shadowColor: gradientConfigs[idx % 5][0].color,
        shadowBlur: 10,
        shadowOffsetY: 2,
      },
      showSymbol: true,
      symbol: "circle",
      symbolSize: 8,
      itemStyle: {
        borderColor: "#fff",
        borderWidth: 2,
        shadowBlur: 10,
        shadowColor: gradientConfigs[idx % 5][0].color,
      },
      areaStyle: {
        opacity: 0.85,
        color: new echarts.graphic.LinearGradient(
          0,
          0,
          0,
          1,
          gradientConfigs[idx % 5]
        ),
        shadowColor: "rgba(0, 0, 0, 0.3)",
        shadowBlur: 20,
      },
      emphasis: {
        focus: "series",
        lineStyle: {
          width: 5,
          shadowBlur: 20,
        },
        itemStyle: {
          borderWidth: 3,
          shadowBlur: 15,
        },
        scale: true,
      },
      animationEasing: "elasticOut",
      animationDelay: (idx: number) => idx * 10,
      data: s.data,
    };
  }),
});

// ============================================
// 3️⃣ ROSE PIE CHART (Nightingale - God-Level Graphics)
// ============================================

const createRosePieChart = (
  title: string,
  pieData: { name: string; value: number }[]
) => {
  // Stunning gradient color palette with depth
  const roseColors = [
    {
      type: "linear",
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: "#667eea" },
        { offset: 1, color: "#764ba2" },
      ],
    },
    {
      type: "linear",
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: "#f093fb" },
        { offset: 1, color: "#f5576c" },
      ],
    },
    {
      type: "linear",
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: "#4facfe" },
        { offset: 1, color: "#00f2fe" },
      ],
    },
    {
      type: "linear",
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: "#43e97b" },
        { offset: 1, color: "#38f9d7" },
      ],
    },
    {
      type: "linear",
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: "#fa709a" },
        { offset: 1, color: "#fee140" },
      ],
    },
    {
      type: "linear",
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: "#30cfd0" },
        { offset: 1, color: "#330867" },
      ],
    },
    {
      type: "linear",
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: "#a8edea" },
        { offset: 1, color: "#fed6e3" },
      ],
    },
    {
      type: "linear",
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: "#ff9a56" },
        { offset: 1, color: "#ff6a88" },
      ],
    },
  ];

  return {
    title: {
      text: title,
      left: "center",
      top: 20,
      textStyle: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "700",
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowBlur: 10,
        textShadowOffsetX: 2,
        textShadowOffsetY: 2,
      },
    },
    legend: {
      show: false, // Hide legend for cleaner look with many items
    },
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(10, 15, 30, 0.98)",
      borderColor: "rgba(138, 43, 226, 0.5)",
      borderWidth: 2,
      textStyle: {
        color: "#ffffff",
        fontSize: 14,
      },
      formatter: (params: AnyData) => {
        const rank = params.dataIndex + 1;
        return `<div style="padding: 8px;">
                  <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px; color: #667eea;">🏆 Rank #${rank}</div>
                  <div style="font-weight: 600; margin-bottom: 6px; font-size: 14px;">${
                    params.name
                  }</div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);"></span>
                    <span style="font-size: 15px;">Value: <strong style="color: #43e97b;">${params.value.toFixed(
                      2
                    )}</strong></span>
                  </div>
                  <div style="margin-top: 4px; font-size: 12px; color: #94a3b8;">Share: ${params.percent.toFixed(
                    1
                  )}%</div>
                </div>`;
      },
    },
    series: [
      {
        name: title || "Nightingale Chart",
        type: "pie",
        radius: [80, 240],
        center: ["50%", "52%"],
        roseType: "area",
        itemStyle: {
          borderRadius: 12,
          borderColor: "rgba(255, 255, 255, 0.2)",
          borderWidth: 3,
          shadowBlur: 25,
          shadowColor: "rgba(0, 0, 0, 0.4)",
          shadowOffsetX: 0,
          shadowOffsetY: 5,
        },
        label: {
          show: true,
          color: "#ffffff",
          fontSize: 13,
          fontWeight: "600",
          textShadowColor: "rgba(0, 0, 0, 0.8)",
          textShadowBlur: 4,
          formatter: (params: AnyData) => {
            const rank = params.dataIndex + 1;
            // Show top 8 labels to avoid clutter
            if (rank <= 8) {
              return `#${rank}\n${params.value.toFixed(1)}`;
            }
            return "";
          },
          position: "outside",
          alignTo: "edge",
          margin: 20,
        },
        labelLine: {
          show: true,
          length: 30,
          length2: 20,
          lineStyle: {
            color: "rgba(255, 255, 255, 0.3)",
            width: 2,
          },
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
            color: "#ffffff",
          },
          itemStyle: {
            shadowBlur: 40,
            shadowColor: "rgba(138, 43, 226, 0.8)",
            borderWidth: 4,
            borderColor: "rgba(255, 255, 255, 0.5)",
          },
          scale: true,
          scaleSize: 15,
        },
        animationType: "scale",
        animationEasing: "elasticOut",
        animationDelay: (idx: number) => idx * 50,
        data: pieData.map((item, index) => ({
          ...item,
          itemStyle: {
            color: roseColors[index % roseColors.length],
            borderColor: "rgba(255, 255, 255, 0.3)",
            borderWidth: 3,
            shadowBlur: 20,
            shadowColor: "rgba(0, 0, 0, 0.3)",
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
          color: "rgba(255, 255, 255, 0.9)",
          fontSize: 12,
          fontWeight: 600,
        },
        lineStyle: {
          color: "rgba(138, 43, 226, 0.5)",
          width: 2,
        },
        itemStyle: {
          color: "rgba(138, 43, 226, 0.3)",
          borderColor: "rgba(138, 43, 226, 0.8)",
          borderWidth: 2,
        },
        controlStyle: {
          color: "#667eea",
          borderColor: "#667eea",
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: "rgba(102, 126, 234, 0.5)",
        },
        emphasis: {
          controlStyle: {
            color: "#f093fb",
            borderColor: "#f093fb",
            shadowBlur: 15,
            shadowColor: "rgba(240, 147, 251, 0.8)",
          },
          itemStyle: {
            color: "rgba(138, 43, 226, 0.6)",
            borderColor: "rgba(240, 116, 245, 1)",
            shadowBlur: 10,
          },
        },
        checkpointStyle: {
          color: "#667eea",
          borderColor: "#f093fb",
          borderWidth: 3,
          shadowBlur: 15,
          shadowColor: "rgba(102, 126, 234, 0.8)",
          animation: true,
          animationDuration: 300,
        },
      },
      title: {
        text: title,
        left: "center",
        top: 10,
        textStyle: {
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 700,
          textShadowColor: "rgba(0, 0, 0, 0.5)",
          textShadowBlur: 10,
          textShadowOffsetX: 2,
          textShadowOffsetY: 2,
        },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(10, 15, 30, 0.98)",
        borderColor: "rgba(138, 43, 226, 0.6)",
        borderWidth: 2,
        textStyle: { color: "#ffffff", fontSize: 13 },
        padding: 12,
        extraCssText: "box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);",
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
      shadowBlur: 30,
      shadowColor: "rgba(138, 43, 226, 0.8)",
      shadowOffsetY: 5,
    },
    scale: true,
    scaleSize: 10,
  };

  // Stunning gradient colors for bars
  const barGradients = [
    [
      { offset: 0, color: "#667eea" },
      { offset: 1, color: "#764ba2" },
    ],
    [
      { offset: 0, color: "#f093fb" },
      { offset: 1, color: "#f5576c" },
    ],
    [
      { offset: 0, color: "#4facfe" },
      { offset: 1, color: "#00f2fe" },
    ],
    [
      { offset: 0, color: "#43e97b" },
      { offset: 1, color: "#38f9d7" },
    ],
    [
      { offset: 0, color: "#fa709a" },
      { offset: 1, color: "#fee140" },
    ],
  ];

  return {
    backgroundColor: "transparent",
    title: {
      text: title,
      left: "center",
      top: 10,
      textStyle: {
        color: "#ffffff",
        fontSize: 22,
        fontWeight: 700,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowBlur: 10,
        textShadowOffsetX: 2,
        textShadowOffsetY: 2,
      },
    },
    legend: {
      data: series.map((s) => s.name),
      left: "10%",
      top: 45,
      textStyle: {
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: 12,
        fontWeight: 500,
      },
      itemWidth: 25,
      itemHeight: 14,
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
      backgroundColor: "rgba(10, 15, 30, 0.98)",
      borderColor: "rgba(138, 43, 226, 0.6)",
      borderWidth: 2,
      textStyle: { color: "#ffffff", fontSize: 13 },
      padding: 12,
      extraCssText: "box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);",
      axisPointer: {
        type: "shadow",
        shadowStyle: {
          color: "rgba(138, 43, 226, 0.15)",
        },
      },
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
      type: s.type || "bar",
      stack: s.stack || (idx < 2 ? "one" : "two"),
      emphasis: emphasisStyle,
      data: s.data,
      smooth: s.type === "line",
      lineStyle:
        s.type === "line"
          ? {
              width: 3,
              shadowColor: barGradients[idx % 5][0].color,
              shadowBlur: 10,
            }
          : undefined,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(
          0,
          0,
          0,
          1,
          barGradients[idx % 5]
        ),
        borderRadius: [8, 8, 0, 0],
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 2,
        shadowBlur: 15,
        shadowColor: "rgba(0, 0, 0, 0.3)",
        shadowOffsetY: 3,
      },
      animationType: "scale",
      animationEasing: "elasticOut",
      animationDelay: (idx: number) => idx * 30,
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
    textStyle: {
      color: "#ffffff",
      fontSize: 22,
      fontWeight: 700,
      textShadowColor: "rgba(0, 0, 0, 0.5)",
      textShadowBlur: 10,
      textShadowOffsetX: 2,
      textShadowOffsetY: 2,
    },
  },
  tooltip: {
    trigger: "axis",
    position: function (pt: number[]) {
      return [pt[0], "10%"];
    },
    backgroundColor: "rgba(10, 15, 30, 0.98)",
    borderColor: "rgba(138, 43, 226, 0.6)",
    borderWidth: 2,
    textStyle: { color: "#ffffff", fontSize: 13 },
    padding: 12,
    extraCssText: "box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);",
  },
  toolbox: {
    feature: {
      dataZoom: {
        yAxisIndex: "none",
        iconStyle: {
          borderColor: "rgba(138, 43, 226, 0.8)",
          borderWidth: 2,
        },
      },
      restore: {
        iconStyle: {
          borderColor: "rgba(138, 43, 226, 0.8)",
          borderWidth: 2,
        },
      },
      saveAsImage: {
        iconStyle: {
          borderColor: "rgba(138, 43, 226, 0.8)",
          borderWidth: 2,
        },
      },
    },
    right: 20,
    top: 10,
    emphasis: {
      iconStyle: {
        borderColor: "rgba(240, 116, 245, 1)",
      },
    },
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
    symbol: "circle",
    symbolSize: 6,
    sampling: "lttb",
    smooth: true,
    lineStyle: {
      width: 2,
      shadowColor: [
        "rgb(255, 70, 131)",
        "rgb(128, 255, 165)",
        "rgb(0, 221, 255)",
        "rgb(55, 162, 255)",
        "rgb(255, 191, 0)",
      ][idx % 5],
      shadowBlur: 10,
    },
    itemStyle: {
      color: [
        "rgb(255, 70, 131)",
        "rgb(128, 255, 165)",
        "rgb(0, 221, 255)",
        "rgb(55, 162, 255)",
        "rgb(255, 191, 0)",
      ][idx % 5],
      borderColor: "#fff",
      borderWidth: 2,
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

// ============================================
// 5️⃣ RISK POLAR BAR CHART (Radial Polar Bar - Premium)
// ============================================

const createRiskRadarChart = (title: string, data: RiskData[]) => {
  // Vibrant gradient colors for each risk factor
  const colors = [
    new echarts.graphic.LinearGradient(0, 0, 1, 0, [
      { offset: 0, color: '#667eea' },
      { offset: 1, color: '#764ba2' }
    ]),
    new echarts.graphic.LinearGradient(0, 0, 1, 0, [
      { offset: 0, color: '#f093fb' },
      { offset: 1, color: '#f5576c' }
    ]),
    new echarts.graphic.LinearGradient(0, 0, 1, 0, [
      { offset: 0, color: '#4facfe' },
      { offset: 1, color: '#00f2fe' }
    ]),
    new echarts.graphic.LinearGradient(0, 0, 1, 0, [
      { offset: 0, color: '#43e97b' },
      { offset: 1, color: '#38f9d7' }
    ]),
  ];

  return {
    title: {
      text: title,
      left: "center",
      top: 15,
      textStyle: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: 700,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowBlur: 8,
      },
    },
    polar: {
      radius: [40, '75%'],
    },
    radiusAxis: {
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { 
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255,255,255,0.15)',
          type: 'dashed'
        }
      }
    },
    angleAxis: {
      type: 'category',
      data: data.map(d => d.factor),
      startAngle: 90,
      axisLine: { 
        lineStyle: { color: 'rgba(255,255,255,0.3)' } 
      },
      axisTick: { show: false },
      axisLabel: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 600,
        padding: [0, 0, 0, 0],
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255,255,255,0.1)'
        }
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 15, 30, 0.95)',
      borderColor: 'rgba(102, 126, 234, 0.6)',
      borderWidth: 2,
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: (params: AnyData) => {
        return `<b>${params.name}</b><br/>Risk Score: <span style="color:#f5576c;font-weight:bold">${params.value.toFixed(1)}%</span>`;
      }
    },
    series: {
      type: 'bar',
      data: data.map((d, idx) => ({
        value: d.score,
        itemStyle: {
          color: colors[idx % colors.length],
          borderRadius: [4, 4, 0, 0],
          shadowBlur: 15,
          shadowColor: 'rgba(0,0,0,0.3)',
        }
      })),
      coordinateSystem: 'polar',
      barWidth: 25,
      label: {
        show: true,
        position: 'middle',
        formatter: '{c}%',
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowBlur: 3,
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 25,
          shadowColor: 'rgba(102, 126, 234, 0.8)',
        }
      }
    },
    animationDuration: 1500,
    animationEasing: 'elasticOut',
  };
};

// ============================================
// 6️⃣ SECTOR GRADIENT CHART (Gradient Stacked Area - Premium)
// ============================================

const createSectorGradientChart = (title: string, data: SectorData[]) => {
  // Gradient color configurations for each sector
  const gradientConfigs = [
    [{ offset: 0, color: 'rgb(128, 255, 165)' }, { offset: 1, color: 'rgb(1, 191, 236)' }],
    [{ offset: 0, color: 'rgb(0, 221, 255)' }, { offset: 1, color: 'rgb(77, 119, 255)' }],
    [{ offset: 0, color: 'rgb(255, 0, 135)' }, { offset: 1, color: 'rgb(135, 0, 157)' }],
    [{ offset: 0, color: 'rgb(255, 191, 0)' }, { offset: 1, color: 'rgb(224, 62, 76)' }],
    [{ offset: 0, color: 'rgb(55, 162, 255)' }, { offset: 1, color: 'rgb(116, 21, 219)' }],
  ];

  // Calculate total and percentages
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return {
    color: ['#80FFA5', '#00DDFF', '#FF0087', '#FFBF00', '#37A2FF'],
    title: {
      text: title,
      left: 'center',
      top: 15,
      textStyle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 700,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowBlur: 8,
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        lineStyle: { color: 'rgba(138, 43, 226, 0.6)', width: 2, type: 'dashed' },
        label: {
          backgroundColor: 'rgba(99, 102, 241, 0.9)',
          borderColor: 'rgba(138, 43, 226, 0.8)',
          color: '#fff',
        }
      },
      backgroundColor: 'rgba(10, 15, 30, 0.98)',
      borderColor: 'rgba(138, 43, 226, 0.6)',
      borderWidth: 2,
      textStyle: { color: '#ffffff', fontSize: 13 },
      formatter: (params: AnyData) => {
        if (!Array.isArray(params)) return '';
        let result = `<div style="padding: 4px;"><b>Sector Distribution</b><br/>`;
        params.forEach((p: AnyData) => {
          const pct = ((p.value / total) * 100).toFixed(1);
          result += `${p.marker} ${p.seriesName}: <b>${pct}%</b> (${(p.value/1000).toFixed(0)}K ham)<br/>`;
        });
        return result + '</div>';
      }
    },
    legend: {
      data: data.map(d => d.sector),
      bottom: 10,
      textStyle: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: 500 },
      itemWidth: 20,
      itemHeight: 12,
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%',
      top: '18%',
      containLabel: true
    },
    xAxis: [{
      type: 'category',
      boundaryGap: false,
      data: ['Share'],
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 },
    }],
    yAxis: [{
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
      axisLabel: { 
        color: 'rgba(255, 255, 255, 0.7)', 
        fontSize: 11,
        formatter: (val: number) => `${(val/1000000).toFixed(1)}M`
      },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)' } },
    }],
    series: data.map((sector, idx) => ({
      name: sector.sector,
      type: 'line',
      stack: 'Total',
      smooth: true,
      lineStyle: { width: 0 },
      showSymbol: false,
      areaStyle: {
        opacity: 0.85,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, gradientConfigs[idx % gradientConfigs.length])
      },
      emphasis: { focus: 'series' },
      label: idx === data.length - 1 ? {
        show: true,
        position: 'top',
        formatter: (params: AnyData) => `${((params.value / total) * 100).toFixed(0)}%`,
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
      } : undefined,
      data: [sector.value],
    })),
    animationDuration: 1500,
    animationEasing: 'cubicOut',
  };
};
export default ChartRenderer;
