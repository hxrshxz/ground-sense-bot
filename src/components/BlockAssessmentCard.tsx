// /components/BlockAssessmentCard.js

"use client";
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    TrendingUp, ArrowDown, ArrowUp, Lightbulb, CloudRain, Satellite
} from "lucide-react";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';

// --- Interactive Chart Sub-Component ---
const TrendChart = ({ trendData }: { trendData: number[] }) => {
  const chartData = trendData.map((value, index) => ({
    year: (2025 - 4) + index,
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
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
        <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: '#d1d5db' }} tick={{ fill: '#6b7280', fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="Extraction Stage (%)" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};


// --- Main Block Assessment Card Component ---
export const BlockAssessmentCard = ({ data }: { data: any }) => {
  const categoryStyles: Record<string, { badge: string; text: string }> = {
    "Over-Exploited": { badge: "bg-red-100 text-red-800", text: "text-red-600" },
    "Critical": { badge: "bg-orange-100 text-orange-800", text: "text-orange-600" },
  };
  const styles = categoryStyles[data.category] || { badge: "bg-slate-100 text-slate-800", text: "text-slate-600" };

  return (
    <Card className="w-full max-w-lg bg-white/80 backdrop-blur-sm border-slate-200/80 shadow-lg text-slate-900">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-2xl font-bold">{data.block} Block</p>
            <p className="text-sm text-slate-500">{data.district}, {data.state}</p>
          </div>
          <Badge className={styles.badge}>{data.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
            <p className="text-xs font-semibold text-slate-500">Recharge (MCM)</p>
            <p className="text-lg font-bold text-sky-800 flex items-center justify-center gap-1"><ArrowDown className="h-4 w-4 text-green-500"/> {data.recharge}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xs font-semibold text-slate-500">Extraction (MCM)</p>
            <p className="text-lg font-bold text-red-800 flex items-center justify-center gap-1"><ArrowUp className="h-4 w-4 text-red-500"/> {data.extraction}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-xs font-semibold text-slate-500">Extraction Stage</p>
            <p className={`text-lg font-bold ${styles.text}`}>{data.stage}</p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2"><TrendingUp className="h-4 w-4"/> 5-Year Trend</h4>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <TrendChart trendData={data.trend} />
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
           <h4 className="text-sm font-semibold text-slate-700">Enriched Data</h4>
           <p className="text-xs text-slate-600 flex items-center gap-2"><CloudRain className="h-4 w-4 text-sky-500"/>IMD Data: Below-average rainfall recorded.</p>
           <p className="text-xs text-slate-600 flex items-center gap-2"><Satellite className="h-4 w-4 text-green-500"/>ISRO Data: Increase in water-intensive crops.</p>
        </div>
        {data.category === "Over-Exploited" && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-2">
                <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2"><Lightbulb className="h-4 w-4"/> AI Advisor</h4>
                <p className="text-xs text-slate-700"><b>Forecast:</b> Groundwater level likely to decline.</p>
                <p className="text-xs text-slate-700"><b>Recommendation:</b> Promote micro-irrigation schemes.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
};