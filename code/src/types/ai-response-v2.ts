// AI Response Types V2 - Enhanced version
export enum DisplayType {
  DEFAULT = "default",
  SINGLE = "single",
  GRID = "grid",
  TABS = "tabs",
  ACCORDION = "accordion",
  COMPARISON = "comparison",
  INTERACTIVE = "interactive",
  DOSSIER = "dossier",
  STATE_SUMMARY = "state_summary",
  LIST = "list",
  FORECAST = "forecast",
  CORRELATION = "correlation",
  RECOMMENDATION = "recommendation",
  ANOMALY_ALERT = "anomaly_alert",
}

export enum ComponentType {
  TEXT = "text",
  MARKDOWN = "markdown",
  TABLE = "table",
  LINE_CHART = "line-chart",
  BAR_CHART = "bar-chart",
  PIE_CHART = "pie-chart",
  GAUGE_CHART = "gauge-chart",
  HEATMAP = "heatmap",
  SCATTER_PLOT = "scatter-plot",
  MAP = "map",
  IMAGE = "image",
  TIMELINE = "timeline",
  ASSESSMENT_CARD = "assessment-card",
  ALERT = "alert",
  BUTTON = "button",
  COLLAPSIBLE = "collapsible",
  CARD = "card",
  KEY_STATS = "key-stats",
  DUAL_LINE_CHART = "dual-line-chart",
  PREDICTION_CARD = "prediction-card",
  DUAL_AXIS_CHART = "dual-axis-chart",
  INSIGHT_CARD = "insight-card",
  CROP_LIST = "crop-list",
  ALERT_CARD = "alert-card",
  KEY_METRICS_BADGES = "key-metrics-badges",
  HOTSPOT_LIST = "hotspot-list",
}

export interface AlertOptions {
  type: "info" | "warning" | "success" | "error";
  title?: string;
}

export interface BaseComponent {
  id: string;
  type: ComponentType;
  title?: string;
  subtitle?: string;
  description?: string;
}

export interface TextComponent extends BaseComponent {
  type: ComponentType.TEXT;
  content: string;
}

export interface MarkdownComponent extends BaseComponent {
  type: ComponentType.MARKDOWN;
  content: string;
}

export interface TableComponent extends BaseComponent {
  type: ComponentType.TABLE;
  headers: string[];
  rows: (string | number)[][];
  caption?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartComponent extends BaseComponent {
  labels: string[];
  datasets: ChartDataset[];
  options?: any; // Chart.js options
}

export interface LineChartComponent extends ChartComponent {
  type: ComponentType.LINE_CHART;
  yAxisLabel?: string;
}

export interface BarChartComponent extends ChartComponent {
  type: ComponentType.BAR_CHART;
  yAxisLabel?: string;
}

export interface PieChartComponent extends ChartComponent {
  type: ComponentType.PIE_CHART;
}

export interface GaugeChartComponent extends BaseComponent {
  type: ComponentType.GAUGE_CHART;
  value: number;
  min: number;
  max: number;
  thresholds?: {
    value: number;
    color: string;
  }[];
}

export interface MapComponent extends BaseComponent {
  type: ComponentType.MAP;
  center: [number, number]; // [latitude, longitude]
  zoom: number;
  markers?: {
    position: [number, number];
    label?: string;
    color?: string;
  }[];
  polygons?: {
    points: [number, number][];
    color?: string;
    label?: string;
  }[];
}

export interface ImageComponent extends BaseComponent {
  type: ComponentType.IMAGE;
  url: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
}

export interface TimelineComponent extends BaseComponent {
  type: ComponentType.TIMELINE;
  events: {
    date: string;
    title: string;
    description?: string;
    icon?: string;
  }[];
}

export interface AssessmentCardComponent extends BaseComponent {
  type: ComponentType.ASSESSMENT_CARD;
  score: number;
  maxScore: number;
  label: string;
  details: {
    title: string;
    value: string | number;
    unit?: string;
    status?: "positive" | "negative" | "neutral";
  }[];
}

export interface AlertComponent extends BaseComponent {
  type: ComponentType.ALERT;
  content: string;
  alertType: "info" | "warning" | "success" | "error";
}

export interface ButtonComponent extends BaseComponent {
  type: ComponentType.BUTTON;
  label: string;
  action: "copy" | "download" | "link";
  actionData?: string; // URL for link, content for copy, etc.
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "destructive"
    | "ghost"
    | "link";
}

export interface CollapsibleComponent extends BaseComponent {
  type: ComponentType.COLLAPSIBLE;
  summary: string;
  content: AIComponent[];
}

export interface CardComponent extends BaseComponent {
  type: ComponentType.CARD;
  content: AIComponent[];
  footer?: string;
}

// Legacy components adapted to new format
export interface KeyValuePair {
  [key: string]: string | number;
}

export interface MetricBadge {
  label: string;
  value: string;
  change?: string;
  variant?: "default" | "alert" | "success" | "warning";
}

export interface KeyStatsComponent extends BaseComponent {
  type: ComponentType.KEY_STATS;
  data: KeyValuePair;
}

export interface KeyMetricsBadgesComponent extends BaseComponent {
  type: ComponentType.KEY_METRICS_BADGES;
  data: MetricBadge[];
}

export interface DualLineChartComponent extends BaseComponent {
  type: ComponentType.DUAL_LINE_CHART;
  labels: string[];
  data: {
    [key: string]: number[] | null[];
  };
  yAxisLabel: string;
}

export interface PredictionCardComponent extends BaseComponent {
  type: ComponentType.PREDICTION_CARD;
  data: KeyValuePair;
}

export interface SeriesItem {
  name: string;
  data: number[];
  type: "line" | "bar";
  yAxis: "left" | "right";
}

export interface DualAxisChartComponent extends BaseComponent {
  type: ComponentType.DUAL_AXIS_CHART;
  labels: string[];
  series: SeriesItem[];
}

export interface InsightCardComponent extends BaseComponent {
  type: ComponentType.INSIGHT_CARD;
  data: KeyValuePair;
}

export interface CropItem {
  name: string;
  waterRequirement: string;
  benefit: string;
}

export interface CropListComponent extends BaseComponent {
  type: ComponentType.CROP_LIST;
  data: CropItem[];
}

export interface HotspotItem {
  district: string;
  stage: string;
}

export interface HotspotListComponent extends BaseComponent {
  type: ComponentType.HOTSPOT_LIST;
  data: HotspotItem[];
}

export interface AlertCardComponent extends BaseComponent {
  type: ComponentType.ALERT_CARD;
  data: {
    status: string;
    message: string;
    details: string;
    action: string;
  };
}

export type AIComponent =
  | TextComponent
  | MarkdownComponent
  | TableComponent
  | LineChartComponent
  | BarChartComponent
  | PieChartComponent
  | GaugeChartComponent
  | MapComponent
  | ImageComponent
  | TimelineComponent
  | AssessmentCardComponent
  | AlertComponent
  | ButtonComponent
  | CollapsibleComponent
  | CardComponent
  | KeyStatsComponent
  | KeyMetricsBadgesComponent
  | DualLineChartComponent
  | PredictionCardComponent
  | DualAxisChartComponent
  | InsightCardComponent
  | CropListComponent
  | HotspotListComponent
  | AlertCardComponent;

export interface AIResponse {
  displayType: DisplayType;
  title?: string;
  components: AIComponent[];
  aiSummary?: string;
  meta?: {
    query?: string;
    timestamp?: string;
    source?: string;
  };
}
