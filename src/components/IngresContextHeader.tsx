import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export type ExtractionStage = "Safe" | "Semi-Critical" | "Critical" | "Over-Exploited";

interface IngresContextHeaderProps {
  title: string;
  subtitle: string;
  problemId?: string | number; // Problem Statement ID reference
  stage?: ExtractionStage;
  moduleTag?: string; // e.g. Crop Module / Recharge Module / Rainfall Module
  accent?: "emerald" | "sky" | "indigo" | "slate";
  extraBadges?: React.ReactNode;
}

const stageColor: Record<ExtractionStage, string> = {
  Safe: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Semi-Critical": "bg-amber-50 text-amber-700 border-amber-200",
  Critical: "bg-orange-50 text-orange-700 border-orange-200",
  "Over-Exploited": "bg-rose-50 text-rose-700 border-rose-200",
};

const accentGradient: Record<NonNullable<IngresContextHeaderProps["accent"]>, string> = {
  emerald: "from-emerald-500 via-lime-500 to-green-600",
  sky: "from-sky-500 via-blue-500 to-indigo-600",
  indigo: "from-indigo-500 via-violet-500 to-purple-600",
  slate: "from-slate-500 via-slate-400 to-slate-600",
};

export const IngresContextHeader: React.FC<IngresContextHeaderProps> = ({
  title,
  subtitle,
  problemId = "25066",
  stage,
  moduleTag,
  accent = "slate",
  extraBadges,
}) => {
  return (
    <CardHeader className="pb-4 relative">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentGradient[accent]}`} />
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${accentGradient[accent]} flex items-center justify-center text-white font-semibold text-sm shadow-sm`}>AI</div>
          </motion.div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">
              {title}
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
              {subtitle}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="outline" className="bg-white/70 backdrop-blur-sm border-slate-200 text-slate-600">
                Problem ID: {problemId}
              </Badge>
              {moduleTag && (
                <Badge variant="outline" className="border-dashed border-slate-300 text-slate-600">
                  {moduleTag}
                </Badge>
              )}
              {stage && (
                <Badge variant="outline" className={stageColor[stage]}>
                  {stage}
                </Badge>
              )}
              {extraBadges}
            </div>
          </div>
        </div>
      </div>
    </CardHeader>
  );
};

export default IngresContextHeader;
