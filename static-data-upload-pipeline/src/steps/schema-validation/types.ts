// Types for schema validation
export interface SchemaField {
  type: 'String' | 'Boolean' | 'Object' | 'Ref';
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

export interface ApiSchema {
  namespace: string;
  typePrefix: string;
  groups: Record<string, SchemaGroup>;
}

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  path?: string;
}
