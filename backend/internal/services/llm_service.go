package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/config"
	"google.golang.org/api/option"
)

type LLMService struct {
	client *genai.Client
	model  *genai.GenerativeModel
}

func NewLLMService(cfg *config.Config) (*LLMService, error) {
	if cfg.Gemini.APIKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not set")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(cfg.Gemini.APIKey))
	if err != nil {
		return nil, err
	}

	// Use gemini-pro-latest - available model
	model := client.GenerativeModel("gemini-2.5-flash")
	model.SetTemperature(0.2) // Low temperature for deterministic SQL

	return &LLMService{
		client: client,
		model:  model,
	}, nil
}

func (s *LLMService) GenerateSQL(userMessage string, schema string) (string, error) {
	ctx := context.Background()
	prompt := fmt.Sprintf(`
You are a PostgreSQL expert. Convert the user's question into a valid SQL query.
Schema:
%s

Rules:
1. Return ONLY the SQL query. No markdown, no explanations.
2. Use 'assessments_summary' for general data (rainfall, stage, category).
3. Use 'assessments_recharge_breakdown', 'assessments_extraction_breakdown', 'assessments_discharge_breakdown' for detailed breakdowns.
4. Join with 'blocks', 'districts', 'states' to filter by location names.
5. Use ILIKE for name matching.
6. If the user asks for a trend, select 'year' and the metric, ordered by year.
7. If the user asks for a comparison, select 'block_name' and the metric.
8. Default to the latest year '2024-2025' if no year is specified.

User Question: "%s"
SQL:`, schema, userMessage)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil {
		return "", fmt.Errorf("no response from LLM")
	}

	part := resp.Candidates[0].Content.Parts[0]
	text, ok := part.(genai.Text)
	if !ok {
		return "", fmt.Errorf("unexpected response format")
	}

	sql := string(text)
	sql = strings.TrimSpace(sql)
	sql = strings.TrimPrefix(sql, "```sql")
	sql = strings.TrimPrefix(sql, "```")
	sql = strings.TrimSuffix(sql, "```")
	return strings.TrimSpace(sql), nil
}

