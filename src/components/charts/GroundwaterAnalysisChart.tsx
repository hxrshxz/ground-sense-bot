import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const GroundwaterAnalysisChart = ({ data }: { data: any }) => {
  const [seriesActive, setSeriesActive] = useState<{ [k: string]: boolean }>({
    extraction: true,
    recharge: true,
    netBalance: true,
    extractionStage: true,
  });
  const [hoverRegion, setHoverRegion] = useState<string | null>(null);

  // Sample groundwater data structure
  const groundwaterData = data?.graphs?.extraction_vs_recharge || [
    {
      region: "Delhi",
      extraction: 155.8,
      recharge: 120.5,
      netBalance: -35.3,
      riskLevel: "Over-Exploited",
      extractionStage: 129,
    },
    {
      region: "Chaksu",
      extraction: 94.1,
      recharge: 95.2,
      netBalance: 1.1,
      riskLevel: "Critical",
      extractionStage: 99,
    },
    {
      region: "Ludhiana",
      extraction: 192.0,
      recharge: 159.0,
      netBalance: -33.0,
      riskLevel: "Over-Exploited",
      extractionStage: 121,
    },
    {
      region: "Amritsar",
      extraction: 180.0,
      recharge: 177.0,
      netBalance: -3.0,
      riskLevel: "Semi-Critical",
      extractionStage: 102,
    },
    {
      region: "Jalandhar",
      extraction: 171.0,
      recharge: 173.0,
      netBalance: 2.0,
      riskLevel: "Safe",
      extractionStage: 99,
    },
    {
      region: "Bhopal",
      extraction: 148.5,
      recharge: 123.8,
      netBalance: -24.7,
      riskLevel: "Over-Exploited",
      extractionStage: 120,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="p-4 bg-white/95 backdrop-blur-sm border border-blue-200 rounded-xl shadow-lg w-72 font-sans">
          <p className="font-bold text-slate-800 text-lg mb-3">
            {label} District Analysis
          </p>
          <div className="space-y-2">
            {payload.map((pld: any) => (
              <div
                key={pld.dataKey}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: pld.stroke || pld.fill }}
                  ></div>
                  <span className="text-slate-600">{pld.name}:</span>
                </div>
                <span className="font-semibold text-slate-800">
                  {pld.dataKey === "extractionStage"
                    ? `${pld.value}%`
                    : `${pld.value} HAM`}
                </span>
              </div>
            ))}
            {data && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Risk Level:</span>
                  <span
                    className={`font-semibold ${
                      data.riskLevel === "Over-Exploited"
                        ? "text-red-600"
                        : data.riskLevel === "Critical"
                        ? "text-orange-600"
                        : data.riskLevel === "Semi-Critical"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {data.riskLevel}
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-slate-500">Net Balance:</span>
                  <span
                    className={`font-semibold ${
                      data.netBalance < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {data.netBalance > 0 ? "+" : ""}
                    {data.netBalance} HAM
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const regionHoverData = hoverRegion
    ? groundwaterData.find((d: any) => d.region === hoverRegion)
    : null;

  const indicators = useMemo(() => {
    if (!groundwaterData.length)
      return { avgExtraction: 0, avgRecharge: 0, avgStage: 0, deficit: 0 };
    const sum = (k: string) =>
      groundwaterData.reduce((a: any, c: any) => a + (c[k] || 0), 0);
    const avgExtraction = (sum("extraction") / groundwaterData.length).toFixed(
      1
    );
    const avgRecharge = (sum("recharge") / groundwaterData.length).toFixed(1);
    const avgStage = (sum("extractionStage") / groundwaterData.length).toFixed(
      0
    );
    const deficit = sum("netBalance").toFixed(1);
    return { avgExtraction, avgRecharge, avgStage, deficit };
  }, [groundwaterData]);

  const toggleSeries = (key: string) =>
    setSeriesActive((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="relative overflow-hidden w-full bg-white/80 p-6 rounded-2xl border my-4 backdrop-blur-md shadow-xl font-sans">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-600 animate-pulse"></div>
      <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_70%_30%,rgba(56,189,248,0.25),transparent_60%)]" />

      <div>
        <h3 className="font-bold text-xl text-slate-800 mb-1 ml-2">
          🌊 Interactive Groundwater Analysis
        </h3>
        <p className="text-sm text-slate-500 mb-4 ml-2">
          Regional Extraction vs Recharge Analysis (HAM - Hectare Meter)
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-slate-100 rounded-2xl flex-wrap">
        {[
          {
            key: "extraction",
            label: "🏭 Extraction",
            on: "bg-red-500 text-white",
            off: "text-red-700 hover:bg-red-100",
          },
          {
            key: "recharge",
            label: "🌧️ Recharge",
            on: "bg-green-500 text-white",
            off: "text-green-700 hover:bg-green-100",
          },
          {
            key: "netBalance",
            label: "⚖️ Net Balance",
            on: "bg-blue-600 text-white",
            off: "text-blue-700 hover:bg-blue-100",
          },
          {
            key: "extractionStage",
            label: "📊 Stage",
            on: "bg-purple-500 text-white",
            off: "text-purple-700 hover:bg-purple-100",
          },
        ].map((b) => (
          <button
            key={b.key}
            onClick={() => toggleSeries(b.key)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 shadow-sm ${
              seriesActive[b.key] ? b.on + " shadow" : b.off + " opacity-70"
            } relative`}
          >
            {b.label}
            <span
              className={`ml-2 inline-block w-2 h-2 rounded-full ${
                seriesActive[b.key] ? "bg-white" : "bg-slate-400"
              }`}
            ></span>
          </button>
        ))}
        <button
          onClick={() =>
            setSeriesActive({
              extraction: true,
              recharge: true,
              netBalance: true,
              extractionStage: true,
            })
          }
          className="px-3 py-1.5 text-[10px] font-semibold rounded-full bg-slate-800 text-white hover:bg-slate-700"
        >
          Reset
        </button>
      </div>

      <div className="w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={groundwaterData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onMouseMove={(s: any) => {
              if (s?.activePayload?.length)
                setHoverRegion(s.activePayload[0].payload.region);
            }}
            onMouseLeave={() => setHoverRegion(null)}
          >
            <defs>
              <linearGradient id="colorExtraction" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorRecharge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorNetBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient
                id="colorExtractionStage"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
              <filter
                id="glowBlue"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />

            <XAxis
              dataKey="region"
              tickLine={false}
              axisLine={false}
              dy={10}
              tick={{ fill: "#64748b", fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />

            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              label={{
                value: "HAM (Hectare Meter)",
                angle: -90,
                position: "insideLeft",
                style: {
                  textAnchor: "middle",
                  fontSize: "12px",
                  fill: "#64748b",
                },
              }}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              label={{
                value: "Extraction Stage (%)",
                angle: 90,
                position: "insideRight",
                style: {
                  textAnchor: "middle",
                  fontSize: "12px",
                  fill: "#64748b",
                },
              }}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(241, 245, 249, 0.7)" }}
            />

            {seriesActive.extraction && (
              <Bar
                yAxisId="left"
                dataKey="extraction"
                name="Groundwater Extraction"
                fill="url(#colorExtraction)"
                stroke="#ef4444"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
              />
            )}
            {seriesActive.recharge && (
              <Bar
                yAxisId="left"
                dataKey="recharge"
                name="Groundwater Recharge"
                fill="url(#colorRecharge)"
                stroke="#22c55e"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
              />
            )}
            {seriesActive.netBalance && (
              <Line
                yAxisId="left"
                type="natural"
                dataKey="netBalance"
                name="Net Balance"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                strokeDasharray="5 5"
                strokeLinecap="round"
                filter="url(#glowBlue)"
                isAnimationActive
                animationDuration={900}
              />
            )}
            {seriesActive.extractionStage && (
              <Line
                yAxisId="right"
                type="natural"
                dataKey="extractionStage"
                name="Extraction Stage"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 5 }}
                strokeLinecap="round"
                filter="url(#glowBlue)"
                isAnimationActive
                animationDuration={950}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {regionHoverData && (
        <div className="mt-4 p-4 rounded-xl border bg-gradient-to-br from-slate-50 to-white shadow-inner grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="col-span-2 md:col-span-4 text-slate-700 font-semibold flex items-center gap-2">
            <span className="text-sm">Region Focus:</span>
            <span className="text-base text-slate-900">
              {regionHoverData.region}
            </span>
          </div>
          <HoverMetric
            label="Extraction"
            value={regionHoverData.extraction + " HAM"}
            color="text-red-600"
          />
          <HoverMetric
            label="Recharge"
            value={regionHoverData.recharge + " HAM"}
            color="text-green-600"
          />
          <HoverMetric
            label="Net Balance"
            value={
              (regionHoverData.netBalance > 0 ? "+" : "") +
              regionHoverData.netBalance +
              " HAM"
            }
            color={
              regionHoverData.netBalance < 0 ? "text-red-600" : "text-green-600"
            }
          />
          <HoverMetric
            label="Stage"
            value={regionHoverData.extractionStage + "%"}
            color="text-purple-600"
          />
          <div className="col-span-2 md:col-span-4 text-[10px] text-slate-500 border-t pt-2 flex flex-wrap gap-4">
            <span>
              Risk:{" "}
              <strong
                className={
                  regionHoverData.riskLevel === "Over-Exploited"
                    ? "text-red-600"
                    : regionHoverData.riskLevel === "Critical"
                    ? "text-orange-600"
                    : regionHoverData.riskLevel === "Semi-Critical"
                    ? "text-yellow-600"
                    : "text-green-600"
                }
              >
                {regionHoverData.riskLevel}
              </strong>
            </span>
            <span>
              Status:{" "}
              <strong
                className={
                  regionHoverData.extractionStage > 150
                    ? "text-red-600"
                    : regionHoverData.extractionStage > 120
                    ? "text-orange-600"
                    : regionHoverData.extractionStage > 100
                    ? "text-yellow-600"
                    : "text-green-600"
                }
              >
                {regionHoverData.extractionStage > 150
                  ? "Critical"
                  : regionHoverData.extractionStage > 120
                  ? "High"
                  : regionHoverData.extractionStage > 100
                  ? "Elevated"
                  : "Moderate"}
              </strong>
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <IndicatorCard
          title="Avg Extraction"
          value={indicators.avgExtraction + " HAM"}
          color="red"
          icon="🏭"
        />
        <IndicatorCard
          title="Avg Recharge"
          value={indicators.avgRecharge + " HAM"}
          color="green"
          icon="🌧️"
        />
        <IndicatorCard
          title="Avg Stage"
          value={indicators.avgStage + "%"}
          color="purple"
          icon="📊"
        />
        <IndicatorCard
          title="Total Net"
          value={
            (parseFloat(indicators.deficit) > 0 ? "+" : "") +
            indicators.deficit +
            " HAM"
          }
          color={parseFloat(indicators.deficit) < 0 ? "red" : "green"}
          icon="⚖️"
        />
      </div>
    </div>
  );
};

const HoverMetric = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] uppercase tracking-wide text-slate-500">
      {label}
    </span>
    <span className={`text-xs font-semibold ${color}`}>{value}</span>
  </div>
);

interface IndicatorProps {
  title: string;
  value: string;
  color: string;
  icon: string;
}
const IndicatorCard = ({ title, value, color, icon }: IndicatorProps) => {
  const palette: Record<string, string> = {
    red: "from-red-50 to-red-100 border-red-200 text-red-800",
    green: "from-green-50 to-green-100 border-green-200 text-green-800",
    purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-800",
    blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-800",
  };
  return (
    <div
      className={`p-3 bg-gradient-to-br rounded-lg border ${
        palette[color] ||
        "from-slate-50 to-slate-100 border-slate-200 text-slate-700"
      } relative overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold tracking-wide">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-sm font-bold">{value}</div>
      <div className="absolute inset-0 pointer-events-none opacity-15 bg-[radial-gradient(circle_at_70%_30%,white,transparent_60%)]" />
    </div>
  );
};

export default GroundwaterAnalysisChart;
