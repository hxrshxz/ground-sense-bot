// Import the original enums from the v2 file
import {
  DisplayType as V2DisplayType,
  ComponentType as V2ComponentType,
} from "../types/ai-response-v2";
// Import the re-exported types
import {
  AIResponse,
  DisplayType,
  LegacyComponentType,
  LegacyKeyValuePair,
  LegacyMetricBadge,
  LegacyPieChartItem,
  LegacySeriesItem,
  AIResponseV2,
} from "../types/ai-response";

// Sample responses for legacy system
export const sampleAIResponse: AIResponse = {
  displayType: "dossier" as DisplayType,
  title: "Delhi Water Resource Overview",
  components: [
    {
      type: "KeyStats" as any,
      data: {
        "Current Groundwater Level": "12.5m",
        "Change from Last Year": "-2.3m",
        "Annual Rainfall": "950mm",
        "Primary Water Source": "Underground Aquifers",
      },
    },
    {
      type: "LineChart" as any,
      title: "Groundwater Levels (Last 12 Months)",
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      data: {
        "Groundwater Level (m)": [
          14.2, 14.0, 13.8, 13.5, 13.2, 12.9, 12.7, 12.6, 12.5, 12.5, 12.6,
          12.5,
        ],
      },
      yAxisLabel: "Depth (m)",
    },
    {
      type: "BarChart" as any,
      title: "Monthly Rainfall Distribution",
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      data: {
        "Rainfall (mm)": [23, 18, 17, 28, 45, 132, 196, 178, 117, 24, 14, 8],
      },
      yAxisLabel: "Rainfall (mm)",
    },
    {
      type: "PieChart" as any,
      title: "Water Usage Distribution",
      data: [
        { name: "Agriculture", value: 68 },
        { name: "Domestic", value: 21 },
        { name: "Industrial", value: 11 },
      ],
    },
  ],
  aiSummary:
    "Delhi currently faces moderate water stress with groundwater levels declining at approximately 2.3m annually. The region receives most of its rainfall during the monsoon months (June-September). Agricultural usage accounts for the majority of water consumption. Conservation efforts should focus on agricultural efficiency and rainwater harvesting during monsoon season.",
};

export const sampleComparisonResponse: AIResponse = {
  displayType: "comparison" as DisplayType,
  title: "Delhi vs. Jaipur Water Resource Comparison",
  components: [
    {
      type: "KeyStats" as any,
      data: {
        "Delhi Groundwater Level": "12.5m",
        "Jaipur Groundwater Level": "18.2m",
        "Delhi Annual Rainfall": "950mm",
        "Jaipur Annual Rainfall": "650mm",
      },
    },
    {
      type: "DualLineChart" as any,
      title: "Groundwater Levels Comparison (Last 12 Months)",
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      data: {
        "Delhi (m)": [
          14.2, 14.0, 13.8, 13.5, 13.2, 12.9, 12.7, 12.6, 12.5, 12.5, 12.6,
          12.5,
        ],
        "Jaipur (m)": [
          19.5, 19.3, 19.1, 18.9, 18.7, 18.5, 18.3, 18.2, 18.1, 18.1, 18.2,
          18.2,
        ],
      },
      yAxisLabel: "Depth (m)",
    },
    {
      type: "BarChart" as any,
      title: "Rainfall Comparison",
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      data: {
        "Delhi (mm)": [23, 18, 17, 28, 45, 132, 196, 178, 117, 24, 14, 8],
        "Jaipur (mm)": [10, 13, 10, 11, 32, 98, 215, 155, 75, 17, 8, 6],
      },
      yAxisLabel: "Rainfall (mm)",
    },
    {
      type: "Table" as any,
      headers: ["Metric", "Delhi", "Jaipur", "Difference"],
      rows: [
        ["Population (millions)", "21.8", "3.9", "+17.9"],
        ["Water Consumption (MLD)", "1100", "450", "+650"],
        ["Per Capita Availability (LPCD)", "65", "90", "-25"],
        ["Extraction Rate (MCM/year)", "420", "180", "+240"],
      ],
    },
  ],
  aiSummary:
    "Delhi and Jaipur face different water challenges. Delhi has higher water stress due to its larger population and deeper groundwater depletion. Both regions rely heavily on groundwater, but Delhi receives more annual rainfall. Jaipur has better per capita water availability despite lower total rainfall, suggesting more efficient water management practices. Delhi could benefit from adopting some of Jaipur's water conservation techniques.",
};

