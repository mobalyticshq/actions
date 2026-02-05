package validator

import (
	"testing"

	"geck-validator/internal/types"
)

func TestValidateDataSourceData_ValidData(t *testing.T) {
	dataSource := types.DataSource{
		"items": {
			{"id": "item1", "slug": "item-1", "name": "Item 1"},
			{"id": "item2", "slug": "item-2", "name": "Item 2"},
		},
		"categories": {
			{"id": "cat1", "slug": "cat-1", "name": "Category 1"},
		},
	}

	errors := ValidateDataSourceData(dataSource)

	if len(errors) != 0 {
		t.Errorf("expected no errors, got %d: %v", len(errors), errors)
	}
}

func TestValidateDataSourceData_MissingRequiredFields(t *testing.T) {
	tests := []struct {
		name          string
		dataSource    types.DataSource
		expectedCount int
		expectedField string
	}{
		{
			name: "missing id",
			dataSource: types.DataSource{
				"items": {
					{"slug": "item-1", "name": "Item 1"},
				},
			},
			expectedCount: 1,
			expectedField: "id",
		},
		{
			name: "missing slug",
			dataSource: types.DataSource{
				"items": {
					{"id": "item1", "name": "Item 1"},
				},
			},
			expectedCount: 1,
			expectedField: "slug",
		},
		{
			name: "missing name",
			dataSource: types.DataSource{
				"items": {
					{"id": "item1", "slug": "item-1"},
				},
			},
			expectedCount: 1,
			expectedField: "name",
		},
		{
			name: "missing all required fields",
			dataSource: types.DataSource{
				"items": {
					{"other": "value"},
				},
			},
			expectedCount: 3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errors := ValidateDataSourceData(tt.dataSource)

			if len(errors) != tt.expectedCount {
				t.Errorf("expected %d errors, got %d: %v", tt.expectedCount, len(errors), errors)
			}

			if tt.expectedField != "" && len(errors) > 0 {
				found := false
				for _, err := range errors {
					if err.Message == "missing required field '"+tt.expectedField+"'" {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("expected error about missing '%s' field", tt.expectedField)
				}
			}
		})
	}
}

func TestValidateDataSourceData_DuplicateId(t *testing.T) {
	dataSource := types.DataSource{
		"items": {
			{"id": "item1", "slug": "item-1", "name": "Item 1"},
			{"id": "item1", "slug": "item-2", "name": "Item 2"},
		},
	}

	errors := ValidateDataSourceData(dataSource)

	if len(errors) != 1 {
		t.Errorf("expected 1 error, got %d: %v", len(errors), errors)
	}

	if len(errors) > 0 {
		if errors[0].Type != "error" {
			t.Errorf("expected error type 'error', got '%s'", errors[0].Type)
		}
		if errors[0].Path != "items[1].id" {
			t.Errorf("expected path 'items[1].id', got '%s'", errors[0].Path)
		}
	}
}

func TestValidateDataSourceData_DuplicateSlug(t *testing.T) {
	dataSource := types.DataSource{
		"items": {
			{"id": "item1", "slug": "same-slug", "name": "Item 1"},
			{"id": "item2", "slug": "same-slug", "name": "Item 2"},
		},
	}

	errors := ValidateDataSourceData(dataSource)

	if len(errors) != 1 {
		t.Errorf("expected 1 error, got %d: %v", len(errors), errors)
	}

	if len(errors) > 0 && errors[0].Path != "items[1].slug" {
		t.Errorf("expected path 'items[1].slug', got '%s'", errors[0].Path)
	}
}

func TestValidateDataSourceData_DuplicatesAcrossGroups(t *testing.T) {
	// Same id/slug in different groups should be allowed
	dataSource := types.DataSource{
		"items": {
			{"id": "shared-id", "slug": "shared-slug", "name": "Item 1"},
		},
		"categories": {
			{"id": "shared-id", "slug": "shared-slug", "name": "Category 1"},
		},
	}

	errors := ValidateDataSourceData(dataSource)

	if len(errors) != 0 {
		t.Errorf("expected no errors (duplicates across groups allowed), got %d: %v", len(errors), errors)
	}
}

func TestValidateDataSourceData_NonStringIdOrSlug(t *testing.T) {
	dataSource := types.DataSource{
		"items": {
			{"id": 123, "slug": "item-1", "name": "Item 1"},
		},
	}

	errors := ValidateDataSourceData(dataSource)

	if len(errors) != 1 {
		t.Errorf("expected 1 error, got %d: %v", len(errors), errors)
	}

	if len(errors) > 0 && errors[0].Message != "field 'id' must be a string" {
		t.Errorf("expected message about non-string id, got '%s'", errors[0].Message)
	}
}

func TestValidateDataSourceData_EmptyGroups(t *testing.T) {
	dataSource := types.DataSource{
		"items": {},
	}

	errors := ValidateDataSourceData(dataSource)

	if len(errors) != 0 {
		t.Errorf("expected no errors for empty groups, got %d: %v", len(errors), errors)
	}
}

func TestValidateDataSourceData_MultipleErrors(t *testing.T) {
	dataSource := types.DataSource{
		"items": {
			{"id": "item1", "slug": "item-1", "name": "Item 1"},
			{"id": "item1", "slug": "item-1", "name": "Item 2"}, // duplicate id and slug
			{"slug": "item-3", "name": "Item 3"},                // missing id
		},
	}

	errors := ValidateDataSourceData(dataSource)

	// Expected: duplicate id, duplicate slug, missing id = 3 errors
	if len(errors) != 3 {
		t.Errorf("expected 3 errors, got %d: %v", len(errors), errors)
	}
}
