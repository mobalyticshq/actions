import { GraphQLSchema } from 'graphql';

export interface CleanedSchemaOptions {
  includedScopes: string[];
  staticDataFieldName: string;
  options?: Record<string, any>;
}

export function getCleanedSchemaByGame(
  params: CleanedSchemaOptions
): (schemaString: string) => GraphQLSchema;

