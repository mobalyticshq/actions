import { readFileSync } from 'node:fs';
import { buildClientSchema, buildSchema, introspectionFromSchema } from 'graphql';
import { Microfiber } from 'microfiber';
import { MutationNamespaces, QueryNamespaces, SubscriptionNamespaces, TargetGameQueryFields, TargetGameQueryTypeName } from '../../../../dist/generated/scopes';
import { pruneSchema } from '../../../../graphql-tools/prune';

export const getCleanedSchemaByGame = ({ includedScopes, staticDataFieldName, options = {} }) => {
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


      const fieldsToRemoveFromQuery = TargetGameQueryFields.filter(field => field !== staticDataFieldName);

      fieldsToRemoveFromQuery.forEach(name => {
        microfiber.removeField({
          typeKind: 'OBJECT',
          typeName: TargetGameQueryTypeName,
          fieldName: name,
          cleanup: false,
        });
      });
    });

    microfiber.cleanSchema();

    const cleanedSchema = buildClientSchema(microfiber.getResponse());

    // remove rest orphan types
    return pruneSchema(cleanedSchema, options);
  };

  return cleanUpSchema;
};
