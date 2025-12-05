import React from "react";
import ReactECharts from "echarts-for-react";

interface ChartPayload {
  type: string;
  title: string;
  series: {
    name: string;
    data: number[];
    type?: string;
  }[];
  xAxis?: {
    data: string[];
  };
  echarts_option?: any;
}

interface ChartRendererProps {
  chart: ChartPayload;
}

// Beautiful color palettes
const COLORS = {
  primary: ["#667eea", "#764ba2"], // Purple gradient
  secondary: ["#11998e", "#38ef7d"], // Teal gradient
  accent: ["#ee0979", "#ff6a00"], // Pink-orange gradient
  blue: ["#2193b0", "#6dd5ed"], // Ocean blue
  sunset: ["#f12711", "#f5af19"], // Sunset
  emerald: ["#11998e", "#38ef7d"], // Emerald
};

const CHART_COLORS = [
  "#667eea", // Purple
  "#38ef7d", // Emerald
  "#f5af19", // Gold
  "#6dd5ed", // Sky blue
  "#ee0979", // Pink
  "#f12711", // Red
  "#11998e", // Teal
  "#764ba2", // Violet
];

const ChartRenderer: React.FC<ChartRendererProps> = ({ chart }) => {
  const getOption = () => {
    // If AI generated a complete ECharts option, use it directly
    if (chart.echarts_option) {
      // Ensure no pie charts even from AI
      const option = { ...chart.echarts_option };
      if (option.series) {
        option.series = option.series.map((s: any) => {
          if (s.type === "pie") {
            return { ...s, type: "bar" }; // Convert pie to bar
          }
          return s;
        });
      }
      return option;
    }

    const { type, title, series, xAxis } = chart;

    // GRADIENT AREA CHART - For trends over time (most beautiful!)
    if (type === "line" || type === "area" || type === "trend") {
      return createGradientAreaChart(title, series, xAxis);
    }

    // STACKED BAR CHART - For comparisons
    if (type === "bar" || type === "compare") {
      return createStackedBarChart(title, series, xAxis);
    }

    // RADAR CHART - For multi-metric analysis
    if (type === "radar") {
      return createRadarChart(title, series, xAxis);
    }

    // GAUGE CHART - For single value display
    if (type === "gauge") {
      return createGaugeChart(title, series);
    }

    // SCATTER CHART - For correlation analysis
    if (type === "scatter") {
      return createScatterChart(title, series, xAxis);
    }

    // HEATMAP - For matrix data
    if (type === "heatmap") {
      return createHeatmapChart(title, series, xAxis);
    }

    // DEFAULT: Gradient Area Chart (looks amazing!)
    return createGradientAreaChart(title, series, xAxis);
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-2xl p-8 border border-slate-200/50 backdrop-blur-sm">
      <ReactECharts
        option={getOption()}
        style={{ height: "450px", width: "100%" }}
        opts={{ renderer: "canvas" }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

// 🎨 GRADIENT AREA CHART - Stunning for trends
const createGradientAreaChart = (
  title: string,
  series: any[],
  xAxis?: { data: string[] }
) => ({
  backgroundColor: "transparent",
  title: {
    text: title,
    left: "center",
    top: 10,
    textStyle: {
      color: "#1e293b",
      fontSize: 20,
      fontWeight: 700,
      fontFamily: "Inter, sans-serif",
    },
  },
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderColor: "rgba(102, 126, 234, 0.3)",
    borderWidth: 2,
    borderRadius: 12,
    padding: [12, 16],
    textStyle: {
      color: "#334155",
      fontSize: 13,
    },
    axisPointer: {
      type: "cross",
      lineStyle: {
        color: "#667eea",
        width: 1,
        type: "dashed",
      },
      crossStyle: {
        color: "#667eea",
      },
    },
    extraCssText: "box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);",
  },
  legend: {
    bottom: 10,
    left: "center",
    data: series.map((s) => s.name),
    textStyle: {
      color: "#64748b",
      fontSize: 12,
    },
    icon: "roundRect",
    itemWidth: 16,
    itemHeight: 8,
    itemGap: 24,
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "15%",
    top: "18%",
    containLabel: true,
  },
  toolbox: {
    feature: {
      saveAsImage: {
        title: "Download",
        pixelRatio: 3,
        backgroundColor: "#fff",
      },
      dataZoom: {
        yAxisIndex: "none",
        title: { zoom: "Zoom", back: "Reset" },
      },
      restore: { title: "Reset" },
    },
    right: 20,
    top: 10,
    iconStyle: {
      borderColor: "#94a3b8",
    },
  },
  dataZoom: [
    {
      type: "inside",
      start: 0,
      end: 100,
    },
    {
      start: 0,
      end: 100,
      height: 20,
      bottom: 45,
      borderColor: "transparent",
      backgroundColor: "#f1f5f9",
      fillerColor: "rgba(102, 126, 234, 0.2)",
      handleStyle: {
        color: "#667eea",
      },
    },
  ],
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: xAxis?.data || [],
    axisLine: {
      lineStyle: {
        color: "#e2e8f0",
        width: 2,
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: "#64748b",
      fontSize: 11,
      margin: 12,
    },
  },
  yAxis: {
    type: "value",
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: "#64748b",
      fontSize: 11,
    },
    splitLine: {
      lineStyle: {
        color: "#f1f5f9",
        type: "dashed",
      },
    },
  },
  series: series.map((s, idx) => ({
    name: s.name,
    type: "line",
    data: s.data,
    smooth: 0.6,
    symbol: "circle",
    symbolSize: 6,
    showSymbol: false,
    lineStyle: {
      width: 3,
      color: CHART_COLORS[idx % CHART_COLORS.length],
      shadowColor: `${CHART_COLORS[idx % CHART_COLORS.length]}40`,
      shadowBlur: 10,
      shadowOffsetY: 5,
    },
    areaStyle: {
      color: {
        type: "linear",
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: `${CHART_COLORS[idx % CHART_COLORS.length]}40` },
          {
            offset: 0.5,
            color: `${CHART_COLORS[idx % CHART_COLORS.length]}20`,
          },
          { offset: 1, color: `${CHART_COLORS[idx % CHART_COLORS.length]}05` },
        ],
      },
    },
    emphasis: {
      focus: "series",
      itemStyle: {
        shadowBlur: 20,
        shadowColor: CHART_COLORS[idx % CHART_COLORS.length],
      },
    },
  })),
  animationDuration: 1500,
  animationEasing: "cubicInOut",
});

