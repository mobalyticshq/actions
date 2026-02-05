package types

// ValidationError represents a validation error or warning
type ValidationError struct {
	Type    string // "error" or "warning"
	Message string
	Path    string
}

// SchemaField represents a field definition in the schema
type SchemaField struct {
	Type             string   `json:"type"`
	Array            bool     `json:"array,omitempty"`
	Required         bool     `json:"required,omitempty"`
	Filter           bool     `json:"filter,omitempty"`
	RefTo            string   `json:"refTo,omitempty"`
	ObjName          string   `json:"objName,omitempty"`
	RefFilters       []string `json:"refFilters,omitempty"`
	GeckRefFieldName string   `json:"geckRefFieldName,omitempty"`
}

// SchemaObject represents an object definition within a group
type SchemaObject struct {
	Fields map[string]SchemaField `json:"fields"`
}

// SchemaGroup represents a group in the schema
type SchemaGroup struct {
	Fields  map[string]SchemaField  `json:"fields"`
	Objects map[string]SchemaObject `json:"objects,omitempty"`
}

// Schema represents the complete schema structure
type Schema struct {
	Namespace          string                 `json:"namespace"`
	TypePrefix         string                 `json:"typePrefix"`
	DeprecatedGeckMode bool                   `json:"deprecatedGeckMode,omitempty"`
	GqlTypesOverride   map[string]string      `json:"gqlTypesOverrides,omitempty"`
	Groups             map[string]SchemaGroup `json:"groups"`
}

// DataSource represents a static data source file structure
// It's a map of group names to arrays of objects
type DataSource map[string][]map[string]interface{}
