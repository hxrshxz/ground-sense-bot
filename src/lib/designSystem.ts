// ============================================================================
// GROUND SENSE BOT - DESIGN SYSTEM
// ============================================================================
// Centralized color palette and styling constants
// Based on INGRES Portal standards with WCAG 2.1 AA compliance
// ============================================================================

// ============================================================================
// THE 4 KEY ATTRIBUTES
// ============================================================================
// ============================================================================
// UNITS: As per CGWB/INGRES Standards
// ============================================================================
// - Extractable & Extraction: ham (hectare-metre) - volume unit
// - Stage: % (percentage) - derived value
// - Category: none (categorical label)
// ============================================================================

export const FOUR_KEY_ATTRIBUTES = {
  EXTRACTABLE: {
    id: "extractable",
    label: "Annual Extractable GW Resources",
    shortLabel: "Extractable GW",
    unit: "ham", // hectare-metre (CGWB standard)
    icon: "📊",
    description: "How much groundwater can be safely extracted annually",
  },
  EXTRACTION: {
    id: "extraction",
    label: "Annual GW Extraction",
    shortLabel: "GW Extraction",
    unit: "ham", // hectare-metre (CGWB standard)
    icon: "📈",
    description: "Actual groundwater being extracted annually",
  },
  STAGE: {
    id: "stage",
    label: "Stage of Extraction",
    shortLabel: "Stage",
    unit: "%",
    icon: "📉",
    description:
      "Extraction as percentage of available resources (Extraction/Extractable × 100)",
  },
  CATEGORY: {
    id: "category",
    label: "Categorization",
    shortLabel: "Category",
    unit: "", // categorical (no unit)
    icon: "🏷️",
    description: "GEC-2015 classification based on stage of extraction",
  },
} as const;

// ============================================================================
// HIERARCHY LEVELS
// ============================================================================
export const HIERARCHY_LEVELS = {
  STATE: {
    id: "state",
    label: "State",
    icon: "🏛️",
    pluralLabel: "States",
    drillDownTo: "district",
    navigateUpTo: null,
  },
  DISTRICT: {
    id: "district",
    label: "District",
    icon: "🏢",
    pluralLabel: "Districts",
    drillDownTo: "block",
    navigateUpTo: "state",
  },
  BLOCK: {
    id: "block",
    label: "Block",
    icon: "📍",
    pluralLabel: "Blocks",
    drillDownTo: null,
    navigateUpTo: "district",
  },
} as const;

// ============================================================================
// CATEGORY COLORS - USER SPECIFIED MAPPING
// ============================================================================
// Safe: #9eb6cb
// Semi-Critical: Blue
// Critical: Yellow
// Over-Exploited: Red
// ============================================================================

