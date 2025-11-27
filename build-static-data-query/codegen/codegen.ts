import { type Types } from '@graphql-codegen/plugin-helpers';

const scalars = {
  NgfDateTime: 'string',
  Diablo4DateTime: 'string',
  NgfDocumentRichTextContentJson: 'any',
  NgfDocumentBase64Json: 'string',
  NgfDocumentContentBase64Json: 'string',
  TagsScalar: 'string[] | null',
};

interface MakeDirConfigArgs {
  typesFilePath: string;
  typesDirPath: string;
  schemaFilePath: Types.Config['schema'];
  documents: string | string[];
  skipTypeName?: boolean;
  preResolveTypes?: boolean;
  avoidOptionals?: true | any;
  enumsAsTypes?: boolean;
}

export const makeDirConfig = (args: MakeDirConfigArgs): { [outputPath: string]: Types.ConfiguredOutput } => {
  const {
    typesFilePath,
    typesDirPath,
    schemaFilePath,
    documents,
    skipTypeName = true,
    preResolveTypes = false,
    avoidOptionals = true,
    enumsAsTypes = false,
  } = args;
  // config that will be applied to  type file, it's path is used as a key
  const fileConfig: Types.ConfiguredOutput = {
    schema: schemaFilePath,
    plugins: [
      {
        add: {
          content: '/* @ts-ignore */',
        },
      },
      'typescript',
      'fragment-matcher',
    ],
    config: {
      namingConvention: 'keep',
      avoidOptionals,
      skipTypename: skipTypeName,
      scalars,
      enumsAsTypes,
    },
  };

  // config that will be applied to type directory, it's path is used as a key
  const dirConfig: Types.ConfiguredOutput = {
    schema: schemaFilePath,
    documents,
    preset: 'near-operation-file',
    presetConfig: {
      extension: '.generated.ts',
      folder: '__generated',
      baseTypesPath: `./types.ts`,
    },
    plugins: [
      {
        add: {
          content: '/* @ts-ignore */',
        },
      },
      'typescript-operations',
      'typescript-react-apollo',
    ],
    config: {
      avoidOptionals: true,
      dedupeFragments: true,
      documentMode: 'documentNode',
      namingConvention: 'keep',
      skipTypename: skipTypeName,
      dedupeOperationSuffix: true,
      omitOperationSuffix: false,
      withComponent: false,
      withHooks: true,
      withHOC: false,
      preResolveTypes: preResolveTypes,
      scalars,
      enumsAsTypes,
    },
  };

  const possibleTypesConfig: Types.ConfiguredOutput = {
    schema: schemaFilePath,
    documents,
    plugins: ['fragment-matcher'],
    config: {
      module: 'commonjs',
    },
  };
  return {
    [typesFilePath]: fileConfig,
    [typesDirPath]: dirConfig,
    [`${typesDirPath}/possible-types.json`]: possibleTypesConfig,
  };
};

const config: Types.Config = {
  generates: {
    ...makeDirConfig({
      typesFilePath: './build/gql/types/types.ts',
      typesDirPath: './build/gql/types',
      schemaFilePath: './_generated/cleaned-schema.graphql',
      documents: ['./build/gql/**/*.gql.ts'],
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
