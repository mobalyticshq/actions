// Types for schema validation
export interface SchemaField {
  type: string;
  array?: boolean;
  required?: boolean;
  filter?: boolean;
  refTo?: string;
  objName?: string;
}

export interface SchemaObject {
  fields: Record<string, SchemaField>;
}

export interface SchemaGroup {
  fields: Record<string, SchemaField>;
  objects?: Record<string, SchemaObject>;
}

export interface Schema {
  namespace: string;
  typePrefix: string;
  groups: Record<string, SchemaGroup>;
}

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  path?: string;
}