// 📊 STACKED BAR CHART - For comparisons
const createStackedBarChart = (
  title: string,
  series: any[],
  xAxis?: { data: string[] }
) => ({
  backgroundColor: "transparent",
  title: {
    text: title,
    left: "center",
    top: 10,
    textStyle: {
      color: "#1e293b",
      fontSize: 20,
      fontWeight: 700,
    },
  },
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderColor: "rgba(102, 126, 234, 0.3)",
    borderWidth: 2,
    borderRadius: 12,
    padding: [12, 16],
    axisPointer: {
      type: "shadow",
      shadowStyle: {
        color: "rgba(102, 126, 234, 0.1)",
      },
    },
    extraCssText: "box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);",
  },
  legend: {
    bottom: 10,
    data: series.map((s) => s.name),
    textStyle: { color: "#64748b" },
    icon: "roundRect",
    itemWidth: 16,
    itemHeight: 8,
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "15%",
    top: "18%",
    containLabel: true,
  },
  toolbox: {
    feature: {
      saveAsImage: { title: "Download", pixelRatio: 3 },
      magicType: {
        type: ["stack", "tiled"],
        title: { stack: "Stack", tiled: "Tiled" },
      },
      restore: { title: "Reset" },
    },
    right: 20,
    top: 10,
  },
  xAxis: {
    type: "category",
    data: xAxis?.data || [],
    axisLine: { lineStyle: { color: "#e2e8f0", width: 2 } },
    axisTick: { show: false },
    axisLabel: {
      color: "#64748b",
      fontSize: 11,
      rotate: xAxis?.data && xAxis.data.length > 8 ? 30 : 0,
    },
  },
  yAxis: {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "#64748b" },
    splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
  },
  series: series.map((s, idx) => ({
    name: s.name,
    type: "bar",
    data: s.data,
    barMaxWidth: 45,
    barGap: "10%",
    itemStyle: {
      borderRadius: [6, 6, 0, 0],
      color: {
        type: "linear",
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: CHART_COLORS[idx % CHART_COLORS.length] },
          {
            offset: 1,
            color: adjustColorBrightness(
              CHART_COLORS[idx % CHART_COLORS.length],
              -30
            ),
          },
        ],
      },
      shadowColor: `${CHART_COLORS[idx % CHART_COLORS.length]}40`,
      shadowBlur: 8,
      shadowOffsetY: 4,
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 20,
        shadowColor: "rgba(0, 0, 0, 0.3)",
      },
    },
  })),
  animationDuration: 1200,
  animationEasing: "elasticOut",
});

