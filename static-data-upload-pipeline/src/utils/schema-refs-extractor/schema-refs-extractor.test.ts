import { 
  extractSchemaRefs, 
  extractSchemaRefsWithOptions, 
  sortRefs, 
  groupRefsByTarget,
  filterRefsByGroup 
} from './schema-refs-extractor';

describe('schema-refs-extractor', () => {
  describe('extractSchemaRefs', () => {
    it('should extract Ref type references', () => {
      const schema = {
        groups: {
          gems: {
            fields: {
              id: { type: 'String' },
              skillRef: { type: 'Ref', refTo: 'skills' }
            }
          },
          skills: {
            fields: {
              id: { type: 'String' }
            }
          }
        }
      };

      const result = extractSchemaRefs(schema);

      expect(result.refs).toContainEqual({
        from: 'gems.skillRef',
        to: 'skills'
      });
    });

    it('should extract nested object references', () => {
      const schema = {
        groups: {
          gems: {
            fields: {
              stats: { type: 'Object', array: true, objName: 'stats' }
            },
            objects: {
              stats: {
                fields: {
                  keywordRef: { type: 'Ref', refTo: 'keywords' }
                }
              }
            }
          },
          keywords: {
            fields: {
              id: { type: 'String' }
            }
          }
        }
      };

      const result = extractSchemaRefs(schema);

      expect(result.refs).toContainEqual({
        from: 'gems.stats.keywordRef',
        to: 'keywords'
      });
    });

    it('should extract self-referencing fields', () => {
      const schema = {
        groups: {
          weapons: {
            fields: {
              id: { type: 'String' },
              baseItemId: { type: 'String' }
            }
          }
        }
      };

      const result = extractSchemaRefs(schema);

      expect(result.refs).toContainEqual({
        from: 'weapons.baseItemId',
        to: 'weapons'
      });
    });

    it('should handle multiple groups and references', () => {
      const schema = {
        groups: {
          gems: {
            fields: {
              skillRef: { type: 'Ref', refTo: 'skills' }
            }
          },
          characters: {
            fields: {
              startingNodeRef: { type: 'Ref', refTo: 'passiveSkillsNodes' }
            }
          },
          skills: {
            fields: {
              id: { type: 'String' }
            }
          },
          passiveSkillsNodes: {
            fields: {
              id: { type: 'String' }
            }
          }
        }
      };

      const result = extractSchemaRefs(schema);

      expect(result.refs).toHaveLength(2);
      expect(result.refs).toContainEqual({
        from: 'gems.skillRef',
        to: 'skills'
      });
      expect(result.refs).toContainEqual({
        from: 'characters.startingNodeRef',
        to: 'passiveSkillsNodes'
      });
    });

    it('should handle array refs', () => {
      const schema = {
        groups: {
          passiveSkills: {
            fields: {
              characterRef: { type: 'Ref', array: true, refTo: 'characters' }
            }
          },
          characters: {
            fields: {
              id: { type: 'String' }
            }
          }
        }
      };

      const result = extractSchemaRefs(schema);

      expect(result.refs).toContainEqual({
        from: 'passiveSkills.characterRef',
        to: 'characters'
      });
    });

    it('should handle deep nested objects', () => {
      const schema = {
        groups: {
          passiveSkillsGraph: {
            fields: {
              groups: { type: 'Object', array: true, objName: 'groups' }
            },
            objects: {
              groups: {
                fields: {
                  passiveSkillNodeRef: { type: 'Ref', array: true, refTo: 'passiveSkillsNodes' }
                }
              }
            }
          },
          passiveSkillsNodes: {
            fields: {
              id: { type: 'String' }
            }
          }
        }
      };

      const result = extractSchemaRefs(schema);

      expect(result.refs).toContainEqual({
        from: 'passiveSkillsGraph.groups.passiveSkillNodeRef',
        to: 'passiveSkillsNodes'
      });
    });
  });

  describe('extractSchemaRefsWithOptions', () => {
    it('should exclude self-refs when includeSelfRefs is false', () => {
      const schema = {
        groups: {
          weapons: {
            fields: {
              id: { type: 'String' },
              baseItemId: { type: 'String' },
              categoryRef: { type: 'Ref', refTo: 'categories' }
            }
          },
          categories: {
            fields: {
              id: { type: 'String' }
            }
          }
        }
      };

      const result = extractSchemaRefsWithOptions(schema, {
        includeSelfRefs: false
      });

      expect(result.refs).toHaveLength(1);
      expect(result.refs).toContainEqual({
        from: 'weapons.categoryRef',
        to: 'categories'
      });
      expect(result.refs).not.toContainEqual({
        from: 'weapons.baseItemId',
        to: 'weapons'
      });
    });

    it('should use custom ref patterns', () => {
      const schema = {
        groups: {
          items: {
            fields: {
              id: { type: 'String' },
              parentItemId: { type: 'String' },
              baseItemId: { type: 'String' }
            }
          }
        }
      };

      const result = extractSchemaRefsWithOptions(schema, {
        includeSelfRefs: true,
        customRefPatterns: ['parentItemId']
      });

      expect(result.refs).toHaveLength(1);
      expect(result.refs).toContainEqual({
        from: 'items.parentItemId',
        to: 'items'
      });
      expect(result.refs).not.toContainEqual({
        from: 'items.baseItemId',
        to: 'items'
      });
    });
  });

  describe('sortRefs', () => {
    it('should sort refs by from field', () => {
      const refs = {
        refs: [
          { from: 'weapons.baseItemId', to: 'weapons' },
          { from: 'gems.skillRef', to: 'skills' },
          { from: 'armours.baseItemId', to: 'armours' }
        ]
      };

      const sorted = sortRefs(refs);

      expect(sorted.refs[0].from).toBe('armours.baseItemId');
      expect(sorted.refs[1].from).toBe('gems.skillRef');
      expect(sorted.refs[2].from).toBe('weapons.baseItemId');
    });
  });

  describe('groupRefsByTarget', () => {
    it('should group refs by target', () => {
      const refs = {
        refs: [
          { from: 'gems.skillRef', to: 'skills' },
          { from: 'weapons.stats.keywordRef', to: 'keywords' },
          { from: 'gems.stats.keywordRef', to: 'keywords' },
          { from: 'weapons.baseItemId', to: 'weapons' }
        ]
      };

      const grouped = groupRefsByTarget(refs);

      expect(grouped['skills']).toEqual(['gems.skillRef']);
      expect(grouped['keywords']).toEqual(['weapons.stats.keywordRef', 'gems.stats.keywordRef']);
      expect(grouped['weapons']).toEqual(['weapons.baseItemId']);
    });
  });

  describe('filterRefsByGroup', () => {
    it('should filter refs by group name', () => {
      const refs = {
        refs: [
          { from: 'gems.skillRef', to: 'skills' },
          { from: 'weapons.stats.keywordRef', to: 'keywords' },
          { from: 'gems.stats.keywordRef', to: 'keywords' }
        ]
      };

      const filtered = filterRefsByGroup(refs, 'gems');

      expect(filtered.refs).toHaveLength(2);
      expect(filtered.refs).toContainEqual({ from: 'gems.skillRef', to: 'skills' });
      expect(filtered.refs).toContainEqual({ from: 'gems.stats.keywordRef', to: 'keywords' });
      expect(filtered.refs).not.toContainEqual({ from: 'weapons.stats.keywordRef', to: 'keywords' });
    });
  });
});

