import { processSchemaGeneration, SchemaGenerationConfig } from './schema-generator';
import * as path from 'path';
import * as fs from 'fs';

describe('processSchemaGeneration', () => {
  it('should generate schema from static data and match expected output', () => {
    // Arrange
    const staticDataPath = path.join(__dirname, 'test');
    const expectedSchemaPath = path.join(__dirname, 'test', 'schema_expected.json');
    
    const config: SchemaGenerationConfig = {
      staticDataPath
    };
    
    // Act
    const result = processSchemaGeneration(config);
    
    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    
    // Parse the result to compare with expected schema
    const generatedSchema = JSON.parse(result);
    const expectedSchemaContent = fs.readFileSync(expectedSchemaPath, 'utf8');
    const expectedSchema = JSON.parse(expectedSchemaContent);
    
    expect(generatedSchema).toEqual(expectedSchema);
  });
});
