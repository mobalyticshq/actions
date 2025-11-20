import { buildStaticDataQuery } from '../index';

describe('buildStaticDataQuery', () => {
  it('should return success status', async () => {
    const result = await buildStaticDataQuery('.', './config.json');
    
    expect(result.status).toBe('success');
  });

  it('should include working directory in result data', async () => {
    const workingDir = './test-dir';
    const result = await buildStaticDataQuery(workingDir, './config.json');
    
    expect(result.data).toContain(workingDir);
  });

  it('should include config path in result data', async () => {
    const configPath = './test-config.json';
    const result = await buildStaticDataQuery('.', configPath);
    
    expect(result.data).toContain(configPath);
  });

  it('should return an object with data and status properties', async () => {
    const result = await buildStaticDataQuery('.', './config.json');
    
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('status');
    expect(typeof result.data).toBe('string');
    expect(typeof result.status).toBe('string');
  });

  it('should handle different input values', async () => {
    const result1 = await buildStaticDataQuery('./dir1', './config1.json');
    const result2 = await buildStaticDataQuery('./dir2', './config2.json');
    
    expect(result1.data).not.toBe(result2.data);
    expect(result1.status).toBe('success');
    expect(result2.status).toBe('success');
  });
});

