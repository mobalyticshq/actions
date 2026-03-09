import { gql } from '@apollo/client';

const StaticDataMetaQueryGql = gql`
  query SomeGameStaticDataMetaQuery {
    game: someGame {
      staticData {
        meta: metadata {
          version: dataVersion
        }
      }
    }
  }
`;

export default StaticDataMetaQueryGql;
