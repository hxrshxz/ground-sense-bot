import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudRain, Droplets, Waves, AlertTriangle } from "lucide-react";

interface SourceSplit {
  label: string;
  value: number;
  color: string;
}
interface Props {
  region?: string;
  season?: string;
  sources?: SourceSplit[];
  stressIndex?: number;
}

const defaultSources: SourceSplit[] = [
  { label: "Direct Rainfall Infiltration", value: 34, color: "bg-sky-500" },
  { label: "Canal Seepage", value: 22, color: "bg-indigo-500" },
  { label: "Field Percolation", value: 28, color: "bg-emerald-500" },
  { label: "Return Flow (Irrigation)", value: 11, color: "bg-amber-500" },
  { label: "Urban Runoff Capture", value: 5, color: "bg-pink-500" },
];

export const RainfallImpactCard: React.FC<Props> = ({
  region = "Punjab Core",
  season = "Monsoon 2024",
  sources = defaultSources,
  stressIndex = 208,
}) => {
  const total = sources.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <Card className="w-full max-w-3xl bg-white/80 backdrop-blur-sm border-slate-200 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl font-semibold">
              Rainfall → Recharge Pathways
            </p>
            <p className="text-xs text-slate-500">
              {region} · {season}
            </p>
          </div>
          <Badge className="flex items-center gap-1 bg-sky-100 text-sky-700 border-sky-200">
            <CloudRain className="h-3 w-3" /> Seasonal Pulse
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {sources.map((s) => (
            <div key={s.label} className="text-xs">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-slate-700">{s.label}</span>
                <span className="font-semibold tabular-nums text-slate-700">
                  {s.value}%
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded overflow-hidden">
                <div
                  className={`h-full ${s.color} transition-all`}
                  style={{ width: `${(s.value / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-md bg-sky-50 border border-sky-100">
            <p className="text-[11px] font-medium text-sky-700 mb-1 flex items-center gap-1">
              <Droplets className="h-3 w-3" /> Recharge Share
            </p>
            <p className="text-xs text-slate-600 leading-snug">
              Top two pathways deliver {sources[0].value + sources[2].value}% of
              monsoon-driven recharge volume.
            </p>
          </div>
          <div className="p-3 rounded-md bg-amber-50 border border-amber-100">
            <p className="text-[11px] font-medium text-amber-700 mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Stress Index
            </p>
            <p className="text-xs text-slate-600 leading-snug">
              Extraction at {stressIndex}% of annual recharge potential —
              indicates severe overdraft sensitivity.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge
            variant="outline"
            className="border-dashed flex items-center gap-1"
          >
            <Waves className="h-3 w-3" /> Pathway Mix
          </Badge>
          <Badge className="bg-rose-500 text-white">Overdraft Risk</Badge>
          <Badge variant="outline" className="border-dashed">
            Illustrative
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default RainfallImpactCard;
