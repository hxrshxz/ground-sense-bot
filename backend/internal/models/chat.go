package models

// ChatResponse is the structured response sent to the client
type ChatResponse struct {
	Text   string        `json:"text"`
	Intent string        `json:"intent"`
	Chart  *ChartPayload `json:"chart,omitempty"`
	Map    *MapPayload   `json:"map,omitempty"`
	Data   interface{}   `json:"data,omitempty"`
}

// ChartPayload defines the structure for ECharts
type ChartPayload struct {
	Type        string                 `json:"type"` // e.g., stacked-area, gradient-area, rose-pie, timeline-bar, brush-bar, large-area, metrics-card, trend-card
	Title       string                 `json:"title"`
	Explanation string                 `json:"explanation,omitempty"`
	XAxis       interface{}            `json:"xAxis,omitempty"` // []string or { data: []string }
	Series      []ChartSeries          `json:"series"`
	PieData     []PieDatum             `json:"pieData,omitempty"`
	Timeline    *TimelinePayload       `json:"timeline,omitempty"`
	TimelineOptions []TimelineOption   `json:"timelineOptions,omitempty"`
	Options     map[string]interface{} `json:"options,omitempty"` // Extra ECharts options (rarely used)
	EChartsOption interface{}          `json:"echarts_option,omitempty"` // Ignored by frontend renderer but kept for compatibility
	MetricsData *MetricsData           `json:"metricsData,omitempty"` // For metrics-card type
	TrendData   *TrendData             `json:"trendData,omitempty"`   // For trend-card type
}

// MetricsData holds groundwater metrics for visualization
type MetricsData struct {
	LocationName       string                  `json:"locationName"`
	LocationType       string                  `json:"locationType"` // "block", "district", "state"
	Year               string                  `json:"year"`
	Category           string                  `json:"category"`
	Rainfall           float64                 `json:"rainfall"`
	TotalRecharge      float64                 `json:"totalRecharge"`
	TotalExtraction    float64                 `json:"totalExtraction"`
	TotalExtractable   float64                 `json:"totalExtractable"`
	NaturalDischarge   float64                 `json:"naturalDischarge"`
	Stage              float64                 `json:"stage"`
	Availability       float64                 `json:"availability,omitempty"`
	RechargeBreakdown  []BreakdownItem         `json:"rechargeBreakdown,omitempty"`
	ExtractionBreakdown []BreakdownItem        `json:"extractionBreakdown,omitempty"`
	// Aggregated data for district/state
	TotalBlocks        int                     `json:"totalBlocks,omitempty"`
	SafeBlocks         int                     `json:"safeBlocks,omitempty"`
	SemiCriticalBlocks int                     `json:"semiCriticalBlocks,omitempty"`
	CriticalBlocks     int                     `json:"criticalBlocks,omitempty"`
	OverExploitedBlocks int                    `json:"overExploitedBlocks,omitempty"`
}

// BreakdownItem represents a source and its value
type BreakdownItem struct {
	Source string  `json:"source"`
	Value  float64 `json:"value"`
}

// TrendDataPoint represents a single year's data point in trend analysis
type TrendDataPoint struct {
	Year       string  `json:"year"`
	Recharge   float64 `json:"recharge"`
	Extraction float64 `json:"extraction"`
	Stage      float64 `json:"stage"`
	Rainfall   float64 `json:"rainfall"`
	Category   string  `json:"category"`
}

// TrendData holds trend analysis data for visualization
type TrendData struct {
	LocationName      string           `json:"locationName"`
	LocationType      string           `json:"locationType"` // "block", "district", "state"
	StartYear         string           `json:"startYear"`
	EndYear           string           `json:"endYear"`
	DataPoints        []TrendDataPoint `json:"dataPoints"`
	// Calculated insights (percentage change from first to last year)
	RechargeChange    float64          `json:"rechargeChange"`
	ExtractionChange  float64          `json:"extractionChange"`
	StageChange       float64          `json:"stageChange"`
	OverallTrend      string           `json:"overallTrend"` // "improving", "stable", "declining"
}

type ChartSeries struct {
	Name string    `json:"name"`
	Data []float64 `json:"data"`
	Type string    `json:"type,omitempty"` // Override type per series
}

type PieDatum struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
}

type TimelinePayload struct {
	Data         []string `json:"data"`
	AutoPlay     bool     `json:"autoPlay,omitempty"`
	PlayInterval int      `json:"playInterval,omitempty"`
}

type TimelineOption struct {
	Title  string        `json:"title"`
	Series []ChartSeries `json:"series"`
}

// MapPayload defines the structure for Map visualizations (GeoJSON)
type MapPayload struct {
	Title   string      `json:"title"`
	GeoJSON interface{} `json:"geoJSON"` // Raw GeoJSON object
	Center  []float64   `json:"center,omitempty"`
	Zoom    int         `json:"zoom,omitempty"`
}


