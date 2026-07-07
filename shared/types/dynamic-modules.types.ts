export enum DynamicModuleSlug {
  STATIC_DATA_MAPPING = 'static-data-mapping',
  STATIC_DATA_MAPPING_V2 = 'static-data-mapping-v2',
  STATIC_DATA_QUERY = 'static-data-query',
  STATIC_DATA_QUERY_V2 = 'static-data-query-v2',
}

export interface DynamicModuleConfig {
  moduleFolder?: string;
  name: string;
  version?: string;
}