func (s *LLMService) GenerateVisualization(data interface{}, query string, userMessage string) (string, string, error) {
	ctx := context.Background()
	dataJSON, _ := json.Marshal(data)
	
	// Truncate data if too large to avoid token limits
	if len(dataJSON) > 10000 {
		dataJSON = dataJSON[:10000]
	}

	prompt := fmt.Sprintf(`
You are an Expert Data Visualization Architect specializing in Apache ECharts.

USER QUERY: "%s"
SQL QUERY: "%s"
DATA RESULT: %s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK: Generate a stunning, interactive ECharts configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AVAILABLE CHART TYPES (IMPORTANT: DO NOT USE PIE CHARTS!):
1. **line** - For trends over time, time series (USE AREA FILL!)
2. **bar** - For comparisons, rankings, distributions, breakdowns
3. **scatter** - For correlations, clustering, multi-dimensional data
4. **heatmap** - For matrix data, correlation grids
5. **gauge** - For single metrics, KPIs, percentages
6. **radar** - For multi-metric comparisons
7. **table** - For precise tabular data display
8. **text** - For simple text responses

⚠️ NEVER USE PIE CHARTS! Use bar charts for proportions/breakdowns instead.

CHART SELECTION LOGIC:
- TREND OVER TIME → use "line" with smooth curves and gradient area fill
- COMPARISON between locations → use "bar" with gradients
- BREAKDOWN/PROPORTION → use "bar" (horizontal or vertical)
- MULTIPLE METRICS per item → use "radar" chart
- CORRELATION/RELATIONSHIP → use "scatter" chart
- SINGLE VALUE/PERCENTAGE → use "gauge" chart
- MATRIX STRUCTURE → use "heatmap"

ECHARTS CONFIGURATION REQUIREMENTS:

1. **Visual Excellence**:
   - Use modern color palettes: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
   - Add gradients for bars/areas
   - Use borderRadius for modern look
   - Include shadows for depth

2. **Interactivity**:
   - Enable rich tooltips with formatters
   - Add dataZoom for large datasets
   - Include toolbox with saveAsImage, dataView, restore
   - Use emphasis effects on hover

3. **Data Insights**:
   - Add markLines for averages/thresholds
   - Use visualMap for heatmaps
   - Include legends with rich content
   - Add annotations for key insights

4. **Responsive Design**:
   - Use percentage-based dimensions
   - Ensure proper grid spacing
   - Handle long labels with rotation/ellipsis

OUTPUT FORMAT (JSON only, no markdown):
{
  "type": "bar|line|pie|scatter|heatmap|gauge|radar|table|text",
  "title": "Descriptive Chart Title",
  "explanation": "Brief 1-2 sentence insight about what the data shows",
  "echarts_option": {
    "backgroundColor": "transparent",
    "title": {
      "text": "Chart Title",
      "left": "center",
      "top": 20,
      "textStyle": { "color": "#1e293b", "fontSize": 18, "fontWeight": 600 }
    },
    "tooltip": { ... },
    "legend": { ... },
    "grid": { "left": "3%%", "right": "4%%", "bottom": "15%%", "top": "15%%", "containLabel": true },
    "toolbox": {
      "feature": {
        "saveAsImage": { "title": "Download", "pixelRatio": 2 },
        "dataZoom": { "yAxisIndex": "none" },
        "restore": { "title": "Reset" }
      }
    },
    "xAxis": { ... },
    "yAxis": { ... },
    "series": [ ... ]
  }
}

EXAMPLES:

For TREND query "Show me groundwater trend for Ludhiana 2017-2024":
{
  "type": "line",
  "title": "Groundwater Trends in Ludhiana (2017-2024)",
  "explanation": "Recharge shows steady increase while extraction remains stable, indicating improving groundwater balance.",
  "echarts_option": {
    "title": { "text": "Groundwater Trends - Ludhiana", "left": "center" },
    "tooltip": { "trigger": "axis", "axisPointer": { "type": "cross" } },
    "legend": { "bottom": 0, "data": ["Recharge", "Extraction"] },
    "xAxis": { "type": "category", "data": ["2017-18", "2018-19", "2019-20", "2020-21", "2021-22", "2022-23", "2023-24"] },
    "yAxis": { "type": "value", "name": "Volume (mcm)" },
    "series": [
      {
        "name": "Recharge",
        "type": "line",
        "smooth": true,
        "data": [450, 480, 520, 510, 540, 560, 580],
        "lineStyle": { "width": 3, "color": "#10b981" },
        "areaStyle": { "color": "rgba(16, 185, 129, 0.2)" }
      },
      {
        "name": "Extraction",
        "type": "line",
        "smooth": true,
        "data": [420, 430, 425, 435, 440, 445, 450],
        "lineStyle": { "width": 3, "color": "#ef4444" },
        "areaStyle": { "color": "rgba(239, 68, 68, 0.2)" }
      }
    ]
  }
}

For BREAKDOWN query "Show me recharge breakdown for Jaisinagar":
{
  "type": "pie",
  "title": "Recharge Sources Distribution - Jaisinagar",
  "explanation": "Rainfall contributes 68%% of total recharge, with canal seepage providing the remaining 32%%.",
  "echarts_option": {
    "title": { "text": "Recharge Sources", "left": "center" },
    "tooltip": { "trigger": "item", "formatter": "{b}: {c} mcm ({d}%%)" },
    "series": [{
      "type": "pie",
      "radius": ["40%%", "70%%"],
      "data": [
        { "value": 235, "name": "Rainfall", "itemStyle": { "color": "#3b82f6" } },
        { "value": 110, "name": "Canal Seepage", "itemStyle": { "color": "#10b981" } }
      ],
      "label": { "formatter": "{b}: {d}%%" }
    }]
  }
}

Now generate the visualization for the given data:`, userMessage, query, string(dataJSON))

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		fmt.Printf("DEBUG: GenerateVisualization LLM Error: %v\n", err)
		return "", "", err
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil {
		fmt.Printf("DEBUG: GenerateVisualization No Candidates\n")
		return "", "", fmt.Errorf("no response from LLM")
	}

	part := resp.Candidates[0].Content.Parts[0]
	text, ok := part.(genai.Text)
	if !ok {
		fmt.Printf("DEBUG: GenerateVisualization Unexpected Format\n")
		return "", "", fmt.Errorf("unexpected response format")
	}

	jsonStr := string(text)
	fmt.Printf("DEBUG: GenerateVisualization Raw JSON: %s\n", jsonStr)
	
	// Clean markdown code blocks
	jsonStr = strings.TrimSpace(jsonStr)
	if strings.HasPrefix(jsonStr, "```") {
		// Find first newline
		if idx := strings.Index(jsonStr, "\n"); idx != -1 {
			jsonStr = jsonStr[idx+1:]
		}
		// Remove trailing ```
		if idx := strings.LastIndex(jsonStr, "```"); idx != -1 {
			jsonStr = jsonStr[:idx]
		}
	}
	
	return strings.TrimSpace(jsonStr), "", nil
}

func (s *LLMService) DetermineIntent(userMessage string) (string, error) {
	// Simple LLM call to classify intent if needed, or we can stick to the rule-based hybrid approach.
	// For now, let's keep it simple and rely on the SQL generation to implicitly handle intent.
	return "", nil
}
