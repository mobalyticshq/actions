import { readFileSync } from 'node:fs';
import { buildClientSchema, buildSchema, extendSchema, introspectionFromSchema, isEnumType } from 'graphql';
import { Microfiber } from 'microfiber';
import { pruneSchema } from './graphql-tools/prune';

export const getCleanedSchemaByGame = ({ includedScopes, staticDataFieldName, scopesData, options = {} }) => {
  const { queryNamespaces, mutationNamespaces, subscriptionNamespaces, targetGameQueryFields, targetGameQueryTypeName } = scopesData;
  const queriesToRemove = queryNamespaces.filter(queryName => !includedScopes.includes(queryName));

  const cleanUpSchema = (schemaString) => {
    const fullFederatedSchema = buildSchema(readFileSync(schemaString, 'utf8'));

    const microfiber = new Microfiber(introspectionFromSchema(fullFederatedSchema));

    // remove top level nodes from other scopes - queries, mutations, subscriptions
    queriesToRemove.forEach(name => {
      microfiber.removeQuery({
        name,
        cleanup: false,
      });
    });
    mutationNamespaces.forEach(name => {
      microfiber.removeMutation({
        name,
        cleanup: false,
      });
    });
    subscriptionNamespaces.forEach(name => {
      microfiber.removeSubscription({
        name,
        cleanup: false,
      });
    });

    if (targetGameQueryTypeName && targetGameQueryFields.length > 0) {
      const fieldsToRemoveFromQuery = targetGameQueryFields.filter(field => field !== staticDataFieldName);

      fieldsToRemoveFromQuery.forEach(name => {
        microfiber.removeField({
          typeKind: 'OBJECT',
          typeName: targetGameQueryTypeName,
          fieldName: name,
          cleanup: false,
        });
      });
    }

    microfiber.cleanSchema();

    const cleanedSchema = buildClientSchema(microfiber.getResponse());

    const entitiesEnumTypeName = targetGameQueryTypeName && targetGameQueryTypeName.endsWith('Query') ? `${targetGameQueryTypeName.slice(0, -5)}EntitiesEnum` : null;

    // Ensure the entitiesEnumTypeName type survives Microfiber cleanup so skipPruning can see it
    let schemaToPrune = cleanedSchema;
    if (entitiesEnumTypeName && !schemaToPrune.getType(entitiesEnumTypeName)) {
      const enumFromSource = fullFederatedSchema.getType(entitiesEnumTypeName);
      if (enumFromSource && isEnumType(enumFromSource) && enumFromSource.astNode) {
        schemaToPrune = extendSchema(schemaToPrune, {
          kind: 'Document',
          definitions: [enumFromSource.astNode],
        });
      }
    }
    // remove rest orphan types
    const pruneOptions = {
      ...options,
      skipPruning: (type) => {
        if (entitiesEnumTypeName && isEnumType(type)) {
          return type.name === entitiesEnumTypeName;
        }
        return false;
      },
    };

    return pruneSchema(schemaToPrune, pruneOptions);
  };

  return cleanUpSchema;
};