export const sampleStateSummaryResponse: AIResponse = {
  displayType: "state_summary" as DisplayType,
  title: "Delhi State Water Summary",
  components: [
    {
      type: "KeyStats" as any,
      data: {
        "Total Districts": "11",
        "Critical Districts": "7",
        "Semi-Critical Districts": "3",
        "Safe Districts": "1",
      },
    },
    {
      type: "LineChart" as any,
      title: "Average State Groundwater Levels (2010-2023)",
      labels: [
        "2010",
        "2011",
        "2012",
        "2013",
        "2014",
        "2015",
        "2016",
        "2017",
        "2018",
        "2019",
        "2020",
        "2021",
        "2022",
        "2023",
      ],
      data: {
        "Groundwater Level (m)": [
          6.8, 7.5, 8.2, 8.9, 9.4, 10.1, 10.7, 11.2, 11.6, 12.0, 12.3, 12.5,
          12.8, 13.2,
        ],
      },
      yAxisLabel: "Depth (m)",
    },
    {
      type: "BarChart" as any,
      title: "District-wise Groundwater Depletion Rate",
      labels: [
        "North",
        "North West",
        "West",
        "South West",
        "South",
        "South East",
        "Central",
        "New Delhi",
        "East",
        "North East",
        "Shahdara",
      ],
      data: {
        "Annual Depletion (cm)": [28, 32, 35, 30, 25, 22, 27, 18, 24, 26, 29],
      },
      yAxisLabel: "Depletion Rate (cm/year)",
    },
    {
      type: "HotspotList" as any,
      title: "Critical Groundwater Hotspots",
      data: [
        { district: "South West Delhi", stage: "Over-Exploited" },
        { district: "West Delhi", stage: "Over-Exploited" },
        { district: "North West Delhi", stage: "Over-Exploited" },
        { district: "South Delhi", stage: "Critical" },
        { district: "Central Delhi", stage: "Critical" },
      ],
    },
  ],
  aiSummary:
    "Delhi is experiencing severe groundwater stress with 7 out of 11 districts classified as critical. The average groundwater level has declined from 6.8m in 2010 to 13.2m in 2023, indicating a troubling trend. South West, West, and North West Delhi are the most affected regions with depletion rates exceeding 30cm annually. The state requires urgent intervention in water management practices, particularly in over-exploited districts.",
};

export const sampleForecastResponse: AIResponse = {
  displayType: "forecast" as DisplayType,
  title: "Delhi 12-Month Water Forecast",
  components: [
    {
      type: "KeyStats" as any,
      data: {
        "Current Groundwater Level": "12.5m",
        "Projected Level (12 months)": "13.1m",
        "Expected Annual Rainfall": "970mm",
        "Confidence Level": "85%",
      },
    },
    {
      type: "LineChart" as any,
      title: "Groundwater Level Forecast (Next 12 Months)",
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      data: {
        "Projected Level (m)": [
          12.5, 12.6, 12.7, 12.8, 12.9, 12.8, 12.7, 12.6, 12.7, 12.8, 12.9,
          13.1,
        ],
        "Historical Average (m)": [
          12.4, 12.5, 12.6, 12.7, 12.8, 12.7, 12.5, 12.4, 12.5, 12.6, 12.7,
          12.8,
        ],
      },
      yAxisLabel: "Depth (m)",
    },
    {
      type: "BarChart" as any,
      title: "Projected Rainfall vs. Historical Average",
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      data: {
        "Projected Rainfall (mm)": [
          25, 20, 15, 30, 50, 140, 210, 190, 120, 25, 15, 10,
        ],
        "Historical Average (mm)": [
          23, 18, 17, 28, 45, 132, 196, 178, 117, 24, 14, 8,
        ],
      },
      yAxisLabel: "Rainfall (mm)",
    },
    {
      type: "PredictionCard" as any,
      data: {
        "Water Stress Level": "High",
        "Expected Supply Gap": "280 MLD",
        "Most Affected Areas": "South West, West Delhi",
        "Recommended Actions":
          "Implement mandatory water restrictions, Increase water recycling initiatives",
      },
    },
  ],
  aiSummary:
    "Delhi is projected to face increased water stress over the next 12 months with groundwater levels expected to decline from 12.5m to 13.1m. While rainfall is forecasted to be slightly above historical averages (+2.1%), it will be insufficient to reverse the depletion trend. The supply gap is expected to reach 280 MLD by the end of the year. South West and West Delhi will likely experience the most severe impacts. Immediate water conservation measures and increased recycling initiatives are strongly recommended.",
};

