package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/repositories"
)

type IngresService struct {
	repo *repositories.IngresRepository
}

func NewIngresService(repo *repositories.IngresRepository) *IngresService {
	return &IngresService{repo: repo}
}

func (s *IngresService) GetStates(ctx context.Context) ([]models.State, error) {
	return s.repo.GetAllStates(ctx)
}

func (s *IngresService) GetDistricts(ctx context.Context, stateUUID uuid.UUID) ([]models.District, error) {
	return s.repo.GetDistrictsByState(ctx, stateUUID)
}

func (s *IngresService) GetBlocks(ctx context.Context, districtUUID uuid.UUID) ([]models.Block, error) {
	return s.repo.GetBlocksByDistrict(ctx, districtUUID)
}

type BlockAssessment struct {
	Summary             *models.AssessmentSummary        `json:"summary"`
	RechargeBreakdown   []models.RechargeBreakdown       `json:"recharge_breakdown"`
	DischargeBreakdown  []models.DischargeBreakdown      `json:"discharge_breakdown"`
	ExtractionBreakdown []models.ExtractionBreakdown     `json:"extraction_breakdown"`
}

func (s *IngresService) GetBlockAssessment(ctx context.Context, blockUUID uuid.UUID, year string) (*BlockAssessment, error) {
	summary, err := s.repo.GetAssessmentSummary(ctx, blockUUID, year)
	if err != nil {
		return nil, err
	}
	if summary == nil {
		return nil, nil // Not found
	}

	recharge, err := s.repo.GetRechargeBreakdown(ctx, summary.AssessmentID)
	if err != nil {
		return nil, err
	}

	discharge, err := s.repo.GetDischargeBreakdown(ctx, summary.AssessmentID)
	if err != nil {
		return nil, err
	}

	extraction, err := s.repo.GetExtractionBreakdown(ctx, summary.AssessmentID)
	if err != nil {
		return nil, err
	}

	return &BlockAssessment{
		Summary:             summary,
		RechargeBreakdown:   recharge,
		DischargeBreakdown:  discharge,
		ExtractionBreakdown: extraction,
	}, nil
}

func (s *IngresService) SearchBlocks(ctx context.Context, query string) ([]models.Block, error) {
	return s.repo.SearchBlocks(ctx, query)
}

// New methods for Chatbot

func (s *IngresService) GetAssessmentTrends(ctx context.Context, blockUUID uuid.UUID, startYear, endYear string) ([]models.AssessmentSummary, error) {
	return s.repo.GetAssessmentTrends(ctx, blockUUID, startYear, endYear)
}

func (s *IngresService) GetBlocksByNames(ctx context.Context, names []string) ([]models.Block, error) {
	return s.repo.GetBlocksByNamesSimple(ctx, names)
}

func (s *IngresService) GetBlocksByCategory(ctx context.Context, category string) ([]models.Block, error) {
	return s.repo.GetBlocksByCategory(ctx, category)
}

func (s *IngresService) GetAssessmentComparison(ctx context.Context, blockUUIDs []uuid.UUID, year string) ([]models.AssessmentSummary, error) {
	return s.repo.GetAssessmentComparison(ctx, blockUUIDs, year)
}

// Helper to get breakdown for a specific year (reusing existing repo methods but needing assessment ID first)
func (s *IngresService) GetRechargeBreakdown(ctx context.Context, blockUUID uuid.UUID, year string) ([]models.RechargeBreakdown, error) {
	summary, err := s.repo.GetAssessmentSummary(ctx, blockUUID, year)
	if err != nil || summary == nil {
		return nil, err
	}
	return s.repo.GetRechargeBreakdown(ctx, summary.AssessmentID)
}

func (s *IngresService) GetExtractionBreakdown(ctx context.Context, blockUUID uuid.UUID, year string) ([]models.ExtractionBreakdown, error) {
	summary, err := s.repo.GetAssessmentSummary(ctx, blockUUID, year)
	if err != nil || summary == nil {
		return nil, err
	}
	return s.repo.GetExtractionBreakdown(ctx, summary.AssessmentID)
}

func (s *IngresService) GetDischargeBreakdown(ctx context.Context, blockUUID uuid.UUID, year string) ([]models.DischargeBreakdown, error) {
	summary, err := s.repo.GetAssessmentSummary(ctx, blockUUID, year)
	if err != nil || summary == nil {
		return nil, err
	}
	return s.repo.GetDischargeBreakdown(ctx, summary.AssessmentID)
}

func (s *IngresService) GetStateByName(ctx context.Context, name string) (*models.State, error) {
	return s.repo.GetStateByName(ctx, name)
}

func (s *IngresService) GetDistrictByName(ctx context.Context, name string) (*models.District, error) {
	return s.repo.GetDistrictByName(ctx, name)
}
