Implement this prompt

## Paths

**All paths are relative to the repository root directory** (the directory that contains the `build-static-data-query/` subdirectory).

To locate the repository root: look for the directory containing `build-static-data-query/package.json` and `build-static-data-query/action.yml`.

## Input

- **File**: build-static-data-query/_generated/cleaned-schema.graphql
- **Content**: GraphQL schema

## Output

- **Folder**: build-static-data-query/build/gql
- **Requirement**: 
  - Create this folder if it does not exist
  - All generated files must be placed in this folder
  - **ONLY** create new `.gql.ts` files in this folder
  - **DO NOT** modify any files outside this folder
  
## Important Restrictions

**DO NOT modify any existing source code files.**
- Do NOT modify any files in the `build-static-data-query/src` directory
- **ONLY create NEW files** in the output folder: `build-static-data-query/build/gql`

---

## Task

1. Analyze the **[Game]StaticDataQuery** type in the GraphQL schema.
   - This type contains *groups* node.
   - Node *groups* contains multiple nested nodes.
   - Each nested node has a data field.
   - The data field contains an array of entities.

2. For **each entity type** found inside the data fields:
   - Generate a **GraphQL fragment**.
   - The fragment must include **all possible fields** defined in the schema for that entity type, expanding nested object types recursively.
   - **Circular reference handling**: while expanding nested fields, keep track of the chain of entity types visited from the root of the current fragment. If a nested field's type is an entity type that **already appears in the current ancestor chain**, do NOT expand that field — include only its **scalar fields** (i.e., fields with scalar/enum types such as `String`, `Boolean`, `Int`, `Float`, `ID`, or any enum), omitting any further nested object-type fields. This prevents infinite recursion while still fetching useful identifying data (like `id`, `slug`, `name`) from the back-referenced entity.

---

## File Naming Convention

- Format: [gql-type-name]-fragment.gql.ts
- Where [gql-type-name] = the GraphQL type name of the entity, transformed to kebab-case.

---

## File Content Example

Use as an example this file - build-static-data-query/src/examples/gql-fragment.example.gql.ts