export const sampleRecommendationResponse: AIResponse = {
  displayType: "recommendation" as DisplayType,
  title: "Delhi Water Management Recommendations",
  components: [
    {
      type: "InsightCard" as any,
      data: {
        "Primary Challenge": "Declining Groundwater Levels",
        "Current Trend": "Annual decline of 2.3m",
        "Primary Cause": "Overextraction for agricultural and domestic use",
        Severity: "Critical",
      },
    },
    {
      type: "Table" as any,
      headers: ["Recommendation", "Impact", "Implementation Timeframe", "Cost"],
      rows: [
        ["Mandatory Rainwater Harvesting", "High", "12-18 months", "₹₹"],
        [
          "Agricultural Water Efficiency Program",
          "Very High",
          "18-24 months",
          "₹₹₹",
        ],
        ["Greywater Recycling Systems", "Medium", "6-12 months", "₹₹"],
        ["Groundwater Recharge Zones", "High", "24-36 months", "₹₹₹₹"],
        ["Water Pricing Reforms", "Medium", "12-18 months", "₹"],
      ],
    },
    {
      type: "CropList" as any,
      title: "Recommended Water-Efficient Crops",
      data: [
        {
          name: "Millets",
          waterRequirement: "Low",
          benefit: "Requires 70% less water than rice",
        },
        {
          name: "Pulses",
          waterRequirement: "Low-Medium",
          benefit: "Nitrogen fixing, improves soil health",
        },
        {
          name: "Oilseeds",
          waterRequirement: "Medium",
          benefit: "Higher profit margin per water unit",
        },
        {
          name: "Drought-resistant Wheat Varieties",
          waterRequirement: "Medium",
          benefit: "30% less water than traditional varieties",
        },
      ],
    },
    {
      type: "BarChart" as any,
      title: "Potential Water Savings by Sector",
      labels: [
        "Agriculture",
        "Domestic",
        "Industrial",
        "Commercial",
        "Institutional",
      ],
      data: {
        "Potential Savings (MLD)": [145, 85, 40, 25, 15],
      },
      yAxisLabel: "Water Savings (MLD)",
    },
  ],
  aiSummary:
    "Delhi requires a comprehensive water management strategy to address its critical groundwater decline. The highest impact interventions include agricultural water efficiency improvements and mandatory rainwater harvesting, which together could save up to 230 MLD. Transitioning to water-efficient crops like millets and pulses in surrounding agricultural areas would significantly reduce extraction rates. Groundwater recharge zones represent the most sustainable long-term solution but require significant investment. A balanced approach combining immediate conservation measures, pricing reforms, and long-term infrastructure development is recommended.",
};

export const sampleAnomalyAlertResponse: AIResponse = {
  displayType: "anomaly_alert" as DisplayType,
  title: "Delhi Critical Water Anomaly Alert",
  components: [
    {
      type: "AlertCard" as any,
      data: {
        status: "Critical",
        message: "Rapid Groundwater Depletion Detected",
        details:
          "Monitoring stations in South West Delhi have detected an accelerated groundwater depletion rate of 4.2m over the past 6 months, significantly exceeding the historical average of 1.1m for this period.",
        action:
          "Immediate investigation and emergency water conservation measures recommended.",
      },
    },
    {
      type: "LineChart" as any,
      title: "South West Delhi Groundwater Levels (Last 12 Months)",
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      data: {
        "Actual Level (m)": [
          15.2,
          15.4,
          15.8,
          16.3,
          17.0,
          17.8,
          18.5,
          19.2,
          19.4,
          null,
          null,
          null,
        ],
        "Expected Range (m)": [
          15.3, 15.5, 15.7, 15.9, 16.1, 16.3, 16.1, 15.9, 15.8, 15.7, 15.8,
          15.9,
        ],
      },
      yAxisLabel: "Depth (m)",
    },
    {
      type: "KeyMetricsBadges" as any,
      data: [
        {
          label: "Depletion Rate",
          value: "4.2m / 6mo",
          change: "+282%",
          variant: "alert",
        },
        {
          label: "Extraction Volume",
          value: "38.5 MCM",
          change: "+65%",
          variant: "alert",
        },
        {
          label: "Recharge Rate",
          value: "9.2 MCM",
          change: "-18%",
          variant: "warning",
        },
        {
          label: "Water Quality",
          value: "Declining",
          change: "TDS +320ppm",
          variant: "warning",
        },
      ],
    },
    {
      type: "DualAxisChart" as any,
      title: "Extraction vs. Rainfall Correlation",
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
      series: [
        {
          name: "Extraction (MCM)",
          data: [3.2, 3.5, 3.8, 4.1, 4.5, 4.8, 5.2, 5.4, 4.9],
          type: "bar",
          yAxis: "left",
        },
        {
          name: "Rainfall (mm)",
          data: [21, 18, 15, 25, 42, 78, 65, 48, 32],
          type: "line",
          yAxis: "right",
        },
      ],
    },
  ],
  aiSummary:
    "URGENT: An unprecedented rate of groundwater depletion has been detected in South West Delhi, with levels dropping 4.2m in just 6 months—nearly 3x the expected rate. This anomaly coincides with a 65% increase in extraction volume and an 18% decrease in aquifer recharge rates. The primary driver appears to be unauthorized deep borewells for agricultural use, exacerbated by lower-than-average rainfall in July-August. Immediate action is required, including enforcement against illegal extraction, emergency water conservation measures, and exploration of alternative water sources for the affected area. The situation threatens water security for approximately 2.3 million residents if not addressed within 30-45 days.",
};

