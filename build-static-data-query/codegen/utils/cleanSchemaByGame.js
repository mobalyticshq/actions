import { readFileSync } from 'node:fs';
import { buildClientSchema, buildSchema, introspectionFromSchema } from 'graphql';
import { Microfiber } from 'microfiber';
import { MutationNamespaces, QueryNamespaces, SubscriptionNamespaces } from '../temp/scopes';
import { pruneSchema } from './graphql-tools/prune';

export const getCleanedSchemaByGame = ({ includedScopes, options = {} }) => {
  const queriesToRemove = QueryNamespaces.filter(queryName => !includedScopes.includes(queryName));

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
    MutationNamespaces.forEach(name => {
      microfiber.removeMutation({
        name,
        cleanup: false,
      });
    });
    SubscriptionNamespaces.forEach(name => {
      microfiber.removeSubscription({
        name,
        cleanup: false,
      });

      // todo Stas delete hardcode
      const fieldsToRemoveFromQuery = ['documents', 'permissions', 'profiles', 'settings'];
      fieldsToRemoveFromQuery.forEach(name => {
        microfiber.removeField({
          typeKind: 'OBJECT',
          typeName: 'Hades2Query',
          fieldName: name,
          cleanup: false,
        });
      });
      // todo Stas delete hardcode
    });

    if (!options.skipEmptyTypesCleanUps) {
      // remove orphan types
      microfiber.cleanSchema();
    }

    const cleanedSchema = buildClientSchema(microfiber.getResponse());

    // remove rest orphan types
    return pruneSchema(filterTransformer.transformSchema(cleanedSchema), options);
  };

  return cleanUpSchema;
};
