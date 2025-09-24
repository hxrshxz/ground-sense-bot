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

  punjabRainfall: {
    displayType: DisplayType.TABS,
    title: "Rainfall Impact on Punjab Groundwater Extraction",
    components: [
      {
        id: "1",
        type: ComponentType.MARKDOWN,
        title: "Rainfall-Groundwater Relationship",
        content: `
- Punjab receives an average annual rainfall of 649mm, with 80% occurring during monsoon months (June-September).
- Rainfall directly affects groundwater recharge, with each 100mm of effective rainfall contributing approximately 10-15mm to groundwater tables in agricultural areas.
- The decreasing monsoon reliability has reduced natural recharge by 18% over the last decade, increasing dependence on irrigation from deep tubewells.
        `,
      },
      {
        id: "2",
        type: ComponentType.MARKDOWN,
        title: "Regional Variations",
        content: `
- Northern districts (Gurdaspur, Pathankot) with higher rainfall (~800mm) show lower extraction rates compared to central Punjab.
- Malwa region in southern Punjab receives less rainfall (~450mm) and shows critically higher extraction rates due to water-intensive rice cultivation.
- Temporal distribution of rainfall has become increasingly erratic, affecting the efficacy of natural recharge.
        `,
      },
      {
        id: "3",
        type: ComponentType.MARKDOWN,
        title: "Climate Change Impact",
        content: `
- Punjab has experienced a 7% decrease in average annual rainfall over the past 30 years.
- Increased frequency of high-intensity, short-duration rainfall events has reduced effective percolation.
- Higher temperatures have increased evapotranspiration rates, further reducing the water available for groundwater recharge.
        `,
      },
    ],
    aiSummary:
      "Rainfall patterns significantly impact Punjab's groundwater dynamics, with decreasing and more erratic precipitation contributing to reduced recharge rates. This creates a vicious cycle where less rainfall leads to more groundwater extraction for irrigation, further depleting aquifers. Climate change is exacerbating these issues through decreased overall rainfall, more erratic distribution, and increased evapotranspiration.",
  },

  punjabExtractionIncrease: {
    displayType: DisplayType.TABS,
    title: "Increasing Groundwater Extraction in Ludhiana and Amritsar",
    components: [
      {
        id: "1",
        type: ComponentType.MARKDOWN,
        title: "Current Extraction Rates",
        content: `
- Ludhiana's groundwater extraction has increased from 165% in 2017 to 198% in 2023 (extraction as percentage of recharge).
- Amritsar has seen extraction rates rise from 173% to 188% during the same period.
- Both districts fall in the 'Over-Exploited' category according to the Central Ground Water Board assessment.
        `,
      },
      {
        id: "2",
        type: ComponentType.MARKDOWN,
        title: "Key Driving Factors",
        content: `
- Rice-wheat cropping pattern dominates, with paddy cultivation requiring approximately 3000-5000 liters of water per kg of rice produced.
- Industrial expansion in Ludhiana (textiles, manufacturing) and urban growth in both districts has increased non-agricultural water demand.
- Free electricity policy for agricultural pumping has removed economic barriers to extraction.
- Fragmentation of landholdings has led to proliferation of private tubewells (currently over 1.4 million in Punjab).
        `,
      },
      {
        id: "3",
        type: ComponentType.MARKDOWN,
        title: "Consequences and Trends",
        content: `
- Annual water table decline averages 75cm in Ludhiana and 64cm in Amritsar.
- Deeper extraction has increased pumping costs and energy consumption despite free electricity.
- Declining water quality with increased fluoride, nitrates, and TDS levels in both districts.
- Estimates suggest both districts will face severe water scarcity by 2030 if current extraction rates continue.
        `,
      },
    ],
    aiSummary:
      "Groundwater extraction in Ludhiana and Amritsar continues to increase due to water-intensive agriculture (particularly paddy cultivation), industrial expansion, urban growth, free electricity for agricultural pumping, and proliferation of private tubewells. This has resulted in rapid water table decline, deteriorating water quality, and projections of severe water scarcity by 2030 if current practices continue.",
  },

  punjabRajasthanComparison: {
    displayType: DisplayType.TABS,
    title: "Groundwater Comparison: Punjab vs. Rajasthan",
    components: [
      {
        id: "1",
        type: ComponentType.MARKDOWN,
        title: "Overview",
        content: `
## Groundwater Situation: Punjab vs Rajasthan

Both states face critical groundwater challenges but with important differences in causes, severity, and distribution:

- Punjab has historically been water-rich but now faces severe depletion due to agricultural practices
- Rajasthan has always been water-scarce with extraction concentrated in specific regions
- Punjab shows more rapid overall decline rates
- Rajasthan faces more severe quality issues and regional variations
        `,
      },
      {
        id: "2",
        type: ComponentType.BAR_CHART,
        title: "Extraction vs. Recharge Comparison",
        labels: ["Punjab", "Rajasthan"],
        datasets: [
          {
            label: "Extraction (% of Recharge)",
            data: [166, 137],
            backgroundColor: [
              "rgba(239, 68, 68, 0.7)",
              "rgba(249, 115, 22, 0.7)",
            ],
            borderColor: "rgb(239, 68, 68)",
            borderWidth: 1,
          },
          {
            label: "Over-Exploited Blocks (%)",
            data: [80, 60],
            backgroundColor: [
              "rgba(139, 92, 246, 0.7)",
              "rgba(99, 102, 241, 0.7)",
            ],
            borderColor: "rgb(139, 92, 246)",
            borderWidth: 1,
          },
        ],
      },
      {
        id: "3",
        type: ComponentType.LINE_CHART,
        title: "Annual Water Table Decline (2015-2025)",
        labels: [
          "2015",
          "2016",
          "2017",
          "2018",
          "2019",
          "2020",
          "2021",
          "2022",
          "2023",
          "2024",
          "2025",
        ],
        datasets: [
          {
            label: "Punjab Central Districts (cm)",
            data: [45, 50, 55, 60, 65, 70, 72, 75, 80, 85, 90],
            borderColor: "rgb(239, 68, 68)",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
          },
          {
            label: "Punjab State Average (cm)",
            data: [35, 38, 40, 42, 45, 47, 48, 49, 50, 51, 52],
            borderColor: "rgb(249, 115, 22)",
            backgroundColor: "rgba(249, 115, 22, 0.1)",
            tension: 0.4,
          },
          {
            label: "Rajasthan Western Districts (cm)",
            data: [70, 75, 85, 90, 95, 100, 105, 110, 120, 130, 140],
            borderColor: "rgb(139, 92, 246)",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            tension: 0.4,
          },
          {
            label: "Rajasthan State Average (cm)",
            data: [20, 22, 24, 25, 27, 28, 29, 30, 31, 32, 33],
            borderColor: "rgb(99, 102, 241)",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            tension: 0.4,
          },
        ],
      },
      {
        id: "4",
        type: ComponentType.TABLE,
        title: "Key Drivers of Groundwater Depletion",
        headers: ["Factor", "Punjab", "Rajasthan"],
        rows: [
          [
            "Primary Crop Pattern",
            "Rice-wheat (83% of area)",
            "Mustard, wheat, millet",
          ],
          ["Rainfall", "649mm average", "200-650mm (highly variable)"],
          [
            "Electricity Policy",
            "Free electricity for agriculture",
            "Subsidized but not free",
          ],
          ["Tubewell Density", "34 per sq. km", "12 per sq. km"],
          [
            "Major Quality Issues",
            "Nitrates, heavy metals",
            "Fluoride, salinity, arsenic",
          ],
          ["Urban Pressure", "Moderate", "Severe in specific regions"],
        ],
      },
      {
        id: "5",
        type: ComponentType.PIE_CHART,
        title: "Groundwater Usage by Sector (Punjab)",
        labels: ["Agriculture", "Domestic", "Industrial", "Other"],
        datasets: [
          {
            data: [92, 5, 2, 1],
            label: "Sector Distribution",
            backgroundColor: [
              "rgba(34, 197, 94, 0.7)",
              "rgba(59, 130, 246, 0.7)",
              "rgba(249, 115, 22, 0.7)",
              "rgba(139, 92, 246, 0.7)",
            ],
            borderColor: "rgb(34, 197, 94)",
            borderWidth: 1,
          },
        ],
      },
      {
        id: "6",
        type: ComponentType.PIE_CHART,
        title: "Groundwater Usage by Sector (Rajasthan)",
        labels: ["Agriculture", "Domestic", "Industrial", "Other"],
        datasets: [
          {
            data: [85, 8, 5, 2],
            label: "Sector Distribution",
            backgroundColor: [
              "rgba(34, 197, 94, 0.7)",
              "rgba(59, 130, 246, 0.7)",
              "rgba(249, 115, 22, 0.7)",
              "rgba(139, 92, 246, 0.7)",
            ],
            borderColor: "rgb(34, 197, 94)",
            borderWidth: 1,
          },
        ],
      },
    ],
    aiSummary:
      "While both Punjab and Rajasthan face serious groundwater challenges, their situations differ significantly. Punjab's crisis stems primarily from water-intensive agriculture in a naturally water-sufficient region, exacerbated by free electricity and dense tubewell networks. Rajasthan's issues derive from naturally low rainfall combined with expanding irrigation in arid regions. Punjab shows more rapid overall depletion, while Rajasthan faces more severe regional variations and water quality problems. Both states require urgent but different intervention strategies tailored to their unique contexts.",
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

  policyRechargeImprovements: {
    displayType: DisplayType.TABS,
    title: "Policy Changes to Improve Groundwater Recharge",
    components: [
      {
        id: "1",
        type: ComponentType.MARKDOWN,
        title: "Overview",
        content: `
## Policy Framework for Groundwater Recharge Enhancement

Effective groundwater management requires a robust policy framework that balances regulatory measures with incentives. The following key policy interventions can significantly improve recharge rates and sustainability:

- **Regulatory reforms** to mandate rainwater harvesting and sustainable extraction
- **Financial incentives** to promote conservation and recharge infrastructure
- **Institutional strengthening** for better monitoring and enforcement
- **Market-based instruments** to properly value water resources
- **Integrated planning** approaches across agriculture, urban development, and water sectors
        `,
      },
      {
        id: "2",
        type: ComponentType.BAR_CHART,
        title: "Estimated Impact of Policy Interventions",
        labels: [
          "Mandatory RWH",
          "Extraction Pricing",
          "Agriculture Subsidies Reform",
          "Land Use Regulations",
          "Building Codes",
        ],
        datasets: [
          {
            label: "Recharge Improvement (%)",
            data: [28, 23, 19, 15, 12],
            backgroundColor: [
              "rgba(59, 130, 246, 0.8)",
              "rgba(16, 185, 129, 0.8)",
              "rgba(249, 115, 22, 0.8)",
              "rgba(139, 92, 246, 0.8)",
              "rgba(236, 72, 153, 0.8)",
            ],
            borderColor: "rgb(59, 130, 246)",
            borderWidth: 2,
          },
        ],
      },
      {
        id: "3",
        type: ComponentType.TABLE,
        title: "Policy Instruments and Implementation Timeline",
        headers: [
          "Policy Measure",
          "Impact Level",
          "Implementation Complexity",
          "Timeframe",
          "Key Stakeholders",
        ],
        rows: [
          [
            "Mandatory Rainwater Harvesting",
            "High",
            "Medium",
            "Short-term (1-2 years)",
            "Urban Local Bodies, Construction Sector",
          ],
          [
            "Volumetric Pricing of Groundwater",
            "High",
            "High",
            "Medium-term (2-4 years)",
            "Water Utilities, Industries, Regulators",
          ],
          [
            "Agricultural Subsidy Restructuring",
            "High",
            "Very High",
            "Long-term (4-7 years)",
            "Agriculture Dept., Farmer Associations",
          ],
          [
            "Urban Development Regulations",
            "Medium",
            "Medium",
            "Medium-term (2-3 years)",
            "Urban Planning Authorities",
          ],
          [
            "Green Infrastructure Requirements",
            "Medium",
            "Low",
            "Short-term (1-2 years)",
            "Municipal Corporations, Developers",
          ],
          [
            "Water Trading Mechanisms",
            "High",
            "Very High",
            "Long-term (5-10 years)",
            "Water Resources Dept., Legal Framework",
          ],
        ],
      },
      {
        id: "4",
        type: ComponentType.MARKDOWN,
        title: "Regulatory Reforms",
        content: `
## Regulatory Policy Reforms

### 1. Mandatory Rainwater Harvesting
- Require all new constructions above 100 sq.m to implement rainwater harvesting
- Retrofitting requirements for existing properties on a phased basis
- Technical standards and certification processes for RWH structures
- Penalties for non-compliance linked to property tax assessments

### 2. Groundwater Extraction Regulations
- Transition from flat-rate to volumetric charging systems
- Establish extraction thresholds based on aquifer conditions
- Mandatory metering for all commercial and bulk users
- Differential pricing based on usage and zone criticality
- Monitoring and enforcement through digital tracking systems

### 3. Land Use Planning Controls
- Designate critical recharge zones with special protection status
- Permeable surface requirements in urban development plans
- Stream buffer protection regulations
- Integrate groundwater vulnerability maps into zoning decisions
        `,
      },
      {
        id: "5",
        type: ComponentType.LINE_CHART,
        title: "Projected Benefits of Policy Implementation (2025-2035)",
        labels: [
          "2025",
          "2026",
          "2027",
          "2028",
          "2029",
          "2030",
          "2031",
          "2032",
          "2033",
          "2034",
          "2035",
        ],
        datasets: [
          {
            label: "Groundwater Level Improvement (m)",
            data: [0, 0.3, 0.8, 1.5, 2.1, 2.8, 3.4, 4.1, 4.6, 5.0, 5.5],
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            tension: 0.4,
          },
          {
            label: "Recharge Rate Increase (%)",
            data: [0, 5, 12, 18, 23, 29, 34, 38, 42, 45, 47],
            borderColor: "rgb(16, 185, 129)",
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            tension: 0.4,
          },
          {
            label: "Extraction Reduction (%)",
            data: [0, 3, 8, 14, 19, 25, 30, 34, 37, 40, 42],
            borderColor: "rgb(249, 115, 22)",
            backgroundColor: "rgba(249, 115, 22, 0.2)",
            tension: 0.4,
          },
        ],
      },
      {
        id: "6",
        type: ComponentType.MARKDOWN,
        title: "Incentive Mechanisms",
        content: `
## Financial Incentives & Market Instruments

### 1. Fiscal Incentives
- Tax rebates for implementing advanced recharge structures
- Accelerated depreciation for water conservation equipment
- Reduced development charges for green infrastructure
- CSR incentives for corporate investment in recharge projects
- Property tax reductions for green roofs and permeable surfaces

### 2. Market-Based Instruments
- Tradable groundwater extraction permits
- Payment for ecosystem services models for upstream recharge areas
- Water quality credit trading systems
- Insurance mechanisms for groundwater-dependent farmers
- Public-private partnership models for recharge infrastructure

### 3. Subsidies & Funding Programs
- Redirect agricultural subsidies to water-efficient crops and practices
- Low-interest financing for recharge infrastructure
- Performance-based grants for community recharge projects
- Technical assistance programs bundled with financial support
- Innovation funds for new recharge technologies
        `,
      },
      {
        id: "7",
        type: ComponentType.PIE_CHART,
        title: "Stakeholder Responsibility Distribution",
        labels: [
          "Government Agencies",
          "Private Sector",
          "Civil Society",
          "Research Institutions",
          "Individual Citizens",
        ],
        datasets: [
          {
            label: "Stakeholder Distribution",
            data: [40, 25, 15, 10, 10],
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(16, 185, 129, 0.7)",
              "rgba(249, 115, 22, 0.7)",
              "rgba(139, 92, 246, 0.7)",
              "rgba(236, 72, 153, 0.7)",
            ],
            borderColor: "rgb(59, 130, 246)",
            borderWidth: 1,
          },
        ],
      },
    ],
    aiSummary:
      "Effective policy interventions for groundwater recharge require a balanced approach combining regulatory reforms with financial incentives. The most impactful policies include mandatory rainwater harvesting, volumetric pricing of extraction, and agricultural subsidy reforms, which together could increase recharge rates by up to 47% over a decade. Implementation requires phased timelines with strong institutional frameworks and multi-stakeholder engagement. Success depends on both enforcement capacity and creating genuine economic incentives that align private interests with sustainable groundwater management.",
  },

  cropRecommendations: {
    displayType: DisplayType.ACCORDION,
    title: "Recommended Crops for Water-Scarce Regions",
    components: [
      {
        id: "1",
        type: ComponentType.MARKDOWN,
        title: "Overview",
        content: `
## Drought-Resistant Crop Recommendations

The following crops are specifically recommended for regions with limited water availability and critical groundwater conditions. These selections are based on:

- Water efficiency
- Economic value
- Climate suitability
- Soil compatibility
- Seasonal adaptability
        `,
      },
      {
        id: "2",
        type: ComponentType.TABLE,
        title: "Recommended Crop Varieties",
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
          ["Sorghum (Jowar)", "Low", "Kharif", "Medium", "Variety of Soils"],
          ["Moth Bean", "Very Low", "Kharif", "Medium", "Sandy, Arid"],
          ["Cluster Bean (Guar)", "Low", "Kharif", "High", "Sandy Loam"],
          ["Sesame (Til)", "Low", "Kharif", "High", "Well-drained"],
          ["Castor", "Low", "Kharif", "Medium", "Well-drained"],
        ],
      },
      {
        id: "3",
        type: ComponentType.PIE_CHART,
        title: "Water Requirement Comparison",
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
            label: "Water Requirement (mm/season)",
            data: [1200, 550, 500, 350, 250, 400],
            backgroundColor: [
              "rgba(255, 99, 132, 0.7)",
              "rgba(255, 159, 64, 0.7)",
              "rgba(255, 205, 86, 0.7)",
              "rgba(75, 192, 192, 0.7)",
              "rgba(54, 162, 235, 0.7)",
              "rgba(153, 102, 255, 0.7)",
            ],
            borderColor: "rgb(255, 99, 132)",
            borderWidth: 1,
          },
        ],
      },
      {
        id: "4",
        type: ComponentType.MARKDOWN,
        title: "Implementation Guidelines",
        content: `
## Best Practices for Implementation

### Irrigation Methods
- Use drip irrigation systems to reduce water consumption by 30-40%
- Implement micro-sprinklers for certain crops like vegetables
- Schedule irrigation based on soil moisture sensors
- Consider deficit irrigation techniques during non-critical growth stages

### Crop Rotation
- Rotate between legumes (chickpea) and cereals (millet, sorghum)
- Include cover crops during fallow periods to improve soil health
- Alternate shallow and deep-rooted crops to utilize different soil moisture layers
- Implement 3-4 year rotation cycles for optimal soil health

### Soil Management
- Apply organic mulch to reduce evaporation
- Maintain soil organic matter through composting
- Practice minimum tillage to preserve soil structure
- Use contour farming in sloped areas to maximize rainfall capture
        `,
      },
      {
        id: "5",
        type: ComponentType.ALERT,
        title: "Important Recommendations",
        content:
          "Crop selection should always be paired with water-efficient irrigation practices such as drip irrigation or micro-sprinklers to maximize water use efficiency. Consider crop rotation to maintain soil health and prevent pest buildup.",
        alertType: "info",
      },
      {
        id: "6",
        type: ComponentType.BAR_CHART,
        title: "Water Productivity Comparison",
        labels: [
          "Pearl Millet",
          "Chickpea",
          "Sorghum",
          "Cluster Bean",
          "Sesame",
          "Rice (for comparison)",
        ],
        datasets: [
          {
            label: "Economic Return per Unit Water (₹/m³)",
            data: [12.5, 15.2, 10.8, 14.3, 16.7, 4.2],
            backgroundColor: [
              "rgba(75, 192, 192, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(153, 102, 255, 0.8)",
              "rgba(255, 205, 86, 0.8)",
              "rgba(255, 159, 64, 0.8)",
              "rgba(255, 99, 132, 0.8)",
            ],
            borderColor: "rgb(75, 192, 192)",
            borderWidth: 1,
          },
        ],
      },
      {
        id: "7",
        type: ComponentType.MARKDOWN,
        title: "AI Summary",
        content: `
For water-scarce regions like Chaksu, drought-resistant crops such as Pearl Millet, Chickpea, and Sorghum are recommended. These crops require 60-80% less water than conventional crops like rice and wheat while providing good economic returns. Implementing water-efficient irrigation techniques alongside these crop choices can help sustain agricultural productivity while reducing groundwater extraction.

**Key Benefits:**
- Significant water savings (60-80% less than conventional crops)
- Maintains agricultural productivity
- Reduces pressure on groundwater
- Provides sustainable economic returns
- Improves soil health when rotated properly
        `,
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

  rainfallImpactGroundwater: {
    displayType: DisplayType.TABS,
    title: "Rainfall's Impact on Groundwater Recharge",
    components: [
      {
        id: "1",
        type: ComponentType.MARKDOWN,
        title: "Regional Rainfall Contribution",
        content: `
## Key Findings:

- In the **Chaksu** block, rainfall provides **75.2 units** of the total **95.2 units** of groundwater recharge (79% of total recharge)
- In the **Delhi** block, rainfall contributes **90.5 units** of the total **120.5 units** of recharge (75% of total recharge)
- Other natural sources (river seepage, canal leakage) contribute the remaining recharge
- Artificial recharge initiatives currently contribute <5% to total recharge in most blocks
        `,
      },
      {
        id: "2",
        type: ComponentType.PIE_CHART,
        title: "Chaksu Block: Recharge Sources",
        labels: ["Rainfall", "Other Natural Sources", "Artificial Recharge"],
        datasets: [
          {
            label: "Recharge Sources",
            data: [75.2, 16.5, 3.5],
            backgroundColor: ["#3182CE", "#38A169", "#DD6B20"],
            borderWidth: 1,
          },
        ],
        options: {
          plugins: {
            legend: {
              position: "right",
              labels: {
                font: {
                  size: 14,
                },
              },
            },
            title: {
              display: true,
              text: "Chaksu Block: Groundwater Recharge Sources (units)",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.label || "";
                  let value = context.raw || 0;
                  let total = context.dataset.data.reduce((a, b) => a + b, 0);
                  let percentage = Math.round((value / total) * 100);
                  return `${label}: ${value} units (${percentage}%)`;
                },
              },
            },
          },
        },
      },
      {
        id: "3",
        type: ComponentType.PIE_CHART,
        title: "Delhi Block: Recharge Sources",
        labels: ["Rainfall", "Other Natural Sources", "Artificial Recharge"],
        datasets: [
          {
            label: "Recharge Sources",
            data: [90.5, 24.8, 5.2],
            backgroundColor: ["#3182CE", "#38A169", "#DD6B20"],
            borderWidth: 1,
          },
        ],
        options: {
          plugins: {
            legend: {
              position: "right",
              labels: {
                font: {
                  size: 14,
                },
              },
            },
            title: {
              display: true,
              text: "Delhi Block: Groundwater Recharge Sources (units)",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.label || "";
                  let value = context.raw || 0;
                  let total = context.dataset.data.reduce((a, b) => a + b, 0);
                  let percentage = Math.round((value / total) * 100);
                  return `${label}: ${value} units (${percentage}%)`;
                },
              },
            },
          },
        },
      },
      {
        id: "4",
        type: ComponentType.BAR_CHART,
        title: "Rainfall vs. Total Recharge Comparison",
        labels: ["Chaksu Block", "Delhi Block"],
        datasets: [
          {
            label: "Rainfall Contribution",
            data: [75.2, 90.5],
            backgroundColor: "rgba(49, 130, 206, 0.7)",
            borderColor: "rgba(44, 82, 130, 1)",
            borderWidth: 1,
          },
          {
            label: "Total Recharge",
            data: [95.2, 120.5],
            backgroundColor: "rgba(56, 161, 105, 0.7)",
            borderColor: "rgba(39, 103, 73, 1)",
            borderWidth: 1,
          },
        ],
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "top",
            },
            title: {
              display: true,
              text: "Rainfall Contribution to Groundwater Recharge (units)",
              font: {
                size: 16,
                weight: "bold",
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || "";
                  let value = context.raw || 0;
                  return `${label}: ${value} units`;
                },
              },
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Location",
              },
            },
            y: {
              title: {
                display: true,
                text: "Recharge Units",
              },
              beginAtZero: true,
            },
          },
        },
      },
      {
        id: "5",
        type: ComponentType.MARKDOWN,
        title: "Analysis & Implications",
        content: `
## Analysis:

- Rainfall is the **dominant source of groundwater recharge** in both Chaksu and Delhi blocks
- The Delhi block benefits from higher absolute rainfall contribution (90.5 units vs 75.2 units)
- Chaksu has a slightly higher dependency on rainfall as a percentage of total recharge (79% vs 75%)
- Both regions would face severe groundwater stress during drought years or periods of below-average rainfall
- The relatively small contribution from artificial recharge methods (3.5-5.2 units) indicates significant potential for improvement

## Implications:

- Rainfall patterns directly impact annual groundwater availability
- Climate change-induced rainfall variability poses a serious threat to groundwater sustainability
- Increasing artificial recharge infrastructure could help buffer against rainfall fluctuations
- Developing rainwater harvesting structures should be prioritized in regional water management plans
- Sustainable extraction limits should account for annual rainfall variations
        `,
      },
    ],
    aiSummary:
      "Rainfall is the primary contributor to groundwater recharge in both Chaksu and Delhi blocks in Rajasthan, accounting for 75-79% of total recharge. Chaksu receives 75.2 units from rainfall out of 95.2 total recharge units, while Delhi receives 90.5 units from rainfall out of 120.5 total recharge units. The high dependence on rainfall makes these regions vulnerable to climate variability, while the relatively small contribution from artificial recharge methods (3.5-5.2 units) indicates significant opportunity for enhancement of managed aquifer recharge infrastructure.",
  },
};

