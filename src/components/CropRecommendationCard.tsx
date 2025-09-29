import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Droplets, Zap } from "lucide-react";

interface CropScenario {
  crop: string;
  waterUse: number; // m3/ha (relative)
  savingVsPaddy: number; // %
  grossMargin: number; // Rs/ha (relative index)
  adoptionEase: number; // 1-5
}

interface Props {
  region?: string;
  baselineCrop?: string;
  scenarios?: CropScenario[];
}

const defaultScenarios: CropScenario[] = [
  {
    crop: "Paddy (Baseline)",
    waterUse: 100,
    savingVsPaddy: 0,
    grossMargin: 100,
    adoptionEase: 4,
  },
  {
    crop: "Maize",
    waterUse: 58,
    savingVsPaddy: 42,
    grossMargin: 92,
    adoptionEase: 3,
  },
  {
    crop: "Pulses",
    waterUse: 46,
    savingVsPaddy: 54,
    grossMargin: 78,
    adoptionEase: 3,
  },
  {
    crop: "Cotton (Short)",
    waterUse: 64,
    savingVsPaddy: 36,
    grossMargin: 110,
    adoptionEase: 2,
  },
  {
    crop: "Oilseeds",
    waterUse: 70,
    savingVsPaddy: 30,
    grossMargin: 95,
    adoptionEase: 3,
  },
];

export const CropRecommendationCard: React.FC<Props> = ({
  region = "Central Punjab",
  baselineCrop = "Paddy",
  scenarios = defaultScenarios,
}) => {
  const maxMargin = Math.max(...scenarios.map((s) => s.grossMargin));
  return (
    <Card className="w-full max-w-3xl bg-white/80 backdrop-blur-sm border-slate-200 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl font-semibold">Crop Switch Impact</p>
            <p className="text-xs text-slate-500">
              {region} · Baseline: {baselineCrop}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700 border-emerald-200"
          >
            Water Saving Focus
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-12 gap-2 text-[11px] font-medium text-slate-600">
          <div className="col-span-4">Crop</div>
          <div className="col-span-4">Relative Water Use</div>
          <div className="col-span-2 text-right">Saving%</div>
          <div className="col-span-2 text-right">Margin</div>
        </div>
        <div className="space-y-2">
          {scenarios.map((s) => {
            const waterColor =
              s.savingVsPaddy === 0
                ? "bg-red-400"
                : s.savingVsPaddy > 45
                ? "bg-emerald-500"
                : s.savingVsPaddy > 35
                ? "bg-lime-500"
                : "bg-amber-400";
            return (
              <div
                key={s.crop}
                className="grid grid-cols-12 gap-2 items-center text-xs"
              >
                <div className="col-span-4 flex items-center gap-1 font-medium text-slate-700">
                  {s.crop.includes("Paddy") ? (
                    <Droplets className="h-3 w-3 text-sky-500" />
                  ) : (
                    <Leaf className="h-3 w-3 text-emerald-600" />
                  )}{" "}
                  {s.crop}
                </div>
                <div className="col-span-4">
                  <div className="h-3 w-full bg-slate-100 rounded relative overflow-hidden">
                    <div
                      className={`h-full ${waterColor} transition-all`}
                      style={{ width: `${s.waterUse}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white drop-shadow-sm">
                      {s.waterUse}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 text-right font-semibold tabular-nums text-slate-700">
                  {s.savingVsPaddy}%
                </div>
                <div className="col-span-2 text-right">
                  <div className="h-3 w-full bg-slate-100 rounded relative overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${(s.grossMargin / maxMargin) * 100}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white">
                      {Math.round((s.grossMargin / maxMargin) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge className="bg-emerald-500 text-white flex items-center gap-1">
            <Leaf className="h-3 w-3" /> Higher saving
          </Badge>
          <Badge className="bg-indigo-500 text-white flex items-center gap-1">
            <Zap className="h-3 w-3" /> Margin index
          </Badge>
          <Badge variant="outline" className="border-dashed">
            Illustrative blend
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default CropRecommendationCard;
