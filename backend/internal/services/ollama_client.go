package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// OllamaClient handles communication with local Ollama LLM server
type OllamaClient struct {
	BaseURL    string
	Model      string
	HTTPClient *http.Client
}

// OllamaRequest represents a request to the Ollama API
type OllamaRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
	Stream bool   `json:"stream"`
	Options *OllamaOptions `json:"options,omitempty"`
}

// OllamaOptions for fine-tuning generation
type OllamaOptions struct {
	Temperature float64 `json:"temperature,omitempty"`
	TopP        float64 `json:"top_p,omitempty"`
	NumPredict  int     `json:"num_predict,omitempty"`
}

// OllamaResponse represents a response from the Ollama API
type OllamaResponse struct {
	Model     string `json:"model"`
	Response  string `json:"response"`
	Done      bool   `json:"done"`
	Context   []int  `json:"context,omitempty"`
	TotalDuration int64 `json:"total_duration,omitempty"`
	LoadDuration  int64 `json:"load_duration,omitempty"`
	EvalCount     int   `json:"eval_count,omitempty"`
}

// NewOllamaClient creates a new Ollama client
func NewOllamaClient(baseURL, model string) *OllamaClient {
	if baseURL == "" {
		baseURL = "http://localhost:11434"
	}
	if model == "" {
		model = "sqlcoder:7b" // Default to SQLCoder for text-to-SQL
	}
	
	return &OllamaClient{
		BaseURL: baseURL,
		Model:   model,
		HTTPClient: &http.Client{
			Timeout: 120 * time.Second, // SQL generation can take time
		},
	}
}

// Generate sends a prompt to Ollama and returns the response
func (c *OllamaClient) Generate(ctx context.Context, prompt string) (string, error) {
	return c.GenerateWithOptions(ctx, prompt, nil)
}

// GenerateWithOptions sends a prompt with custom options
func (c *OllamaClient) GenerateWithOptions(ctx context.Context, prompt string, opts *OllamaOptions) (string, error) {
	// Default options for SQL generation
	if opts == nil {
		opts = &OllamaOptions{
			Temperature: 0.1, // Low temperature for deterministic SQL
			TopP:        0.9,
			NumPredict:  2048, // Enough for complex SQL queries
		}
	}

	reqBody := OllamaRequest{
		Model:   c.Model,
		Prompt:  prompt,
		Stream:  false, // Get complete response at once
		Options: opts,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/api/generate", c.BaseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("ollama request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("ollama error (%d): %s", resp.StatusCode, string(body))
	}

	var ollamaResp OllamaResponse
	if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	return ollamaResp.Response, nil
}

// GenerateSQL generates a SQL query from natural language using local LLM
func (c *OllamaClient) GenerateSQL(ctx context.Context, userQuery, schema, domainKnowledge string) (string, error) {
	// Rich chain-of-thought prompt matching the Gemini prompt quality
	prompt := fmt.Sprintf(`You are an expert PostgreSQL developer for India's INGRES Groundwater Data System.

%s

DATABASE SCHEMA:
%s

USER REQUEST: "%s"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SQL GENERATION RULES (MUST FOLLOW EXACTLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ALWAYS join tables to get human-readable names:
   FROM assessments_summary a
   JOIN blocks b ON a.block_uuid = b.block_uuid
   JOIN districts d ON b.district_uuid = d.district_uuid
   JOIN states s ON b.state_uuid = s.state_uuid

2. STATE matching (UPPERCASE): WHERE UPPER(s.state_name) = UPPER('punjab')
3. BLOCK/DISTRICT matching (ILIKE): WHERE LOWER(b.block_name) ILIKE '%%ludhiana%%'
4. CATEGORY values (EXACT lowercase with underscores):
   - 'safe', 'semi_critical', 'critical', 'over_exploited', 'salinity'
5. Default year: WHERE a.year = '2024-2025'
6. Add LIMIT 50 for list queries
7. Use ROUND(value::numeric, 2) for decimals
8. For stage averages: AVG(CASE WHEN a.stage > 0 THEN a.stage ELSE NULL END)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SQL EXAMPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Example 1 - "List over-exploited blocks in Punjab":
SELECT b.block_name, d.district_name, a.stage, a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('punjab')
AND LOWER(a.category) = 'over_exploited'
AND a.year = '2024-2025'
ORDER BY a.stage DESC
LIMIT 50

Example 2 - "Groundwater status of Ludhiana":
SELECT b.block_name, d.district_name, s.state_name, a.year,
       a.rainfall, a.total_recharge, a.total_extraction, a.stage, a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE LOWER(b.block_name) ILIKE '%%ludhiana%%'
AND a.year = '2024-2025'

Example 3 - "Compare Punjab and Haryana":
SELECT s.state_name, COUNT(*) as total_blocks,
       ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage,
       SUM(CASE WHEN LOWER(a.category) = 'over_exploited' THEN 1 ELSE 0 END) as overexploited
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) IN ('PUNJAB', 'HARYANA')
AND a.year = '2024-2025'
GROUP BY s.state_name

Return ONLY the SQL query. No explanations, no markdown, no comments.

SQL:`, domainKnowledge, schema, userQuery)

	response, err := c.Generate(ctx, prompt)
	if err != nil {
		return "", fmt.Errorf("SQL generation failed: %w", err)
	}

	// Clean the response
	sql := strings.TrimSpace(response)
	sql = strings.TrimPrefix(sql, "```sql")
	sql = strings.TrimPrefix(sql, "```")
	sql = strings.TrimSuffix(sql, "```")
	sql = strings.TrimSpace(sql)

	// Basic validation
	sqlUpper := strings.ToUpper(sql)
	if !strings.Contains(sqlUpper, "SELECT") {
		return "", fmt.Errorf("invalid SQL generated: missing SELECT statement")
	}

	// Check for dangerous operations
	if strings.Contains(sqlUpper, "DROP") || strings.Contains(sqlUpper, "DELETE") ||
		strings.Contains(sqlUpper, "TRUNCATE") || strings.Contains(sqlUpper, "INSERT") ||
		strings.Contains(sqlUpper, "UPDATE") {
		return "", fmt.Errorf("invalid SQL: contains prohibited operations")
	}

	return sql, nil
}

// IsAvailable checks if Ollama server is running and model is available
func (c *OllamaClient) IsAvailable(ctx context.Context) bool {
	url := fmt.Sprintf("%s/api/tags", c.BaseURL)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return false
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK
}

// ListModels returns available models from Ollama
func (c *OllamaClient) ListModels(ctx context.Context) ([]string, error) {
	url := fmt.Sprintf("%s/api/tags", c.BaseURL)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Models []struct {
			Name string `json:"name"`
		} `json:"models"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	models := make([]string, len(result.Models))
	for i, m := range result.Models {
		models[i] = m.Name
	}
	return models, nil
}
