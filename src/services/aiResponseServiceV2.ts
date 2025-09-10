import { AIResponse, DisplayType, ComponentType } from "@/types/ai-response-v2";

// Mock data for different response types
const sampleResponses: { [key: string]: AIResponse } = {
  groundwaterComparison: {
    displayType: DisplayType.COMPARISON,
    title: "Groundwater Level Comparison",
    components: [
      {
        id: "1",
        type: ComponentType.LINE_CHART,
        title: "Delhi Groundwater Trends (2010-2023)",
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
        datasets: [
          {
            label: "Pre-Monsoon (m)",
            data: [
              8.5, 9.2, 10.1, 10.8, 11.2, 11.5, 12.3, 13.1, 13.8, 14.2, 14.6,
              15.1, 15.5, 16.2,
            ],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            tension: 0.4,
          },
          {
            label: "Post-Monsoon (m)",
            data: [
              7.8, 8.1, 8.9, 9.5, 10.0, 10.2, 10.9, 11.5, 12.3, 12.8, 13.1,
              13.5, 14.1, 14.8,
            ],
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            tension: 0.4,
          },
        ],
      },
      {
        id: "2",
        type: ComponentType.MARKDOWN,
        content: `
## Groundwater Analysis

The data shows a concerning trend of declining groundwater levels in Delhi over the past decade:

- **Average annual decline**: 0.59 meters
- **Total decline (2010-2023)**: 7.7 meters
- **Current average depth**: 16.2 meters below ground level

This decline is primarily attributed to:
1. Excessive groundwater extraction
2. Reduction in recharge areas
3. Urbanization and reduced percolation
4. Climate change impacts
        `,
      },
      {
        id: "3",
        type: ComponentType.ALERT,
        title: "Critical Status",
        content:
          'Delhi\'s groundwater extraction exceeds recharge by 27%, putting it in the "Critical Zone" according to the Central Ground Water Board.',
        alertType: "warning",
      },
    ],
    aiSummary:
      "Delhi is experiencing significant groundwater depletion with levels declining at an average rate of 0.59 meters annually. The current depth stands at 16.2 meters below ground level, representing a total decline of 7.7 meters since 2010. Immediate conservation and recharge measures are recommended.",
  },

  blockAssessment: {
    displayType: DisplayType.GRID,
    title: "Block-wise Groundwater Assessment",
    components: [
      {
        id: "1",
        type: ComponentType.ASSESSMENT_CARD,
        title: "Central Delhi",
        score: 25,
        maxScore: 100,
        label: "Critical",
        details: [
          {
            title: "Annual Decline",
            value: "0.82",
            unit: "m",
            status: "positive",
          },
          {
            title: "Extraction Rate",
            value: "135",
            unit: "%",
            status: "negative",
          },
          {
            title: "TDS Levels",
            value: "1250",
            unit: "mg/L",
            status: "negative",
          },
          { title: "Fluoride", value: "0.9", unit: "mg/L", status: "neutral" },
        ],
      },
      {
        id: "2",
        type: ComponentType.ASSESSMENT_CARD,
        title: "South Delhi",
        score: 32,
        maxScore: 100,
        label: "Critical",
        details: [
          {
            title: "Annual Decline",
            value: "0.75",
            unit: "m",
            status: "negative",
          },
          {
            title: "Extraction Rate",
            value: "124",
            unit: "%",
            status: "negative",
          },
          {
            title: "TDS Levels",
            value: "980",
            unit: "mg/L",
            status: "neutral",
          },
          { title: "Fluoride", value: "0.7", unit: "mg/L", status: "positive" },
        ],
      },
      {
        id: "3",
        type: ComponentType.ASSESSMENT_CARD,
        title: "North Delhi",
        score: 41,
        maxScore: 100,
        label: "Semi-Critical",
        details: [
          {
            title: "Annual Decline",
            value: "0.65",
            unit: "m",
            status: "negative",
          },
          {
            title: "Extraction Rate",
            value: "115",
            unit: "%",
            status: "negative",
          },
          {
            title: "TDS Levels",
            value: "850",
            unit: "mg/L",
            status: "neutral",
          },
          { title: "Fluoride", value: "0.8", unit: "mg/L", status: "neutral" },
        ],
      },
      {
        id: "4",
        type: ComponentType.ASSESSMENT_CARD,
        title: "East Delhi",
        score: 38,
        maxScore: 100,
        label: "Semi-Critical",
        details: [
          {
            title: "Annual Decline",
            value: "0.69",
            unit: "m",
            status: "negative",
          },
          {
            title: "Extraction Rate",
            value: "118",
            unit: "%",
            status: "negative",
          },
          {
            title: "TDS Levels",
            value: "1050",
            unit: "mg/L",
            status: "negative",
          },
          { title: "Fluoride", value: "1.1", unit: "mg/L", status: "negative" },
        ],
      },
    ],
    aiSummary:
      "Delhi's groundwater situation is critical across most blocks, with Central and South Delhi showing the most severe depletion. All blocks are experiencing annual decline, with extraction rates exceeding sustainable levels throughout the region.",
  },

  rechargeStrategy: {
    displayType: DisplayType.TABS,
    title: "Delhi Groundwater Recharge Strategy",
    components: [
      {
        id: "1",
        type: ComponentType.MARKDOWN,
        title: "Overview",
        content: `
## Groundwater Recharge Strategy for Delhi

Delhi faces severe groundwater depletion with levels declining at an average rate of 0.59 meters annually. This comprehensive strategy outlines measures to enhance recharge, reduce extraction, and improve management practices.

### Current Status
- Critical depletion in 60% of blocks
- Semi-critical depletion in 28% of blocks
- Safe status in only 12% of blocks

### Implementation Timeline
- **Short-term**: Rainwater harvesting, water conservation campaigns
- **Medium-term**: Artificial recharge structures, stormwater management
- **Long-term**: Land use policy reform, aquifer mapping
        `,
      },
      {
        id: "2",
        type: ComponentType.CARD,
        title: "Priority Recharge Zones",
        content: [
          {
            id: "2-1",
            type: ComponentType.TABLE,
            headers: [
              "Zone",
              "Priority Level",
              "Potential (MCM/year)",
              "Investment (₹ Cr)",
            ],
            rows: [
              ["South Delhi Ridge", "Very High", "18.5", "65"],
              ["Yamuna Floodplain", "Very High", "22.3", "78"],
              ["Central Delhi Watershed", "High", "12.8", "45"],
              ["North Delhi Aquifer", "High", "14.5", "52"],
              ["West Delhi Basin", "Medium", "9.6", "35"],
              ["East Delhi Yamuna Belt", "Medium", "8.7", "31"],
            ],
          },
        ],
      },
      {
        id: "3",
        type: ComponentType.CARD,
        title: "Recommended Interventions",
        content: [
          {
            id: "3-1",
            type: ComponentType.PIE_CHART,
            title: "Investment Allocation by Intervention Type",
            labels: [
              "Rainwater Harvesting",
              "Artificial Recharge",
              "Water Conservation",
              "Policy & Governance",
              "Monitoring & Research",
            ],
            datasets: [
              {
                label: "Budget Allocation",
                data: [35, 25, 15, 15, 10],
                backgroundColor: [
                  "rgba(59, 130, 246, 0.7)",
                  "rgba(16, 185, 129, 0.7)",
                  "rgba(249, 115, 22, 0.7)",
                  "rgba(139, 92, 246, 0.7)",
                  "rgba(236, 72, 153, 0.7)",
                ],
              },
            ],
          },
          {
            id: "3-2",
            type: ComponentType.TEXT,
            content:
              "The investment strategy prioritizes infrastructure development for rainwater harvesting and artificial recharge, which together account for 60% of the proposed budget. These interventions offer the highest return in terms of recharge potential and long-term sustainability.",
          },
        ],
      },
    ],
    aiSummary:
      "This comprehensive strategy for Delhi's groundwater recharge identifies priority zones and specific interventions across a strategic timeline. With an emphasis on the Yamuna Floodplain and South Delhi Ridge as key recharge areas, the plan allocates 60% of investment to rainwater harvesting and artificial recharge structures, which offer the highest potential impact.",
  },

  cropRecommendations: {
    displayType: DisplayType.DEFAULT,
    title: "Recommended Crops for Water-Scarce Regions",
    components: [
      {
        id: "1",
        type: ComponentType.MARKDOWN,
        content: `
## Drought-Resistant Crop Recommendations

The following crops are specifically recommended for regions with limited water availability and critical groundwater conditions. These selections are based on water efficiency, economic value, and climate suitability.
        `,
      },
      {
        id: "2",
        type: ComponentType.CARD,
        title: "Recommended Crops",
        content: [
          {
            id: "2-1",
            type: ComponentType.TABLE,
            headers: [
              "Crop",
              "Water Requirement",
              "Growing Season",
              "Economic Value",
              "Soil Suitability",
            ],
            rows: [
              [
                "Pearl Millet (Bajra)",
                "Very Low",
                "Kharif",
                "Medium",
                "Sandy, Loamy",
              ],
              ["Chickpea (Gram)", "Low", "Rabi", "High", "Sandy Loam, Clay"],
              [
                "Sorghum (Jowar)",
                "Low",
                "Kharif",
                "Medium",
                "Variety of Soils",
              ],
              ["Moth Bean", "Very Low", "Kharif", "Medium", "Sandy, Arid"],
              ["Cluster Bean (Guar)", "Low", "Kharif", "High", "Sandy Loam"],
              ["Sesame (Til)", "Low", "Kharif", "High", "Well-drained"],
              ["Castor", "Low", "Kharif", "Medium", "Well-drained"],
            ],
          },
        ],
      },
      {
        id: "3",
        type: ComponentType.PIE_CHART,
        title: "Water Requirement Comparison (mm/season)",
        labels: [
          "Rice",
          "Wheat",
          "Maize",
          "Pearl Millet",
          "Chickpea",
          "Sorghum",
        ],
        datasets: [
          {
            label: "Water Requirement (mm)",
            data: [1200, 550, 500, 350, 250, 400],
            backgroundColor: [
              "rgba(255, 99, 132, 0.7)",
              "rgba(255, 159, 64, 0.7)",
              "rgba(255, 205, 86, 0.7)",
              "rgba(75, 192, 192, 0.7)",
              "rgba(54, 162, 235, 0.7)",
              "rgba(153, 102, 255, 0.7)",
            ],
          },
        ],
      },
      {
        id: "4",
        type: ComponentType.ALERT,
        title: "Recommendation Notice",
        content:
          "Crop selection should always be paired with water-efficient irrigation practices such as drip irrigation or micro-sprinklers to maximize water use efficiency. Consider crop rotation to maintain soil health.",
        alertType: "info",
      },
    ],
    aiSummary:
      "For water-scarce regions like Chaksu, drought-resistant crops such as Pearl Millet, Chickpea, and Sorghum are recommended. These crops require 60-80% less water than conventional crops like rice and wheat while providing good economic returns. Implementing water-efficient irrigation techniques alongside these crop choices can help sustain agricultural productivity while reducing groundwater extraction.",
  },

  conservationMeasures: {
    displayType: DisplayType.TABS,
    title: "Water Conservation Measures for Over-Exploited Blocks",
    components: [
      {
        id: "1",
        type: ComponentType.MARKDOWN,
        title: "Overview",
        content: `
## Urgent Water Conservation Measures

The following conservation measures are recommended for implementation in over-exploited and critical groundwater blocks. These measures aim to reduce extraction, enhance recharge, and improve water use efficiency across agricultural, domestic, and industrial sectors.
        `,
      },
      {
        id: "2",
        type: ComponentType.CARD,
        title: "Agricultural Measures",
        content: [
          {
            id: "2-1",
            type: ComponentType.BAR_CHART,
            title: "Water Savings by Agricultural Measure (%)",
            labels: [
              "Micro-irrigation",
              "Crop Diversification",
              "Laser Land Leveling",
              "Mulching",
              "Alternate Wetting & Drying",
            ],
            datasets: [
              {
                label: "Water Savings (%)",
                data: [40, 30, 25, 20, 35],
                backgroundColor: "rgba(16, 185, 129, 0.7)",
                borderColor: "rgba(16, 185, 129, 1)",
                borderWidth: 1,
              },
            ],
          },
          {
            id: "2-2",
            type: ComponentType.TEXT,
            content:
              "Agricultural measures focus on improving irrigation efficiency and promoting less water-intensive cropping patterns. Micro-irrigation systems like drip and sprinkler irrigation can reduce water usage by up to 40% compared to flood irrigation.",
          },
        ],
      },
      {
        id: "3",
        type: ComponentType.CARD,
        title: "Domestic & Urban Measures",
        content: [
          {
            id: "3-1",
            type: ComponentType.TABLE,
            headers: [
              "Measure",
              "Potential Savings",
              "Implementation Cost",
              "Payback Period",
            ],
            rows: [
              [
                "Rainwater Harvesting",
                "50-80% of roof runoff",
                "Medium",
                "3-5 years",
              ],
              [
                "Water-Efficient Fixtures",
                "20-30% of domestic use",
                "Low",
                "1-2 years",
              ],
              [
                "Greywater Recycling",
                "30-40% of domestic use",
                "Medium-High",
                "4-6 years",
              ],
              [
                "Leak Detection & Repair",
                "10-15% of supply",
                "Medium",
                "2-3 years",
              ],
              ["Water Metering", "15-20% reduction in use", "Low", "1-2 years"],
            ],
          },
        ],
      },
      {
        id: "4",
        type: ComponentType.CARD,
        title: "Policy Measures",
        content: [
          {
            id: "4-1",
            type: ComponentType.MARKDOWN,
            content: `
### Recommended Policy Interventions

1. **Regulatory Measures**
   - Mandatory water audits for industries
   - Groundwater extraction permits with volume caps
   - Building code amendments for water conservation
   - Penalties for excessive extraction

2. **Incentive Structures**
   - Subsidies for water-efficient technologies
   - Tax rebates for rainwater harvesting
   - Recognition programs for water-conserving entities
   - Water saving certificates trading

3. **Institutional Framework**
   - Block-level water user associations
   - Community monitoring systems
   - Capacity building for local governance
   - Public-private partnerships for conservation
            `,
          },
        ],
      },
    ],
    aiSummary:
      "For over-exploited blocks, a multi-pronged approach combining agricultural, domestic, and policy measures is essential. Agricultural interventions like micro-irrigation can save 30-40% water, while domestic measures such as rainwater harvesting and efficient fixtures can reduce usage by 20-30%. Policy interventions through regulations and incentives are crucial for sustained impact. Implementation should be prioritized in blocks with extraction rates exceeding 120% of recharge.",
  },

  alertsRajasthan: {
    displayType: DisplayType.DEFAULT,
    title: "Critical Groundwater Alerts for Rajasthan",
    components: [
      {
        id: "1",
        type: ComponentType.MARKDOWN,
        content: `
## Critical Groundwater Alerts

The following alerts are based on current groundwater monitoring data and trend analysis for Rajasthan. These alerts highlight blocks requiring immediate attention and intervention.
        `,
      },
      {
        id: "2",
        type: ComponentType.ALERT,
        title: "Critical Depletion",
        content:
          "85 blocks in Rajasthan are currently classified as 'Over-Exploited' with extraction exceeding 150% of recharge. These blocks are primarily concentrated in western and central regions of the state.",
        alertType: "error",
      },
      {
        id: "3",
        type: ComponentType.TABLE,
        title: "Top 10 Most Critical Blocks",
        headers: [
          "Block",
          "District",
          "Extraction Rate (%)",
          "Annual Decline (m)",
          "Current Status",
        ],
        rows: [
          ["Sanganer", "Jaipur", "192", "0.95", "Over-Exploited"],
          ["Osian", "Jodhpur", "187", "0.91", "Over-Exploited"],
          ["Jhunjhunu", "Jhunjhunu", "183", "0.88", "Over-Exploited"],
          ["Dudu", "Jaipur", "178", "0.84", "Over-Exploited"],
          ["Chomu", "Jaipur", "175", "0.82", "Over-Exploited"],
          ["Phagi", "Jaipur", "169", "0.80", "Over-Exploited"],
          ["Jaipur", "Jaipur", "165", "0.78", "Over-Exploited"],
          ["Didwana", "Nagaur", "162", "0.76", "Over-Exploited"],
          ["Ladnu", "Nagaur", "159", "0.75", "Over-Exploited"],
          ["Chaksu", "Jaipur", "157", "0.74", "Over-Exploited"],
        ],
      },
      {
        id: "4",
        type: ComponentType.BAR_CHART,
        title: "Critical Blocks by District",
        labels: [
          "Jaipur",
          "Jodhpur",
          "Sikar",
          "Nagaur",
          "Barmer",
          "Ajmer",
          "Churu",
        ],
        datasets: [
          {
            label: "Number of Critical Blocks",
            data: [18, 14, 12, 10, 9, 7, 6],
            backgroundColor: "rgba(239, 68, 68, 0.7)",
            borderColor: "rgba(239, 68, 68, 1)",
            borderWidth: 1,
          },
        ],
      },
      {
        id: "5",
        type: ComponentType.MARKDOWN,
        content: `
### Immediate Recommendations

1. Declare water emergency in the 10 most critical blocks
2. Implement immediate restrictions on new borewells
3. Mandate water audits for all major users in critical blocks
4. Accelerate rainwater harvesting projects in these regions
5. Establish emergency response teams for water management
        `,
      },
    ],
    aiSummary:
      "Rajasthan currently has 85 blocks classified as 'Over-Exploited' with extraction rates exceeding 150% of recharge. Jaipur district has the highest concentration of critical blocks (18), with Sanganer being the most severely affected (192% extraction rate). Immediate action is required in these areas to prevent irreversible damage to aquifers and ensure water security for local communities.",
  },
};