// Sample V2 responses with proper enum values
export const sampleV2Response: AIResponseV2 = {
  displayType: V2DisplayType.DEFAULT,
  title: "Delhi Water Resource Overview V2",
  components: [
    {
      id: "1",
      type: V2ComponentType.KEY_STATS,
      title: "Key Statistics",
      data: {
        "Current Groundwater Level": "12.5m",
        "Change from Last Year": "-2.3m",
        "Annual Rainfall": "950mm",
        "Primary Water Source": "Underground Aquifers",
      },
    },
    {
      id: "2",
      type: V2ComponentType.LINE_CHART,
      title: "Groundwater Levels (Last 12 Months)",
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Groundwater Level (m)",
          data: [
            14.2, 14.0, 13.8, 13.5, 13.2, 12.9, 12.7, 12.6, 12.5, 12.5, 12.6,
            12.5,
          ],
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          tension: 0.4,
        },
      ],
    },
    {
      id: "3",
      type: V2ComponentType.BAR_CHART,
      title: "Monthly Rainfall Distribution",
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Rainfall (mm)",
          data: [23, 18, 17, 28, 45, 132, 196, 178, 117, 24, 14, 8],
          backgroundColor: "rgba(16, 185, 129, 0.7)",
        },
      ],
    },
    {
      id: "4",
      type: V2ComponentType.PIE_CHART,
      title: "Water Usage Distribution",
      labels: ["Agriculture", "Domestic", "Industrial"],
      datasets: [
        {
          label: "Water Usage Distribution",
          data: [68, 21, 11],
          backgroundColor: [
            "rgba(59, 130, 246, 0.7)",
            "rgba(16, 185, 129, 0.7)",
            "rgba(249, 115, 22, 0.7)",
          ],
        },
      ],
    },
  ],
  aiSummary:
    "Delhi currently faces moderate water stress with groundwater levels declining at approximately 2.3m annually. The region receives most of its rainfall during the monsoon months (June-September). Agricultural usage accounts for the majority of water consumption. Conservation efforts should focus on agricultural efficiency and rainwater harvesting during monsoon season.",
};

// Function to determine which response to return based on query
export function getAIResponse(query: string): AIResponse {
  query = query.toLowerCase();

  if (query.includes("comparison") || query.includes("compare")) {
    return sampleComparisonResponse;
  } else if (query.includes("state") || query.includes("summary")) {
    return sampleStateSummaryResponse;
  } else if (
    query.includes("forecast") ||
    query.includes("prediction") ||
    query.includes("future")
  ) {
    return sampleForecastResponse;
  } else if (
    query.includes("recommend") ||
    query.includes("suggestion") ||
    query.includes("advice")
  ) {
    return sampleRecommendationResponse;
  } else if (
    query.includes("anomaly") ||
    query.includes("alert") ||
    query.includes("warning")
  ) {
    return sampleAnomalyAlertResponse;
  } else {
    // Default response
    return sampleAIResponse;
  }
}

// Function to determine which V2 response to return based on query
export function getAIResponseV2(query: string): AIResponseV2 {
  // For now, just return the sample V2 response
  // This would be expanded with more V2 samples as needed
  return sampleV2Response;
}
