import { buildSchema } from 'graphql';
import { buildFragments } from './generate-fragments';

const schema = buildSchema(`
  type Query {
    game: GameQuery
  }

  type GameQuery {
    staticData: GameStaticDataQuery!
  }

  type GameStaticDataQuery {
    groups: GameStaticDataGroups!
  }

  input GameFilter {
    slug: String
  }

  type GameStaticDataGroups {
    classes(filter: GameFilter): GameClassesResult!
    items(filter: GameFilter): GameItemsResult!
  }

  type GameClassesResult {
    data: [GameClasses!]
    errorMessage: String
  }

  type GameItemsResult {
    data: [GameItems!]
  }

  enum GameRarity {
    COMMON
    RARE
  }

  type GameClasses {
    slug: String!
    name: String!
    items: [GameItems!]
  }

  type GameItems {
    slug: String!
    rarity: GameRarity
    allowableClasses: [GameClasses!]
    stats: [GameItemsStats!]
    localized(locale: String!): String
  }

  type GameItemsStats {
    value: String
    item: GameItems
    nested: GameItemsStats
  }
`);

const options = { gameField: 'game', staticDataFieldName: 'staticData' };

describe('buildFragments', () => {
  it('creates one fragment file per groups entity', () => {
    const fragments = buildFragments(schema, options);

    expect(fragments.map(fragment => fragment.fileName)).toEqual([
      'game-classes-fragment.gql.ts',
      'game-items-fragment.gql.ts',
    ]);
  });

  it('selects referenced entities by scalars only and expands embedded objects once per path', () => {
    const [, items] = buildFragments(schema, options);

    expect(items.content).toBe(`import { gql } from '@apollo/client';

export const GameItemsFragmentGql = gql\`
  fragment GameItemsFragment on GameItems {
    slug
    rarity
    allowableClasses {
      slug
      name
    }
    stats {
      value
      item {
        slug
        rarity
      }
      nested {
        value
      }
    }
  }
\`;
`);
  });

  it('throws when the static data path is missing', () => {
    expect(() => buildFragments(schema, { ...options, gameField: 'unknown' })).toThrow(
      "Field 'unknown' not found in type 'Query'",
    );
  });
});
