import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, TrendingUp, Layers, Droplets } from "lucide-react";

interface Measure {
  name: string;
  addedRecharge: number; // ham (relative index scaled)
  feasibility: number; // 1-5
  leadYears: number;
  priority: "High" | "Med" | "Low";
}

interface Props {
  region?: string;
  baselineRecharge?: number;
  measures?: Measure[];
}

const defaultMeasures: Measure[] = [
  {
    name: "Canal Lining Repair",
    addedRecharge: 18,
    feasibility: 4,
    leadYears: 2,
    priority: "High",
  },
  {
    name: "Recharge Shafts (Public)",
    addedRecharge: 22,
    feasibility: 3,
    leadYears: 3,
    priority: "High",
  },
  {
    name: "Check Dam Desilting",
    addedRecharge: 11,
    feasibility: 5,
    leadYears: 1,
    priority: "Med",
  },
  {
    name: "Managed Aquifer Injection",
    addedRecharge: 15,
    feasibility: 2,
    leadYears: 4,
    priority: "Med",
  },
  {
    name: "Stormwater Harvest Parks",
    addedRecharge: 9,
    feasibility: 3,
    leadYears: 3,
    priority: "Low",
  },
];

export const PolicyRechargeCard: React.FC<Props> = ({
  region = "Target Over-Exploited Blocks",
  baselineRecharge = 100,
  measures = defaultMeasures,
}) => {
  const maxRecharge = Math.max(...measures.map((m) => m.addedRecharge));
  return (
    <Card className="w-full max-w-3xl bg-white/80 backdrop-blur-sm border-slate-200 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl font-semibold">Recharge Policy Stack</p>
            <p className="text-xs text-slate-500">
              {region} · Baseline index {baselineRecharge}
            </p>
          </div>
          <Badge className="bg-sky-100 text-sky-700 border-sky-200 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Action Mix
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-12 gap-2 text-[11px] font-medium text-slate-600">
          <div className="col-span-5">Measure</div>
          <div className="col-span-4">Added Recharge</div>
          <div className="col-span-1 text-right">Feas.</div>
          <div className="col-span-2 text-right">Lead (y)</div>
        </div>
        <div className="space-y-2">
          {measures.map((m) => {
            const priorityColor =
              m.priority === "High"
                ? "bg-emerald-500"
                : m.priority === "Med"
                ? "bg-amber-500"
                : "bg-slate-400";
            return (
              <div
                key={m.name}
                className="grid grid-cols-12 gap-2 items-center text-xs"
              >
                <div className="col-span-5 flex items-center gap-1 font-medium text-slate-700">
                  <Layers className="h-3 w-3 text-slate-500" /> {m.name}
                </div>
                <div className="col-span-4">
                  <div className="h-3 w-full bg-slate-100 rounded relative overflow-hidden">
                    <div
                      className={`h-full ${priorityColor}`}
                      style={{
                        width: `${(m.addedRecharge / maxRecharge) * 100}%`,
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white drop-shadow-sm">
                      {m.addedRecharge}
                    </span>
                  </div>
                </div>
                <div className="col-span-1 text-right font-semibold tabular-nums">
                  {m.feasibility}
                </div>
                <div className="col-span-2 text-right font-semibold tabular-nums">
                  {m.leadYears}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge className="bg-emerald-500 text-white">High Impact</Badge>
          <Badge className="bg-amber-500 text-white">Medium</Badge>
          <Badge className="bg-slate-400 text-white">Lower</Badge>
          <Badge
            variant="outline"
            className="border-dashed flex items-center gap-1"
          >
            <TrendingUp className="h-3 w-3" /> Potential Index
          </Badge>
          <Badge
            variant="outline"
            className="border-dashed flex items-center gap-1"
          >
            <Droplets className="h-3 w-3" /> Recharge Units
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default PolicyRechargeCard;
