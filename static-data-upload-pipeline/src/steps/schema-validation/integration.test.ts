import { ApiSchema } from './types';
import { validateSchemaStructure } from './utils';

describe('Schema Validation Integration Tests', () => {
  it('should validate a complete valid schema', () => {
    const validSchema: ApiSchema = {
      namespace: 'poeStaticData',
      typePrefix: 'Poe',
      groups: {
        weapons: {
          fields: {
            id: { type: 'String' },
            name: { type: 'String' },
            damage: { type: 'String' },
          },
          objects: {
            stats: {
              fields: {
                value: { type: 'String' },
                type: { type: 'String' },
              },
            },
          },
        },
      },
    };

    const errors = validateSchemaStructure(validSchema);
    expect(errors).toHaveLength(0);
  });

  it('should detect invalid namespace with hyphens', () => {
    const invalidSchema: ApiSchema = {
      namespace: 'poe-static-data',
      typePrefix: 'Poe',
      groups: {
        weapons: {
          fields: {
            id: { type: 'String' },
          },
        },
      },
    };

    const errors = validateSchemaStructure(invalidSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Namespace must be defined and start with letter or underscore, contain only letters, digits, underscores and dots');
  });

  it('should detect invalid namespace starting with digit', () => {
    const invalidSchema: ApiSchema = {
      namespace: '123poeData',
      typePrefix: 'Poe',
      groups: {
        weapons: {
          fields: {
            id: { type: 'String' },
          },
        },
      },
    };

    const errors = validateSchemaStructure(invalidSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Namespace must be defined and start with letter or underscore, contain only letters, digits, underscores and dots');
  });

  it('should accept valid namespace with underscores', () => {
    const validSchema: ApiSchema = {
      namespace: '_poe_static_data',
      typePrefix: 'Poe',
      groups: {
        weapons: {
          fields: {
            id: { type: 'String' },
          },
        },
      },
    };

    const errors = validateSchemaStructure(validSchema);
    expect(errors).toHaveLength(0);
  });

  it('should accept valid namespace with numbers', () => {
    const validSchema: ApiSchema = {
      namespace: 'poeStaticData123',
      typePrefix: 'Poe',
      groups: {
        weapons: {
          fields: {
            id: { type: 'String' },
          },
        },
      },
    };

    const errors = validateSchemaStructure(validSchema);
    expect(errors).toHaveLength(0);
  });

  it('should accept valid namespace with dots', () => {
    const validSchema: ApiSchema = {
      namespace: 'poe.static.data',
      typePrefix: 'Poe',
      groups: {
        weapons: {
          fields: {
            id: { type: 'String' },
          },
        },
      },
    };

    const errors = validateSchemaStructure(validSchema);
    expect(errors).toHaveLength(0);
  });

  it('should accept valid namespace with dots and underscores', () => {
    const validSchema: ApiSchema = {
      namespace: 'poe.static_data.v2',
      typePrefix: 'Poe',
      groups: {
        weapons: {
          fields: {
            id: { type: 'String' },
          },
        },
      },
    };

    const errors = validateSchemaStructure(validSchema);
    expect(errors).toHaveLength(0);
  });
});
