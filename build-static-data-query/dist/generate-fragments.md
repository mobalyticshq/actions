Implement this prompt

## Paths

**All paths are relative to the repository root directory** (the directory that contains the `build-static-data-query/` subdirectory).

To locate the repository root: look for the directory containing `build-static-data-query/package.json` and `build-static-data-query/action.yml`.

## Input

- **File**: build-static-data-query/_generated/cleaned-schema.graphql
- **Content**: GraphQL schema

## Output

- **Folder**: build-static-data-query/build/gql/fragments
- **Requirement**: All generated files must be placed in this folder

---

## Task

1. Analyze the **[Game]StaticDataQuery** type in the GraphQL schema.
   - This type contains *groups* node.
   - Node *groups* contains multiple nested nodes.
   - Each nested node has a data field.
   - The data field contains an array of entities.

2. For **each entity type** found inside the data fields:
   - Generate a **GraphQL fragment**.
   - The fragment must include **all possible fields** defined in the schema for that entity type, including all the nested fields recursively.

---

## File Naming Convention

- Format: [gql-type-name]-fragment.gql.ts
- Where [gql-type-name] = the GraphQL type name of the entity, transformed to kebab-case.

---

## File Content Example

Use as an example this file - build-static-data-query/src/examples/gql-fragment.example.gql.ts
