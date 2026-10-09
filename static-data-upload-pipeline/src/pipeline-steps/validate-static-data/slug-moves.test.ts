import { findSlugMoves } from './utils';

describe('findSlugMoves', () => {
  it('reports a slug that moves to another id while the old owner stays live', () => {
    // wowfor_stg v0.0.27: iron-will
    const before = [{ id: '1', slug: 'iron-will' }];
    const after = [
      { id: '1', slug: 'iron-will-rank-1' },
      { id: '2', slug: 'iron-will' },
    ];
    const { movedIn, movedOut } = findSlugMoves(before, after);
    expect(movedIn.get('2')).toEqual({ slug: 'iron-will', from: '1', fromSlug: 'iron-will-rank-1' });
    expect(movedOut.get('1')).toEqual({ slug: 'iron-will', to: '2' });
  });

  it('reports both sides of a swap', () => {
    // wowfor_stg v0.0.27: spiritcaller-boots / spiritcaller-treads
    const before = [
      { id: '1', slug: 'spiritcaller-boots' },
      { id: '2', slug: 'spiritcaller-treads' },
    ];
    const after = [
      { id: '1', slug: 'spiritcaller-treads' },
      { id: '2', slug: 'spiritcaller-boots' },
    ];
    const { movedIn, movedOut } = findSlugMoves(before, after);
    expect([...movedIn.keys()].sort()).toEqual(['1', '2']);
    expect([...movedOut.keys()].sort()).toEqual(['1', '2']);
  });

  it('ignores a slug handed over by a retired entity - that is the intended outcome', () => {
    const before = [{ id: '1', slug: 'holy-shock' }];
    const after = [
      { id: '1', slug: 'holy-shock-old', deprecated: true },
      { id: '2', slug: 'holy-shock' },
    ];
    expect(findSlugMoves(before, after).movedIn.size).toBe(0);
  });

  it('ignores a plain rename and a slug nobody owned before', () => {
    const before = [{ id: '1', slug: 'a' }];
    const after = [
      { id: '1', slug: 'b' },
      { id: '2', slug: 'c' },
    ];
    const { movedIn, movedOut } = findSlugMoves(before, after);
    expect(movedIn.size + movedOut.size).toBe(0);
  });

  it('matches numeric and string ids alike', () => {
    const before = [{ id: 1 as any, slug: 'x' }];
    const after = [
      { id: 1 as any, slug: 'y' },
      { id: 2 as any, slug: 'x' },
    ];
    expect(findSlugMoves(before, after).movedIn.get('2')?.from).toBe('1');
  });
});
