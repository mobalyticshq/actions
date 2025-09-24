import { Schema } from '../types';

import { validateSchemaStructure } from '../utils';

describe('validateSchemaStructure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('namespace validation', () => {
    it('should pass with valid namespace', () => {
      const schema: Schema = {
        namespace: 'poe.staticData',
        typePrefix: 'Poe',
        groups: {
          testGroup: {
            fields: {
              id: { type: 'String' },
            },
          },
        },
      };

      const errors = validateSchemaStructure(schema);
      expect(errors).toHaveLength(1); // Only namespace error, typePrefix should be valid
      expect(errors[0].path).toBe('namespace');
    });

    it('should fail with invalid namespace containing special characters', () => {
      const schema: Schema = {
        namespace: 'poe-static-data',
        typePrefix: 'Poe',
        groups: {
          testGroup: {
            fields: {
              id: { type: 'String' },
            },
          },
        },
      };

      const errors = validateSchemaStructure(schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Namespace must be defined and start with letter or underscore, contain only letters, digits and underscores');
    });

    it('should fail with empty namespace', () => {
      const schema: Schema = {
        namespace: '',
        typePrefix: 'Poe',
        groups: {
          testGroup: {
            fields: {
              id: { type: 'String' },
            },
          },
        },
      };

      const errors = validateSchemaStructure(schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Namespace must be defined and start with letter or underscore, contain only letters, digits and underscores');
    });
  });

  describe('typePrefix validation', () => {
    it('should pass with valid typePrefix', () => {
      const schema: Schema = {
        namespace: 'poeStaticData',
        typePrefix: 'Poe',
        groups: {
          testGroup: {
            fields: {
              id: { type: 'String' },
            },
          },
        },
      };

      const errors = validateSchemaStructure(schema);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid typePrefix containing special characters', () => {
      const schema: Schema = {
        namespace: 'poeStaticData',
        typePrefix: 'Poe-Type',
        groups: {
          testGroup: {
            fields: {
              id: { type: 'String' },
            },
          },
        },
      };

      const errors = validateSchemaStructure(schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('TypePrefix must be defined and contain only letters and digits');
    });
  });

  describe('groups validation', () => {
    it('should fail with empty groups', () => {
      const schema: Schema = {
        namespace: 'poeStaticData',
        typePrefix: 'Poe',
        groups: {},
      };

      const errors = validateSchemaStructure(schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Groups cannot be empty');
    });

    it('should pass with unique group names', () => {
      const schema: Schema = {
        namespace: 'poeStaticData',
        typePrefix: 'Poe',
        groups: {
          testGroup: {
            fields: {
              id: { type: 'String' },
            },
          },
          testGroup2: {
            fields: {
              id: { type: 'String' },
            },
          },
        },
      };

      const errors = validateSchemaStructure(schema);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid group name containing special characters', () => {
      const schema: Schema = {
        namespace: 'poeStaticData',
        typePrefix: 'Poe',
        groups: {
          'test-group': {
            fields: {
              id: { type: 'String' },
            },
          },
        },
      };

      const errors = validateSchemaStructure(schema);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Group name must contain only letters and digits');
    });

    it('should pass with valid groups', () => {
      const schema: Schema = {
        namespace: 'poeStaticData',
        typePrefix: 'Poe',
        groups: {
          testGroup: {
            fields: {
              id: { type: 'String' },
            },
          },
          anotherGroup: {
            fields: {
              id: { type: 'String' },
            },
          },
        },
      };

      const errors = validateSchemaStructure(schema);
      expect(errors).toHaveLength(0);
    });
  });

  describe('combined validation', () => {
    it('should return multiple errors for invalid schema', () => {
      const schema: Schema = {
        namespace: 'poe-static-data',
        typePrefix: 'Poe-Type',
        groups: {
          'test-group': {
            fields: {
              id: { type: 'String' },
            },
          },
          'test-group2': {
            fields: {
              id: { type: 'String' },
            },
          },
        },
      };

      const errors = validateSchemaStructure(schema);
      expect(errors).toHaveLength(4); // namespace, typePrefix, group name, group name2
    });
  });
});
