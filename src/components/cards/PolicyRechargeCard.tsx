import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, Clock, Users, Download, TrendingUp } from "lucide-react";

const policyData = {
  interventions: [
    {
      name: "Mandatory Rainwater Harvesting",
      impact: 85,
      phase: "2025-2026",
      color: "#3b82f6",
    },
    {
      name: "Volumetric Pricing & Metering",
      impact: 78,
      phase: "2026-2027",
      color: "#6366f1",
    },
    {
      name: "Managed Aquifer Recharge",
      impact: 72,
      phase: "2027-2028",
      color: "#8b5cf6",
    },
    {
      name: "Crop Incentive Reform",
      impact: 68,
      phase: "2028-2029",
      color: "#a855f7",
    },
    {
      name: "Digital Monitoring System",
      impact: 60,
      phase: "2025-2026",
      color: "#c084fc",
    },
  ],
  timeline: [
    { year: "2025-26", focus: "Foundation & Regulation", progress: 100 },
    { year: "2027-28", focus: "Scaling & Enforcement", progress: 75 },
    { year: "2029-30", focus: "Optimization & Incentives", progress: 45 },
  ],
};

const PolicyRechargeCard: React.FC = () => {
  const maxImpact = Math.max(...policyData.interventions.map((i) => i.impact));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="w-full overflow-hidden bg-white shadow-lg">
        <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100/70">
                <Scale className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">
                  Policy Impact on Recharge
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Regulatory interventions & implementation timeline
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200"
            >
              5-Year Framework
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Policy Impact Ladder */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Estimated Impact Score
            </h4>
            <div className="space-y-3">
              {policyData.interventions.map((policy, index) => (
                <div key={policy.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {policy.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {policy.phase}
                      </Badge>
                      <span className="font-bold text-slate-800">
                        {policy.impact}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gradient-to-r from-slate-100 to-slate-200 rounded-full h-4 relative overflow-hidden shadow-inner border border-slate-200/50">
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{
                        width: `${(policy.impact / maxImpact) * 100}%`,
                        opacity: 1,
                      }}
                      transition={{
                        duration: 1.5,
                        delay: index * 0.15,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full shadow-lg relative overflow-hidden"
                      style={{
                        background:
                          policy.impact > 75
                            ? "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)"
                            : policy.impact > 50
                            ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)"
                            : "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
                      }}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2 },
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-pulse" />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Implementation Timeline */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-500" />
              Implementation Phases
            </h4>
            <div className="space-y-3">
              {policyData.timeline.map((phase, index) => (
                <div key={phase.year} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-slate-600">
                    {phase.year}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700">
                        {phase.focus}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {phase.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gradient-to-r from-slate-100 to-slate-200 rounded-full h-3 shadow-inner border border-slate-200/50">
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: `${phase.progress}%`, opacity: 1 }}
                        transition={{
                          duration: 1.5,
                          delay: 0.5 + index * 0.25,
                          ease: "easeOut",
                        }}
                        className="h-full rounded-full shadow-lg relative overflow-hidden"
                        style={{
                          background:
                            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
                        }}
                        whileHover={{
                          scale: 1.02,
                          transition: { duration: 0.2 },
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stakeholder Engagement */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <Users className="h-4 w-4 mx-auto text-blue-600 mb-1" />
              <div className="text-xs font-medium text-blue-700">Govt</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <Users className="h-4 w-4 mx-auto text-green-600 mb-1" />
              <div className="text-xs font-medium text-green-700">Farmers</div>
            </div>
            <div className="text-center p-2 bg-amber-50 rounded-lg">
              <Users className="h-4 w-4 mx-auto text-amber-600 mb-1" />
              <div className="text-xs font-medium text-amber-700">
                Urban Dev
              </div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded-lg">
              <Users className="h-4 w-4 mx-auto text-purple-600 mb-1" />
              <div className="text-xs font-medium text-purple-700">
                Water Auth
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>High-impact early interventions:</strong> Enforce RWH +
              digital metering (2025-26); scale MAR + volumetric pricing
              (2027-28) for structural recharge gains up to 47% improvement.
            </p>
          </div>

          {/* Follow-up Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-xs">
              Show regional variations
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Implementation challenges
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PolicyRechargeCard;
