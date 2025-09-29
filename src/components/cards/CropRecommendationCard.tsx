import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Droplets, Leaf, TrendingDown, Download } from "lucide-react";

const cropData = {
  location: "Water-Scarce Regions",
  baselineCrops: [
    { name: "Rice", water: 1400, color: "#ef4444" },
    { name: "Wheat", water: 950, color: "#f97316" },
  ],
  recommended: [
    { name: "Pearl Millet", water: 520, savingPct: 63, color: "#22c55e" },
    { name: "Chickpea", water: 480, savingPct: 66, color: "#10b981" },
    { name: "Sorghum", water: 560, savingPct: 60, color: "#16a34a" },
  ],
};

const CropRecommendationCard: React.FC = () => {
  const maxWater = Math.max(...cropData.baselineCrops.map((c) => c.water));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="w-full overflow-hidden bg-white shadow-lg">
        <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600"></div>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100/70">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">
                  Water-Efficient Crops
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Recommended for water-scarce regions
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              60-70% Water Savings
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Baseline */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              Current High-Water Crops
            </h4>
            <div className="space-y-2">
              {cropData.baselineCrops.map((crop) => (
                <div key={crop.name} className="flex items-center gap-3">
                  <div className="w-20 text-sm font-medium text-slate-600">
                    {crop.name}
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full h-8 relative overflow-hidden shadow-inner border border-slate-200/50">
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{
                        width: `${(crop.water / maxWater) * 100}%`,
                        opacity: 1,
                      }}
                      transition={{
                        duration: 1.5,
                        delay: 0.3,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full relative overflow-hidden shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${crop.color} 0%, ${crop.color}dd 50%, ${crop.color}bb 100%)`,
                      }}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2 },
                      }}
                    >
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{
                          animation: `shimmer 3s ease-in-out infinite`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="absolute inset-0 flex items-center justify-end pr-3"
                    >
                      <span className="text-sm font-bold text-white drop-shadow-lg">
                        {crop.water}mm
                      </span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Crops */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-500" />
              Water-Efficient Alternatives
            </h4>
            <div className="space-y-2">
              {cropData.recommended.map((crop) => (
                <div key={crop.name} className="flex items-center gap-3">
                  <div className="w-20 text-sm font-medium text-slate-600">
                    {crop.name}
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full h-8 relative overflow-hidden shadow-inner border border-slate-200/50">
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{
                        width: `${(crop.water / maxWater) * 100}%`,
                        opacity: 1,
                      }}
                      transition={{
                        duration: 1.8,
                        delay: 0.5,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full relative overflow-hidden shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${crop.color} 0%, ${crop.color}dd 50%, ${crop.color}bb 100%)`,
                      }}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2 },
                      }}
                    >
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{
                          animation: `shimmer 3s ease-in-out 0.5s infinite`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.0 }}
                      className="absolute inset-0 flex items-center justify-between px-3"
                    >
                      <span className="text-sm font-bold text-white drop-shadow-lg">
                        {crop.water}mm
                      </span>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 1.2,
                          type: "spring",
                          stiffness: 200,
                        }}
                      >
                        <Badge
                          variant="secondary"
                          className="text-xs bg-white/30 text-white border-0 font-bold backdrop-blur-sm"
                        >
                          -{crop.savingPct}%
                        </Badge>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Benefits */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5, ease: "backOut" }}
              whileHover={{ scale: 1.05, y: -3 }}
              className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-lg border border-green-200/50"
            >
              <div className="text-xl font-bold text-green-700 mb-1">
                60-70%
              </div>
              <div className="text-xs text-green-600 font-medium">
                Water Savings
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.5, ease: "backOut" }}
              whileHover={{ scale: 1.05, y: -3 }}
              className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl shadow-lg border border-blue-200/50"
            >
              <div className="text-xl font-bold text-blue-700 mb-1">High</div>
              <div className="text-xs text-blue-600 font-medium">
                Drought Tolerance
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1.9, duration: 0.5, ease: "backOut" }}
              whileHover={{ scale: 1.05, y: -3 }}
              className="text-center p-4 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl shadow-lg border border-amber-200/50"
            >
              <div className="text-xl font-bold text-amber-700 mb-1">Good</div>
              <div className="text-xs text-amber-600 font-medium">
                Market Price
              </div>
            </motion.div>
          </div>

          {/* AI Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Recommended shift:</strong> Pearl Millet, Chickpea, and
              Sorghum require 60-66% less water than rice/wheat while
              maintaining yield stability under drought conditions and good
              economic returns.
            </p>
          </div>

          {/* Follow-up Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-xs">
              Show implementation timeline
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Compare with other regions
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

export default CropRecommendationCard;