export const CATEGORY_COLORS = {
  // Safe: Green - Stage < 70%
  safe: {
    primary: "#2E7D32", // Government Green 800
    background: "#E8F5E9", // Green 50
    backgroundDark: "#2E7D32",
    border: "#1B5E20", // Green 900
    text: "#1B5E20", // Green 900
    textOnDark: "#FFFFFF", // White for dark backgrounds
    gradient: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
    emoji: "🟢",
    stage: { min: 0, max: 70 },
    label: "Safe",
  },

  // Semi-Critical: Blue - Stage 70-90%
  semiCritical: {
    primary: "#1565C0", // Government Blue 800
    background: "#E3F2FD", // Blue 50
    backgroundDark: "#1565C0",
    border: "#0D47A1", // Blue 900
    text: "#0D47A1", // Blue 900
    textOnDark: "#FFFFFF", // White
    gradient: "linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)",
    emoji: "🔵",
    stage: { min: 70, max: 90 },
    label: "Semi-Critical",
  },

  // Critical: Orange - Stage 90-100%
  critical: {
    primary: "#E65100", // Orange 900 - visible and bold
    background: "#FFF3E0", // Orange 50
    backgroundDark: "#E65100",
    border: "#BF360C", // Deep Orange 900
    text: "#BF360C", // Deep Orange 900
    textOnDark: "#FFFFFF", // White
    gradient: "linear-gradient(135deg, #E65100 0%, #BF360C 100%)",
    emoji: "🟠",
    stage: { min: 90, max: 100 },
    label: "Critical",
  },

  // Over-Exploited: Red - Stage > 100%
  overExploited: {
    primary: "#C62828", // Government Red 800
    background: "#FFEBEE", // Red 50
    backgroundDark: "#C62828",
    border: "#B71C1C", // Red 900
    text: "#B71C1C", // Red 900
    textOnDark: "#FFFFFF", // White
    gradient: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
    emoji: "🔴",
    stage: { min: 100, max: Infinity },
    label: "Over-Exploited",
  },

  // Saline (special category)
  saline: {
    primary: "#6A1B9A", // Purple 800
    background: "#F3E5F5", // Purple 50
    backgroundDark: "#6A1B9A",
    border: "#4A148C", // Purple 900
    text: "#4A148C", // Purple 900
    textOnDark: "#FFFFFF", // White
    gradient: "linear-gradient(135deg, #6A1B9A 0%, #4A148C 100%)",
    emoji: "🟣",
    stage: { min: 0, max: Infinity },
    label: "Saline",
  },

  // Hilly Area (special category)
  hillyArea: {
    primary: "#6D4C41", // Brown 700
    background: "#EFEBE9", // Brown 50
    backgroundDark: "#6D4C41",
    border: "#4E342E", // Brown 900
    text: "#4E342E", // Brown 900
    textOnDark: "#FFFFFF", // White
    gradient: "linear-gradient(135deg, #6D4C41 0%, #4E342E 100%)",
    emoji: "🟤",
    stage: { min: 0, max: Infinity },
    label: "Hilly Area",
  },

  // Unknown/Default
  unknown: {
    primary: "#546E7A", // Blue Grey 600
    background: "#ECEFF1", // Blue Grey 50
    backgroundDark: "#546E7A",
    border: "#37474F", // Blue Grey 800
    text: "#263238", // Blue Grey 900
    textOnDark: "#FFFFFF", // White
    gradient: "linear-gradient(135deg, #546E7A 0%, #37474F 100%)",
    emoji: "⚪",
    stage: { min: 0, max: Infinity },
    label: "Unknown",
  },
} as const;

