# geck-validator

A CLI tool for validating GECK static data sources and schema files.

## Installation

```bash
cd geck-validator
go build -o geck-validator .
```

## Usage

### Validate a data source file

```bash
geck-validator validate data-source --file ./static_data.json
```

### Validate a schema file

```bash
geck-validator validate schema --file ./schema.json
```

### Validate schema backward compatibility

```bash
geck-validator validate compatibility --new ./new_schema.json --current ./current_schema.json
```

### Help

```bash
geck-validator --help
geck-validator validate --help
```

## Validation Rules

### Data Source Validation

| ID   | Rule | Description |
|------|------|-------------|
| DS01 | Required fields | Fields `id`, `slug`, `name` must be present for all elements in all groups |
| DS02 | Unique id | `id` must be unique within each group |
| DS03 | Unique slug | `slug` must be unique within each group |

### Schema Structure Validation

**Top-level**

| ID   | Rule | Description |
|------|------|-------------|
| SS01 | Namespace format | Namespace must be defined, start with letter or underscore, contain only letters, digits, underscores, dots |
| SS02 | TypePrefix format | TypePrefix must be defined, contain only letters and digits |
| SS03 | Groups not empty | Schema must have at least one group |
| SS04 | deprecatedGeckMode enabled | `deprecatedGeckMode` must be set to `true` |

**Group-level**

| ID   | Rule | Description |
|------|------|-------------|
| SS05 | Group name format | Group name must start with letter, contain only letters and digits |
| SS06 | Group name uniqueness | No duplicate group names |
| SS07 | Group has fields | Each group must have at least one field |
| SS08 | Group has id field | Each group must have `id` field with `required: true` and `filter: true` |
| SS09 | Group has slug field | Each group must have `slug` field with `required: true` and `filter: true` |

**Object-level**

| ID   | Rule | Description |
|------|------|-------------|
| SS10 | Object name format | Object name must start with letter, contain only letters and digits |
| SS11 | Object name uniqueness | No duplicate object names within a group |
| SS12 | Object has fields | Each object must have at least one field |

**Field-level (applies to both group fields and object fields)**

| ID   | Rule | Description |
|------|------|-------------|
| SS13 | Field name format | Field name must start with letter, contain only letters and digits |
| SS14 | Field name uniqueness | No duplicate field names within a group/object |
| SS15 | Field type format | Field type must contain only letters and digits |
| SS16 | Field type allowed | Field type must be one of: String, Int, Float, Boolean, Ref, Object |
| SS17 | objName reference valid | If field has `objName`, it must exist in the group's objects |
| SS18 | refTo reference valid | If field has `refTo`, it must exist in schema groups |
| SS19 | Filter only on String | `filter: true` only allowed on String type fields |
| SS20 | Ref field name conflict | Field names ending with "Ref", "Slug", "Slugs" cannot conflict with base field names |

### Schema Compatibility Validation (Backward Compatibility)

| ID   | Rule | Description |
|------|------|-------------|
| SC01 | Namespace unchanged | Namespace cannot be changed |
| SC02 | TypePrefix unchanged | TypePrefix cannot be changed |
| SC03 | Group not deleted | Groups from reference schema cannot be deleted |
| SC04 | Field not deleted | Fields from reference schema cannot be deleted |
| SC05 | Field type unchanged | Field types cannot be changed |
| SC06 | Required modifier kept | `required` modifier cannot be removed |
| SC07 | Filter modifier kept | `filter` modifier cannot be removed |
| SC08 | Array modifier kept | `array` modifier cannot be removed |
| SC09 | Object not deleted | Objects from reference schema cannot be deleted |
| SC10 | Object field not deleted | Object fields from reference schema cannot be deleted |
| SC11 | Object field type unchanged | Object field types cannot be changed |

## Development

### Run tests

```bash
go test ./...
```

### Build

```bash
go build -o geck-validator .
```
