package validator

import (
	"testing"

	"geck-validator/internal/types"
)

// Helper to create a valid base schema for testing
func validBaseSchema() *types.Schema {
	return &types.Schema{
		Namespace:          "test.namespace",
		TypePrefix:         "Test",
		DeprecatedGeckMode: true,
		Groups: map[string]types.SchemaGroup{
			"items": {
				Fields: map[string]types.SchemaField{
					"id":   {Type: "String", Required: true, Filter: true},
					"slug": {Type: "String", Required: true, Filter: true},
					"name": {Type: "String"},
				},
			},
		},
	}
}

func TestValidateSchemaData_ValidSchema(t *testing.T) {
	schema := validBaseSchema()
	errors := ValidateSchemaData(schema)

	if len(errors) != 0 {
		t.Errorf("expected no errors, got %d: %v", len(errors), errors)
	}
}

func TestSS01_NamespaceFormat(t *testing.T) {
	tests := []struct {
		name      string
		namespace string
		wantError bool
	}{
		{"valid namespace", "test.namespace", false},
		{"valid with underscore", "_test", false},
		{"empty namespace", "", true},
		{"starts with digit", "1test", true},
		{"invalid chars", "test@namespace", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			schema := validBaseSchema()
			schema.Namespace = tt.namespace
			errors := validateSS01_NamespaceFormat(schema)
			if (len(errors) > 0) != tt.wantError {
				t.Errorf("wantError=%v, got errors: %v", tt.wantError, errors)
			}
		})
	}
}

func TestSS02_TypePrefixFormat(t *testing.T) {
	tests := []struct {
		name       string
		typePrefix string
		wantError  bool
	}{
		{"valid prefix", "Test", false},
		{"valid with digits", "Test123", false},
		{"empty prefix", "", true},
		{"invalid chars", "Test_Prefix", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			schema := validBaseSchema()
			schema.TypePrefix = tt.typePrefix
			errors := validateSS02_TypePrefixFormat(schema)
			if (len(errors) > 0) != tt.wantError {
				t.Errorf("wantError=%v, got errors: %v", tt.wantError, errors)
			}
		})
	}
}

func TestSS03_GroupsNotEmpty(t *testing.T) {
	schema := validBaseSchema()
	schema.Groups = map[string]types.SchemaGroup{}
	errors := validateSS03_GroupsNotEmpty(schema)

	if len(errors) != 1 {
		t.Errorf("expected 1 error, got %d", len(errors))
	}
}

func TestSS04_DeprecatedGeckModeEnabled(t *testing.T) {
	schema := validBaseSchema()
	schema.DeprecatedGeckMode = false
	errors := validateSS04_DeprecatedGeckModeEnabled(schema)

	if len(errors) != 1 {
		t.Errorf("expected 1 error, got %d", len(errors))
	}
}

func TestSS05_GroupNameFormat(t *testing.T) {
	tests := []struct {
		name      string
		groupName string
		wantError bool
	}{
		{"valid name", "items", false},
		{"valid camelCase", "itemCategories", false},
		{"starts with digit", "1items", true},
		{"contains underscore", "item_categories", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errors := validateSS05_GroupNameFormat(tt.groupName)
			if (len(errors) > 0) != tt.wantError {
				t.Errorf("wantError=%v, got errors: %v", tt.wantError, errors)
			}
		})
	}
}

func TestSS07_GroupHasFields(t *testing.T) {
	group := &types.SchemaGroup{Fields: map[string]types.SchemaField{}}
	errors := validateSS07_GroupHasFields("items", group)

	if len(errors) != 1 {
		t.Errorf("expected 1 error, got %d", len(errors))
	}
}

func TestSS08_GroupHasIdField(t *testing.T) {
	t.Run("missing id field", func(t *testing.T) {
		group := &types.SchemaGroup{
			Fields: map[string]types.SchemaField{
				"slug": {Type: "String", Required: true, Filter: true},
			},
		}
		errors := validateSS08_GroupHasIdField("items", group)
		if len(errors) != 1 {
			t.Errorf("expected 1 error, got %d", len(errors))
		}
	})

	t.Run("id without required", func(t *testing.T) {
		group := &types.SchemaGroup{
			Fields: map[string]types.SchemaField{
				"id": {Type: "String", Required: false, Filter: true},
			},
		}
		errors := validateSS08_GroupHasIdField("items", group)
		if len(errors) != 1 {
			t.Errorf("expected 1 error for missing required, got %d", len(errors))
		}
	})
}

func TestSS16_FieldTypeAllowed(t *testing.T) {
	tests := []struct {
		name      string
		fieldType string
		wantError bool
	}{
		{"String", "String", false},
		{"Int", "Int", false},
		{"Float", "Float", false},
		{"Boolean", "Boolean", false},
		{"Ref", "Ref", false},
		{"Object", "Object", false},
		{"Invalid", "InvalidType", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			field := &types.SchemaField{Type: tt.fieldType}
			errors := validateSS16_FieldTypeAllowed(field, "test.path")
			if (len(errors) > 0) != tt.wantError {
				t.Errorf("wantError=%v, got errors: %v", tt.wantError, errors)
			}
		})
	}
}

