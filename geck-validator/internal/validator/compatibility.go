package validator

import (
	"encoding/json"
	"fmt"
	"os"

	"geck-validator/internal/types"
)

// ValidateCompatibility validates backward compatibility between new and current schema
func ValidateCompatibility(newSchemaPath, currentSchemaPath string) ([]types.ValidationError, error) {
	// Read new schema
	newData, err := os.ReadFile(newSchemaPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read new schema file: %w", err)
	}

	var newSchema types.Schema
	if err := json.Unmarshal(newData, &newSchema); err != nil {
		return nil, fmt.Errorf("failed to parse new schema JSON: %w", err)
	}

	// Read current schema
	currentData, err := os.ReadFile(currentSchemaPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read current schema file: %w", err)
	}

	var currentSchema types.Schema
	if err := json.Unmarshal(currentData, &currentSchema); err != nil {
		return nil, fmt.Errorf("failed to parse current schema JSON: %w", err)
	}

	return ValidateCompatibilityData(&newSchema, &currentSchema), nil
}

// ValidateCompatibilityData validates backward compatibility between two parsed schemas
func ValidateCompatibilityData(newSchema, currentSchema *types.Schema) []types.ValidationError {
	var errors []types.ValidationError

	// Top-level validations
	errors = append(errors, validateSC01_NamespaceUnchanged(newSchema, currentSchema)...)
	errors = append(errors, validateSC02_TypePrefixUnchanged(newSchema, currentSchema)...)

	// Group-level validations
	for groupName, currentGroup := range currentSchema.Groups {
		newGroup, exists := newSchema.Groups[groupName]
		if !exists {
			errors = append(errors, validateSC03_GroupNotDeleted(groupName)...)
			continue
		}

		// Field-level validations for group fields
		for fieldName, currentField := range currentGroup.Fields {
			newField, exists := newGroup.Fields[fieldName]
			if !exists {
				errors = append(errors, validateSC04_FieldNotDeleted(groupName, fieldName)...)
				continue
			}

			path := fmt.Sprintf("groups.%s.fields.%s", groupName, fieldName)
			errors = append(errors, validateSC05_FieldTypeUnchanged(&newField, &currentField, path)...)
			errors = append(errors, validateSC06_RequiredModifierKept(&newField, &currentField, path)...)
			errors = append(errors, validateSC07_FilterModifierKept(&newField, &currentField, path)...)
			errors = append(errors, validateSC08_ArrayModifierKept(&newField, &currentField, path)...)
			errors = append(errors, validateSC12_GeckRefFieldNameUnchanged(&newField, &currentField, path)...)
		}

		// Object-level validations
		for objectName, currentObject := range currentGroup.Objects {
			if newGroup.Objects == nil {
				errors = append(errors, validateSC09_ObjectNotDeleted(groupName, objectName)...)
				continue
			}

			newObject, exists := newGroup.Objects[objectName]
			if !exists {
				errors = append(errors, validateSC09_ObjectNotDeleted(groupName, objectName)...)
				continue
			}

			// Object field validations
			for fieldName, currentField := range currentObject.Fields {
				newField, exists := newObject.Fields[fieldName]
				if !exists {
					errors = append(errors, validateSC10_ObjectFieldNotDeleted(groupName, objectName, fieldName)...)
					continue
				}

				path := fmt.Sprintf("groups.%s.objects.%s.fields.%s", groupName, objectName, fieldName)
				errors = append(errors, validateSC11_ObjectFieldTypeUnchanged(&newField, &currentField, path)...)
			}
		}
	}

	return errors
}

// SC01: Namespace unchanged
func validateSC01_NamespaceUnchanged(newSchema, currentSchema *types.Schema) []types.ValidationError {
	if newSchema.Namespace != currentSchema.Namespace {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("namespace cannot be changed from %q to %q", currentSchema.Namespace, newSchema.Namespace),
			Path:    "namespace",
		}}
	}
	return nil
}

