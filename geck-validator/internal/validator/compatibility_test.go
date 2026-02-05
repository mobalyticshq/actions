package validator

import (
	"testing"

	"geck-validator/internal/types"
)

// Helper to create a valid base schema for compatibility testing
func validCompatibilitySchema() *types.Schema {
	return &types.Schema{
		Namespace:          "test.namespace",
		TypePrefix:         "Test",
		DeprecatedGeckMode: true,
		Groups: map[string]types.SchemaGroup{
			"items": {
				Fields: map[string]types.SchemaField{
					"id":    {Type: "String", Required: true, Filter: true},
					"slug":  {Type: "String", Required: true, Filter: true},
					"name":  {Type: "String"},
					"tags":  {Type: "Ref", Array: true, RefTo: "tags"},
					"stats": {Type: "Object", ObjName: "stats"},
				},
				Objects: map[string]types.SchemaObject{
					"stats": {
						Fields: map[string]types.SchemaField{
							"health": {Type: "Int"},
							"mana":   {Type: "Int"},
						},
					},
				},
			},
			"tags": {
				Fields: map[string]types.SchemaField{
					"id":   {Type: "String", Required: true, Filter: true},
					"slug": {Type: "String", Required: true, Filter: true},
				},
			},
		},
	}
}

func copySchema(s *types.Schema) *types.Schema {
	// Simple deep copy for testing
	copy := &types.Schema{
		Namespace:          s.Namespace,
		TypePrefix:         s.TypePrefix,
		DeprecatedGeckMode: s.DeprecatedGeckMode,
		Groups:             make(map[string]types.SchemaGroup),
	}
	for gName, group := range s.Groups {
		newGroup := types.SchemaGroup{
			Fields:  make(map[string]types.SchemaField),
			Objects: make(map[string]types.SchemaObject),
		}
		for fName, field := range group.Fields {
			newGroup.Fields[fName] = field
		}
		for oName, obj := range group.Objects {
			newObj := types.SchemaObject{Fields: make(map[string]types.SchemaField)}
			for fName, field := range obj.Fields {
				newObj.Fields[fName] = field
			}
			newGroup.Objects[oName] = newObj
		}
		copy.Groups[gName] = newGroup
	}
	return copy
}

func TestValidateCompatibilityData_NoChanges(t *testing.T) {
	current := validCompatibilitySchema()
	new := copySchema(current)

	errors := ValidateCompatibilityData(new, current)

	if len(errors) != 0 {
		t.Errorf("expected no errors for identical schemas, got %d: %v", len(errors), errors)
	}
}

func TestSC01_NamespaceUnchanged(t *testing.T) {
	current := validCompatibilitySchema()
	new := copySchema(current)
	new.Namespace = "different.namespace"

	errors := validateSC01_NamespaceUnchanged(new, current)

	if len(errors) != 1 {
		t.Errorf("expected 1 error, got %d", len(errors))
	}
}

func TestSC02_TypePrefixUnchanged(t *testing.T) {
	current := validCompatibilitySchema()
	new := copySchema(current)
	new.TypePrefix = "Different"

	errors := validateSC02_TypePrefixUnchanged(new, current)

	if len(errors) != 1 {
		t.Errorf("expected 1 error, got %d", len(errors))
	}
}

func TestSC03_GroupNotDeleted(t *testing.T) {
	current := validCompatibilitySchema()
	new := copySchema(current)
	delete(new.Groups, "tags")

	errors := ValidateCompatibilityData(new, current)

	found := false
	for _, err := range errors {
		if err.Path == "groups.tags" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected error for deleted group 'tags'")
	}
}

func TestSC04_FieldNotDeleted(t *testing.T) {
	current := validCompatibilitySchema()
	new := copySchema(current)
	delete(new.Groups["items"].Fields, "name")

	errors := ValidateCompatibilityData(new, current)

	found := false
	for _, err := range errors {
		if err.Path == "groups.items.fields.name" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected error for deleted field 'name'")
	}
}

func TestSC05_FieldTypeUnchanged(t *testing.T) {
	currentField := &types.SchemaField{Type: "String"}
	newField := &types.SchemaField{Type: "Int"}

	errors := validateSC05_FieldTypeUnchanged(newField, currentField, "test.path")

	if len(errors) != 1 {
		t.Errorf("expected 1 error, got %d", len(errors))
	}
}

