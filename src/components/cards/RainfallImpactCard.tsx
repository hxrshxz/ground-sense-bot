import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CloudRain, Droplets, MapPin, Download, PieChart } from "lucide-react";

const rainfallData = {
  blocks: [
    {
      name: "Chaksu",
      total: 95.2,
      components: [
        { label: "Rainfall", value: 75.2, percentage: 79, color: "#3b82f6" },
        {
          label: "Natural Seepage",
          value: 12.5,
          percentage: 13,
          color: "#0ea5e9",
        },
        { label: "Canal/River", value: 4.8, percentage: 5, color: "#6366f1" },
        {
          label: "Artificial Recharge",
          value: 2.7,
          percentage: 3,
          color: "#10b981",
        },
      ],
    },
    {
      name: "Delhi",
      total: 120.5,
      components: [
        { label: "Rainfall", value: 90.5, percentage: 75, color: "#3b82f6" },
        {
          label: "Natural Seepage",
          value: 15.4,
          percentage: 13,
          color: "#0ea5e9",
        },
        { label: "Canal/River", value: 9.4, percentage: 8, color: "#6366f1" },
        {
          label: "Artificial Recharge",
          value: 5.2,
          percentage: 4,
          color: "#10b981",
        },
      ],
    },
  ],
};

const RainfallImpactCard: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="w-full overflow-hidden bg-white shadow-lg">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-600"></div>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100/70">
                <CloudRain className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">
                  Rainfall Impact on Recharge
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Source contribution analysis by assessment block
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              75-79% Dependency
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Block Comparison */}
          {rainfallData.blocks.map((block, blockIndex) => (
            <div key={block.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  {block.name} Block
                </h4>
                <div className="text-sm font-medium text-slate-600">
                  Total: {block.total} units
                </div>
              </div>

              {/* Stacked Bar */}
              <div className="relative">
                <div className="flex w-full h-10 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl overflow-hidden shadow-inner border border-slate-200/50">
                  {block.components.map((component, index) => (
                    <motion.div
                      key={component.label}
                      initial={{ width: 0, opacity: 0 }}
                      animate={{
                        width: `${component.percentage}%`,
                        opacity: 1,
                      }}
                      transition={{
                        duration: 1.5,
                        delay: blockIndex * 0.4 + index * 0.15,
                        ease: "easeOut",
                      }}
                      className="h-full relative overflow-hidden"
                      style={{
                        background:
                          component.label === "Rainfall"
                            ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)"
                            : component.label === "Natural Seepage"
                            ? "linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)"
                            : component.label === "Canal/River"
                            ? "linear-gradient(135deg, #6366f1 0%, #5b21b6 50%, #4c1d95 100%)"
                            : "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
                      }}
                      whileHover={{
                        scale: 1.02,
                        zIndex: 10,
                        transition: { duration: 0.2 },
                      }}
                    >
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{
                          animation: `shimmer 3s ease-in-out ${
                            index * 0.5
                          }s infinite`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                      {component.percentage > 8 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            delay: blockIndex * 0.4 + index * 0.15 + 0.5,
                          }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <span className="text-xs font-bold text-white drop-shadow-lg">
                            {component.percentage}%
                          </span>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {block.components.map((component) => (
                  <div
                    key={component.label}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: component.color }}
                    />
                    <span className="text-slate-600">
                      {component.label}: {component.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Rainfall Dependency Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-700">79%</div>
              <div className="text-xs text-blue-600">Chaksu Dependency</div>
            </div>
            <div className="text-center p-3 bg-cyan-50 rounded-lg">
              <div className="text-lg font-bold text-cyan-700">75%</div>
              <div className="text-xs text-cyan-600">Delhi Dependency</div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 2.0, duration: 0.5, ease: "backOut" }}
              whileHover={{ scale: 1.05, y: -3 }}
              className="text-center p-3 bg-gradient-to-br from-red-50 to-rose-100 rounded-xl shadow-lg border border-red-200/50"
            >
              <div className="text-lg font-bold text-red-700 mb-1">High</div>
              <div className="text-xs text-red-600 font-medium">
                Climate Risk
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.5, ease: "backOut" }}
              whileHover={{ scale: 1.05, y: -3 }}
              className="text-center p-3 bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl shadow-lg border border-amber-200/50"
            >
              <div className="text-lg font-bold text-amber-700 mb-1">3-5%</div>
              <div className="text-xs text-amber-600 font-medium">
                Artificial Share
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 2.4, duration: 0.5, ease: "backOut" }}
              whileHover={{ scale: 1.05, y: -3 }}
              className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-lg border border-green-200/50"
            >
              <div className="text-lg font-bold text-green-700 mb-1">Large</div>
              <div className="text-xs text-green-600 font-medium">
                Enhancement Potential
              </div>
            </motion.div>
          </div>

          {/* AI Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Rainfall dominance:</strong> 75-79% recharge dependency on
              rainfall makes both blocks vulnerable to climate variability. Low
              artificial recharge share (&lt;5%) indicates significant
              opportunity for managed aquifer recharge infrastructure.
            </p>
          </div>

          {/* Follow-up Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-xs">
              Show monsoon patterns
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Artificial recharge potential
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

export default RainfallImpactCard;
