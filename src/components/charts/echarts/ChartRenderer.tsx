import React from 'react';
import ReactECharts from 'echarts-for-react';

interface ChartPayload {
  type: string;
  title: string;
  series: {
    name: string;
    data: number[];
    type: string;
  }[];
  xAxis?: {
    data: string[];
  };
}

interface ChartRendererProps {
  chart: ChartPayload;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ chart }) => {
  const getOption = () => {
    const { type, title, series, xAxis } = chart;

    const baseOption = {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          color: '#333', // Adjust for dark mode if needed
        },
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        bottom: 0,
        data: series.map((s) => s.name),
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true,
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
    };

    if (type === 'pie') {
      return {
        ...baseOption,
        tooltip: {
          trigger: 'item',
        },
        series: series.map((s) => ({
          name: s.name,
          type: 'pie',
          radius: '50%',
          data: s.data.map((val, idx) => ({
             value: val,
             name: xAxis?.data?.[idx] || `Item ${idx}`
          })), // Pie chart expects {value, name}
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        })),
      };
    }

    // Bar and Line
    return {
      ...baseOption,
      xAxis: {
        type: 'category',
        boundaryGap: type === 'bar', // Gap for bar, no gap for line usually
        data: xAxis?.data || [],
      },
      yAxis: {
        type: 'value',
      },
      series: series.map((s) => ({
        name: s.name,
        type: s.type || type, // Allow mixed types
        data: s.data,
        smooth: true, // Smooth lines
        areaStyle: s.type === 'line' ? { opacity: 0.1 } : undefined, // Subtle area for lines
      })),
    };
  };

  return (
    <div className="w-full h-[400px] bg-white rounded-lg shadow-md p-4">
      <ReactECharts option={getOption()} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

export default ChartRenderer;
