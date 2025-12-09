package main

import (
	"bufio"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

// loadMarkdown loads groundwater data from tab-separated markdown files
func loadMarkdown(filepath, year string) {
	cfg := getDBConfig()
	connStr := fmt.Sprintf("host=%s port=%s dbname=%s user=%s password=%s sslmode=disable",
		cfg.Host, cfg.Port, cfg.Database, cfg.User, cfg.Password)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "❌ Failed to connect to database: %v\n", err)
		return
	}
	defer db.Close()

	fmt.Printf("\n{'='*70}\n")
	fmt.Printf("Processing: %s (Year: %s)\n", filepath, year)
	fmt.Printf("{'='*70}\n")

	file, err := os.Open(filepath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "❌ File not found: %s\n", filepath)
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)

	// Skip header line
	if scanner.Scan() {
		// Header skipped
	}

	processed := 0
	skipped := 0
	errors := 0

	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			skipped++
			continue
		}

		data := parseMarkdownLine(line)
		if data == nil {
			skipped++
			continue
		}

		// Get or create state
		stateUUID, err := getOrCreateState(db, data["state"].(string))
		if err != nil {
			fmt.Fprintf(os.Stderr, "❌ Error creating state: %v\n", err)
			errors++
			continue
		}

		// Get or create district
		districtUUID, err := getOrCreateDistrict(db, data["district"].(string), stateUUID)
		if err != nil {
			fmt.Fprintf(os.Stderr, "❌ Error creating district: %v\n", err)
			errors++
			continue
		}

		// Get or create block
		blockUUID, err := getOrCreateBlock(db, data["assessment_unit_name"].(string), districtUUID, stateUUID)
		if err != nil {
			fmt.Fprintf(os.Stderr, "❌ Error creating block: %v\n", err)
			errors++
			continue
		}

		// Insert assessment
		err = insertAssessmentFromMarkdown(db, blockUUID, year, data)
		if err != nil {
			fmt.Fprintf(os.Stderr, "❌ Error inserting assessment: %v\n", err)
			errors++
			continue
		}

		processed++
	}

	fmt.Printf("\n✅ Processed: %d records\n", processed)
	fmt.Printf("⚠️  Skipped: %d records\n", skipped)
	if errors > 0 {
		fmt.Printf("❌ Errors: %d records\n", errors)
	}

	// Show statistics
	var count int
	db.QueryRow("SELECT COUNT(*) FROM assessments_summary WHERE year = $1", year).Scan(&count)
	fmt.Printf("\n📊 Total records for %s: %d\n", year, count)
}

func parseMarkdownLine(line string) map[string]interface{} {
	fields := strings.Split(strings.TrimSpace(line), "\t")

	if len(fields) < 22 {
		return nil
	}

	return map[string]interface{}{
		"sl_no":                         parseIntField(fields[0]),
		"state":                         strings.TrimSpace(fields[1]),
		"district":                      strings.TrimSpace(fields[2]),
		"assessment_unit_name":          strings.TrimSpace(fields[3]),
		"assessment_unit_type":          strings.TrimSpace(fields[4]),
		"total_area":                    parseFloatField(fields[5]),
		"recharge_worthy_area":          parseFloatField(fields[6]),
		"recharge_rainfall_monsoon":     parseFloatField(fields[7]),
		"recharge_other_monsoon":        parseFloatField(fields[8]),
		"recharge_rainfall_non_monsoon": parseFloatField(fields[9]),
		"recharge_other_non_monsoon":    parseFloatField(fields[10]),
		"total_annual_recharge":         parseFloatField(fields[11]),
		"total_natural_discharge":       parseFloatField(fields[12]),
		"annual_extractable":            parseFloatField(fields[13]), // total_extractable
		"extraction_irrigation":         parseFloatField(fields[14]),
		"extraction_industrial":         parseFloatField(fields[15]),
		"extraction_domestic":           parseFloatField(fields[16]),
		"total_extraction":              parseFloatField(fields[17]), // total_extraction
		"annual_gw_allocation_domestic": parseFloatField(fields[18]),
		"net_availability_future":       parseFloatField(fields[19]),
		"stage_extraction":              parseFloatField(fields[20]), // stage
		"category":                      strings.ToLower(strings.TrimSpace(fields[21])),
	}
}

