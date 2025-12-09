package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type State struct {
	StateUUID uuid.UUID `json:"state_uuid"`
	StateName string    `json:"state_name"`
}

type District struct {
	DistrictUUID uuid.UUID `json:"district_uuid"`
	DistrictName string    `json:"district_name"`
	StateUUID    uuid.UUID `json:"state_uuid"`
}

type Block struct {
	BlockUUID    uuid.UUID       `json:"block_uuid"`
	BlockName    string          `json:"block_name"`
	DistrictUUID uuid.UUID       `json:"district_uuid"`
	StateUUID    uuid.UUID       `json:"state_uuid"`
	GeomGeoJSON  json.RawMessage `json:"geom_geojson,omitempty"`
}

type AssessmentSummary struct {
	AssessmentID     int             `json:"assessment_id"`
	BlockUUID        uuid.UUID       `json:"block_uuid"`
	Year             string          `json:"year"`
	Rainfall         float64         `json:"rainfall"`
	TotalRecharge    float64         `json:"total_recharge"`
	TotalDischarge   float64         `json:"total_discharge"`
	TotalExtractable float64         `json:"total_extractable"`
	TotalExtraction  float64         `json:"total_extraction"`
	Category         string          `json:"category"`
	Stage            float64         `json:"stage"`
	Availability     float64         `json:"availability"`
	Raw              json.RawMessage `json:"raw,omitempty"`
	CreatedAt        time.Time       `json:"created_at"`
}

type RechargeBreakdown struct {
	ID           int     `json:"id"`
	AssessmentID int     `json:"assessment_id"`
	Source       string  `json:"source"`
	Command      float64 `json:"command"`
	NonCommand   float64 `json:"non_command"`
	Total        float64 `json:"total"`
}

type DischargeBreakdown struct {
	ID           int     `json:"id"`
	AssessmentID int     `json:"assessment_id"`
	Source       string  `json:"source"`
	Command      float64 `json:"command"`
	NonCommand   float64 `json:"non_command"`
	Total        float64 `json:"total"`
}

type ExtractionBreakdown struct {
	ID           int     `json:"id"`
	AssessmentID int     `json:"assessment_id"`
	Source       string  `json:"source"`
	Command      float64 `json:"command"`
	NonCommand   float64 `json:"non_command"`
	Total        float64 `json:"total"`
}
