// /components/BlockAssessmentCard.js

"use client";
import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  ArrowDown,
  ArrowUp,
  Lightbulb,
  CloudRain,
  Satellite,
  ChevronDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  CartesianGrid,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { DownloadReport } from "./DownloadReport";

// --- Interactive Chart Sub-Component ---
const TrendChart = ({ trendData }: { trendData: number[] }) => {
  if (!Array.isArray(trendData)) {
    return (
      <div className="text-center text-xs text-slate-500 py-4">
        Trend data not available.
      </div>
    );
  }

  const chartData = trendData.map((value, index) => ({
    year: 2021 + index,
    "Extraction Stage (%)": value,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg">
          <p className="font-bold text-slate-700">{`Year: ${label}`}</p>
          <p className="text-sm text-sky-600">{`${payload[0].name}: ${payload[0].value}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e0e0e0"
          vertical={false}
        />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={{ stroke: "#d1d5db" }}
          tick={{ fill: "#6b7280", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#6b7280", fontSize: 12 }}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="Extraction Stage (%)"
          stroke="#0ea5e9"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorTrend)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// --- Collapsible Section Component ---
const DataAccordion = ({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children: React.ReactNode[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full p-3 text-left"
      >
        <div className="flex items-center gap-2">
          {children[0]}
          <span className="font-semibold text-slate-700 text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sky-600 text-sm">{value}</span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 border-t border-slate-200">{children[1]}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Component ---
export const BlockAssessmentCard = ({ data }: { data: any }) => {
  const categoryStyles: Record<string, { badge: string; text: string }> = {
    "Over-Exploited": {
      badge: "bg-red-100 text-red-800",
      text: "text-red-600",
    },
    Critical: {
      badge: "bg-orange-100 text-orange-800",
      text: "text-orange-600",
    },
  };
  const styles = categoryStyles[data.category] || {
    badge: "bg-slate-100 text-slate-800",
    text: "text-slate-600",
  };

  const formatNumber = (num: number | undefined) =>
    num?.toLocaleString("en-IN") ?? "N/A";

  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <Card
      ref={cardRef}
      className="w-full max-w-md md:max-w-4xl lg:max-w-6xl bg-white/80 backdrop-blur-sm border-slate-200/80 shadow-lg text-slate-900"
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-2xl font-bold">{data.block || "N/A"} Block</p>
            <p className="text-sm text-slate-500">
              {data.district || "N/A"}, {data.state || "N/A"}
            </p>
          </div>
          <Badge className={styles.badge}>{data.category || "N/A"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DataAccordion
          title="Groundwater Recharge"
          value={formatNumber(data.recharge?.total)}
        >
          <ArrowDown className="h-4 w-4 text-green-500" />
          <table className="w-full text-xs text-slate-600">
            <thead>
              <tr className="text-left">
                <th className="pb-1">Source</th>
                <th className="text-right pb-1">Value (ham)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="py-1">Rainfall</td>
                <td className="text-right py-1 font-medium">
                  {formatNumber(data.recharge?.rainfall)}
                </td>
              </tr>
              <tr className="border-t">
                <td className="py-1">Canal</td>
                <td className="text-right py-1 font-medium">
                  {formatNumber(data.recharge?.canal)}
                </td>
              </tr>
            </tbody>
          </table>
        </DataAccordion>

        <DataAccordion
          title="Groundwater Extraction"
          value={formatNumber(data.extraction?.total)}
        >
          <ArrowUp className="h-4 w-4 text-red-500" />
          <table className="w-full text-xs text-slate-600">
            <thead>
              <tr className="text-left">
                <th className="pb-1">Use</th>
                <th className="text-right pb-1">Value (ham)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="py-1">Irrigation</td>
                <td className="text-right py-1 font-medium">
                  {formatNumber(data.extraction?.irrigation)}
                </td>
              </tr>
              <tr className="border-t">
                <td className="py-1">Domestic</td>
                <td className="text-right py-1 font-medium">
                  {formatNumber(data.extraction?.domestic)}
                </td>
              </tr>
              <tr className="border-t">
                <td className="py-1">Industry</td>
                <td className="text-right py-1 font-medium">
                  {formatNumber(data.extraction?.industry)}
                </td>
              </tr>
            </tbody>
          </table>
        </DataAccordion>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> 5-Year Trend (Extraction Stage)
          </h4>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <TrendChart trendData={data.trend} />
          </div>
        </div>

        {data.category === "Over-Exploited" && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-2">
            <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> AI Advisor
            </h4>
            <p className="text-xs text-slate-700">
              <b>Forecast:</b> Groundwater level likely to decline due to high
              extraction rates.
            </p>
            <p className="text-xs text-slate-700">
              <b>Recommendation:</b> Promote micro-irrigation and crop
              diversification to reduce water usage.
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <DownloadReport
            targetRef={cardRef}
            fileName={`${
              data.block?.toLowerCase().replace(/\s+/g, "-") || "block"
            }-assessment`}
          />
        </div>
      </CardContent>
    </Card>
  );
};
