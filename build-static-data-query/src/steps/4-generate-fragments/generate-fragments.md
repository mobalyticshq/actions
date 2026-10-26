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
   - The fragment must include **every field** of the entity type itself, selected as follows.
   - An **entity type** is any type that is the item type of a `data` field under *groups* (each group's entity). Every other object type is an **embedded type** (effects, stats, damage, bonuses, substitutions, grid cells, reagent lists, and so on).
   - **Scalar/enum fields** (`String`, `Boolean`, `Int`, `Float`, `ID`, any enum, or lists of these): always include them.
   - **Embedded-type fields**: expand them and apply these same rules to their fields, however deep the embedded types nest.
   - **Linked entity fields** (a field, at any depth, whose type is an entity type, e.g. an item's `quality`, `allowableClasses`, or an effect's `spell`): include **all** of that entity's scalar/enum fields - not just `id`, `slug` and `name` - and **none** of its object-type fields. Never expand a linked entity any further: its own links are fetched by that entity's own fragment, not here. This is one level of linked records, and it keeps the query small enough for the GraphQL server to accept.
   - **Circular embedded types**: if an embedded type appears again inside itself, include only its scalar/enum fields at the repeated level.
   - Example, for an items entity whose `quality` and `spell` are entity types and whose `effects` is an embedded type:
     ```graphql
     fragment ItemsFragment on Items {
       id
       name
       itemLevel
       quality { id slug name color sortOrder }
       effects {
         slotIndex
         triggerType
         spell { id slug name description iconUrl cooldown }
       }
     }
     ```
     `quality` and `spell` list every scalar field of those types (the field names above are only illustrative) and nothing below them.

---

## File Naming Convention

- Format: [gql-type-name]-fragment.gql.ts
- Where [gql-type-name] = the GraphQL type name of the entity, transformed to kebab-case.

---

## File Content Example

Use as an example this file - build-static-data-query/src/examples/gql-fragment.example.gql.ts
