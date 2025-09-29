import { StateGroundwaterProfile } from "@/components/cards/StateDeepDiveCard";

// Example single-state deep dive data (placeholder). Replace with live API or analytical model output as available.
export const PUNJAB_PROFILE: StateGroundwaterProfile = {
  key: "punjab",
  name: "Punjab",
  color: "#dc2626",
  gradient: "from-rose-500 to-red-600",
  category: "Over-Exploited",
  extractionStage: 168,
  annualDeclineM: 0.9,
  rechargeComponents: [
    { name: "Rainfall", value: 42 },
    { name: "Canal Seepage", value: 28 },
    { name: "Irrigation Return", value: 33 },
    { name: "Tank/Pond", value: 11 },
    { name: "Induced", value: 9 },
  ],
  sectors: [
    {
      name: "Agriculture",
      value: 82,
      icon: null,
      color: "linear-gradient(90deg,#f97316,#fb923c)",
    },
    {
      name: "Domestic",
      value: 9,
      icon: null,
      color: "linear-gradient(90deg,#2563eb,#3b82f6)",
    },
    {
      name: "Industrial",
      value: 6,
      icon: null,
      color: "linear-gradient(90deg,#475569,#64748b)",
    },
    {
      name: "Commercial",
      value: 3,
      icon: null,
      color: "linear-gradient(90deg,#059669,#10b981)",
    },
  ],
  drivers: [
    { name: "Free Power", impact: 88 },
    { name: "Paddy MSP", impact: 84 },
    { name: "Canal Inefficiency", impact: 71 },
    { name: "High Water Table Decline", impact: 65 },
    { name: "Climate Variability", impact: 58 },
  ],
  timeSeries: [
    { year: 2015, extraction: 34, recharge: 21, net: -13 },
    { year: 2016, extraction: 35, recharge: 22, net: -13 },
    { year: 2017, extraction: 36, recharge: 22.5, net: -13.5 },
    { year: 2018, extraction: 37.2, recharge: 22.8, net: -14.4 },
    { year: 2019, extraction: 38, recharge: 23, net: -15 },
    { year: 2020, extraction: 38.6, recharge: 23.2, net: -15.4 },
    { year: 2021, extraction: 39.1, recharge: 23.4, net: -15.7 },
    { year: 2022, extraction: 39.4, recharge: 23.6, net: -15.8 },
    { year: 2023, extraction: 40, recharge: 23.7, net: -16.3 },
  ],
  riskFactors: [
    { factor: "Overdraft Volume", score: 92, weight: 5 },
    { factor: "Climate Sensitivity", score: 63, weight: 3 },
    { factor: "Irrigation Efficiency", score: 74, weight: 4 },
    { factor: "Policy Lock-In", score: 81, weight: 4 },
    { factor: "Monitoring Density", score: 55, weight: 2 },
  ],
  recommendations: [
    "Accelerate paddy area realignment toward less water intensive crops via MSP differentiation & direct incentives.",
    "Deploy smart metering & feeder segregation to rationalize energy-groundwater linkage.",
    "Scale managed aquifer recharge pilot projects in canal command zones with high seepage potential.",
    "Mandate precision irrigation adoption (drip/sprinkler) in high-withdrawal blocks with capital subsidy redesign.",
    "Integrate real-time groundwater dashboards at block level to trigger adaptive extraction advisories.",
  ],
  notes:
    "Punjab exhibits structurally entrenched extraction drivers amplified by policy incentives and canal system inefficiencies, requiring sequenced demand management plus targeted recharge augmentation.",
};
export const DELHI_PROFILE: StateGroundwaterProfile = {
  key: "delhi",
  name: "Delhi",
  color: "#2563eb",
  gradient: "from-sky-500 to-blue-600",
  category: "Critical",
  extractionStage: 122,
  annualDeclineM: 0.6,
  rechargeComponents: [
    { name: "Rainfall", value: 48 },
    { name: "Canal Seepage", value: 12 },
    { name: "Irrigation Return", value: 9 },
    { name: "Urban Leakage", value: 15 },
    { name: "Parks/Green", value: 6 },
  ],
  sectors: [
    {
      name: "Domestic",
      value: 44,
      icon: null,
      color: "linear-gradient(90deg,#2563eb,#3b82f6)",
    },
    {
      name: "Commercial",
      value: 18,
      icon: null,
      color: "linear-gradient(90deg,#6366f1,#818cf8)",
    },
    {
      name: "Industrial",
      value: 21,
      icon: null,
      color: "linear-gradient(90deg,#475569,#64748b)",
    },
    {
      name: "Agriculture",
      value: 17,
      icon: null,
      color: "linear-gradient(90deg,#f59e0b,#fbbf24)",
    },
  ],
  drivers: [
    { name: "Urban Growth", impact: 83 },
    { name: "Network Losses", impact: 72 },
    { name: "Industrial Demand", impact: 61 },
    { name: "Rainfall Variability", impact: 58 },
    { name: "Recharge Space Limits", impact: 69 },
  ],
  timeSeries: [
    { year: 2015, extraction: 5.2, recharge: 4.4, net: -0.8 },
    { year: 2016, extraction: 5.3, recharge: 4.5, net: -0.8 },
    { year: 2017, extraction: 5.35, recharge: 4.45, net: -0.9 },
    { year: 2018, extraction: 5.5, recharge: 4.5, net: -1.0 },
    { year: 2019, extraction: 5.6, recharge: 4.55, net: -1.05 },
    { year: 2020, extraction: 5.65, recharge: 4.6, net: -1.05 },
    { year: 2021, extraction: 5.7, recharge: 4.62, net: -1.08 },
    { year: 2022, extraction: 5.78, recharge: 4.65, net: -1.13 },
    { year: 2023, extraction: 5.85, recharge: 4.7, net: -1.15 },
  ],
  riskFactors: [
    { factor: "Urban Demand Surge", score: 86, weight: 4 },
    { factor: "Distribution Losses", score: 73, weight: 3 },
    { factor: "Recharge Constrained", score: 68, weight: 3 },
    { factor: "Climate Extremes", score: 59, weight: 2 },
    { factor: "Monitoring Density", score: 62, weight: 2 },
  ],
  recommendations: [
    "Accelerate NRW (non-revenue water) reduction via active leak detection & pressure zoning.",
    "Scale urban stormwater harvesting retrofits integrated with green infrastructure corridors.",
    "Mandate groundwater audit & metering for high-consumption commercial clusters.",
    "Expand managed recharge using permeable pavement & shallow infiltration galleries.",
    "Deploy sub-basin digital twins for scenario stress testing (heat/drought impacts).",
  ],
  notes:
    "Delhi's stress profile is dominated by urban growth, infrastructure leakage, and constrained recharge footprint; emphasis should be on demand-side optimization and distributed infiltration retrofits.",
};