// 🎯 RADAR CHART - For multi-metric analysis
const createRadarChart = (
  title: string,
  series: any[],
  xAxis?: { data: string[] }
) => ({
  backgroundColor: "transparent",
  title: {
    text: title,
    left: "center",
    top: 10,
    textStyle: { color: "#1e293b", fontSize: 20, fontWeight: 700 },
  },
  tooltip: {
    trigger: "item",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 12,
  },
  legend: {
    bottom: 10,
    data: series.map((s) => s.name),
    textStyle: { color: "#64748b" },
  },
  radar: {
    indicator: (xAxis?.data || []).map((name) => ({
      name,
      max: Math.max(...series.flatMap((s) => s.data)) * 1.2,
    })),
    center: ["50%", "55%"],
    radius: "65%",
    axisLine: { lineStyle: { color: "#e2e8f0" } },
    splitLine: { lineStyle: { color: "#f1f5f9" } },
    splitArea: {
      areaStyle: {
        color: ["rgba(102, 126, 234, 0.02)", "rgba(102, 126, 234, 0.05)"],
      },
    },
  },
  series: [
    {
      type: "radar",
      data: series.map((s, idx) => ({
        value: s.data,
        name: s.name,
        lineStyle: { color: CHART_COLORS[idx], width: 2 },
        areaStyle: { color: `${CHART_COLORS[idx]}30` },
        itemStyle: { color: CHART_COLORS[idx] },
      })),
    },
  ],
});

// ⏱️ GAUGE CHART - For single metrics
const createGaugeChart = (title: string, series: any[]) => ({
  backgroundColor: "transparent",
  title: {
    text: title,
    left: "center",
    top: 10,
    textStyle: { color: "#1e293b", fontSize: 20, fontWeight: 700 },
  },
  series: [
    {
      type: "gauge",
      center: ["50%", "60%"],
      radius: "80%",
      min: 0,
      max: 100,
      progress: {
        show: true,
        width: 18,
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: "#667eea" },
              { offset: 1, color: "#38ef7d" },
            ],
          },
        },
      },
      axisLine: {
        lineStyle: { width: 18, color: [[1, "#f1f5f9"]] },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 42,
        fontWeight: 700,
        color: "#1e293b",
        offsetCenter: [0, "10%"],
        formatter: "{value}%",
      },
      data: [{ value: series[0]?.data?.[0] || 0, name: series[0]?.name || "" }],
    },
  ],
});

// 🔵 SCATTER CHART - For correlation
const createScatterChart = (
  title: string,
  series: any[],
  xAxis?: { data: string[] }
) => ({
  backgroundColor: "transparent",
  title: {
    text: title,
    left: "center",
    top: 10,
    textStyle: { color: "#1e293b", fontSize: 20, fontWeight: 700 },
  },
  tooltip: {
    trigger: "item",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 12,
  },
  xAxis: {
    type: "value",
    axisLine: { lineStyle: { color: "#e2e8f0" } },
    splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
  },
  yAxis: {
    type: "value",
    axisLine: { show: false },
    splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
  },
  series: series.map((s, idx) => ({
    name: s.name,
    type: "scatter",
    data: s.data,
    symbolSize: 14,
    itemStyle: {
      color: CHART_COLORS[idx],
      shadowBlur: 10,
      shadowColor: `${CHART_COLORS[idx]}60`,
    },
  })),
});

// 🔥 HEATMAP CHART - For matrix data
const createHeatmapChart = (
  title: string,
  series: any[],
  xAxis?: { data: string[] }
) => ({
  backgroundColor: "transparent",
  title: {
    text: title,
    left: "center",
    top: 10,
    textStyle: { color: "#1e293b", fontSize: 20, fontWeight: 700 },
  },
  tooltip: {
    position: "top",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 12,
  },
  grid: {
    left: "10%",
    right: "10%",
    top: "18%",
    bottom: "15%",
  },
  xAxis: {
    type: "category",
    data: xAxis?.data || [],
    axisLine: { show: false },
    axisTick: { show: false },
  },
  yAxis: {
    type: "category",
    data: series.map((s) => s.name),
    axisLine: { show: false },
    axisTick: { show: false },
  },
  visualMap: {
    min: 0,
    max: Math.max(...series.flatMap((s) => s.data)),
    calculable: true,
    orient: "horizontal",
    left: "center",
    bottom: 10,
    inRange: {
      color: ["#f8fafc", "#667eea", "#764ba2"],
    },
  },
  series: [
    {
      type: "heatmap",
      data: series.flatMap((s, yIdx) =>
        s.data.map((val: number, xIdx: number) => [xIdx, yIdx, val])
      ),
      itemStyle: {
        borderRadius: 4,
        borderColor: "#fff",
        borderWidth: 2,
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: "rgba(0, 0, 0, 0.3)",
        },
      },
    },
  ],
});

// Utility function
const adjustColorBrightness = (color: string, percent: number): string => {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
};

export default ChartRenderer;
