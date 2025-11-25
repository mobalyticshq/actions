import { readFileSync } from 'node:fs';
import { buildClientSchema, buildSchema, introspectionFromSchema } from 'graphql';
import { Microfiber } from 'microfiber';
import { FilterTypes } from '@graphql-tools/wrap';
import { MutationNamespaces, QueryNamespaces, SubscriptionNamespaces, TargetGameQueryFields } from '../temp/scopes';
import { pruneSchema } from './graphql-tools/prune';

export const getCleanedSchemaByGame = ({ includedScopes, staticDataFieldName, options = {} }) => {
  const queriesToRemove = QueryNamespaces.filter(queryName => !includedScopes.includes(queryName));
  const extraTypesToRemove = ['Treasury']; // Treasury has circular types that don't clean by usual schema prune

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
      console.log('fieldsToRemoveFromQuery', fieldsToRemoveFromQuery);
      fieldsToRemoveFromQuery.forEach(name => {
        microfiber.removeField({
          typeKind: 'OBJECT',
          typeName: 'Hades2Query',
          fieldName: name,
          cleanup: false,
        });
      });
    });

    microfiber.cleanSchema();

    const cleanedSchema = buildClientSchema(microfiber.getResponse());

     // remove "Treasury**" types that have circular dependencies, unless it is in included scope
     const filterTransformer = new FilterTypes(type => {
      return !extraTypesToRemove.some(typeToRemovePrefix => type.toString().startsWith(typeToRemovePrefix));
    });

    // remove rest orphan types
    return pruneSchema(filterTransformer.transformSchema(cleanedSchema), options);
  };

  return cleanUpSchema;
};
