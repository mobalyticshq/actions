Implement this prompt

## Paths

**All paths are relative to the repository root directory** (the directory that contains the `build-static-data-query/` subdirectory).

To locate the repository root: look for the directory containing `build-static-data-query/package.json` and `build-static-data-query/action.yml`.

## Input

- **File**: build-static-data-query/_generated/cleaned-schema.graphql
- **Content**: GraphQL schema

- **Folder**: build-static-data-query/build/gql/fragments
- **Content**: GraphQL fragments

## Output

- **Folder**: build-static-data-query/build/gql/query
- **Requirement**: All generated files must be placed in this folder

---

## Task

1. Analyze the **[Game]StaticDataQuery** type in the GraphQL schema.
   - This type contains *groups* node and *metadata* node.
   - Node *groups* contains multiple nested nodes.
   - Node *metadata* contains node *dataVersion* and node *schemaVersion*.
2. Generate a file containing a GraphQL query that:
   - uses **all fields of the `groups` node**.
   - For each field, the filter must be the object: { page: { all: true } }.
   - Query only data field, ignore all other fields in the type.
   - Additionally, you need to query `dataVersion` field of the *metadata* node in the [Game]StaticDataQuery type. This node should have the "meta: metadata" and "version: dataVersion" aliases. You must **always** request the following part as a **separate node**, not combined with game data queries. Refer to example in the file - build-static-data-query/src/examples/gql-query.example.gql.ts 
3. As the very last step — after you complete all tasks and finish all validations — create an empty text file named done.txt inside the following directory:
   - **Folder**: build-static-data-query/build/gql/query
   - Make sure this file is created only after everything else has been successfully completed.

---

## File Naming Convention

- Format: [query-name].gql.ts
- Where [query-name] = the GraphQL type name [Game]StaticDataQuery, transformed to kebab-case.

---

## File Content Example

Use as an example this file - build-static-data-query/src/examples/gql-query.example.gql.ts
