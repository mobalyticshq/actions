// Top level nodes available in graphql api
export const QueryNamespaces = [
  '_stub',
  'accounts',
  'battlePass',
  'accountsV2',
  'deadlock',
  'destiny',
  'diablo4',
  'diablo4StaticData',
  'eldenRingNightreign',
  'exampleGame',
  'lol',
  'lostArk',
  'marvelRivals',
  'mhw',
  'poe2',
  'search',
  'tft',
  'theBazaar',
  'treasury',
  'valorant',
  'zzz',
  'news',
  'borderlands4',
  'tftNgf',
  'lolNgf',
  'destiny2Ngf',
  'valorantNgf',
  'hades2',
  // #NGF_NEW_GAME#
];

export const MutationNamespaces = [
  'accounts',
  'battlePass',
  'accountsV2',
  'deadlock',
  'destiny',
  'diablo4',
  'eldenRingNightreign',
  'exampleGame',
  'lol',
  'marvelRivals',
  'mhw',
  'poe2',
  'tft',
  'theBazaar',
  'treasury',
  'valorant',
  'zzz',
  'news',
  'borderlands4',
  'tftNgf',
  'lolNgf',
  'destiny2Ngf',
  'valorantNgf',
  'hades2',
  // #NGF_NEW_GAME#
];

export const SubscriptionNamespaces = [
  'challengeChanged',
  'lolProfileChanged',
  'tftProfileChanged',
  'treasuryPaymentsPaymentReceived',
  'treasuryPaymentsSubscriptionChanged',
  'valorantUpdate',
];

// used to remove all types that are not related to requested game, but implement Ngf interface
export const CommonNgfInterfacesPrefix = 'Ngf';