// ============================================================================
// ATTRIBUTE COLORS - For the 4 Key Attributes
// ============================================================================
export const ATTRIBUTE_COLORS = {
  extractable: {
    primary: "#3B82F6", // Blue 500
    background: "#DBEAFE", // Blue 100
    backgroundDark: "#3B82F6",
    text: "#1E40AF", // Blue 800
    textOnDark: "#FFFFFF", // White
    gradient: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
    icon: "💧",
  },
  extraction: {
    primary: "#F97316", // Orange 500
    background: "#FFEDD5", // Orange 100
    backgroundDark: "#F97316",
    text: "#9A3412", // Orange 800
    textOnDark: "#FFFFFF", // White
    gradient: "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
    icon: "📤",
  },
  stage: {
    primary: "#EF4444", // Red 500
    background: "#FEE2E2", // Red 100
    backgroundDark: "#EF4444",
    text: "#991B1B", // Red 800
    textOnDark: "#FFFFFF", // White
    gradient: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
    icon: "📊",
  },
  category: {
    // Dynamic based on actual category value
    primary: "#6B7280",
    background: "#F3F4F6",
    backgroundDark: "#EF4444",
    text: "#374151",
    textOnDark: "#FFFFFF",
    gradient: "linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)",
    icon: "🏷️",
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get category colors based on category name
 */
export function getCategoryColors(category: string) {
  const normalized = category?.toLowerCase().replace(/[_\s-]/g, "") || "";

  if (normalized.includes("over") || normalized.includes("exploited")) {
    return CATEGORY_COLORS.overExploited;
  }
  if (normalized.includes("critical") && !normalized.includes("semi")) {
    return CATEGORY_COLORS.critical;
  }
  if (normalized.includes("semi")) {
    return CATEGORY_COLORS.semiCritical;
  }
  if (normalized.includes("safe")) {
    return CATEGORY_COLORS.safe;
  }
  if (normalized.includes("saline")) {
    return CATEGORY_COLORS.saline;
  }
  if (normalized.includes("hilly") || normalized.includes("hill")) {
    return CATEGORY_COLORS.hillyArea;
  }
  return CATEGORY_COLORS.unknown;
}

/**
 * Get category from stage percentage
 */
export function getCategoryFromStage(
  stage: number
): keyof typeof CATEGORY_COLORS {
  if (stage > 100) return "overExploited";
  if (stage > 90) return "critical";
  if (stage > 70) return "semiCritical";
  return "safe";
}

/**
 * Get category colors based on stage percentage
 */
export function getCategoryColorsFromStage(stage: number) {
  const category = getCategoryFromStage(stage);
  return CATEGORY_COLORS[category];
}

/**
 * Format category name for display
 */
export function formatCategoryName(category: string): string {
  const normalized = category?.toLowerCase().replace(/[_\s-]/g, "") || "";

  if (normalized.includes("over") || normalized.includes("exploited")) {
    return "Over-Exploited";
  }
  if (normalized.includes("critical") && !normalized.includes("semi")) {
    return "Critical";
  }
  if (normalized.includes("semi")) {
    return "Semi-Critical";
  }
  if (normalized.includes("safe")) {
    return "Safe";
  }
  if (normalized.includes("saline")) {
    return "Saline";
  }
  if (normalized.includes("hilly") || normalized.includes("hill")) {
    return "Hilly Area";
  }
  return category || "Unknown";
}

/**
 * Get stage status label
 */
export function getStageLabel(stage: number): string {
  if (stage > 100) return "Over-Exploited";
  if (stage > 90) return "Critical";
  if (stage > 70) return "Semi-Critical";
  return "Safe";
}

/**
 * Format large numbers for display
 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "N/A";
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(2);
}

/**
 * Format number with unit
 */
export function formatWithUnit(
  num: number | undefined | null,
  unit: string
): string {
  return `${formatNumber(num)} ${unit}`.trim();
}

// ============================================================================
// CHART THEME - ECharts Compatible
// ============================================================================
export const CHART_THEME = {
  backgroundColor: "transparent",
  textStyle: {
    color: "#94A3B8", // Slate 400
    fontFamily: "Inter, system-ui, sans-serif",
  },
  title: {
    textStyle: {
      color: "#F8FAFC", // Slate 50
      fontSize: 16,
      fontWeight: 600,
    },
    subtextStyle: {
      color: "#94A3B8", // Slate 400
      fontSize: 12,
    },
  },
  axisLine: {
    lineStyle: {
      color: "#475569", // Slate 600
    },
  },
  axisTick: {
    lineStyle: {
      color: "#475569",
    },
  },
  axisLabel: {
    color: "#94A3B8",
    fontSize: 11,
  },
  splitLine: {
    lineStyle: {
      color: "#334155", // Slate 700
      type: "dashed" as const,
    },
  },
  tooltip: {
    backgroundColor: "rgba(15, 23, 42, 0.95)", // Slate 900
    borderColor: "rgba(148, 163, 184, 0.2)", // Slate 400
    textStyle: {
      color: "#F8FAFC",
    },
  },
  legend: {
    textStyle: {
      color: "#94A3B8",
      fontSize: 12,
    },
  },
  // Predefined color palette for charts
  colorPalette: [
    "#3B82F6", // Blue (Extractable)
    "#F97316", // Orange (Extraction)
    "#16A34A", // Green (Safe)
    "#CA8A04", // Yellow (Semi-Critical)
    "#EA580C", // Orange (Critical)
    "#DC2626", // Red (Over-Exploited)
    "#8B5CF6", // Violet (Stage)
    "#06B6D4", // Cyan
    "#EC4899", // Pink
  ],
} as const;

// ============================================================================
// PREDEFINED CHART CONFIGURATIONS
// ============================================================================

/**
 * Create a bar chart configuration for extractable vs extraction comparison
 */
export function createExtractionComparisonChart(data: {
  locationName: string;
  extractable: number;
  extraction: number;
  year?: string;
}) {
  return {
    type: "bar",
    title: `${data.locationName} - Groundwater Balance`,
    subtitle: data.year || "2024-2025",
    xAxis: {
      data: ["Extractable GW", "GW Extraction"],
    },
    series: [
      {
        name: "MCM",
        type: "bar",
        data: [
          {
            value: data.extractable,
            itemStyle: { color: ATTRIBUTE_COLORS.extractable.primary },
          },
          {
            value: data.extraction,
            itemStyle: { color: ATTRIBUTE_COLORS.extraction.primary },
          },
        ],
      },
    ],
  };
}

/**
 * Create a gauge chart configuration for stage of extraction
 */
export function createStageGaugeChart(data: {
  locationName: string;
  stage: number;
}) {
  const colors = getCategoryColorsFromStage(data.stage);
  return {
    type: "gauge",
    title: `${data.locationName} - Stage of Extraction`,
    series: [
      {
        name: "Stage",
        type: "gauge",
        min: 0,
        max: Math.max(150, data.stage + 20),
        data: [{ value: data.stage, name: "Stage" }],
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [0.47, CATEGORY_COLORS.safe.primary],
              [0.6, CATEGORY_COLORS.semiCritical.primary],
              [0.67, CATEGORY_COLORS.critical.primary],
              [1, CATEGORY_COLORS.overExploited.primary],
            ],
          },
        },
        detail: {
          formatter: "{value}%",
          color: colors.textOnDark,
        },
      },
    ],
  };
}

