import { processSchemaGeneration, SchemaGenerationConfig } from './schema-generator';
import * as path from 'path';
import * as fs from 'fs';

describe('processSchemaGeneration', () => {
  it('should generate schema from static data and match expected output', () => {
    // Arrange
    const staticDataPath = path.join(__dirname, 'test_data');
    const expectedSchemaPath = path.join(__dirname, 'test_data', 'expected', 'new_schema.json');
    
    const config: SchemaGenerationConfig = {
      staticDataPath
    };
    
    // Act
    const result = processSchemaGeneration(config);
    
    // Assert
    const expectedSchemaContent = fs.readFileSync(expectedSchemaPath, 'utf8');
    
    // Compare the exact string output (including formatting)
    expect(result.trim()).toBe(expectedSchemaContent.trim());
  });

  it('should update schema from static data using existing schema and match expected output', () => {
    // Arrange
    const staticDataPath = path.join(__dirname, 'test_data');
    const existingSchemaPath = path.join(__dirname, 'test_data', 'existing_schema.json');
    const expectedSchemaPath = path.join(__dirname, 'test_data', 'expected', 'updated_schema.json');
    
    const config: SchemaGenerationConfig = {
      staticDataPath,
      existingSchemaPath
    };
    
    // Act
    const result = processSchemaGeneration(config);
    
    // Assert
    const expectedSchemaContent = fs.readFileSync(expectedSchemaPath, 'utf8');
    
    // Compare the exact string output (including formatting)
    expect(result.trim()).toBe(expectedSchemaContent.trim());
  });
});
