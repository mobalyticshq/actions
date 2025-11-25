import { type CodegenConfig } from '@graphql-codegen/cli';
import { getCleanedSchemaByGame } from './utils/cleanSchemaByGame.js';

const config: CodegenConfig = {
  generates: {
    './dist/api/graphql/schema.graphql': {
      schema: {
        // todo Stas - remove hardcode
        ['./codegen/temp/schema.graphql']: {
          loader: getCleanedSchemaByGame({
            includedScopes: ['riftbound'],
            staticDataFieldName: 'staticData',
          }),
        },
      },
      plugins: ['schema-ast'],
      config: {
        includeDirectives: true,
        commentDescriptions: true,
      },
    },
  },
  hooks: {
    afterAllFileWrite: ['prettier --write'],
  },
};

export default config;
