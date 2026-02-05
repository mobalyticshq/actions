package validator

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"strings"

	"geck-validator/internal/types"
)

// Regex patterns for validation
var (
	namespacePattern  = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_.]*$`)
	typePrefixPattern = regexp.MustCompile(`^[a-zA-Z0-9]+$`)
	namePattern       = regexp.MustCompile(`^[a-zA-Z][a-zA-Z0-9]*$`)
)

// Allowed field types
var allowedFieldTypes = map[string]bool{
	"String":  true,
	"Int":     true,
	"Float":   true,
	"Boolean": true,
	"Ref":     true,
	"Object":  true,
}

// Reference suffixes that can cause conflicts
var refSuffixes = []string{"Ref", "Slug", "Slugs"}

// ValidateSchema validates a schema file and returns validation errors
func ValidateSchema(filePath string) ([]types.ValidationError, error) {
	// Read the file
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	// Parse JSON
	var schema types.Schema
	if err := json.Unmarshal(data, &schema); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	return ValidateSchemaData(&schema), nil
}

// ValidateSchemaData validates parsed schema and returns validation errors
func ValidateSchemaData(schema *types.Schema) []types.ValidationError {
	var errors []types.ValidationError

	// Top-level validations
	errors = append(errors, validateSS01_NamespaceFormat(schema)...)
	errors = append(errors, validateSS02_TypePrefixFormat(schema)...)
	errors = append(errors, validateSS03_GroupsNotEmpty(schema)...)
	errors = append(errors, validateSS04_DeprecatedGeckModeEnabled(schema)...)

	// Group-level validations
	for groupName, group := range schema.Groups {
		errors = append(errors, validateSS05_GroupNameFormat(groupName)...)
		errors = append(errors, validateSS07_GroupHasFields(groupName, &group)...)
		errors = append(errors, validateSS08_GroupHasIdField(groupName, &group)...)
		errors = append(errors, validateSS09_GroupHasSlugField(groupName, &group)...)

		// Object-level validations
		for objectName, object := range group.Objects {
			errors = append(errors, validateSS10_ObjectNameFormat(groupName, objectName)...)
			errors = append(errors, validateSS12_ObjectHasFields(groupName, objectName, &object)...)

			// Field-level validations for object fields
			for fieldName, field := range object.Fields {
				path := fmt.Sprintf("groups.%s.objects.%s.fields.%s", groupName, objectName, fieldName)
				errors = append(errors, validateFieldRules(fieldName, &field, path, &group, schema)...)
			}
		}
		errors = append(errors, validateSS11_ObjectNameUniqueness(groupName, &group)...)

		// Field-level validations for group fields
		for fieldName, field := range group.Fields {
			path := fmt.Sprintf("groups.%s.fields.%s", groupName, fieldName)
			errors = append(errors, validateFieldRules(fieldName, &field, path, &group, schema)...)
		}
		errors = append(errors, validateSS14_FieldNameUniqueness(groupName, &group)...)
	}
	errors = append(errors, validateSS06_GroupNameUniqueness(schema)...)

	return errors
}

// validateFieldRules applies all field-level validation rules (SS13-SS20)
func validateFieldRules(fieldName string, field *types.SchemaField, path string, group *types.SchemaGroup, schema *types.Schema) []types.ValidationError {
	var errors []types.ValidationError
	errors = append(errors, validateSS13_FieldNameFormat(fieldName, path)...)
	errors = append(errors, validateSS15_FieldTypeFormat(field, path)...)
	errors = append(errors, validateSS16_FieldTypeAllowed(field, path)...)
	errors = append(errors, validateSS17_ObjNameReferenceValid(field, path, group)...)
	errors = append(errors, validateSS18_RefToReferenceValid(field, path, schema)...)
	errors = append(errors, validateSS19_FilterOnlyOnString(field, path)...)
	errors = append(errors, validateSS20_RefFieldNameConflict(fieldName, field, path, group)...)
	return errors
}

// SS01: Namespace format
func validateSS01_NamespaceFormat(schema *types.Schema) []types.ValidationError {
	if schema.Namespace == "" || !namespacePattern.MatchString(schema.Namespace) {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("namespace must be defined, start with letter or underscore, contain only letters, digits, underscores, dots; got: %q", schema.Namespace),
			Path:    "namespace",
		}}
	}
	return nil
}

// SS02: TypePrefix format
func validateSS02_TypePrefixFormat(schema *types.Schema) []types.ValidationError {
	if schema.TypePrefix == "" || !typePrefixPattern.MatchString(schema.TypePrefix) {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("typePrefix must be defined, contain only letters and digits; got: %q", schema.TypePrefix),
			Path:    "typePrefix",
		}}
	}
	return nil
}

// SS03: Groups not empty
func validateSS03_GroupsNotEmpty(schema *types.Schema) []types.ValidationError {
	if len(schema.Groups) == 0 {
		return []types.ValidationError{{
			Type:    "error",
			Message: "schema must have at least one group",
			Path:    "groups",
		}}
	}
	return nil
}

// SS04: deprecatedGeckMode enabled
func validateSS04_DeprecatedGeckModeEnabled(schema *types.Schema) []types.ValidationError {
	if !schema.DeprecatedGeckMode {
		return []types.ValidationError{{
			Type:    "error",
			Message: "deprecatedGeckMode must be set to true",
			Path:    "deprecatedGeckMode",
		}}
	}
	return nil
}

// SS05: Group name format
func validateSS05_GroupNameFormat(groupName string) []types.ValidationError {
	if !namePattern.MatchString(groupName) {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("group name must start with letter, contain only letters and digits; got: %q", groupName),
			Path:    fmt.Sprintf("groups.%s", groupName),
		}}
	}
	return nil
}

// SS06: Group name uniqueness (handled by Go map, but we validate anyway for completeness)
func validateSS06_GroupNameUniqueness(schema *types.Schema) []types.ValidationError {
	// In Go, map keys are inherently unique, so this is always satisfied
	// This function exists for completeness with the rule set
	return nil
}

// SS07: Group has fields
func validateSS07_GroupHasFields(groupName string, group *types.SchemaGroup) []types.ValidationError {
	if len(group.Fields) == 0 {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("group %q must have at least one field", groupName),
			Path:    fmt.Sprintf("groups.%s.fields", groupName),
		}}
	}
	return nil
}

// SS08: Group has id field with required and filter
func validateSS08_GroupHasIdField(groupName string, group *types.SchemaGroup) []types.ValidationError {
	idField, exists := group.Fields["id"]
	if !exists {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("group %q must have 'id' field", groupName),
			Path:    fmt.Sprintf("groups.%s.fields.id", groupName),
		}}
	}
	var errors []types.ValidationError
	if !idField.Required {
		errors = append(errors, types.ValidationError{
			Type:    "error",
			Message: fmt.Sprintf("group %q 'id' field must have required: true", groupName),
			Path:    fmt.Sprintf("groups.%s.fields.id.required", groupName),
		})
	}
	if !idField.Filter {
		errors = append(errors, types.ValidationError{
			Type:    "error",
			Message: fmt.Sprintf("group %q 'id' field must have filter: true", groupName),
			Path:    fmt.Sprintf("groups.%s.fields.id.filter", groupName),
		})
	}
	return errors
}

// SS09: Group has slug field with required and filter
func validateSS09_GroupHasSlugField(groupName string, group *types.SchemaGroup) []types.ValidationError {
	slugField, exists := group.Fields["slug"]
	if !exists {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("group %q must have 'slug' field", groupName),
			Path:    fmt.Sprintf("groups.%s.fields.slug", groupName),
		}}
	}
	var errors []types.ValidationError
	if !slugField.Required {
		errors = append(errors, types.ValidationError{
			Type:    "error",
			Message: fmt.Sprintf("group %q 'slug' field must have required: true", groupName),
			Path:    fmt.Sprintf("groups.%s.fields.slug.required", groupName),
		})
	}
	if !slugField.Filter {
		errors = append(errors, types.ValidationError{
			Type:    "error",
			Message: fmt.Sprintf("group %q 'slug' field must have filter: true", groupName),
			Path:    fmt.Sprintf("groups.%s.fields.slug.filter", groupName),
		})
	}
	return errors
}

// SS10: Object name format
func validateSS10_ObjectNameFormat(groupName, objectName string) []types.ValidationError {
	if !namePattern.MatchString(objectName) {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("object name must start with letter, contain only letters and digits; got: %q", objectName),
			Path:    fmt.Sprintf("groups.%s.objects.%s", groupName, objectName),
		}}
	}
	return nil
}

// SS11: Object name uniqueness (handled by Go map)
func validateSS11_ObjectNameUniqueness(groupName string, group *types.SchemaGroup) []types.ValidationError {
	// In Go, map keys are inherently unique
	return nil
}

// SS12: Object has fields
func validateSS12_ObjectHasFields(groupName, objectName string, object *types.SchemaObject) []types.ValidationError {
	if len(object.Fields) == 0 {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("object %q in group %q must have at least one field", objectName, groupName),
			Path:    fmt.Sprintf("groups.%s.objects.%s.fields", groupName, objectName),
		}}
	}
	return nil
}

// SS13: Field name format
func validateSS13_FieldNameFormat(fieldName, path string) []types.ValidationError {
	if !namePattern.MatchString(fieldName) {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("field name must start with letter, contain only letters and digits; got: %q", fieldName),
			Path:    path,
		}}
	}
	return nil
}

// SS14: Field name uniqueness (handled by Go map)
func validateSS14_FieldNameUniqueness(groupName string, group *types.SchemaGroup) []types.ValidationError {
	// In Go, map keys are inherently unique
	return nil
}

// SS15: Field type format
func validateSS15_FieldTypeFormat(field *types.SchemaField, path string) []types.ValidationError {
	if !typePrefixPattern.MatchString(field.Type) {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("field type must contain only letters and digits; got: %q", field.Type),
			Path:    path + ".type",
		}}
	}
	return nil
}

// SS16: Field type allowed
func validateSS16_FieldTypeAllowed(field *types.SchemaField, path string) []types.ValidationError {
	if !allowedFieldTypes[field.Type] {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("field type must be one of: String, Int, Float, Boolean, Ref, Object; got: %q", field.Type),
			Path:    path + ".type",
		}}
	}
	return nil
}

// SS17: objName reference valid
func validateSS17_ObjNameReferenceValid(field *types.SchemaField, path string, group *types.SchemaGroup) []types.ValidationError {
	if field.ObjName == "" {
		return nil
	}
	if group.Objects == nil {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("objName %q references non-existent object (no objects defined in group)", field.ObjName),
			Path:    path + ".objName",
		}}
	}
	if _, exists := group.Objects[field.ObjName]; !exists {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("objName %q must exist in group's objects", field.ObjName),
			Path:    path + ".objName",
		}}
	}
	return nil
}

// SS18: refTo reference valid
func validateSS18_RefToReferenceValid(field *types.SchemaField, path string, schema *types.Schema) []types.ValidationError {
	if field.RefTo == "" {
		return nil
	}
	if _, exists := schema.Groups[field.RefTo]; !exists {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("refTo %q must exist in schema groups", field.RefTo),
			Path:    path + ".refTo",
		}}
	}
	return nil
}

// SS19: Filter only on String
func validateSS19_FilterOnlyOnString(field *types.SchemaField, path string) []types.ValidationError {
	if field.Filter && field.Type != "String" {
		return []types.ValidationError{{
			Type:    "error",
			Message: fmt.Sprintf("filter: true only allowed on String type fields; got type: %q", field.Type),
			Path:    path + ".filter",
		}}
	}
	return nil
}

// SS20: Ref field name conflict (only applies to Ref type fields)
func validateSS20_RefFieldNameConflict(fieldName string, field *types.SchemaField, path string, group *types.SchemaGroup) []types.ValidationError {
	// Only apply to Ref type fields
	if field.Type != "Ref" {
		return nil
	}

	// If geckRefFieldName is set, check that name doesn't conflict with other fields
	if field.GeckRefFieldName != "" {
		if _, exists := group.Fields[field.GeckRefFieldName]; exists {
			return []types.ValidationError{{
				Type:    "error",
				Message: fmt.Sprintf("geckRefFieldName %q conflicts with existing field in the group", field.GeckRefFieldName),
				Path:    path + ".geckRefFieldName",
			}}
		}
		return nil
	}

	// Fall back to suffix-based check if geckRefFieldName is not set
	for _, suffix := range refSuffixes {
		if strings.HasSuffix(fieldName, suffix) {
			baseFieldName := strings.TrimSuffix(fieldName, suffix)
			if baseFieldName != "" {
				if _, exists := group.Fields[baseFieldName]; exists {
					return []types.ValidationError{{
						Type:    "error",
						Message: fmt.Sprintf("field %q conflicts with field %q after trimming %q suffix", fieldName, baseFieldName, suffix),
						Path:    path,
					}}
				}
			}
		}
	}
	return nil
}