func parseFloatField(s string) *float64 {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return nil
	}
	return &f
}

func parseIntField(s string) *int {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	i, err := strconv.Atoi(s)
	if err != nil {
		return nil
	}
	return &i
}

func getOrCreateState(db *sql.DB, stateName string) (string, error) {
	var stateUUID string
	err := db.QueryRow("SELECT state_uuid FROM states WHERE state_name = $1", stateName).Scan(&stateUUID)

	if err == sql.ErrNoRows {
		stateUUID = uuid.New().String()
		_, err = db.Exec("INSERT INTO states (state_uuid, state_name) VALUES ($1, $2)",
			stateUUID, stateName)
		if err != nil {
			return "", err
		}
	} else if err != nil {
		return "", err
	}

	return stateUUID, nil
}

func getOrCreateDistrict(db *sql.DB, districtName, stateUUID string) (string, error) {
	var districtUUID string
	err := db.QueryRow("SELECT district_uuid FROM districts WHERE district_name = $1 AND state_uuid = $2",
		districtName, stateUUID).Scan(&districtUUID)

	if err == sql.ErrNoRows {
		districtUUID = uuid.New().String()
		_, err = db.Exec("INSERT INTO districts (district_uuid, district_name, state_uuid) VALUES ($1, $2, $3)",
			districtUUID, districtName, stateUUID)
		if err != nil {
			return "", err
		}
	} else if err != nil {
		return "", err
	}

	return districtUUID, nil
}

func getOrCreateBlock(db *sql.DB, blockName, districtUUID, stateUUID string) (string, error) {
	var blockUUID string
	err := db.QueryRow("SELECT block_uuid FROM blocks WHERE block_name = $1 AND district_uuid = $2",
		blockName, districtUUID).Scan(&blockUUID)

	if err == sql.ErrNoRows {
		blockUUID = uuid.New().String()
		_, err = db.Exec("INSERT INTO blocks (block_uuid, block_name, district_uuid, state_uuid) VALUES ($1, $2, $3, $4)",
			blockUUID, blockName, districtUUID, stateUUID)
		if err != nil {
			return "", err
		}
	} else if err != nil {
		return "", err
	}

	return blockUUID, nil
}

