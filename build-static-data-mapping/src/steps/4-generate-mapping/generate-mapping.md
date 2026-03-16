## Paths

**All paths are relative to the repository root directory** (the directory that contains the `build-static-data-mapping/` subdirectory).

To locate the repository root: look for the directory containing `build-static-data-mapping/package.json` and `build-static-data-mapping/action.yml`.

## Input

- **File**: build-static-data-mapping/build/downloaded/cleaned-schema/entities.graphql
- **Content**: Game entities enum

---

- **Folder**: build-static-data-mapping/build/downloaded/fragments
- **Content**: GraphQL fragments

---

- **Folder**: build-static-data-mapping/build/downloaded/types
- **Content**: Generated types for GraphQL fragments

---

- **Folder**: build-static-data-mapping/src/types/output-data.types.ts
- **Content**: Target TypeScript type for mapping

---

- **Folder**: build-static-data-mapping/src/static-data-mapping-prompts
- **Content**: Prompts for generating static data mapping functions

---

## Output

- **Folder**: build-static-data-mapping/build/mapping
- **Requirement**: All mapping code, except SupportedStaticDataKeys enum, must be placed in this folder

- **Folder**: build-static-data-mapping/build/types
- **Requirement**: Output folder for SupportedStaticDataKeys enum

---

## Important Restrictions

**DO NOT modify any existing source code files.**
- Do NOT modify any files in the `build-static-data-mapping/src` directory
- **ONLY create NEW files** in the output folder: `build-static-data-mapping/build/mapping`

---

## Task

1. **Analyze the enum `[Game]EntitiesEnum`** in the entities.graphql file.
    - It contains a set of keys that correspond to the entities for which gql fragments have been generated.
2. **Analyze the folder `src/static-data-mapping-prompts`**
    - It contains a set of prompts, each designed to generate a mapping function for a specific entity.
    - The filename corresponds to the key in the `[Game]EntitiesEnum`.
3. **For each key in `[Game]EntitiesEnum`:**
    - Find the corresponding gql fragment in the folder `build-static-data-mapping/build/downloaded/fragments`.
    - Find the corresponding type for the gql fragment in the folder `build-static-data-mapping/build/downloaded/types`.
    - Find the corresponding prompt in the folder `build-static-data-mapping/build/user-prompts`.
        - The filename matches the key in `[Game]EntitiesEnum`.
    - Generate a TypeScript mapping function that:
        - Takes the corresponding type for gql fragment as **input**.
        - Returns data matching the type **`StaticDataInfo`**.
        - Uses the mapping instructions from the corresponding prompt.
        - Must be **strictly typed** — the use of `any` is forbidden.
        - ⚠️ **Important:** the `type` field in the returned object must always match the key from `[Game]EntitiesEnum` for which the mapping function is generated.
    - Do **not** create a function if there is no corresponding gql fragment or prompt.
    - Each mapping function must be **exported**.
    - Each mapping function must have the name format: map[EntityName]
      where `[EntityName]` is the name of the entity from `[Game]EntitiesEnum`, converted to **PascalCase**.
    - Each mapping function must be placed in a separate file.
        - The filename format must be: [entity-name].mapping.ts
          where `[entity-name]` is the entity name from `[Game]EntitiesEnum`, converted to **kebab-case**.
    - An example mapping function can be found in: `build-static-data-mapping/src/examples/static-data-mapping.example.ts`

4. **Create a file `index.ts`** in the folder `build-static-data-mapping/build/mapping`.

5. **In `index.ts`:**
    - Import all generated mapping functions.
    - Create an object `staticDataMappers` that maps keys from `[Game]EntitiesEnum` to their corresponding mapping functions.
    - The object `staticDataMappers` should have an export default.
  
6. **Create a file `mapping.types.ts`** in the folder `build-static-data-mapping/build/types`.

7. **In `mapping.types.ts`:** make an enum **SupportedStaticDataKeys**, that contains all keys from the `staticDataMappers` object. Key of enum should be in the upper case, the words delimiter is a low dash `_`. Values should be the same as `staticDataMappers` object keys.
   - An example enum can be found in: `build-static-data-mapping/src/examples/supported-static-data-keys.example.ts`