// Function to get a response based on query
export function getAIResponse(query: string): AIResponse | null {
  const queryLower = query.toLowerCase();

  // Better keyword matching with more specific patterns

  // 1. Groundwater comparison and trends
  if (
    (queryLower.includes("comparison") || queryLower.includes("compare")) &&
    (queryLower.includes("groundwater") ||
      queryLower.includes("water") ||
      queryLower.includes("level"))
  ) {
    return sampleResponses.groundwaterComparison;
  }

  // 2. Trend analysis specifically
  if (
    queryLower.includes("trend") &&
    (queryLower.includes("groundwater") ||
      queryLower.includes("water") ||
      queryLower.includes("level"))
  ) {
    return sampleResponses.groundwaterComparison;
  }

  // 3. Block assessment and status
  if (
    (queryLower.includes("block") || queryLower.includes("assessment")) &&
    (queryLower.includes("status") ||
      queryLower.includes("show") ||
      queryLower.includes("display"))
  ) {
    return sampleResponses.blockAssessment;
  }

  // 4. Critical areas and hotspots
  if (
    (queryLower.includes("critical") ||
      queryLower.includes("over-exploited") ||
      queryLower.includes("overexploited")) &&
    (queryLower.includes("block") ||
      queryLower.includes("area") ||
      queryLower.includes("zone"))
  ) {
    return sampleResponses.blockAssessment;
  }

  // 5. Recharge strategies and solutions
  if (
    (queryLower.includes("strategy") ||
      queryLower.includes("solution") ||
      queryLower.includes("recommendation")) &&
    (queryLower.includes("recharge") ||
      queryLower.includes("conservation") ||
      queryLower.includes("management"))
  ) {
    return sampleResponses.rechargeStrategy;
  }

  // 6. Water availability forecasts
  if (
    (queryLower.includes("forecast") ||
      queryLower.includes("predict") ||
      queryLower.includes("future")) &&
    (queryLower.includes("water") ||
      queryLower.includes("groundwater") ||
      queryLower.includes("availability"))
  ) {
    return sampleResponses.rechargeStrategy;
  }

  // 7. Crop recommendations
  if (
    (queryLower.includes("crop") ||
      queryLower.includes("agriculture") ||
      queryLower.includes("farming")) &&
    (queryLower.includes("recommend") ||
      queryLower.includes("grow") ||
      queryLower.includes("plant") ||
      queryLower.includes("suggestion") ||
      queryLower.includes("water-scarce") ||
      queryLower.includes("drought"))
  ) {
    return sampleResponses.cropRecommendations;
  }

  // 8. Water conservation measures
  if (
    (queryLower.includes("conservation") ||
      queryLower.includes("save") ||
      queryLower.includes("saving") ||
      queryLower.includes("efficient") ||
      queryLower.includes("efficiency")) &&
    (queryLower.includes("water") ||
      queryLower.includes("measure") ||
      queryLower.includes("method"))
  ) {
    return sampleResponses.conservationMeasures;
  }

  // 9. Critical groundwater alerts
  if (
    (queryLower.includes("alert") ||
      queryLower.includes("critical") ||
      queryLower.includes("emergency") ||
      queryLower.includes("warning")) &&
    (queryLower.includes("rajasthan") ||
      queryLower.includes("groundwater") ||
      queryLower.includes("depletion"))
  ) {
    return sampleResponses.alertsRajasthan;
  }

  // 10. List blocks with depletion warnings
  if (
    (queryLower.includes("list") ||
      queryLower.includes("show") ||
      queryLower.includes("display")) &&
    (queryLower.includes("depletion") ||
      queryLower.includes("critical") ||
      queryLower.includes("severe") ||
      queryLower.includes("warning"))
  ) {
    return sampleResponses.alertsRajasthan;
  }

  // Return null if no match, so we can fall back to other processing methods
  return null;
}
