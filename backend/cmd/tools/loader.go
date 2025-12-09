package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/lib/pq"
)

// Years available for trend analysis
var years = []string{
	"2012-2013", "2016-2017", "2019-2020", "2021-2022",
	"2023-2024", "2024-2025",
}

// MasterIndex represents the structure of master_index.json
type MasterIndex struct {
	States    map[string]StateInfo    `json:"states"`
	Districts map[string]DistrictInfo `json:"districts"`
	Blocks    map[string]BlockInfo    `json:"blocks"`
}

type StateInfo struct {
	Name string `json:"name"`
}

type DistrictInfo struct {
	Name            string `json:"name"`
	ParentStateUUID string `json:"parent_state_uuid"`
}

type BlockInfo struct {
	Name               string `json:"name"`
	ParentDistrictUUID string `json:"parent_district_uuid"`
}

// AssessmentData from JSON files
type AssessmentData struct {
	Rainfall                          interface{} `json:"rainfall"`
	StageOfExtraction                 interface{} `json:"stageOfExtraction"`
	Category                          interface{} `json:"category"`
	RechargeData                      RechargeData `json:"rechargeData"`
	DraftData                         DraftData    `json:"draftData"`
	CurrentAvailabilityForAllPurposes interface{} `json:"currentAvailabilityForAllPurposes"`
}

type RechargeData struct {
	Total TotalData `json:"total"`
}

type DraftData struct {
	Total TotalData `json:"total"`
}

type TotalData struct {
	Command    interface{} `json:"command"`
	NonCommand interface{} `json:"non_command"`
	Total      interface{} `json:"total"`
}

