import { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const SectorUsageChart = ({ data }: { data: any }) => {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  // Sample sector usage data
  const sectorData = data?.sector_usage || [
    {
      sector: "Agriculture",
      percentage: 89.8,
      usage: 1534.2,
      color: "#22c55e",
      icon: "🌾",
    },
    {
      sector: "Domestic",
      percentage: 7.2,
      usage: 123.1,
      color: "#3b82f6",
      icon: "🏠",
    },
    {
      sector: "Industrial",
      percentage: 3.0,
      usage: 51.3,
      color: "#f59e0b",
      icon: "🏭",
    },
  ];

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b"];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-4 bg-white/95 backdrop-blur-sm border border-blue-200 rounded-xl shadow-lg w-64 font-sans">
          <p className="font-bold text-slate-800 text-lg mb-2 flex items-center">
            {data.icon} {data.sector}
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Usage Share:</span>
              <span className="font-semibold text-slate-800">
                {data.percentage}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Volume:</span>
              <span className="font-semibold text-slate-800">
                {data.usage} HAM
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs text-slate-500">
                {data.sector === "Agriculture"
                  ? "Primarily rice & wheat cultivation"
                  : data.sector === "Domestic"
                  ? "Urban & rural water supply"
                  : "Manufacturing & processing industries"}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    sector,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="font-semibold text-sm drop-shadow-md"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="relative overflow-hidden w-full bg-white/80 p-6 rounded-2xl border my-4 backdrop-blur-md shadow-xl font-sans">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 to-blue-600"></div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-xl text-slate-800 mb-1">
            💧 Sector-wise Water Usage Distribution
          </h3>
          <p className="text-sm text-slate-500">
            Groundwater Extraction by Major Sectors (HAM)
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setChartType("pie")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 ${
              chartType === "pie"
                ? "bg-blue-500 text-white shadow"
                : "text-blue-700 hover:bg-blue-100 border border-blue-200"
            }`}
          >
            🥧 Pie Chart
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 ${
              chartType === "bar"
                ? "bg-green-500 text-white shadow"
                : "text-green-700 hover:bg-green-100 border border-green-200"
            }`}
          >
            📊 Bar Chart
          </button>
        </div>
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "pie" ? (
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomPieLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="percentage"
                stroke="#ffffff"
                strokeWidth={3}
              >
                {sectorData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : (
            <BarChart
              data={sectorData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient
                  id="agricultureGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient
                  id="domesticGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient
                  id="industrialGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="sector"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Usage (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    textAnchor: "middle",
                    fontSize: "12px",
                    fill: "#64748b",
                  },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="percentage"
                radius={[8, 8, 0, 0]}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {sectorData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.sector === "Agriculture"
                        ? "url(#agricultureGradient)"
                        : entry.sector === "Domestic"
                        ? "url(#domesticGradient)"
                        : "url(#industrialGradient)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {sectorData.map((sector, index) => (
          <div
            key={sector.sector}
            className="p-4 bg-gradient-to-br from-white/60 to-white/30 rounded-xl border backdrop-blur-sm"
            style={{ borderColor: sector.color + "40" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-2">{sector.icon}</span>
                <span className="font-semibold text-slate-700 text-sm">
                  {sector.sector}
                </span>
              </div>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: sector.color }}
              ></div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Share:</span>
                <span className="font-bold text-slate-700">
                  {sector.percentage}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Volume:</span>
                <span className="font-semibold text-slate-700">
                  {sector.usage} HAM
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Key Insights */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-sm text-slate-800 mb-2">
          💡 Key Insights:
        </h4>
        <ul className="text-xs text-slate-600 space-y-1">
          <li>
            • Agriculture dominates with nearly 90% of total groundwater usage
          </li>
          <li>
            • Industrial usage remains minimal but concentrated in urban centers
          </li>
          <li>• Domestic consumption shows steady growth with urbanization</li>
        </ul>
      </div>
    </div>
  );
};

export default SectorUsageChart;