export const RAJASTHAN_PROFILE: StateGroundwaterProfile = {
  key: "rajasthan",
  name: "Rajasthan",
  color: "#f97316",
  gradient: "from-amber-500 to-orange-600",
  category: "Over-Exploited",
  extractionStage: 142,
  annualDeclineM: 1.2,
  rechargeComponents: [
    { name: "Rainfall", value: 31 },
    { name: "Irrigation Return", value: 22 },
    { name: "Tank/Pond", value: 9 },
    { name: "Canal Seepage", value: 12 },
    { name: "Induced", value: 5 },
  ],
  sectors: [
    {
      name: "Agriculture",
      value: 76,
      icon: null,
      color: "linear-gradient(90deg,#f97316,#fb923c)",
    },
    {
      name: "Domestic",
      value: 12,
      icon: null,
      color: "linear-gradient(90deg,#2563eb,#3b82f6)",
    },
    {
      name: "Industrial",
      value: 7,
      icon: null,
      color: "linear-gradient(90deg,#475569,#64748b)",
    },
    {
      name: "Livestock",
      value: 5,
      icon: null,
      color: "linear-gradient(90deg,#059669,#10b981)",
    },
  ],
  drivers: [
    { name: "Arid Climate", impact: 82 },
    { name: "Canal Over-Reliance", impact: 61 },
    { name: "High ET Loss", impact: 74 },
    { name: "Cropping Intensity", impact: 69 },
    { name: "Well Density", impact: 63 },
  ],
  timeSeries: [
    { year: 2015, extraction: 18.5, recharge: 11.6, net: -6.9 },
    { year: 2016, extraction: 18.8, recharge: 11.7, net: -7.1 },
    { year: 2017, extraction: 19.1, recharge: 11.8, net: -7.3 },
    { year: 2018, extraction: 19.5, recharge: 11.85, net: -7.65 },
    { year: 2019, extraction: 19.9, recharge: 11.9, net: -8.0 },
    { year: 2020, extraction: 20.3, recharge: 11.95, net: -8.35 },
    { year: 2021, extraction: 20.6, recharge: 12.0, net: -8.6 },
    { year: 2022, extraction: 20.9, recharge: 12.05, net: -8.85 },
    { year: 2023, extraction: 21.2, recharge: 12.1, net: -9.1 },
  ],
  riskFactors: [
    { factor: "Aridity", score: 88, weight: 5 },
    { factor: "Decline Rate", score: 79, weight: 4 },
    { factor: "Recharge Variability", score: 71, weight: 3 },
    { factor: "Irrigation Inefficiency", score: 75, weight: 4 },
    { factor: "Adaptive Capacity", score: 58, weight: 2 },
  ],
  recommendations: [
    "Scale micro-catchment water harvesting & desert recharge trenches in priority basins.",
    "Promote millet & low water resilient crop transitions via procurement & extension.",
    "Introduce staged pumping regulation + telemetry for high-decline clusters.",
    "Expand solar-powered drip modernization with performance-based incentives.",
    "Integrate remote-sensed ET monitoring to target efficiency interventions.",
  ],
  notes:
    "Rajasthan's groundwater trajectory reflects structural climatic deficit plus extraction overshoot—requiring aggressive demand moderation blended with decentralized recharge augmentation.",
};

export const SAMPLE_STATE_PROFILES: StateGroundwaterProfile[] = [
  PUNJAB_PROFILE,
  DELHI_PROFILE,
  RAJASTHAN_PROFILE,
];

export const STATE_PROFILE_MAP: Record<string, StateGroundwaterProfile> =
  SAMPLE_STATE_PROFILES.reduce((acc, p) => {
    acc[p.key] = p;
    acc[p.name.toLowerCase()] = p;
    return acc;
  }, {} as Record<string, StateGroundwaterProfile>);