// Function to get a response based on query
export function getAIResponse(query: string): AIResponse | null {
  const queryLower = query.toLowerCase();

  // Better keyword matching with more specific patterns

  // First check for the specific Punjab vs Rajasthan comparison query (highest priority)
  if (
    (queryLower.includes("punjab") && queryLower.includes("rajasthan")) ||
    queryLower.includes("punjab rajasthan")
  ) {
    console.log("Direct match on Punjab Rajasthan keywords");
    return sampleResponses.punjabRajasthanComparison;
  }

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

  // 11. Punjab Groundwater Extraction Increasing
  if (
    (queryLower.includes("why") || queryLower.includes("reason")) &&
    queryLower.includes("extraction") &&
    queryLower.includes("increasing") &&
    (queryLower.includes("ludhiana") || queryLower.includes("amritsar"))
  ) {
    return sampleResponses.punjabExtractionIncrease;
  }

  // Rainfall Impact on Groundwater (General)
  if (
    queryLower.includes("rainfall") &&
    queryLower.includes("impact") &&
    queryLower.includes("groundwater")
  ) {
    return sampleResponses.rainfallImpactGroundwater;
  }

  // 12. Punjab Rainfall Impact
  if (
    queryLower.includes("rainfall") &&
    queryLower.includes("pattern") &&
    queryLower.includes("punjab") &&
    (queryLower.includes("groundwater") || queryLower.includes("extraction"))
  ) {
    return sampleResponses.punjabRainfall;
  }

  // 13. Punjab vs Rajasthan Comparison - More aggressive matching
  if (
    (queryLower.includes("punjab") && queryLower.includes("rajasthan")) ||
    (queryLower.includes("punjab") &&
      queryLower.includes("situation") &&
      queryLower.includes("compare"))
  ) {
    console.log("Matched Punjab vs Rajasthan comparison query");
    return sampleResponses.punjabRajasthanComparison;
  }

  // 14. Catch-all for any Punjab and Rajasthan combined query
  if (queryLower.includes("punjab") && queryLower.includes("rajasthan")) {
    console.log("Matched Punjab and Rajasthan catch-all");
    return sampleResponses.punjabRajasthanComparison;
  }

  // 15. Policy Changes for Recharge Improvement
  if (
    queryLower.includes("policy") &&
    (queryLower.includes("change") ||
      queryLower.includes("reform") ||
      queryLower.includes("improve")) &&
    (queryLower.includes("recharge") || queryLower.includes("groundwater"))
  ) {
    console.log("Matched policy changes for recharge query");
    return sampleResponses.policyRechargeImprovements;
  }

  // Return null if no match, so we can fall back to other processing methods
  return null;
}
