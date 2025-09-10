// For backward compatibility
// Import enhanced version
import { DisplayType as DisplayTypeV2, ComponentType as ComponentTypeV2, AIResponse as AIResponseV2 } from './ai-response-v2';

export type { DisplayTypeV2, ComponentTypeV2, AIResponseV2 };

// Legacy types below for backward compatibility
export type DisplayType = 
  | 'dossier'
  | 'comparison'
  | 'state_summary'
  | 'list'
  | 'forecast'
  | 'correlation'
  | 'recommendation'
  | 'anomaly_alert';

// Legacy component types
export type LegacyComponentType =
  | 'KeyStats'
  | 'PieChart'
  | 'LineChart'
  | 'BarChart'
  | 'Table'
  | 'DualLineChart'
  | 'PredictionCard'
  | 'DualAxisChart'
  | 'InsightCard'
  | 'CropList'
  | 'AlertCard'
  | 'KeyMetricsBadges'
  | 'HotspotList';

export interface LegacyChartData {
  [key: string]: number[] | null[];
}

export interface LegacyPieChartItem {
  name: string;
  value: number;
}

export interface LegacyKeyValuePair {
  [key: string]: string | number;
}

export interface LegacyMetricBadge {
  label: string;
  value: string;
  change?: string;
  variant?: 'default' | 'alert' | 'success' | 'warning';
}

export interface LegacyTableComponent {
  type: 'Table';
  headers: string[];
  rows: string[][];
}

export interface LegacyPieChartComponent {
  type: 'PieChart';
  title: string;
  data: LegacyPieChartItem[];
}

export interface LegacyLineChartComponent {
  type: 'LineChart';
  title: string;
  labels: string[];
  data: LegacyChartData;
  yAxisLabel: string;
}

export interface LegacyBarChartComponent {
  type: 'BarChart';
  title: string;
  labels: string[];
  data: LegacyChartData;
  yAxisLabel: string;
}

export interface LegacyKeyStatsComponent {
  type: 'KeyStats';
  data: LegacyKeyValuePair;
}

export interface LegacyKeyMetricsBadgesComponent {
  type: 'KeyMetricsBadges';
  data: LegacyMetricBadge[];
}

export interface LegacyDualLineChartComponent {
  type: 'DualLineChart';
  title: string;
  labels: string[];
  data: LegacyChartData;
  yAxisLabel: string;
}

export interface LegacyPredictionCardComponent {
  type: 'PredictionCard';
  data: LegacyKeyValuePair;
}

export interface LegacySeriesItem {
  name: string;
  data: number[];
  type: 'line' | 'bar';
  yAxis: 'left' | 'right';
}

export interface LegacyDualAxisChartComponent {
  type: 'DualAxisChart';
  title: string;
  labels: string[];
  series: LegacySeriesItem[];
}

export interface LegacyInsightCardComponent {
  type: 'InsightCard';
  data: LegacyKeyValuePair;
}

export interface LegacyCropItem {
  name: string;
  waterRequirement: string;
  benefit: string;
}

export interface LegacyCropListComponent {
  type: 'CropList';
  title: string;
  data: LegacyCropItem[];
}

export interface LegacyHotspotItem {
  district: string;
  stage: string;
}

export interface LegacyHotspotListComponent {
  type: 'HotspotList';
  title: string;
  data: LegacyHotspotItem[];
}

export interface LegacyAlertCardComponent {
  type: 'AlertCard';
  data: {
    status: string;
    message: string;
    details: string;
    action: string;
  };
}

export type ComponentData = 
  | LegacyKeyStatsComponent
  | LegacyPieChartComponent
  | LegacyLineChartComponent
  | LegacyBarChartComponent
  | LegacyTableComponent
  | LegacyDualLineChartComponent
  | LegacyPredictionCardComponent
  | LegacyDualAxisChartComponent
  | LegacyInsightCardComponent
  | LegacyCropListComponent
  | LegacyKeyMetricsBadgesComponent
  | LegacyHotspotListComponent
  | LegacyAlertCardComponent;

export interface LegacyAIResponse {
  displayType: DisplayType;
  title: string;
  components: ComponentData[];
  aiSummary: string;
}

// Helper function to convert legacy response to new format
export function convertLegacyToV2(legacy: LegacyAIResponse): AIResponseV2 {
  // Conversion logic would go here
  return {
    displayType: DisplayTypeV2.DEFAULT,
    title: legacy.title,
    components: [],
    aiSummary: legacy.aiSummary
  };
}

// Legacy AIResponse with a different name to avoid conflict
export type { LegacyAIResponse as AIResponse };
