import React from "react";
import { motion } from "framer-motion";
import GroundwaterAnalysisChart from "../charts/GroundwaterAnalysisChart";
import SectorUsageChart from "../charts/SectorUsageChart";
import AnnualTrendsChart from "../charts/AnnualTrendsChart";

// Enhanced renderer for groundwater analysis responses
export const GroundwaterAnalysisRenderer = ({
  response,
}: {
  response: string;
}) => {
  // Try to extract JSON data from the response
  const extractGroundwaterData = (text: string) => {
    try {
      // Look for JSON patterns in the response
      const jsonMatch = text.match(/\{[\s\S]*"graphs"[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // If no JSON found, return null to use default renderer
      return null;
    } catch (error) {
      console.log("Could not extract groundwater JSON data:", error);
      return null;
    }
  };

  // Check if this response contains groundwater analysis keywords
  const isGroundwaterAnalysis = (text: string) => {
    const keywords = [
      "extraction_vs_recharge",
      "sector_usage",
      "annual_trends",
      "groundwater",
      "recharge",
      "extraction",
      "problem_districts",
      "recommended_interventions",
      "ham", // Hectare Meter
      "over-exploited",
      "critical",
      "semi-critical",
      "safe",
    ];

    const lowerText = text.toLowerCase();
    return keywords.some((keyword) => lowerText.includes(keyword));
  };

  // Extract the groundwater data
  const groundwaterData = extractGroundwaterData(response);
  const isAnalysis = isGroundwaterAnalysis(response);

  // If this doesn't look like groundwater analysis, return null to use default renderer
  if (!isAnalysis && !groundwaterData) {
    return null;
  }

  // Parse the text response to extract key information
  const parseTextData = (text: string) => {
    const sections = {
      summary: "",
      problemDistricts: [] as any[],
      interventions: [] as string[],
    };

    // Extract summary
    const summaryMatch = text.match(/summary["\s]*:[\s]*["']([^"']+)["']/i);
    if (summaryMatch) {
      sections.summary = summaryMatch[1];
    }

    // Extract problem districts
    const problemMatch = text.match(
      /problem_districts["\s]*:[\s]*\[([\s\S]*?)\]/i
    );
    if (problemMatch) {
      try {
        sections.problemDistricts = JSON.parse(`[${problemMatch[1]}]`);
      } catch (e) {
        console.log("Could not parse problem districts");
      }
    }

    // Extract interventions
    const interventionsMatch = text.match(
      /recommended_interventions["\s]*:[\s]*\[([\s\S]*?)\]/i
    );
    if (interventionsMatch) {
      try {
        const interventionsStr = interventionsMatch[1];
        sections.interventions = interventionsStr
          .split(",")
          .map((item: string) => item.replace(/["\[\]]/g, "").trim())
          .filter((item: string) => item.length > 0);
      } catch (e) {
        console.log("Could not parse interventions");
      }
    }

    return sections;
  };

  const textData = parseTextData(response);

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      {textData.summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
            🌊 Executive Summary
          </h3>
          <p className="text-slate-700 leading-relaxed">{textData.summary}</p>
        </motion.div>
      )}

      {/* Interactive Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <GroundwaterAnalysisChart data={groundwaterData} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <SectorUsageChart data={groundwaterData} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <AnnualTrendsChart data={groundwaterData} />
      </motion.div>

      {/* Problem Districts */}
      {textData.problemDistricts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            ⚠️ High-Risk Districts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {textData.problemDistricts.map((district: any, index: number) => (
              <div
                key={index}
                className="p-4 bg-white/60 rounded-lg border border-red-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-800">
                    {district.district}
                  </h4>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      district.category === "Over-Exploited"
                        ? "bg-red-100 text-red-800"
                        : district.category === "Critical"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {district.category}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{district.reason}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommended Interventions */}
      {textData.interventions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            💡 Recommended Interventions
          </h3>
          <div className="space-y-3">
            {textData.interventions.map(
              (intervention: string, index: number) => (
                <div
                  key={index}
                  className="flex items-start p-3 bg-white/60 rounded-lg border border-green-200"
                >
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {intervention}
                  </p>
                </div>
              )
            )}
          </div>
        </motion.div>
      )}

      {/* Raw Response (for debugging) */}
      {process.env.NODE_ENV === "development" && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700">
            🔧 Raw Response Data (Development)
          </summary>
          <pre className="mt-2 p-4 bg-slate-100 rounded-lg text-xs overflow-auto max-h-40">
            {response}
          </pre>
        </details>
      )}
    </div>
  );
};

export default GroundwaterAnalysisRenderer;
