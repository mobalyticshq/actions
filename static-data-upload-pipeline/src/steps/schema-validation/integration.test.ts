import { Schema } from './types';
import { validateSchemaStructure } from './utils';

describe('Schema Validation Integration Tests', () => {
  it('should validate a complete valid schema', () => {
    const validSchema: Schema = {
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

  it('should detect invalid namespace', () => {
    const invalidSchema: Schema = {
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
    expect(errors[0].message).toContain('Namespace must be defined and contain only letters and digits');
  });
});
