// /data/groundWaterData.ts

// MODIFIED: BlockData interface now defines the correct nested structure
export interface BlockData {
  type: "Block";
  block: string;
  district: string;
  state: string;
  category: "Over-Exploited" | "Critical";
  recharge: {
    total: number;
    rainfall: number;
    canal: number;
  };
  extraction: {
    total: number;
    irrigation: number;
    domestic: number;
    industry: number;
  };
  stage: string;
  trend: number[];
}

export interface StateData {
  type: "State";
  recharge: { [key: string]: number };
  extraction: { [key: string]: number };
  hotspots: { district: string; stage: string }[];
}

export interface DistrictData {
  type: "District";
  district: string;
  state: string;
  extraction: number[];
  recharge: number[];
  net: number[];
  analysis?: {
    reason: string;
    recommendation: string;
  };
}

export const groundwaterDB: {
  [key: string]: BlockData | StateData | DistrictData;
} = {
  // MODIFIED: delhi data with detailed object structure
  delhi: {
    type: "Block",
    block: "Delhi",
    district: "New Delhi",
    state: "Delhi",
    category: "Over-Exploited",
    recharge: {
      total: 120.5,
      rainfall: 90.5,
      canal: 30.0,
    },
    extraction: {
      total: 155.8,
      irrigation: 140.0,
      domestic: 10.8,
      industry: 5.0,
    },
    stage: "129%",
    trend: [98, 107, 115, 122, 129],
  },
  // MODIFIED: chaksu data now has the detailed object structure
  chaksu: {
    type: "Block",
    block: "Chaksu",
    district: "Jaipur",
    state: "Rajasthan",
    category: "Critical",
    recharge: {
      total: 95.2,
      rainfall: 75.2,
      canal: 20.0,
    },
    extraction: {
      total: 94.1,
      irrigation: 85.0,
      domestic: 7.1,
      industry: 2.0,
    },
    stage: "99%",
    trend: [82, 88, 91, 95, 99],
  },
  "madhya pradesh": {
    type: "State",
    recharge: { total: 3606611 },
    extraction: { total: 2025793 },
    hotspots: [
      { district: "Bhopal", stage: "120%" },
      { district: "Indore", stage: "115%" },
    ],
  },
  ludhiana: {
    type: "District",
    district: "Ludhiana",
    state: "Punjab",
    extraction: [1.82, 1.85, 1.88, 1.9, 1.92],
    recharge: [1.55, 1.56, 1.58, 1.57, 1.59],
    net: [-0.27, -0.29, -0.3, -0.33, -0.33],
    analysis: {
      reason:
        "Ludhiana is a major industrial and agricultural hub in Punjab, with extensive rice and wheat cultivation that requires significant irrigation. This, combined with high population density, leads to greater groundwater extraction.",
      recommendation:
        "Promote Direct Seeded Rice (DSR) and micro-irrigation techniques to reduce agricultural water usage.",
    },
  },
  jalandhar: {
    type: "District",
    district: "Jalandhar",
    state: "Punjab",
    extraction: [1.65, 1.66, 1.68, 1.7, 1.71],
    recharge: [1.68, 1.7, 1.69, 1.72, 1.73],
    net: [0.03, 0.04, 0.01, 0.02, 0.02],
  },
  amritsar: {
    type: "District",
    district: "Amritsar",
    state: "Punjab",
    extraction: [1.7, 1.72, 1.75, 1.78, 1.8],
    recharge: [1.71, 1.73, 1.74, 1.76, 1.77],
    net: [0.01, 0.01, -0.01, -0.02, -0.03],
  },
};