func TestSC06_RequiredModifierKept(t *testing.T) {
	t.Run("removing required is error", func(t *testing.T) {
		currentField := &types.SchemaField{Type: "String", Required: true}
		newField := &types.SchemaField{Type: "String", Required: false}

		errors := validateSC06_RequiredModifierKept(newField, currentField, "test.path")

		if len(errors) != 1 {
			t.Errorf("expected 1 error, got %d", len(errors))
		}
	})

	t.Run("adding required is ok", func(t *testing.T) {
		currentField := &types.SchemaField{Type: "String", Required: false}
		newField := &types.SchemaField{Type: "String", Required: true}

		errors := validateSC06_RequiredModifierKept(newField, currentField, "test.path")

		if len(errors) != 0 {
			t.Errorf("expected no errors, got %d", len(errors))
		}
	})
}

func TestSC07_FilterModifierKept(t *testing.T) {
	currentField := &types.SchemaField{Type: "String", Filter: true}
	newField := &types.SchemaField{Type: "String", Filter: false}

	errors := validateSC07_FilterModifierKept(newField, currentField, "test.path")

	if len(errors) != 1 {
		t.Errorf("expected 1 error, got %d", len(errors))
	}
}

func TestSC08_ArrayModifierKept(t *testing.T) {
	currentField := &types.SchemaField{Type: "Ref", Array: true}
	newField := &types.SchemaField{Type: "Ref", Array: false}

	errors := validateSC08_ArrayModifierKept(newField, currentField, "test.path")

	if len(errors) != 1 {
		t.Errorf("expected 1 error, got %d", len(errors))
	}
}

func TestSC09_ObjectNotDeleted(t *testing.T) {
	current := validCompatibilitySchema()
	new := copySchema(current)
	delete(new.Groups["items"].Objects, "stats")

	errors := ValidateCompatibilityData(new, current)

	found := false
	for _, err := range errors {
		if err.Path == "groups.items.objects.stats" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected error for deleted object 'stats'")
	}
}

func TestSC10_ObjectFieldNotDeleted(t *testing.T) {
	current := validCompatibilitySchema()
	new := copySchema(current)
	delete(new.Groups["items"].Objects["stats"].Fields, "health")

	errors := ValidateCompatibilityData(new, current)

	found := false
	for _, err := range errors {
		if err.Path == "groups.items.objects.stats.fields.health" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected error for deleted object field 'health'")
	}
}

func TestSC11_ObjectFieldTypeUnchanged(t *testing.T) {
	currentField := &types.SchemaField{Type: "Int"}
	newField := &types.SchemaField{Type: "String"}

	errors := validateSC11_ObjectFieldTypeUnchanged(newField, currentField, "test.path")

	if len(errors) != 1 {
		t.Errorf("expected 1 error, got %d", len(errors))
	}
}

func TestSC12_GeckRefFieldNameUnchanged(t *testing.T) {
	t.Run("changing geckRefFieldName is error", func(t *testing.T) {
		currentField := &types.SchemaField{Type: "Ref", GeckRefFieldName: "original"}
		newField := &types.SchemaField{Type: "Ref", GeckRefFieldName: "changed"}

		errors := validateSC12_GeckRefFieldNameUnchanged(newField, currentField, "test.path")

		if len(errors) != 1 {
			t.Errorf("expected 1 error, got %d", len(errors))
		}
	})

	t.Run("removing geckRefFieldName is error", func(t *testing.T) {
		currentField := &types.SchemaField{Type: "Ref", GeckRefFieldName: "original"}
		newField := &types.SchemaField{Type: "Ref", GeckRefFieldName: ""}

		errors := validateSC12_GeckRefFieldNameUnchanged(newField, currentField, "test.path")

		if len(errors) != 1 {
			t.Errorf("expected 1 error, got %d", len(errors))
		}
	})

	t.Run("adding geckRefFieldName is ok", func(t *testing.T) {
		currentField := &types.SchemaField{Type: "Ref", GeckRefFieldName: ""}
		newField := &types.SchemaField{Type: "Ref", GeckRefFieldName: "newValue"}

		errors := validateSC12_GeckRefFieldNameUnchanged(newField, currentField, "test.path")

		if len(errors) != 0 {
			t.Errorf("expected no errors when adding geckRefFieldName, got %d", len(errors))
		}
	})

	t.Run("keeping same geckRefFieldName is ok", func(t *testing.T) {
		currentField := &types.SchemaField{Type: "Ref", GeckRefFieldName: "same"}
		newField := &types.SchemaField{Type: "Ref", GeckRefFieldName: "same"}

		errors := validateSC12_GeckRefFieldNameUnchanged(newField, currentField, "test.path")

		if len(errors) != 0 {
			t.Errorf("expected no errors, got %d", len(errors))
		}
	})
}