// loadData loads data from JSON files into PostgreSQL
func loadData(dataDir, indexFile string) {
	cfg := getDBConfig()
	connStr := fmt.Sprintf("host=%s port=%s dbname=%s user=%s password=%s sslmode=disable",
		cfg.Host, cfg.Port, cfg.Database, cfg.User, cfg.Password)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "❌ Failed to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		fmt.Fprintf(os.Stderr, "❌ Database connection failed: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ Connected to database")

	// Load master index
	fmt.Printf("📖 Loading master index from %s...\n", indexFile)
	masterIndex, err := loadMasterIndex(indexFile)
	if err != nil {
		fmt.Fprintf(os.Stderr, "❌ Failed to load master index: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("   States: %d, Districts: %d, Blocks: %d\n",
		len(masterIndex.States), len(masterIndex.Districts), len(masterIndex.Blocks))

	// Truncate tables
	fmt.Println("🗑️  Truncating tables...")
	_, err = db.Exec(`TRUNCATE TABLE assessments_summary, assessments_recharge_breakdown, 
		assessments_extraction_breakdown, assessments_discharge_breakdown, 
		blocks, districts, states CASCADE`)
	if err != nil {
		fmt.Fprintf(os.Stderr, "❌ Failed to truncate tables: %v\n", err)
		os.Exit(1)
	}

	// Build lookup maps
	stateNames := make(map[string]string)
	districtNames := make(map[string]string)

	// Ingest states
	fmt.Println("📍 Ingesting states...")
	for uuid, state := range masterIndex.States {
		stateNames[uuid] = state.Name
		_, err = db.Exec(`INSERT INTO states (state_uuid, state_name) VALUES ($1, $2) 
			ON CONFLICT (state_uuid) DO NOTHING`, uuid, state.Name)
		if err != nil {
			fmt.Fprintf(os.Stderr, "⚠️  Failed to insert state %s: %v\n", state.Name, err)
		}
	}

	// Ingest districts
	fmt.Println("📍 Ingesting districts...")
	for uuid, district := range masterIndex.Districts {
		districtNames[uuid] = district.Name
		_, err = db.Exec(`INSERT INTO districts (district_uuid, district_name, state_uuid) 
			VALUES ($1, $2, $3) ON CONFLICT (district_uuid) DO NOTHING`,
			uuid, district.Name, district.ParentStateUUID)
		if err != nil {
			fmt.Fprintf(os.Stderr, "⚠️  Failed to insert district %s: %v\n", district.Name, err)
		}
	}

	// Process each year
	totalProcessed := 0
	totalSkipped := 0

	for _, year := range years {
		fmt.Printf("\n--- Processing Year: %s ---\n", year)
		yearDir := filepath.Join(dataDir, year)

		if _, err := os.Stat(yearDir); os.IsNotExist(err) {
			fmt.Printf("   Skipping %s - directory not found\n", year)
			continue
		}

		processed := 0
		skipped := 0

		for blockUUID, block := range masterIndex.Blocks {
			districtUUID := block.ParentDistrictUUID
			district, ok := masterIndex.Districts[districtUUID]
			if !ok {
				skipped++
				continue
			}

			stateUUID := district.ParentStateUUID
			stateName := stateNames[stateUUID]
			districtName := districtNames[districtUUID]

			if stateName == "" || districtName == "" {
				skipped++
				continue
			}

			// Construct file path
			jsonPath := filepath.Join(yearDir, stateName, districtName, block.Name+".json")
			if _, err := os.Stat(jsonPath); os.IsNotExist(err) {
				skipped++
				continue
			}

			// Insert block
			_, err = db.Exec(`INSERT INTO blocks (block_uuid, block_name, district_uuid, state_uuid) 
				VALUES ($1, $2, $3, $4) ON CONFLICT (block_uuid) DO NOTHING`,
				blockUUID, block.Name, districtUUID, stateUUID)
			if err != nil {
				fmt.Fprintf(os.Stderr, "⚠️  Failed to insert block %s: %v\n", block.Name, err)
			}

			// Load JSON file
			jsonData, err := os.ReadFile(jsonPath)
			if err != nil {
				skipped++
				continue
			}

			// Parse JSON - can be array or single object
			var assessments []json.RawMessage
			if err := json.Unmarshal(jsonData, &assessments); err != nil {
				// Try single object
				var single json.RawMessage
				if err := json.Unmarshal(jsonData, &single); err != nil {
					skipped++
					continue
				}
				assessments = []json.RawMessage{single}
			}

			if len(assessments) == 0 {
				skipped++
				continue
			}

			// Use first assessment
			var item map[string]interface{}
			if err := json.Unmarshal(assessments[0], &item); err != nil {
				skipped++
				continue
			}

			// Extract values
			rainfall := safeGetTotal(item["rainfall"])
			stage := safeGetTotal(item["stageOfExtraction"])
			category := safeGetCategory(item["category"])

			rechargeData := safeGetMap(item["rechargeData"])
			draftData := safeGetMap(item["draftData"])

			rechargeTotal := safeGetTotal(safeGetMap(rechargeData["total"]))
			extractionTotal := safeGetTotal(safeGetMap(draftData["total"]))
			extractableTotal := safeGetTotal(item["currentAvailabilityForAllPurposes"])

			// Insert assessment summary
			rawJSON, _ := json.Marshal(item)
			var assessmentID int
			err = db.QueryRow(`
				INSERT INTO assessments_summary (
					block_uuid, year, rainfall, total_recharge, total_discharge,
					total_extractable, total_extraction, category, stage, raw
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
				ON CONFLICT (block_uuid, year) DO UPDATE SET
					rainfall = EXCLUDED.rainfall,
					total_recharge = EXCLUDED.total_recharge,
					total_discharge = EXCLUDED.total_discharge,
					total_extractable = EXCLUDED.total_extractable,
					total_extraction = EXCLUDED.total_extraction,
					category = EXCLUDED.category,
					stage = EXCLUDED.stage,
					raw = EXCLUDED.raw
				RETURNING assessment_id`,
				blockUUID, year, rainfall, rechargeTotal, 0.0,
				extractableTotal, extractionTotal, category, stage, string(rawJSON)).Scan(&assessmentID)

			if err != nil {
				fmt.Fprintf(os.Stderr, "⚠️  Failed to insert assessment for %s: %v\n", block.Name, err)
				skipped++
				continue
			}

			// Insert breakdowns
			insertBreakdown(db, "assessments_recharge_breakdown", assessmentID, rechargeData)
			insertBreakdown(db, "assessments_extraction_breakdown", assessmentID, draftData)

			processed++
		}

		fmt.Printf("   Year %s: Processed %d blocks, Skipped %d\n", year, processed, skipped)
		totalProcessed += processed
		totalSkipped += skipped
	}

	fmt.Printf("\n✅ Data loading complete!\n")
	fmt.Printf("   Total processed: %d\n", totalProcessed)
	fmt.Printf("   Total skipped: %d\n", totalSkipped)
}

func loadMasterIndex(path string) (*MasterIndex, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var index MasterIndex
	if err := json.Unmarshal(data, &index); err != nil {
		return nil, err
	}

	return &index, nil
}

func safeFloat(val interface{}) float64 {
	switch v := val.(type) {
	case float64:
		return v
	case float32:
		return float64(v)
	case int:
		return float64(v)
	case int64:
		return float64(v)
	case string:
		var f float64
		fmt.Sscanf(v, "%f", &f)
		return f
	default:
		return 0.0
	}
}

func safeGetTotal(val interface{}) float64 {
	switch v := val.(type) {
	case map[string]interface{}:
		if total, ok := v["total"]; ok {
			return safeFloat(total)
		}
		return 0.0
	case float64:
		return v
	case int:
		return float64(v)
	default:
		return safeFloat(val)
	}
}

func safeGetCategory(val interface{}) string {
	switch v := val.(type) {
	case map[string]interface{}:
		if total, ok := v["total"]; ok {
			return fmt.Sprintf("%v", total)
		}
		return ""
	case string:
		return strings.ToLower(v)
	default:
		return fmt.Sprintf("%v", val)
	}
}

func safeGetMap(val interface{}) map[string]interface{} {
	if m, ok := val.(map[string]interface{}); ok {
		return m
	}
	return make(map[string]interface{})
}

func insertBreakdown(db *sql.DB, table string, assessmentID int, sourceData map[string]interface{}) {
	if sourceData == nil {
		return
	}

	// Delete existing breakdowns
	db.Exec(fmt.Sprintf("DELETE FROM %s WHERE assessment_id = $1", table), assessmentID)

	// Insert total row
	if totalRow, ok := sourceData["total"].(map[string]interface{}); ok {
		db.Exec(fmt.Sprintf(`INSERT INTO %s (assessment_id, source, command, non_command, total) 
			VALUES ($1, 'Total', $2, $3, $4)`, table),
			assessmentID,
			safeFloat(totalRow["command"]),
			safeFloat(totalRow["non_command"]),
			safeFloat(totalRow["total"]))
	}

	// Insert other rows
	for key, val := range sourceData {
		if key == "total" {
			continue
		}
		if valMap, ok := val.(map[string]interface{}); ok {
			db.Exec(fmt.Sprintf(`INSERT INTO %s (assessment_id, source, command, non_command, total) 
				VALUES ($1, $2, $3, $4, $5)`, table),
				assessmentID, key,
				safeFloat(valMap["command"]),
				safeFloat(valMap["non_command"]),
				safeFloat(valMap["total"]))
		}
	}
}
