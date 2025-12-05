package services

import (
	"regexp"
	"strconv"
	"strings"
)

type NLPService struct{
	llm *LLMService
}

func NewNLPService(llm *LLMService) *NLPService {
	return &NLPService{llm: llm}
}

type Intent string

const (
	IntentSummary             Intent = "SUMMARY"
	IntentTrend               Intent = "TREND"
	IntentCompare             Intent = "COMPARE"
	IntentRechargeBreakdown   Intent = "RECHARGE_BREAKDOWN"
	IntentExtractionBreakdown Intent = "EXTRACTION_BREAKDOWN"
	IntentDischargeBreakdown  Intent = "DISCHARGE_BREAKDOWN"
	IntentMapCategory         Intent = "MAP_CATEGORY"
	IntentUnknown             Intent = "UNKNOWN"
)

type Entities struct {
	Locations []string
	Year      string
	StartYear string
	EndYear   string
	Metric    string
	Category  string
}

func (s *NLPService) ParseMessage(message string) (Intent, Entities, string) {
	msg := strings.ToLower(message)
	entities := s.extractEntities(msg)
	intent := s.determineIntent(msg)

	// If intent is summary/trend/compare/breakdown, we might want to use LLM for better SQL
	// But for now, let's keep the rule-based intent as primary for simple cases.
	// However, the user wants "Autonomous Query Construction".
	// So, if we have a valid intent but want more flexibility, or if intent is UNKNOWN, use LLM.
	
	var sqlQuery string
	if intent == IntentUnknown || intent == IntentSummary || intent == IntentTrend || intent == IntentCompare || intent == IntentRechargeBreakdown || intent == IntentExtractionBreakdown || intent == IntentDischargeBreakdown || intent == IntentMapCategory {
		// Use LLM to generate SQL for data-related queries
		// We need the schema. For now, let's hardcode a simplified schema or fetch it.
		// Ideally, we pass it in. Since we don't have it easily here, let's use a constant.
		schema := `
Tables:
- states (state_uuid, state_name)
- districts (district_uuid, district_name, state_uuid)
- blocks (block_uuid, block_name, district_uuid, state_uuid)
- assessments_summary (assessment_id, block_uuid, year, rainfall, total_recharge, total_discharge, total_extractable, total_extraction, category, stage, availability)
- assessments_recharge_breakdown (assessment_id, source, command, non_command, total)
- assessments_extraction_breakdown (assessment_id, source, command, non_command, total)
- assessments_discharge_breakdown (assessment_id, source, command, non_command, total)
`
		generatedSQL, err := s.llm.GenerateSQL(message, schema)
		if err == nil {
			sqlQuery = generatedSQL
		} else {
			// Fallback or log error
			// fmt.Printf("LLM SQL Gen Error: %v\n", err)
		}
	}
	
	return intent, entities, sqlQuery
}

func (s *NLPService) determineIntent(msg string) Intent {
	if strings.Contains(msg, "compare") || strings.Contains(msg, "vs") {
		return IntentCompare
	}
	if strings.Contains(msg, "trend") || strings.Contains(msg, "history") || strings.Contains(msg, "over time") {
		return IntentTrend
	}
	if strings.Contains(msg, "map") || strings.Contains(msg, "show") && strings.Contains(msg, "blocks") {
		return IntentMapCategory
	}
	if strings.Contains(msg, "recharge") && (strings.Contains(msg, "breakdown") || strings.Contains(msg, "source")) {
		return IntentRechargeBreakdown
	}
	if strings.Contains(msg, "extraction") && (strings.Contains(msg, "breakdown") || strings.Contains(msg, "source") || strings.Contains(msg, "usage")) {
		return IntentExtractionBreakdown
	}
	if strings.Contains(msg, "discharge") && (strings.Contains(msg, "breakdown") || strings.Contains(msg, "source")) {
		return IntentDischargeBreakdown
	}
	if strings.Contains(msg, "status") || strings.Contains(msg, "summary") || strings.Contains(msg, "about") || strings.Contains(msg, "what is") {
		return IntentSummary
	}
	
	// Default to summary if a location is mentioned but no specific intent
	return IntentSummary
}

func (s *NLPService) extractEntities(msg string) Entities {
	var e Entities

	// Extract Year
	yearRegex := regexp.MustCompile(`\b(20\d{2})\b`)
	years := yearRegex.FindAllString(msg, -1)
	if len(years) > 0 {
		e.Year = years[0] + "-" + incrementYear(years[0]) // Convert 2024 to 2024-2025 format approximation
		if len(years) >= 2 {
			e.StartYear = years[0] + "-" + incrementYear(years[0])
			e.EndYear = years[1] + "-" + incrementYear(years[1])
		} else {
			// Only 1 year mentioned, use it as end year or single point?
			// For trend, we need a range. Let's default to 5 years before.
			e.EndYear = e.Year
			// Simple logic: parse year, subtract 5. 
			// But without strconv, let's just use defaults if not range.
			e.StartYear = "2017-2018" // Fallback
		}
	} else {
		// Default year
		e.Year = "2024-2025"
		e.StartYear = "2017-2018" // Default trend range
		e.EndYear = "2024-2025"
	}

	// Extract Category
	if strings.Contains(msg, "over-exploited") || strings.Contains(msg, "over exploited") {
		e.Category = "Over-Exploited"
	} else if strings.Contains(msg, "critical") {
		e.Category = "Critical"
	} else if strings.Contains(msg, "semi-critical") {
		e.Category = "Semi-Critical"
	} else if strings.Contains(msg, "safe") {
		e.Category = "Safe"
	}

	// Extract Locations (Simple heuristic: words starting with capital letters in original message, 
	// but here we have lowercased msg. 
	// Better approach: Look for words that are NOT keywords.
	// For this MVP, we will rely on the user typing the name, and we'll try to match against known blocks in DB later.
	// Here we just extract potential candidates.
	// Actually, let's just extract everything that looks like a name.
	// Since we don't have the full list of blocks here, we will pass the whole message or specific parts to the ChatService
	// which can use the DB to fuzzy match.
	// BUT, the interface requires returning Entities.
	// Let's try to extract proper nouns from the *original* message if we had it, but we lowercased it.
	// Let's change ParseMessage signature to take original message? No, let's just use a simple stop-word filter on the lowercased msg.
	
	words := strings.Fields(msg)
	stopWords := map[string]bool{
		"compare": true, "trend": true, "map": true, "show": true, "what": true, "is": true, "the": true,
		"of": true, "in": true, "for": true, "and": true, "vs": true, "breakdown": true, "recharge": true,
		"extraction": true, "discharge": true, "groundwater": true, "status": true, "summary": true,
		"about": true, "year": true, "years": true, "from": true, "to": true, "district": true, "block": true,
		"state": true, "data": true, "give": true, "me": true, "tell": true, "list": true, "all": true, "blocks": true,
	}
	
	var potentialLocations []string
	for _, w := range words {
		cleanWord := strings.Trim(w, "?!,.")
		if !stopWords[cleanWord] && !yearRegex.MatchString(cleanWord) {
			potentialLocations = append(potentialLocations, cleanWord)
		}
	}
	e.Locations = potentialLocations

	return e
}

func incrementYear(y string) string {
	if len(y) != 4 {
		return "2025"
	}
	yearInt, err := strconv.Atoi(y)
	if err != nil {
		return "2025"
	}
	return strconv.Itoa(yearInt + 1)
}
