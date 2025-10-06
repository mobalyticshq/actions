import { processSchemaGeneration, SchemaGenerationConfig } from './main';
import * as path from 'path';
import * as fs from 'fs';

describe('processSchemaGeneration', () => {
  it('should generate schema from static data', () => {
    // Arrange
    const staticDataPath = path.join(__dirname, 'test_data', "main");
    const expectedSchemaPath = path.join(__dirname, 'test_data', "main", 'expected', 'new_schema.json');
    
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

  it('should update schema from static data using existing schema', () => {
    // Arrange
    const staticDataPath = path.join(__dirname, 'test_data', "main");
    const existingSchemaPath = path.join(__dirname, 'test_data', "main", 'existing_schema.json');
    const expectedSchemaPath = path.join(__dirname, 'test_data', "main", 'expected', 'updated_schema.json');
    
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

  it('should ignore deleted fields and groups when ignoreDeleted is true', () => {
    // Arrange
    const staticDataPath = path.join(__dirname, 'test_data', "main");
    const existingSchemaPath = path.join(__dirname, 'test_data', "main", 'existing_schema.json');
    const expectedSchemaPath = path.join(__dirname, 'test_data', "main", 'expected', 'refreshed_schema.json');
    
    const config: SchemaGenerationConfig = {
      staticDataPath,
      existingSchemaPath,
      ignoreDeleted: true
    };
    
    // Act
    const result = processSchemaGeneration(config);
    
    // Assert
    const expectedSchemaContent = fs.readFileSync(expectedSchemaPath, 'utf8');
    
    // Compare the exact string output (including formatting)
    expect(result.trim()).toBe(expectedSchemaContent.trim());
  });

  it('should generate schema from deep nested static data', () => {
    // Arrange
    const staticDataPath = path.join(__dirname, 'test_data', "nested");
    const expectedSchemaPath = path.join(__dirname, 'test_data', "nested", 'schema_expected.json');
    
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

  it('should exclude gameId and gameID fields from schema', () => {
    // Arrange
    const staticDataPath = path.join(__dirname, 'test_data', "gameid-exclusion");
    const expectedSchemaPath = path.join(__dirname, 'test_data', "gameid-exclusion", 'schema_expected.json');
    
    const config: SchemaGenerationConfig = {
      staticDataPath
    };
    
    // Act
    const result = processSchemaGeneration(config);
    const resultObj = JSON.parse(result);
    
    // Assert - verify gameId and gameID fields are not present
    expect(resultObj.groups.heroes.fields.gameId).toBeUndefined();
    expect(resultObj.groups.heroes.fields.gameID).toBeUndefined();
    expect(resultObj.groups.items.fields.gameId).toBeUndefined();
    
    // Assert - verify nested gameId/gameID fields are excluded
    expect(resultObj.groups.heroes.objects.abilities.fields.gameID).toBeUndefined();
    expect(resultObj.groups.heroes.objects.stats.fields.gameId).toBeUndefined();
    
    // Assert - verify other fields are still present
    expect(resultObj.groups.heroes.fields.id).toBeDefined();
    expect(resultObj.groups.heroes.fields.name).toBeDefined();
    expect(resultObj.groups.heroes.fields.health).toBeDefined();
    expect(resultObj.groups.heroes.objects.abilities.fields.abilityId).toBeDefined();
    expect(resultObj.groups.heroes.objects.abilities.fields.power).toBeDefined();
    expect(resultObj.groups.heroes.objects.stats.fields.strength).toBeDefined();
    expect(resultObj.groups.heroes.objects.stats.fields.intelligence).toBeDefined();
    
    // Assert - compare with expected schema
    const expectedSchemaContent = fs.readFileSync(expectedSchemaPath, 'utf8');
    expect(result.trim()).toBe(expectedSchemaContent.trim());
  });
});
