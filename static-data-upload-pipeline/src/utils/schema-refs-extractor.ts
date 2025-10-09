/**
 * Schema reference extractor utility
 * Transforms schema structure into a list of references
 */

interface SchemaField {
  type: string;
  refTo?: string;
  array?: boolean;
  objName?: string;
  filter?: boolean;
  required?: boolean;
  [key: string]: any;
}

interface SchemaObject {
  fields: Record<string, SchemaField>;
}

interface SchemaGroup {
  fields: Record<string, SchemaField>;
  objects?: Record<string, SchemaObject>;
}

interface Schema {
  namespace?: string;
  typePrefix?: string;
  groups: Record<string, SchemaGroup>;
}

interface Reference {
  from: string;
  to: string;
}

interface ExtractedRefs {
  refs: Reference[];
}

/**
 * Extract all references from schema
 * @param schema - Input schema with groups, fields, and objects
 * @returns Object with refs array containing all references
 */
export function extractSchemaRefs(schema: Schema): ExtractedRefs {
  const refs: Reference[] = [];

  // Iterate through all groups
  for (const [groupName, group] of Object.entries(schema.groups)) {
    // Process top-level fields
    processFields(groupName, '', group.fields, refs);

    // Process nested objects
    if (group.objects) {
      for (const [objectName, obj] of Object.entries(group.objects)) {
        processFields(groupName, objectName, obj.fields, refs);
      }
    }
  }

  return { refs };
}

/**
 * Process fields and extract references
 * @param groupName - Current group name
 * @param objectPath - Path to nested object (empty for top-level fields)
 * @param fields - Fields to process
 * @param refs - Array to collect references
 */
function processFields(
  groupName: string,
  objectPath: string,
  fields: Record<string, SchemaField>,
  refs: Reference[]
): void {
  for (const [fieldName, field] of Object.entries(fields)) {
    // Build full field path
    const fieldPath = objectPath 
      ? `${groupName}.${objectPath}.${fieldName}`
      : `${groupName}.${fieldName}`;

    // Check if field is a Ref type
    if (field.type === 'Ref' && field.refTo) {
      refs.push({
        from: fieldPath,
        to: field.refTo
      });
    }

    // Check for self-referencing ID fields (e.g., baseItemId)
    if (field.type === 'String' && isSelfReferencingIdField(fieldName, groupName)) {
      refs.push({
        from: fieldPath,
        to: groupName
      });
    }
  }
}

/**
 * Check if field is a self-referencing ID field
 * Common patterns: baseItemId, parentId, etc.
 * @param fieldName - Name of the field
 * @param groupName - Name of the current group
 * @returns true if field is likely a self-reference
 */
function isSelfReferencingIdField(fieldName: string, groupName: string): boolean {
  // Common self-referencing patterns
  const selfRefPatterns = ['baseItemId', 'parentId', 'baseId'];
  
  return selfRefPatterns.includes(fieldName);
}

/**
 * Extract references with custom options
 * @param schema - Input schema
 * @param options - Extraction options
 * @returns Object with refs array
 */
export function extractSchemaRefsWithOptions(
  schema: Schema,
  options?: {
    includeSelfRefs?: boolean;
    customRefPatterns?: string[];
  }
): ExtractedRefs {
  const refs: Reference[] = [];
  const includeSelfRefs = options?.includeSelfRefs ?? true;
  const customPatterns = options?.customRefPatterns ?? ['baseItemId', 'parentId', 'baseId'];

  for (const [groupName, group] of Object.entries(schema.groups)) {
    processFieldsWithOptions(groupName, '', group.fields, refs, includeSelfRefs, customPatterns);

    if (group.objects) {
      for (const [objectName, obj] of Object.entries(group.objects)) {
        processFieldsWithOptions(groupName, objectName, obj.fields, refs, includeSelfRefs, customPatterns);
      }
    }
  }

  return { refs };
}

function processFieldsWithOptions(
  groupName: string,
  objectPath: string,
  fields: Record<string, SchemaField>,
  refs: Reference[],
  includeSelfRefs: boolean,
  customPatterns: string[]
): void {
  for (const [fieldName, field] of Object.entries(fields)) {
    const fieldPath = objectPath 
      ? `${groupName}.${objectPath}.${fieldName}`
      : `${groupName}.${fieldName}`;

    // Extract Ref type references
    if (field.type === 'Ref' && field.refTo) {
      refs.push({
        from: fieldPath,
        to: field.refTo
      });
    }

    // Extract self-referencing fields if enabled
    if (includeSelfRefs && field.type === 'String' && customPatterns.includes(fieldName)) {
      refs.push({
        from: fieldPath,
        to: groupName
      });
    }
  }
}

/**
 * Sort references by 'from' field
 * @param refs - References to sort
 * @returns Sorted references
 */
export function sortRefs(refs: ExtractedRefs): ExtractedRefs {
  return {
    refs: refs.refs.sort((a, b) => a.from.localeCompare(b.from))
  };
}

/**
 * Group references by target
 * @param refs - References to group
 * @returns Grouped references
 */
export function groupRefsByTarget(refs: ExtractedRefs): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const ref of refs.refs) {
    if (!grouped[ref.to]) {
      grouped[ref.to] = [];
    }
    grouped[ref.to].push(ref.from);
  }

  return grouped;
}

/**
 * Filter references by source group
 * @param refs - References to filter
 * @param groupName - Group name to filter by
 * @returns Filtered references
 */
export function filterRefsByGroup(refs: ExtractedRefs, groupName: string): ExtractedRefs {
  return {
    refs: refs.refs.filter(ref => ref.from.startsWith(`${groupName}.`))
  };
}

