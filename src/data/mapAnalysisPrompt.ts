// mapAnalysisPrompt.ts - Predefined prompt for map analysis feature

/**
 * This prompt is triggered when a user says "analyse map" 
 * and produces comprehensive groundwater analysis with visualizations
 */
export const MAP_ANALYSIS_PROMPT = `You are a data analyst for the Ingres Groundwater Portal.

INPUT:
- A list of states/districts detected from an uploaded map image.
- For each district:
  - category (Safe, Semi-Critical, Critical, Over-Exploited, Saline),
  - rainfall (mm),
  - annual groundwater recharge (ham) broken down as:
      - Rainfall Recharge
      - Stream Channel Recharge
      - Canal Recharge
      - Surface Water Irrigation
      - Ground Water Irrigation
      - Water Conservation Structures
      - Tanks and Ponds
      - Total Recharge
  - natural discharge (ham)
  - annual extractable groundwater resources (ham)
  - groundwater extraction (ham) broken down as:
      - Irrigation
      - Domestic
      - Industrial
      - Total Extraction
  - sector-wise usage percentages (Agriculture, Domestic, Industrial).

TASK:
1. Parse the input and produce a structured JSON object with the following keys:

{
  "summary": "<high-level analysis of the region>",
  "problem_districts": [ { "district": "...", "category": "Over-Exploited", "reason": "..." } ],
  "annual_trends": [ { "year": 2015, "extraction": ..., "recharge": ..., "decline_rate_m_per_year": ... } ],
  "sector_usage": [ { "sector": "Agriculture", "percentage": ... }, { "sector": "Domestic", ... }, { "sector": "Industrial", ... } ],
  "water_quality": [ { "district": "...", "issue": "Salinity" } ],
  "recommended_interventions": [ "..." , "..." ],
  "graphs": {
    "extraction_vs_recharge": <data array>,
    "annual_decline": <data array>,
    "sector_usage": <data array>
  }
}

2. In the "summary" key, write a concise paragraph explaining the main findings:
   - Which districts are most at risk
   - How extraction compares to recharge (e.g. 17,09,620.10 ham vs 11,62,168.28 ham)
   - Any notable water quality issues (saline areas, etc.)
   - Recommendations in one or two lines

3. In "recommended_interventions", list practical, state-specific actions
   (e.g. crop diversification, drip irrigation, stricter well permits, artificial recharge projects).

4. Ensure all numbers are copied exactly from the input. If a field is missing, use null but keep the structure.

5. Create dynamic, visually appealing graphs to illustrate:
   - Bar chart comparing extraction vs. recharge across districts
   - Line chart showing annual groundwater decline trends
   - Pie chart of sector-wise water usage
   - Heatmap of districts by extraction stage
   - Radar chart comparing various recharge components

6. Include a comprehensive analysis section with:
   - Long-term sustainability projections
   - Comparison with historical data
   - Assessment of climate change impacts
   - Evaluation of current policy effectiveness
   - Risk assessment for agriculture and water security

OUTPUT:
- Return the complete JSON object with visualization data
- Include additional metadata for enhanced graph rendering
`;

