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
	Type    string                 `json:"type"` // "bar", "line", "pie"
	Title   string                 `json:"title"`
	XAxis   []string               `json:"xAxis,omitempty"`
	Series  []ChartSeries          `json:"series"`
	Options map[string]interface{} `json:"options,omitempty"` // Extra ECharts options
	EChartsOption interface{}      `json:"echarts_option,omitempty"` // Full ECharts option object
}

type ChartSeries struct {
	Name string    `json:"name"`
	Data []float64 `json:"data"`
	Type string    `json:"type,omitempty"` // Override type per series
}

// MapPayload defines the structure for Map visualizations (GeoJSON)
type MapPayload struct {
	Title   string      `json:"title"`
	GeoJSON interface{} `json:"geoJSON"` // Raw GeoJSON object
	Center  []float64   `json:"center,omitempty"`
	Zoom    int         `json:"zoom,omitempty"`
}