func TestSS17_ObjNameReferenceValid(t *testing.T) {
	group := &types.SchemaGroup{
		Fields: map[string]types.SchemaField{},
		Objects: map[string]types.SchemaObject{
			"stats": {Fields: map[string]types.SchemaField{"health": {Type: "Int"}}},
		},
	}

	t.Run("valid objName", func(t *testing.T) {
		field := &types.SchemaField{Type: "Object", ObjName: "stats"}
		errors := validateSS17_ObjNameReferenceValid(field, "test.path", group)
		if len(errors) != 0 {
			t.Errorf("expected no errors, got %d", len(errors))
		}
	})

	t.Run("invalid objName", func(t *testing.T) {
		field := &types.SchemaField{Type: "Object", ObjName: "nonexistent"}
		errors := validateSS17_ObjNameReferenceValid(field, "test.path", group)
		if len(errors) != 1 {
			t.Errorf("expected 1 error, got %d", len(errors))
		}
	})
}

func TestSS18_RefToReferenceValid(t *testing.T) {
	schema := validBaseSchema()

	t.Run("valid refTo", func(t *testing.T) {
		field := &types.SchemaField{Type: "Ref", RefTo: "items"}
		errors := validateSS18_RefToReferenceValid(field, "test.path", schema)
		if len(errors) != 0 {
			t.Errorf("expected no errors, got %d", len(errors))
		}
	})

	t.Run("invalid refTo", func(t *testing.T) {
		field := &types.SchemaField{Type: "Ref", RefTo: "nonexistent"}
		errors := validateSS18_RefToReferenceValid(field, "test.path", schema)
		if len(errors) != 1 {
			t.Errorf("expected 1 error, got %d", len(errors))
		}
	})
}

func TestSS19_FilterOnlyOnString(t *testing.T) {
	t.Run("filter on String is ok", func(t *testing.T) {
		field := &types.SchemaField{Type: "String", Filter: true}
		errors := validateSS19_FilterOnlyOnString(field, "test.path")
		if len(errors) != 0 {
			t.Errorf("expected no errors, got %d", len(errors))
		}
	})

	t.Run("filter on Int is error", func(t *testing.T) {
		field := &types.SchemaField{Type: "Int", Filter: true}
		errors := validateSS19_FilterOnlyOnString(field, "test.path")
		if len(errors) != 1 {
			t.Errorf("expected 1 error, got %d", len(errors))
		}
	})
}

func TestSS20_RefFieldNameConflict(t *testing.T) {
	group := &types.SchemaGroup{
		Fields: map[string]types.SchemaField{
			"item":     {Type: "String"},
			"category": {Type: "String"},
		},
	}

	t.Run("only applies to Ref type", func(t *testing.T) {
		field := &types.SchemaField{Type: "String"}
		errors := validateSS20_RefFieldNameConflict("itemRef", field, "test.path", group)
		if len(errors) != 0 {
			t.Errorf("expected no errors for non-Ref type, got %d", len(errors))
		}
	})

	t.Run("conflict with Ref suffix", func(t *testing.T) {
		field := &types.SchemaField{Type: "Ref", RefTo: "items"}
		errors := validateSS20_RefFieldNameConflict("itemRef", field, "test.path", group)
		if len(errors) != 1 {
			t.Errorf("expected 1 error, got %d", len(errors))
		}
	})

	t.Run("conflict with Slug suffix", func(t *testing.T) {
		field := &types.SchemaField{Type: "Ref", RefTo: "categories"}
		errors := validateSS20_RefFieldNameConflict("categorySlug", field, "test.path", group)
		if len(errors) != 1 {
			t.Errorf("expected 1 error, got %d", len(errors))
		}
	})

	t.Run("no conflict with suffix", func(t *testing.T) {
		field := &types.SchemaField{Type: "Ref", RefTo: "other"}
		errors := validateSS20_RefFieldNameConflict("otherRef", field, "test.path", group)
		if len(errors) != 0 {
			t.Errorf("expected no errors, got %d", len(errors))
		}
	})

	t.Run("geckRefFieldName conflict", func(t *testing.T) {
		field := &types.SchemaField{Type: "Ref", RefTo: "items", GeckRefFieldName: "item"}
		errors := validateSS20_RefFieldNameConflict("someRef", field, "test.path", group)
		if len(errors) != 1 {
			t.Errorf("expected 1 error for geckRefFieldName conflict, got %d", len(errors))
		}
	})

	t.Run("geckRefFieldName no conflict", func(t *testing.T) {
		field := &types.SchemaField{Type: "Ref", RefTo: "items", GeckRefFieldName: "nonexistent"}
		errors := validateSS20_RefFieldNameConflict("someRef", field, "test.path", group)
		if len(errors) != 0 {
			t.Errorf("expected no errors, got %d", len(errors))
		}
	})

	t.Run("geckRefFieldName skips suffix check", func(t *testing.T) {
		// Even though field name has Ref suffix and "item" exists,
		// geckRefFieldName takes precedence and doesn't conflict
		field := &types.SchemaField{Type: "Ref", RefTo: "items", GeckRefFieldName: "nonexistent"}
		errors := validateSS20_RefFieldNameConflict("itemRef", field, "test.path", group)
		if len(errors) != 0 {
			t.Errorf("expected no errors when geckRefFieldName is set (skips suffix check), got %d", len(errors))
		}
	})
}
