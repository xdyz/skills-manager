package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// RatingService 管理技能评分和笔记
type RatingService struct {
	ctx context.Context
}

func NewRatingService() *RatingService {
	return &RatingService{}
}

func (rs *RatingService) Startup(ctx context.Context) {
	rs.ctx = ctx
}

// SkillRating 技能评分和笔记
type SkillRating struct {
	SkillName string `json:"skillName"`
	Rating    int    `json:"rating"` // 1-5
	Note      string `json:"note"`
	UpdatedAt string `json:"updatedAt"`
}

// RatingsConfig 评分配置
type RatingsConfig struct {
	Ratings map[string]SkillRating `json:"ratings"` // skill name -> rating
}

func getRatingsFilePath() (string, error) {
	configDir, err := getConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "ratings.json"), nil
}

func loadRatings() (RatingsConfig, error) {
	filePath, err := getRatingsFilePath()
	if err != nil {
		return RatingsConfig{Ratings: make(map[string]SkillRating)}, err
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		return RatingsConfig{Ratings: make(map[string]SkillRating)}, nil
	}
	var config RatingsConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return RatingsConfig{Ratings: make(map[string]SkillRating)}, nil
	}
	if config.Ratings == nil {
		config.Ratings = make(map[string]SkillRating)
	}
	return config, nil
}

func saveRatings(config RatingsConfig) error {
	filePath, err := getRatingsFilePath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

// GetRating 获取技能评分
func (rs *RatingService) GetRating(skillName string) (*SkillRating, error) {
	config, err := loadRatings()
	if err != nil {
		return nil, err
	}
	if r, ok := config.Ratings[skillName]; ok {
		return &r, nil
	}
	return &SkillRating{SkillName: skillName, Rating: 0}, nil
}

// SetRating 设置技能评分
func (rs *RatingService) SetRating(skillName string, rating int, note string) error {
	if rating < 0 || rating > 5 {
		return fmt.Errorf("rating must be between 0 and 5")
	}
	config, err := loadRatings()
	if err != nil {
		return err
	}
	if rating == 0 && note == "" {
		delete(config.Ratings, skillName)
	} else {
		config.Ratings[skillName] = SkillRating{
			SkillName: skillName,
			Rating:    rating,
			Note:      note,
			UpdatedAt: time.Now().Format(time.RFC3339),
		}
	}
	return saveRatings(config)
}

// GetAllRatings 获取所有评分
func (rs *RatingService) GetAllRatings() (map[string]SkillRating, error) {
	config, err := loadRatings()
	if err != nil {
		return nil, err
	}
	return config.Ratings, nil
}

// CompareResult 技能对比结果
type CompareResult struct {
	Skill1 SkillCompareInfo `json:"skill1"`
	Skill2 SkillCompareInfo `json:"skill2"`
}

// SkillCompareInfo 对比信息
type SkillCompareInfo struct {
	Name       string   `json:"name"`
	Desc       string   `json:"desc"`
	Language   string   `json:"language"`
	Framework  string   `json:"framework"`
	Agents     []string `json:"agents"`
	Source     string   `json:"source"`
	Tags       []string `json:"tags"`
	Rating     int      `json:"rating"`
	Note       string   `json:"note"`
	FileCount  int      `json:"fileCount"`
	TotalSize  int64    `json:"totalSize"`
	Content    string   `json:"content"`
}
