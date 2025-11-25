import { type CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  generates: {
    // todo Stas - remove hardcode
    './codegen/temp/riftbound.schema.graphql': {
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
