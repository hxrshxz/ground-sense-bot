package models

// ChatResponse is the structured response sent to the client
type ChatResponse struct {
	Text        string        `json:"text"`
	Intent      string        `json:"intent"`
	Chart       *ChartPayload `json:"chart,omitempty"`
	Map         *MapPayload   `json:"map,omitempty"`
	Data        interface{}   `json:"data,omitempty"`
	Suggestions []string      `json:"suggestions,omitempty"` // Dynamic follow-up query suggestions
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
	MetricsData    *MetricsData    `json:"metricsData,omitempty"`    // For metrics-card type
	TrendData      *TrendData      `json:"trendData,omitempty"`      // For trend-card type
	ComparisonData *ComparisonData `json:"comparisonData,omitempty"` // For comparison-card type
	RiskData       []RiskFactor    `json:"riskData,omitempty"`       // For risk-radar type
	SectorData     []SectorUsage   `json:"sectorData,omitempty"`     // For sector-stacked-bar type
}

// RiskFactor represents a single dimension in the risk radar
type RiskFactor struct {
	Factor string  `json:"factor"`
	Score  float64 `json:"score"` // 0-100 scale (higher is riskier)
	FullMark float64 `json:"fullMark,omitempty"` // Max value (usually 100)
}

// SectorUsage represents usage share for a sector
type SectorUsage struct {
	Sector string  `json:"sector"`
	Value  float64 `json:"value"` // Percentage or absolute value
	Color  string  `json:"color,omitempty"`
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

// ComparisonDataPoint represents a single location's data in comparison
type ComparisonDataPoint struct {
	Name           string  `json:"name"`           // Location name (frontend expects "name" not "locationName")
	Recharge       float64 `json:"recharge"`
	Extraction     float64 `json:"extraction"`
	Stage          float64 `json:"stage"`
	Rainfall       float64 `json:"rainfall"`
	Category       string  `json:"category"`
	SafeBlocks     int     `json:"safeBlocks,omitempty"`
	CriticalBlocks int     `json:"criticalBlocks,omitempty"`
}

// ComparisonData holds comparison data for multiple locations
type ComparisonData struct {
	Year           string                 `json:"year"`
	Locations      []ComparisonDataPoint  `json:"locations"`
	ComparisonType string                 `json:"comparisonType"` // "state", "district", "block"
}

type ChartSeries struct {
	Name    string        `json:"name"`
	Data    []float64     `json:"data,omitempty"`
	DataAny []interface{} `json:"dataAny,omitempty"` // For styled data items with itemStyle
	Type    string        `json:"type,omitempty"`    // Override type per series
}

// XAxisDataItem represents an xAxis label with optional navigation UUID
type XAxisDataItem struct {
	Value        string `json:"value"`                  // Display name
	BlockUUID    string `json:"blockUuid,omitempty"`    // For block navigation
	DistrictUUID string `json:"districtUuid,omitempty"` // For district navigation
}

type PieDatum struct {
	Name         string  `json:"name"`
	Value        float64 `json:"value"`
	BlockUUID    string  `json:"blockUuid,omitempty"`     // For clickable navigation to block overview
	DistrictUUID string  `json:"districtUuid,omitempty"`  // For clickable navigation to district overview
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

// FourAttributeData - Focused response structure for mentor's 4 key attributes
type FourAttributeData struct {
	LocationName string  `json:"locationName"`
	LocationType string  `json:"locationType"` // "state", "district", "block"
	Year         string  `json:"year"`
	
	// The 4 Key Attributes (as per mentor feedback)
	Extractable float64 `json:"extractable"` // Annual Extractable GW Resources (MCM)
	Extraction  float64 `json:"extraction"`  // Annual GW Extraction (MCM)
	Stage       float64 `json:"stage"`       // Stage of Extraction (%)
	Category    string  `json:"category"`    // Categorization
	
	// Hierarchical navigation
	ParentName  string `json:"parentName,omitempty"`  // Parent location name
	ParentType  string `json:"parentType,omitempty"`  // Parent location type
	ChildCount  int    `json:"childCount,omitempty"`  // Number of child units
	ChildType   string `json:"childType,omitempty"`   // "districts" or "blocks"
}

// HierarchyItem - Single item in a list of districts/blocks
type HierarchyItem struct {
	Name       string  `json:"name"`
	Stage      float64 `json:"stage"`
	Category   string  `json:"category"`
	Extraction float64 `json:"extraction"`
}

// HierarchyListData - Response for "list districts/blocks" queries
type HierarchyListData struct {
	ParentName   string          `json:"parentName"`
	ParentType   string          `json:"parentType"`
	Year         string          `json:"year"`
	Items        []HierarchyItem `json:"items"`
	TotalCount   int             `json:"totalCount"`
	DrillDownHint string         `json:"drillDownHint,omitempty"` // e.g., "Show blocks in [district]"
}
