import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CircleCheck, AlertTriangle, Info } from "lucide-react";

type DetailItem = {
  title: string;
  value: string | number;
  unit?: string;
  status?: "positive" | "negative" | "neutral";
};

interface AssessmentCardProps {
  title: string;
  score: number;
  maxScore: number;
  label: string;
  details: DetailItem[];
}

// Simplified version of BlockAssessmentCard for AI components
export const BlockAssessmentCard = (
  props: AssessmentCardProps | { data: any }
) => {
  // Check if we're using the v2 API or the legacy API
  if ("data" in props) {
    // This is the legacy implementation from the original BlockAssessmentCard
    const { data } = props;

    const categoryStyles: Record<string, { badge: string; text: string }> = {
      "Over-Exploited": {
        badge: "bg-red-100 text-red-800",
        text: "text-red-600",
      },
      Critical: {
        badge: "bg-orange-100 text-orange-800",
        text: "text-orange-600",
      },
      Saline: {
        badge: "bg-blue-100 text-blue-800",
        text: "text-blue-600",
      },
      "Semi-Critical": {
        badge: "bg-yellow-100 text-yellow-800",
        text: "text-yellow-600",
      },
      Safe: { badge: "bg-green-100 text-green-800", text: "text-green-600" },
    };

    const styles = categoryStyles[data.category] || {
      badge: "bg-slate-100 text-slate-800",
      text: "text-slate-600",
    };

    return (
      <Card className="w-full bg-white shadow-md">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold">
                {data.block || "N/A"} Block
              </CardTitle>
              <p className="text-sm text-slate-500">
                {data.district || "N/A"}, {data.state || "N/A"}
              </p>
            </div>
            <Badge className={styles.badge}>{data.category || "N/A"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500">Extraction</p>
              <p className="text-lg font-bold">
                {data.extraction?.total || "N/A"}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500">Recharge</p>
              <p className="text-lg font-bold">
                {data.recharge?.total || "N/A"}
              </p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Stage of Extraction
            </h4>
            <p className="text-xl font-bold text-slate-800">
              {data.stage || "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  } else {
    // This is the v2 implementation for AI components
    const { title, score, maxScore, label, details } = props;

    const getLabelStyle = (label: string) => {
      switch (label.toLowerCase()) {
        case "over-exploited":
        case "critical":
          return "bg-red-100 text-red-800";
        case "semi-critical":
          return "bg-orange-100 text-orange-800";
        case "safe":
          return "bg-green-100 text-green-800";
        default:
          return "bg-slate-100 text-slate-800";
      }
    };

    const getStatusIcon = (status?: string) => {
      switch (status) {
        case "positive":
          return <CircleCheck className="h-4 w-4 text-green-500" />;
        case "negative":
          return <AlertTriangle className="h-4 w-4 text-red-500" />;
        default:
          return <Info className="h-4 w-4 text-slate-500" />;
      }
    };

    return (
      <Card className="w-full bg-white shadow-md">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
            <Badge className={getLabelStyle(label)}>{label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-2.5 bg-gray-200 rounded-full">
                <div
                  className="h-2.5 bg-blue-600 rounded-full"
                  style={{ width: `${(score / maxScore) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-semibold ml-2">
              {score}/{maxScore}
            </span>
          </div>

          <div className="space-y-2">
            {details.map((detail, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(detail.status)}
                  <span className="text-sm font-medium">{detail.title}</span>
                </div>
                <span className="text-sm font-semibold">
                  {detail.value}
                  {detail.unit ? ` ${detail.unit}` : ""}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default BlockAssessmentCard;
