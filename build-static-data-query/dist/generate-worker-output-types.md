Implement this prompt

## Paths

**All paths are relative to the repository root directory** (the directory that contains the `build-static-data-query/` subdirectory).

To locate the repository root: look for the directory containing `build-static-data-query/package.json` and `build-static-data-query/action.yml`.

## Input

- **File**: build-static-data-query/build/gql/gql-types/*fragment.gql.generated.ts
- **Content**: GraphQL fragments types

- **File**: build-static-data-query/build/gql/static-data-query.gql.ts
- **Content**: GraphQL query

## Output

- **Folder**: build-static-data-query/build/gql/gql-types
- **Requirement**:
  - All generated files must be placed in this folder
  - **ONLY** create new `worker-output.types.ts` file in this folder
  - **DO NOT** modify any files outside or inside this folder


## Important Restrictions

**DO NOT modify any existing source code files.**
- Do NOT modify any files in the `build-static-data-query/src` directory
- **ONLY create NEW file** in the output folder: `build-static-data-query/build/gql/gql-types`

---

## Task

1. Analyze the **StaticDataQueryGql** in the GraphQL query file.
2. Generate a .ts file containing a following types in the output folder:
   - The **WorkerOutputType** interface, where each key corresponds to the name of a node requested inside the groups node in **StaticDataQueryGql**, and the value is an array of the corresponding node type from `gql-types/*fragment.gql.generated.ts` | null.
   - Interface should have named export.

---

## File Naming Convention

- Format: `worker-output.types.ts`

---

## File Content Example

Use as an example this file - `build-static-data-query/src/examples/worker-output-type.example.ts`
