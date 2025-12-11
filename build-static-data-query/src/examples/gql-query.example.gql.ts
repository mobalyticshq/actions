import { gql } from '@apollo/client';
import { SomeGameStaticDataWeaponsFragmentGql } from '../fragments/some-game-static-data-weapons-fragment.gql';

const SomeGameStaticDataQueryGql = gql`
  query SomeGameStaticDataQuery {
    game: someGame {
      staticData {
        groups {
          weapons(filter: { page: { all: true } }) {
            data {
              ...SomeGameStaticDataWeaponsFragment
            }
          }
        }
      }
      staticData {
        meta: metadata {
          version: dataVersion
        }
      }
    }
  }
  ${SomeGameStaticDataWeaponsFragmentGql}
`;

export default SomeGameStaticDataQueryGql;