export const SAMPLE_MAP_ANALYSIS_RESPONSE = {
  "summary": "Analysis shows Delhi and Chaksu block are at high risk with extraction exceeding recharge. Delhi is over-exploited (129% extraction stage) with a concerning upward trend, while Chaksu is critical (99% stage). Ludhiana district shows consistent groundwater decline, while Amritsar has recently shifted to negative net balance. Agricultural irrigation is the dominant water use sector across regions. Interventions should focus on agricultural water use efficiency, particularly in Punjab where rice cultivation drives high extraction rates.",
  "problem_districts": [
    { "district": "New Delhi", "category": "Over-Exploited", "reason": "Extraction exceeds recharge by 29%, with irrigation accounting for 90% of total extraction" },
    { "district": "Jaipur", "category": "Critical", "reason": "Extraction nearing total recharge capacity (99% stage) with irrigation accounting for 90% of total extraction" },
    { "district": "Ludhiana", "category": "Over-Exploited", "reason": "Consistent negative net balance between extraction and recharge, likely due to intensive agriculture and industrial activities" },
    { "district": "Bhopal", "category": "Over-Exploited", "reason": "Extraction exceeds recharge by 20%" },
    { "district": "Indore", "category": "Over-Exploited", "reason": "Extraction exceeds recharge by 15%" }
  ],
  "annual_trends": [
    { "year": 2021, "extraction": 155.8, "recharge": 120.5, "decline_rate_m_per_year": 0.33 },
    { "year": 2022, "extraction": 158.2, "recharge": 119.8, "decline_rate_m_per_year": 0.35 },
    { "year": 2023, "extraction": 160.5, "recharge": 118.2, "decline_rate_m_per_year": 0.38 },
    { "year": 2024, "extraction": 162.1, "recharge": 117.5, "decline_rate_m_per_year": 0.41 },
    { "year": 2025, "extraction": 164.8, "recharge": 116.1, "decline_rate_m_per_year": 0.45 }
  ],
  "sector_usage": [
    { "sector": "Agriculture", "percentage": 89.8 },
    { "sector": "Domestic", "percentage": 7.2 },
    { "sector": "Industrial", "percentage": 3.0 }
  ],
  "water_quality": [
    { "district": "Amritsar", "issue": "Fluoride Contamination" },
    { "district": "Jaipur", "issue": "Salinity" },
    { "district": "Ludhiana", "issue": "Heavy Metal Contamination" }
  ],
  "recommended_interventions": [
    "Promote Direct Seeded Rice (DSR) and micro-irrigation techniques to reduce agricultural water usage in Punjab",
    "Implement rainwater harvesting and artificial recharge structures in Delhi to improve recharge rates",
    "Encourage crop diversification away from water-intensive crops in critical and over-exploited blocks",
    "Strengthen groundwater regulation and monitoring in urban areas like Delhi and Bhopal",
    "Develop and enforce industrial water recycling standards in manufacturing hubs"
  ],
  "graphs": {
    "extraction_vs_recharge": [
      {"region": "Delhi", "extraction": 155.8, "recharge": 120.5, "color": "#FF4500"},
      {"region": "Chaksu", "extraction": 94.1, "recharge": 95.2, "color": "#FFA500"},
      {"region": "Ludhiana", "extraction": 1.92, "recharge": 1.59, "color": "#FF4500"},
      {"region": "Amritsar", "extraction": 1.8, "recharge": 1.77, "color": "#FFA500"},
      {"region": "Jalandhar", "extraction": 1.71, "recharge": 1.73, "color": "#32CD32"}
    ],
    "annual_decline": [
      {"region": "Delhi", "trend": [98, 107, 115, 122, 129], "color": "#FF4500"},
      {"region": "Chaksu", "trend": [82, 88, 91, 95, 99], "color": "#FFA500"},
      {"region": "Ludhiana", "net": [-0.27, -0.29, -0.3, -0.33, -0.33], "color": "#FF4500"},
      {"region": "Amritsar", "net": [0.01, 0.01, -0.01, -0.02, -0.03], "color": "#FFA500"},
      {"region": "Jalandhar", "net": [0.03, 0.04, 0.01, 0.02, 0.02], "color": "#32CD32"}
    ],
    "sector_usage": [
      {"region": "Delhi", "irrigation": 89.9, "domestic": 6.9, "industry": 3.2, "colors": ["#1E90FF", "#32CD32", "#FFD700"]},
      {"region": "Chaksu", "irrigation": 90.3, "domestic": 7.5, "industry": 2.2, "colors": ["#1E90FF", "#32CD32", "#FFD700"]},
      {"region": "Punjab", "irrigation": 92.1, "domestic": 5.4, "industry": 2.5, "colors": ["#1E90FF", "#32CD32", "#FFD700"]}
    ],
    "recharge_components": [
      {"region": "Delhi", "rainfall": 90.5, "canal": 30.0, "colors": ["#87CEEB", "#40E0D0"]},
      {"region": "Chaksu", "rainfall": 75.2, "canal": 20.0, "colors": ["#87CEEB", "#40E0D0"]},
      {"region": "Madhya Pradesh", "rainfall": 2523627.7, "canal": 1082983.3, "colors": ["#87CEEB", "#40E0D0"]}
    ],
    "risk_heatmap": {
      "districts": ["New Delhi", "Jaipur", "Ludhiana", "Bhopal", "Indore", "Amritsar", "Jalandhar"],
      "riskScores": [85, 72, 78, 76, 69, 58, 45],
      "colorScale": ["#FFFF00", "#FFA500", "#FF4500", "#8B0000"]
    }
  },
  "metadata": {
    "analysisDate": "September 11, 2025",
    "dataSource": "CGWB Annual Report 2024-25",
    "mapProjection": "UTM Zone 43N",
    "confidenceScore": 0.92,
    "graphOptions": {
      "responsiveLayout": true,
      "darkMode": false,
      "exportFormats": ["PNG", "SVG", "CSV"],
      "animationDuration": 1000,
      "tooltipEnabled": true
    }
  }
};
