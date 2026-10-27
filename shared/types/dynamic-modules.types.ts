export enum DynamicModuleSlug {
  STATIC_DATA_MAPPING = 'static-data-mapping',
  STATIC_DATA_QUERY = 'static-data-query',
  STATIC_DATA_QUERY_V2 = 'static-data-query-v2',
  STATIC_DATA_QUERY_V3 = 'static-data-query-v3',
}

export interface DynamicModuleConfig {
  moduleFolder?: string;
  name: string;
  version?: string;
}
