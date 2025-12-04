This is a bit stripped version of https://github.com/ardatan/graphql-tools/tree/master/packages/utils/src
Only file updated is [prune.js](prune.js) - originally it preserves all types that implement an interface that is used in schema

E.g., if we have

`type Diablo4StructDocument implements NgfStructDocument`

then, prune script will preserve all types that implement NgfStructDocument keeping most of NGF games types, which we don't want.
