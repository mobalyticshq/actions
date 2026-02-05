package validator

import (
	"encoding/json"
	"fmt"
	"os"

	"geck-validator/internal/types"
)

// Required fields that must be present in every element
var requiredFields = []string{"id", "slug", "name"}

// Fields that must be unique within a group
var uniqueFields = []string{"id", "slug"}

// ValidateDataSource validates a data source file and returns validation errors
func ValidateDataSource(filePath string) ([]types.ValidationError, error) {
	// Read the file
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	// Parse JSON
	var dataSource types.DataSource
	if err := json.Unmarshal(data, &dataSource); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	return ValidateDataSourceData(dataSource), nil
}

// ValidateDataSourceData validates parsed data source and returns validation errors
func ValidateDataSourceData(dataSource types.DataSource) []types.ValidationError {
	var errors []types.ValidationError

	for groupName, elements := range dataSource {
		groupErrors := validateGroup(groupName, elements)
		errors = append(errors, groupErrors...)
	}

	return errors
}

// validateGroup validates a single group and its elements
func validateGroup(groupName string, elements []map[string]interface{}) []types.ValidationError {
	var errors []types.ValidationError

	// Track unique values for id and slug
	uniqueValues := make(map[string]map[string]int) // field -> value -> first occurrence index
	for _, field := range uniqueFields {
		uniqueValues[field] = make(map[string]int)
	}

	for idx, element := range elements {
		// Check required fields
		for _, field := range requiredFields {
			if _, exists := element[field]; !exists {
				errors = append(errors, types.ValidationError{
					Type:    "error",
					Message: fmt.Sprintf("missing required field '%s'", field),
					Path:    fmt.Sprintf("%s[%d]", groupName, idx),
				})
			}
		}

		// Check uniqueness of id and slug
		for _, field := range uniqueFields {
			if value, exists := element[field]; exists {
				strValue, ok := value.(string)
				if !ok {
					errors = append(errors, types.ValidationError{
						Type:    "error",
						Message: fmt.Sprintf("field '%s' must be a string", field),
						Path:    fmt.Sprintf("%s[%d].%s", groupName, idx, field),
					})
					continue
				}

				if firstIdx, duplicate := uniqueValues[field][strValue]; duplicate {
					errors = append(errors, types.ValidationError{
						Type:    "error",
						Message: fmt.Sprintf("duplicate '%s' value '%s' (first occurrence at index %d)", field, strValue, firstIdx),
						Path:    fmt.Sprintf("%s[%d].%s", groupName, idx, field),
					})
				} else {
					uniqueValues[field][strValue] = idx
				}
			}
		}
	}

	return errors
}
