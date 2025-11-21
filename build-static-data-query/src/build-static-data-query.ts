/**
 * Mock function to build static data query
 */
export async function buildStaticDataQuery(
  game: string
): Promise<{ data: string; status: string }> {
  // Simulate some async work
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Mock implementation
  const result = {
    data: `Processed data for game ${game}`,
    status: 'success',
  };

  return result;
}

