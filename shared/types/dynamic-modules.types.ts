export enum DynamicModuleSlug {
  STATIC_DATA_MAPPING = 'static-data-mapping',
  STATIC_DATA_QUERY = 'static-data-query',
}

export interface DynamicModuleConfig {
  moduleFolder?: string,
  name: string,
  schemaVersion?: string
}