// SC02: TypePrefix unchanged
func validateSC02_TypePrefixUnchanged(newSchema, currentSchema *types.Schema) []types.ValidationError {
	if newSchema.TypePrefix != currentSchema.TypePrefix {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("typePrefix cannot be changed from %q to %q", currentSchema.TypePrefix, newSchema.TypePrefix),
			Path:    "typePrefix",
		}}
	}
	return nil
}

// SC03: Group not deleted
func validateSC03_GroupNotDeleted(groupName string) []types.ValidationError {
	return []types.ValidationError{{
		Type:    "error",
		Message: fmt.Sprintf("group %q cannot be deleted", groupName),
		Path:    fmt.Sprintf("groups.%s", groupName),
	}}
}

// SC04: Field not deleted
func validateSC04_FieldNotDeleted(groupName, fieldName string) []types.ValidationError {
	return []types.ValidationError{{
		Type:    "error",
		Message: fmt.Sprintf("field %q in group %q cannot be deleted", fieldName, groupName),
		Path:    fmt.Sprintf("groups.%s.fields.%s", groupName, fieldName),
	}}
}

// SC05: Field type unchanged
func validateSC05_FieldTypeUnchanged(newField, currentField *types.SchemaField, path string) []types.ValidationError {
	if newField.Type != currentField.Type {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("field type cannot be changed from %q to %q", currentField.Type, newField.Type),
			Path:    path + ".type",
		}}
	}
	return nil
}

// SC06: Required modifier kept
func validateSC06_RequiredModifierKept(newField, currentField *types.SchemaField, path string) []types.ValidationError {
	if currentField.Required && !newField.Required {
		return []types.ValidationError{{
			Type:    "error",
			Message: "required modifier cannot be removed",
			Path:    path + ".required",
		}}
	}
	return nil
}

// SC07: Filter modifier kept
func validateSC07_FilterModifierKept(newField, currentField *types.SchemaField, path string) []types.ValidationError {
	if currentField.Filter && !newField.Filter {
		return []types.ValidationError{{
			Type:    "error",
			Message: "filter modifier cannot be removed",
			Path:    path + ".filter",
		}}
	}
	return nil
}

// SC08: Array modifier kept
func validateSC08_ArrayModifierKept(newField, currentField *types.SchemaField, path string) []types.ValidationError {
	if currentField.Array && !newField.Array {
		return []types.ValidationError{{
			Type:    "error",
			Message: "array modifier cannot be removed",
			Path:    path + ".array",
		}}
	}
	return nil
}

// SC09: Object not deleted
func validateSC09_ObjectNotDeleted(groupName, objectName string) []types.ValidationError {
	return []types.ValidationError{{
		Type:    "error",
		Message: fmt.Sprintf("object %q in group %q cannot be deleted", objectName, groupName),
		Path:    fmt.Sprintf("groups.%s.objects.%s", groupName, objectName),
	}}
}

// SC10: Object field not deleted
func validateSC10_ObjectFieldNotDeleted(groupName, objectName, fieldName string) []types.ValidationError {
	return []types.ValidationError{{
		Type:    "error",
		Message: fmt.Sprintf("field %q in object %q (group %q) cannot be deleted", fieldName, objectName, groupName),
		Path:    fmt.Sprintf("groups.%s.objects.%s.fields.%s", groupName, objectName, fieldName),
	}}
}

// SC11: Object field type unchanged
func validateSC11_ObjectFieldTypeUnchanged(newField, currentField *types.SchemaField, path string) []types.ValidationError {
	if newField.Type != currentField.Type {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("object field type cannot be changed from %q to %q", currentField.Type, newField.Type),
			Path:    path + ".type",
		}}
	}
	return nil
}

// SC12: geckRefFieldName unchanged (if it was set)
func validateSC12_GeckRefFieldNameUnchanged(newField, currentField *types.SchemaField, path string) []types.ValidationError {
	// Only check if geckRefFieldName was set in the current schema
	if currentField.GeckRefFieldName != "" && newField.GeckRefFieldName != currentField.GeckRefFieldName {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("geckRefFieldName cannot be changed from %q to %q", currentField.GeckRefFieldName, newField.GeckRefFieldName),
			Path:    path + ".geckRefFieldName",
		}}
	}
	return nil
}
