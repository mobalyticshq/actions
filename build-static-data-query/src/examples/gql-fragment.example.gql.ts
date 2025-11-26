import { gql } from '@apollo/client';

export const SomeGameStaticDataNocturnalArmsFragmentGql = gql`
  fragment SomeGameStaticDataNocturnalArmsFragment on SomeGameNocturnalArm {
    slug
    id
    iconUrl
    name
    subtitle
    unlock
    formerWielder {
      slug
    }
    description
    flavorText
  }
`;
