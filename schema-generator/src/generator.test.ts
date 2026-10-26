import { processSchemaGeneration, SchemaGenerationConfig, MANUAL_FILL_PLACEHOLDER } from './main';
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

  it('should preserve translatable annotations from the existing schema', () => {
    // Arrange:
    // The annotation only ever lives in the existing schema — data inference cannot produce it —
    // so losing it in any of these paths would strip it on every regeneration.
    const staticDataPath = path.join(__dirname, 'test_data', "translatable");
    const existingSchemaPath = path.join(__dirname, 'test_data', "translatable", 'existing_schema.json');
    const expectedSchemaPath = path.join(__dirname, 'test_data', "translatable", 'expected', 'updated_schema.json');

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
    expect((result.match(/"translatable": true/g) || []).length).toBe(3);
  });

  it('should preserve group wiki configs from the existing schema', () => {
    // Arrange:
    // The wiki config only ever lives in the existing schema, so it must survive for groups found
    // in the data and for groups that only exist in the existing schema.
    const staticDataPath = path.join(__dirname, 'test_data', "wiki");
    const existingSchemaPath = path.join(__dirname, 'test_data', "wiki", 'existing_schema.json');
    const expectedSchemaPath = path.join(__dirname, 'test_data', "wiki", 'expected', 'updated_schema.json');

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
    expect(JSON.parse(result).groups.runes.wiki).toEqual({ enabled: false, tagMappings: { unique: 'isUnique' } });
    expect(Object.keys(JSON.parse(result).groups.weapons.wiki.tagMappings)).toEqual(['weaponClass', 'unique']);
  });

  it('should preserve group wiki configs when ignoreDeleted is true', () => {
    // Arrange
    const staticDataPath = path.join(__dirname, 'test_data', "wiki");
    const existingSchemaPath = path.join(__dirname, 'test_data', "wiki", 'existing_schema.json');
    const expectedSchemaPath = path.join(__dirname, 'test_data', "wiki", 'expected', 'refreshed_schema.json');

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
    expect((result.match(/"wiki"/g) || []).length).toBe(3);
  });

  it('should keep existing field types and resolve new references without placeholders', () => {
    // Arrange:
    // Inference reads every slug-suffixed field as a Ref and whole-number Floats as Int; the existing
    // schema must win over both, and new references go through the ref-config or fall back to String.
    const staticDataPath = path.join(__dirname, 'test_data', "existing_types");
    const existingSchemaPath = path.join(__dirname, 'test_data', "existing_types", 'existing_schema.json');
    const refConfigPath = path.join(__dirname, 'test_data', "existing_types", 'config.json');
    const expectedSchemaPath = path.join(__dirname, 'test_data', "existing_types", 'expected', 'updated_schema.json');

    const config: SchemaGenerationConfig = {
      staticDataPath,
      existingSchemaPath,
      refConfigPath,
      geckMode: true
    };

    // Act
    const result = processSchemaGeneration(config);

    // Assert
    const expectedSchemaContent = fs.readFileSync(expectedSchemaPath, 'utf8');

    // Compare the exact string output (including formatting)
    expect(result.trim()).toBe(expectedSchemaContent.trim());
    const weapons = JSON.parse(result).groups.weapons;
    expect(weapons.fields.ascendancySlug).toEqual({ type: 'String' });
    expect(weapons.fields.descriptionRef).toEqual({ type: 'Ref', refTo: 'dictionary' });
    expect(weapons.fields.x).toEqual({ type: 'Float' });
    expect(weapons.fields.mainStatSlug).toEqual({ type: 'Ref', refTo: 'dictionary' });
    expect(weapons.objects.weaponStats.fields.statRef).toEqual({ type: 'Ref', refTo: 'dictionary' });
    expect(weapons.fields.suffixStatSlugs).toEqual({ type: 'String', array: true });
    expect(result).not.toContain(MANUAL_FILL_PLACEHOLDER);
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

  it('should generate schema in geck mode', () => {
    // Arrange
    const staticDataPath = path.join(__dirname, 'test_data', "geck");
    const expectedSchemaPath = path.join(__dirname, 'test_data', "geck", 'expected_schema.json');
    
    const config: SchemaGenerationConfig = {
      staticDataPath,
      geckMode: true
    };
    
    // Act
    const result = processSchemaGeneration(config);
    
    // Assert
    const expectedSchemaContent = fs.readFileSync(expectedSchemaPath, 'utf8');
    
    // Compare the exact string output (including formatting)
    expect(result.trim()).toBe(expectedSchemaContent.trim());
  });
});
