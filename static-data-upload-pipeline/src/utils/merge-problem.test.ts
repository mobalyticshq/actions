import { isValidDataForMerge, mergeProblem } from './merge.utils';

describe('mergeProblem', () => {
  it('names a duplicate id - the overwatch stacked-sticks case', () => {
    const data: any = { items: [{ id: 'stacked-sticks' }, { id: 'pinb-o-b' }, { id: 'stacked-sticks' }] };
    expect(mergeProblem(data)).toBe('duplicate id "stacked-sticks" in "items"');
    expect(isValidDataForMerge(data)).toBe(false);
  });

  it('treats 1 and "1" as the same id, like the merge does', () => {
    expect(mergeProblem({ g: [{ id: 1 as any }, { id: '1' }] })).toBe('duplicate id "1" in "g"');
  });

  it('names a missing id and a non-array group', () => {
    expect(mergeProblem({ g: [{ id: 'a' }, { name: 'no id' } as any] })).toBe('an entity in "g" has no id');
    expect(mergeProblem({ g: { id: 'a' } as any })).toBe('group "g" is not an array');
  });

  it('is null for a clean file', () => {
    expect(mergeProblem({ g: [{ id: 'a' }, { id: 'b' }], h: [] })).toBeNull();
    expect(isValidDataForMerge({ g: [{ id: 'a' }] })).toBe(true);
  });
});
