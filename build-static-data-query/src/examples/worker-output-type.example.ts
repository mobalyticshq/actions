import { type XkoStaticDataCharactersFragment } from './xko-static-data-characters-fragment.gql.generated';
import { type XkoStaticDataFusesFragment } from './xko-static-data-fuses-fragment.gql.generated';
import { type XkoStaticDataInputsFragment } from './xko-static-data-inputs-fragment.gql.generated';

interface WorkerOutputType {
  characters: XkoStaticDataCharactersFragment[] | null;
  fuses: XkoStaticDataFusesFragment[] | null;
  inputs: XkoStaticDataInputsFragment[] | null;
}
