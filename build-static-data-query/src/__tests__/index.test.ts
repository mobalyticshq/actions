import { buildStaticDataQuery } from '../build-static-data-query';

describe('buildStaticDataQuery', () => {
  it('should return success status', async () => {
    const result = await buildStaticDataQuery('test-game');

    expect(result.status).toBe('success');
  });

  it('should include game in result data', async () => {
    const game = 'example-game';
    const result = await buildStaticDataQuery(game);

    expect(result.data).toContain(game);
  });

  it('should return an object with data and status properties', async () => {
    const result = await buildStaticDataQuery('test-game');

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('status');
    expect(typeof result.data).toBe('string');
    expect(typeof result.status).toBe('string');
  });

  it('should handle different game values', async () => {
    const result1 = await buildStaticDataQuery('game1');
    const result2 = await buildStaticDataQuery('game2');

    expect(result1.data).not.toBe(result2.data);
    expect(result1.status).toBe('success');
    expect(result2.status).toBe('success');
  });
});

