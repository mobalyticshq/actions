import { GraphQLSchema } from 'graphql';

export interface ScopesData {
  queryNamespaces: string[];
  mutationNamespaces: string[];
  subscriptionNamespaces: string[];
  targetGameQueryFields: string[];
  targetGameQueryTypeName: string | undefined;
}

export interface CleanedSchemaOptions {
  includedScopes: string[];
  staticDataFieldName: string;
  scopesData: ScopesData;
  options?: Record<string, any>;
}

export function getCleanedSchemaByGame(
  params: CleanedSchemaOptions
): (schemaString: string) => GraphQLSchema;