/**
 * Create a pie chart configuration for category distribution
 */
export function createCategoryDistributionChart(data: {
  safe: number;
  semiCritical: number;
  critical: number;
  overExploited: number;
}) {
  return {
    type: "pie",
    series: [
      {
        name: "Category Distribution",
        type: "pie",
        radius: ["40%", "70%"],
        data: [
          {
            value: data.safe,
            name: "Safe",
            itemStyle: { color: CATEGORY_COLORS.safe.primary },
          },
          {
            value: data.semiCritical,
            name: "Semi-Critical",
            itemStyle: { color: CATEGORY_COLORS.semiCritical.primary },
          },
          {
            value: data.critical,
            name: "Critical",
            itemStyle: { color: CATEGORY_COLORS.critical.primary },
          },
          {
            value: data.overExploited,
            name: "Over-Exploited",
            itemStyle: { color: CATEGORY_COLORS.overExploited.primary },
          },
        ].filter((d) => d.value > 0),
      },
    ],
  };
}

/**
 * Create a horizontal bar chart for ranking by stage
 */
export function createStageRankingChart(
  data: Array<{
    name: string;
    stage: number;
    category: string;
  }>
) {
  return {
    type: "bar",
    series: [
      {
        name: "Stage (%)",
        type: "bar",
        data: data.map((item) => ({
          value: item.stage,
          itemStyle: { color: getCategoryColors(item.category).primary },
        })),
      },
    ],
    yAxis: {
      type: "category",
      data: data.map((item) => item.name),
    },
    xAxis: {
      type: "value",
      name: "Stage (%)",
    },
  };
}

// ============================================================================
// SUGGESTION TEMPLATES
// ============================================================================
export const SUGGESTION_TEMPLATES = {
  // State level suggestions
  stateLevel: (stateName: string) => [
    `Show districts in ${stateName}`,
    `Critical blocks in ${stateName}`,
    `${stateName} groundwater trend`,
  ],

  // District level suggestions
  districtLevel: (districtName: string, stateName: string) => [
    `Show blocks in ${districtName}`,
    `${stateName} state overview`,
    `Compare districts in ${stateName}`,
  ],

  // Block level suggestions
  blockLevel: (districtName: string, stateName: string) => [
    `${districtName} district overview`,
    `${stateName} state overview`,
    `Show similar blocks`,
  ],

  // General suggestions
  general: () => [
    "Show all states",
    "Punjab groundwater status",
    "Critical blocks in India",
    "Compare Punjab and Haryana",
  ],
} as const;

export default {
  FOUR_KEY_ATTRIBUTES,
  HIERARCHY_LEVELS,
  CATEGORY_COLORS,
  ATTRIBUTE_COLORS,
  CHART_THEME,
  getCategoryColors,
  getCategoryFromStage,
  getCategoryColorsFromStage,
  formatCategoryName,
  getStageLabel,
  formatNumber,
  formatWithUnit,
  createExtractionComparisonChart,
  createStageGaugeChart,
  createCategoryDistributionChart,
  createStageRankingChart,
  SUGGESTION_TEMPLATES,
};
