import { Schema, SchemaGroup, SchemaObject } from '../types';

import { validateObjectStructure } from '../utils';

describe('validateObjectStructure', () => {
  const mockSchema: Schema = {
    namespace: 'poeStaticData',
    typePrefix: 'Poe',
    groups: {},
  };

  const mockGroup: SchemaGroup = {
    fields: {
      id: { type: 'String' },
    },
  };

  describe('field validation', () => {
    it('should fail when object has no fields', () => {
      const object: SchemaObject = {
        fields: {},
      };

      const errors = validateObjectStructure(object, 'stats', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Object "stats" must include at least one field');
    });

    it('should pass when object has at least one field', () => {
      const object: SchemaObject = {
        fields: {
          value: { type: 'String' },
        },
      };

      const errors = validateObjectStructure(object, 'stats', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(0);
    });
  });

  describe('field name validation', () => {
    it('should fail with invalid field name containing special characters', () => {
      const object: SchemaObject = {
        fields: {
          'field-name': { type: 'String' },
        },
      };

      const errors = validateObjectStructure(object, 'stats', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Object field name must contain only letters and digits');
    });

    it('should pass with unique field names', () => {
      const object: SchemaObject = {
        fields: {
          value: { type: 'String' },
          name: { type: 'String' },
          name2: { type: 'String' },
        },
      };

      const errors = validateObjectStructure(object, 'stats', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(0);
    });

    it('should pass with valid field names', () => {
      const object: SchemaObject = {
        fields: {
          value: { type: 'String' },
          name: { type: 'String' },
          description: { type: 'String' },
        },
      };

      const errors = validateObjectStructure(object, 'stats', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(0);
    });
  });

  describe('combined validation', () => {
    it('should return multiple errors for invalid object', () => {
      const object: SchemaObject = {
        fields: {
          'field-name': { type: 'String' },
          value: { type: 'String' },
          value2: { type: 'String' },
        },
      };

      const errors = validateObjectStructure(object, 'stats', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(1); // invalid field name
    });
  });
});
