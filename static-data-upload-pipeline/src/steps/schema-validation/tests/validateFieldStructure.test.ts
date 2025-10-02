import { ApiSchema, SchemaGroup, SchemaField } from '../types';

import { validateFieldStructure } from '../utils';

describe('validateFieldStructure', () => {
  const mockSchema: ApiSchema = {
    namespace: 'poeStaticData',
    typePrefix: 'Poe',
    groups: {
      weapons: {
        fields: {
          id: { type: 'String' },
        },
      },
    },
  };

  const mockGroup: SchemaGroup = {
    fields: {
      id: { type: 'String' },
      weapons: { type: 'String' },
    },
    objects: {
      stats: {
        fields: {
          value: { type: 'String' },
        },
      },
    },
  };

  describe('field type validation', () => {
    it('should fail with invalid field type containing special characters', () => {
      const field: SchemaField = {
        type: 'field-type' as any,
      };

      const errors = validateFieldStructure(field, 'testField', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toContain('Field type must contain only letters and digits');
      expect(errors[1].message).toContain('Field type must be one of: String, Boolean, Ref, Object');
    });

    it('should fail with disallowed field type', () => {
      const field: SchemaField = {
        type: 'Number' as any,
      };

      const errors = validateFieldStructure(field, 'testField', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Field type must be one of: String, Boolean, Ref, Object');
    });

    it('should pass with valid field types', () => {
      const validTypes = ['String', 'Boolean', 'Ref', 'Object'];

      validTypes.forEach(type => {
        const field: SchemaField = { type: type as any };
        const errors = validateFieldStructure(field, 'testField', 'testGroup', mockGroup, mockSchema);
        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('objName validation', () => {
    it('should fail when objName does not exist in objects', () => {
      const field: SchemaField = {
        type: 'Object',
        objName: 'nonexistent',
      };

      const errors = validateFieldStructure(field, 'testField', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('objName "nonexistent" must exist in objects field within group');
    });

    it('should pass when objName exists in objects', () => {
      const field: SchemaField = {
        type: 'Object',
        objName: 'stats',
      };

      const errors = validateFieldStructure(field, 'testField', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(0);
    });
  });

  describe('refTo validation', () => {
    it('should fail when refTo does not exist in groups', () => {
      const field: SchemaField = {
        type: 'Ref',
        refTo: 'nonexistent',
      };

      const errors = validateFieldStructure(field, 'testField', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('refTo "nonexistent" must exist in groups keys in the schema');
    });

    it('should pass when refTo exists in groups', () => {
      const field: SchemaField = {
        type: 'Ref',
        refTo: 'weapons',
      };

      const errors = validateFieldStructure(field, 'testField', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(0);
    });
  });

  describe('filter validation', () => {
    it('should fail when filter is true but type is not String', () => {
      const field: SchemaField = {
        type: 'Boolean',
        filter: true,
      };

      const errors = validateFieldStructure(field, 'testField', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Filter modifier is only acceptable for fields with type String');
    });

    it('should pass when filter is true and type is String', () => {
      const field: SchemaField = {
        type: 'String',
        filter: true,
      };

      const errors = validateFieldStructure(field, 'testField', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Ref field name conflicts', () => {
    it('should fail when Ref field conflicts with existing field', () => {
      const field: SchemaField = {
        type: 'Ref',
        refTo: 'weapons',
      };

      const errors = validateFieldStructure(field, 'weaponsRef', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Ref field name "weaponsRef" conflicts with field "weapons"');
    });

    it('should pass when Ref field does not conflict', () => {
      const field: SchemaField = {
        type: 'Ref',
        refTo: 'weapons',
      };

      const errors = validateFieldStructure(field, 'armourRef', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(0);
    });
  });

  describe('combined validation', () => {
    it('should return multiple errors for invalid field', () => {
      const field: SchemaField = {
        type: 'Number' as any,
        objName: 'nonexistent',
        refTo: 'nonexistent',
        filter: true,
      };

      const errors = validateFieldStructure(field, 'weaponsRef', 'testGroup', mockGroup, mockSchema);
      expect(errors).toHaveLength(5); // invalid type, invalid objName, invalid refTo, invalid filter, Ref conflict
    });
  });
});
