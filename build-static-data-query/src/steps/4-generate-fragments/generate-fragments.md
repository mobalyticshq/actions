Implement this prompt

## Input

- **File**: build-static-data-query/_generated/cleaned-schema.graphql
- **Content**: GraphQL schema

## Output

- **Folder**: build-static-data-query/build/gql/fragments
- **Requirement**: All generated files must be placed in this folder

---

## Task

1. Analyze the **[Game]StaticDataQuery** type in the GraphQL schema.
   - This type contains multiple GraphQL nodes.
   - Each node has a data field.
   - The data field contains an array of entities.

2. For **each entity type** found inside the data fields:
   - Generate a **GraphQL fragment**.
   - The fragment must include **all possible fields** defined in the schema for that entity type, including all the nested fields recursively.

3. As the very last step — after you complete all tasks and finish all validations — create an empty text file named done.txt inside the following directory:
   - **Folder**: build-static-data-query/build/gql/fragments
   - Make sure this file is created only after everything else has been successfully completed.
---

## File Naming Convention

- Format: [gql-type-name]-fragment.gql.ts
- Where [gql-type-name] = the GraphQL type name of the entity, transformed to kebab-case.

---

## File Content Example

Use as an example this file - build-static-data-query/src/examples/gql-fragment.example.gql.ts