func insertAssessmentFromMarkdown(db *sql.DB, blockUUID, year string, data map[string]interface{}) error {
	// Calculate rainfall
	rainfallMonsoon := floatOrZero(data["recharge_rainfall_monsoon"])
	rainfallNonMonsoon := floatOrZero(data["recharge_rainfall_non_monsoon"])
	rainfall := rainfallMonsoon + rainfallNonMonsoon

	// Create raw JSON
	rawData := map[string]interface{}{
		"stateName":             data["state"],
		"districtName":          data["district"],
		"name":                  data["assessment_unit_name"],
		"year":                  year,
		"rainfall":              rainfall,
		"totalNaturalRecharge":  data["total_annual_recharge"],
		"totalNaturalDischarge": data["total_natural_discharge"],
		"totalExtractable":      data["annual_extractable"],
		"totalExtraction":       data["total_extraction"],
		"category":              data["category"],
		"stage":                 data["stage_extraction"],
		"availability":          data["net_availability_future"],
	}
	rawJSON, _ := json.Marshal(rawData)

	var assessmentID int
	err := db.QueryRow(`
		INSERT INTO assessments_summary (
			block_uuid, year, rainfall, total_recharge, total_discharge,
			total_extractable, total_extraction, category, stage, availability, raw
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		ON CONFLICT (block_uuid, year) DO UPDATE SET
			rainfall = EXCLUDED.rainfall,
			total_recharge = EXCLUDED.total_recharge,
			total_discharge = EXCLUDED.total_discharge,
			total_extractable = EXCLUDED.total_extractable,
			total_extraction = EXCLUDED.total_extraction,
			category = EXCLUDED.category,
			stage = EXCLUDED.stage,
			availability = EXCLUDED.availability,
			raw = EXCLUDED.raw
		RETURNING assessment_id`,
		blockUUID, year,
		rainfall,
		floatOrZero(data["total_annual_recharge"]),
		floatOrZero(data["total_natural_discharge"]),
		floatOrZero(data["annual_extractable"]),
		floatOrZero(data["total_extraction"]),
		data["category"],
		floatOrZero(data["stage_extraction"]),
		floatOrZero(data["net_availability_future"]),
		string(rawJSON),
	).Scan(&assessmentID)

	if err != nil {
		return err
	}

	// Insert breakdowns

	// Delete existing
	db.Exec("DELETE FROM assessments_recharge_breakdown WHERE assessment_id = $1", assessmentID)
	db.Exec("DELETE FROM assessments_extraction_breakdown WHERE assessment_id = $1", assessmentID)
	db.Exec("DELETE FROM assessments_discharge_breakdown WHERE assessment_id = $1", assessmentID)

	// Recharge - Rainfall
	if data["recharge_rainfall_monsoon"] != nil || data["recharge_rainfall_non_monsoon"] != nil {
		db.Exec(`INSERT INTO assessments_recharge_breakdown 
			(assessment_id, source, command, non_command, total)
			VALUES ($1, 'Rainfall', $2, $3, $4)`,
			assessmentID,
			floatOrZero(data["recharge_rainfall_monsoon"]),
			floatOrZero(data["recharge_rainfall_non_monsoon"]),
			rainfallMonsoon+rainfallNonMonsoon)
	}

	// Recharge - Other Sources
	otherMonsoon := floatOrZero(data["recharge_other_monsoon"])
	otherNonMonsoon := floatOrZero(data["recharge_other_non_monsoon"])
	if data["recharge_other_monsoon"] != nil || data["recharge_other_non_monsoon"] != nil {
		db.Exec(`INSERT INTO assessments_recharge_breakdown 
			(assessment_id, source, command, non_command, total)
			VALUES ($1, 'Other Sources', $2, $3, $4)`,
			assessmentID, otherMonsoon, otherNonMonsoon, otherMonsoon+otherNonMonsoon)
	}

	// Extraction - Irrigation
	if data["extraction_irrigation"] != nil {
		db.Exec(`INSERT INTO assessments_extraction_breakdown 
			(assessment_id, source, command, non_command, total)
			VALUES ($1, 'Irrigation', 0, 0, $2)`,
			assessmentID, floatOrZero(data["extraction_irrigation"]))
	}

	// Extraction - Industrial
	if data["extraction_industrial"] != nil {
		db.Exec(`INSERT INTO assessments_extraction_breakdown 
			(assessment_id, source, command, non_command, total)
			VALUES ($1, 'Industrial', 0, 0, $2)`,
			assessmentID, floatOrZero(data["extraction_industrial"]))
	}

	// Extraction - Domestic
	if data["extraction_domestic"] != nil {
		db.Exec(`INSERT INTO assessments_extraction_breakdown 
			(assessment_id, source, command, non_command, total)
			VALUES ($1, 'Domestic', 0, 0, $2)`,
			assessmentID, floatOrZero(data["extraction_domestic"]))
	}

	// Discharge
	if data["total_natural_discharge"] != nil {
		db.Exec(`INSERT INTO assessments_discharge_breakdown 
			(assessment_id, source, command, non_command, total)
			VALUES ($1, 'Natural Discharge', 0, 0, $2)`,
			assessmentID, floatOrZero(data["total_natural_discharge"]))
	}

	return nil
}

func floatOrZero(val interface{}) float64 {
	if val == nil {
		return 0
	}
	if f, ok := val.(*float64); ok && f != nil {
		return *f
	}
	if f, ok := val.(float64); ok {
		return f
	}
	return 0
}
