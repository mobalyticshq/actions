import { type Types } from '@graphql-codegen/plugin-helpers';
import { makeDirConfig } from '../../../codegen.base';

const config: Types.Config = {
  generates: {
    ...makeDirConfig({
      typesFilePath: './src/api/graphql/__generated/types.ts',
      typesDirPath: './src/api/graphql/__generated',
      schemaFilePath: './src/api/graphql/schema.graphql',
      documents: ['./src/api/graphql/**/*.gql.ts', './src/api/gql/**/*.gql.ts'],
      skipTypeName: false,
      preResolveTypes: true,
      avoidOptionals: {
        field: true,
        inputValue: false,
        object: true,
        defaultValue: true,
      },
      enumsAsTypes: true,
    }),
  },
};

export default config;
