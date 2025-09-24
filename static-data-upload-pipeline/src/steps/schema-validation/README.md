# Schema Validation

This folder contains the schema validation logic and unit tests for the static data upload pipeline.

## Files

### Core Files
- `schema-validation.ts` - Main validation logic and entry point
- `types.ts` - TypeScript interfaces for schema validation (centralized type definitions)

### Test Files
- `validateSchemaStructure.test.ts` - Tests for schema structure validation
- `validateGroupStructure.test.ts` - Tests for group structure validation
- `validateFieldStructure.test.ts` - Tests for field structure validation
- `validateObjectsStructure.test.ts` - Tests for objects structure validation
- `validateObjectStructure.test.ts` - Tests for object structure validation
- `validateObjectFieldStructure.test.ts` - Tests for object field structure validation

## Validation Rules

### Schema Structure Validation
1. **Namespace** must be defined and start with letter or underscore, contain only letters, digits and underscores
2. **TypePrefix** must be defined and contain only letters and digits
3. **Groups** cannot be empty; group names must be unique valid strings
4. **Groups** must include at least one field (id); field names must be unique valid strings
5. **Group object names** must be unique valid strings (letters only)
6. **Object definitions** must include at least one field; field names must be unique valid strings
7. **Field definitions** must be valid (letters and digits only) and type must be one of: String, Boolean, Ref, Object
8. **objName values** must exist in objects field within group
9. **refTo values** must exist in groups keys in the schema
10. **Filters** must be valid (filter modifier only acceptable for fields with type String)
11. **Ref field names** should not conflict with other fields after trimming "Ref" suffix

### Backward Compatibility Validation
- Namespace and TypePrefix must not change
- Groups, fields, objects, and object fields must not be deleted
- Field types must not change
- Required and filter modifiers must not change from true to false
- Array modifier must not change

## Usage

```typescript
import { schemaValidationStep } from './steps/schema-validation/schema-validation';

// Validate schema structure and backward compatibility
const result = await schemaValidationStep(slackManager, schemaPath, staticDataPath);
```

## Type Imports

All types are centralized in `types.ts` and can be imported from there:

```typescript
import { Schema, SchemaField, SchemaGroup, SchemaObject, ValidationError } from './types';
```

For testing, you can import both functions and types from the convenience file:

```typescript
import { 
  validateSchemaStructure, 
  validateGroupStructure,
  Schema, 
  ValidationError 
} from './schema-validation';
```

## Testing

Run the unit tests to verify validation logic:

```bash
npm test -- --testPathPattern=schema-validation
```

Each validation function has comprehensive unit tests covering:
- Valid cases
- Invalid cases
- Edge cases
- Combined validation scenarios
