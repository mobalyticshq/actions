import { type CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  generates: {
    './codegen/temp/schema.graphql': {
      schema: [
        {
          // todo Stas - remove hardcode
          ['https://stg.mobalytics.gg/api/riftbound/v1/graphql/query']: {
            headers: { 'xmoba-no-cache': '1' },
          },
        },
      ],
      plugins: ['schema-ast'],
      config: {
        includeDirectives: true,
        commentDescriptions: true,
      },
    },
  },
};

export default config;
