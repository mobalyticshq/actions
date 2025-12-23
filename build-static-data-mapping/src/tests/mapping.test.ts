import { print, type DocumentNode } from 'graphql';
import StaticDataQuery from '../../build/downloaded/query';
import staticDataMappers from '../../build/mapping/index';

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT;
if (!GRAPHQL_ENDPOINT) {
  throw new Error('GRAPHQL_ENDPOINT environment variable is required');
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
}

describe('Static Data Mapping Integration Test', () => {
  it('should fetch static data and map it without runtime errors', async () => {
    // Convert GraphQL DocumentNode to query string
    const queryString = print(StaticDataQuery as unknown as DocumentNode);

    // Execute GraphQL request
    let response: Response;
    try {
      response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xmoba-no-cache': '1',
        },
        body: JSON.stringify({
          query: queryString,
          variables: {},
        }),
      });
    } catch (error) {
      throw new Error(`Failed to execute GraphQL request: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Check HTTP response status
    if (!response.ok) {
      throw new Error(`GraphQL request failed with status ${response.status}: ${response.statusText}`);
    }

    // Parse response
    let result: GraphQLResponse<{ game: any }>;
    try {
      result = (await response.json()) as GraphQLResponse<{ game: any }>;
    } catch (error) {
      throw new Error(`Failed to parse GraphQL response: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    // Verify data exists
    if (!result.data) {
      throw new Error('GraphQL response contains no data');
    }

    const staticData = result.data.game?.staticData;
    if (!staticData) {
      throw new Error('Static data not found in GraphQL response');
    }

    const groups = staticData.groups;
    if (!groups) {
      throw new Error('Groups not found in static data');
    }

    // Apply mappers to each data type
    for (const [mapperKey, mapper] of Object.entries(staticDataMappers)) {
      try {
        // Get corresponding data from response dynamically by mapperKey
        const groupField = groups[mapperKey as keyof typeof groups];
        if (!groupField) {
          throw new Error(`Group field "${mapperKey}" not found in static data groups`);
        }

        // Type assertion: we know that groupField is a Result type with data property
        const resultField = groupField as { data: unknown[] | null | undefined };
        if (!resultField.data || !Array.isArray(resultField.data)) {
          throw new Error(`Data array not found or invalid for mapper key: ${mapperKey}`);
        }

        const dataArray = resultField.data;

        // Apply mapper to each element
        for (let i = 0; i < dataArray.length; i++) {
          const item = dataArray[i];
          if (!item) {
            continue;
          }

          try {
            // Apply mapper function
            const mappedResult = mapper(item as never);

            // Verify mapped result has expected structure
            if (!mappedResult || typeof mappedResult !== 'object') {
              throw new Error(`Mapper for ${mapperKey} returned invalid result for item at index ${i}`);
            }

            // Verify required fields exist
            if (!('slug' in mappedResult) || !('type' in mappedResult)) {
              throw new Error(
                `Mapper for ${mapperKey} returned result missing required fields (slug, type) for item at index ${i}`,
              );
            }
          } catch (error) {
            throw new Error(
              `Runtime error in mapper "${mapperKey}" for item at index ${i}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }

        console.log(`✓ Successfully mapped ${dataArray.length} items using mapper: ${mapperKey}`);
      } catch (error) {
        throw new Error(
          `Failed to process mapper "${mapperKey}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }, 30000); // 30 second timeout for network request
});
