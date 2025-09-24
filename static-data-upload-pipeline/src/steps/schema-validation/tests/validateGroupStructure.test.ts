import { Schema, SchemaGroup } from '../types';

import { validateGroupStructure } from '../utils';

describe('validateGroupStructure', () => {
  const mockSchema: Schema = {
    namespace: 'poeStaticData',
    typePrefix: 'Poe',
    groups: {},
  };

  describe('field validation', () => {
    it('should fail when group has no fields', () => {
      const group: SchemaGroup = {
        fields: {},
      };

      const errors = validateGroupStructure(group, 'testGroup', mockSchema);
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toBe('Group "testGroup" must include at least one field');
      expect(errors[1].message).toBe('Group "testGroup" must include an "id" field');
    });

    it('should fail when group has no id field', () => {
      const group: SchemaGroup = {
        fields: {
          name: { type: 'String' },
        },
      };

      const errors = validateGroupStructure(group, 'testGroup', mockSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Group "testGroup" must include an "id" field');
    });

    it('should pass when group has id field', () => {
      const group: SchemaGroup = {
        fields: {
          id: { type: 'String' },
        },
      };

      const errors = validateGroupStructure(group, 'testGroup', mockSchema);
      expect(errors).toHaveLength(0);
    });
  });

  describe('field name validation', () => {
    it('should fail with invalid field name containing special characters', () => {
      const group: SchemaGroup = {
        fields: {
          id: { type: 'String' },
          'field-name': { type: 'String' },
        },
      };

      const errors = validateGroupStructure(group, 'testGroup', mockSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Field name must contain only letters and digits');
    });

    it('should pass with unique field names', () => {
      const group: SchemaGroup = {
        fields: {
          id: { type: 'String' },
          name: { type: 'String' },
          name2: { type: 'String' },
        },
      };

      const errors = validateGroupStructure(group, 'testGroup', mockSchema);
      expect(errors).toHaveLength(0);
    });

    it('should pass with valid field names', () => {
      const group: SchemaGroup = {
        fields: {
          id: { type: 'String' },
          name: { type: 'String' },
          description: { type: 'String' },
        },
      };

      const errors = validateGroupStructure(group, 'testGroup', mockSchema);
      expect(errors).toHaveLength(0);
    });
  });

  describe('combined validation', () => {
    it('should return multiple errors for invalid group', () => {
      const group: SchemaGroup = {
        fields: {
          'field-name': { type: 'String' },
          name: { type: 'String' },
          name2: { type: 'String' },
        },
      };

      const errors = validateGroupStructure(group, 'testGroup', mockSchema);
      expect(errors).toHaveLength(2); // no id field, invalid field name
    });
  });
});
