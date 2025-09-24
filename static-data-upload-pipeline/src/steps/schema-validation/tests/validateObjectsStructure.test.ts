import { Schema, SchemaGroup, SchemaObject } from '../types';

import { validateObjectsStructure } from '../utils';

describe('validateObjectsStructure', () => {
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

  describe('object name validation', () => {
    it('should fail with invalid object name containing numbers', () => {
      const objects: Record<string, SchemaObject> = {
        stats1: {
          fields: {
            value: { type: 'String' },
          },
        },
      };

      const errors = validateObjectsStructure(objects, 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Object name must contain only letters');
    });

    it('should fail with invalid object name containing special characters', () => {
      const objects: Record<string, SchemaObject> = {
        'stats-object': {
          fields: {
            value: { type: 'String' },
          },
        },
      };

      const errors = validateObjectsStructure(objects, 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Object name must contain only letters');
    });

    it('should pass with valid object name containing only letters', () => {
      const objects: Record<string, SchemaObject> = {
        stats: {
          fields: {
            value: { type: 'String' },
          },
        },
      };

      const errors = validateObjectsStructure(objects, 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(0);
    });
  });

  describe('unique object names', () => {
    it('should pass with unique object names', () => {
      const objects: Record<string, SchemaObject> = {
        stats: {
          fields: {
            value: { type: 'String' },
          },
        },
        statsData: {
          fields: {
            name: { type: 'String' },
          },
        },
      };

      const errors = validateObjectsStructure(objects, 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(0);
    });

    it('should pass with unique object names', () => {
      const objects: Record<string, SchemaObject> = {
        stats: {
          fields: {
            value: { type: 'String' },
          },
        },
        metadata: {
          fields: {
            name: { type: 'String' },
          },
        },
      };

      const errors = validateObjectsStructure(objects, 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(0);
    });
  });

  describe('combined validation', () => {
    it('should return multiple errors for invalid objects', () => {
      const objects: Record<string, SchemaObject> = {
        'stats-object': {
          fields: {
            value: { type: 'String' },
          },
        },
        stats: {
          fields: {
            name: { type: 'String' },
          },
        },
        statsData: {
          fields: {
            description: { type: 'String' },
          },
        },
      };

      const errors = validateObjectsStructure(objects, 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(1); // invalid object name
    });
  });
});
