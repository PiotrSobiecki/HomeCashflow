import { describe, expect, it } from 'vitest';
import { mergeCandidates, mergeDescription } from './MergeIntoFixedControl';
import { nameSimilarity } from '../lib/nameSimilarity';

const bank = { source: 'bank', name: 'abcdefghijklmnopqrst', amount: 1000 };
const fixed = { id: 'fixed', name: 'abcdefghijklmnopqXYZ', amount: 1100, isFixed: true, updatedAt: 'now' };

describe('merge suggestions', () => {
  it('includes 85% name similarity with a different amount, but excludes 80%', () => {
    expect(nameSimilarity(bank.name, fixed.name)).toBe(0.85);
    expect(mergeCandidates(bank, [fixed], () => true)).toEqual([fixed]);
    expect(mergeCandidates(bank, [{ ...fixed, name: 'abcdefghijklmnopWXYZ' }], () => true)).toEqual([]);
  });
  it('normalizes Polish accents, case and punctuation', () => {
    expect(nameSimilarity('  OPŁATA — Żłobek ', 'oplata zlobek')).toBe(1);
    expect(nameSimilarity('', '')).toBe(0);
  });
  it('retains amount matching and respects permissions and exclusions', () => {
    expect(mergeCandidates({ ...bank, name: 'Przelew', amount: 1100 }, [fixed], () => true)).toEqual([fixed]);
    expect(mergeCandidates(bank, [fixed], () => false)).toEqual([]);
    expect(mergeCandidates({ ...bank, excludeFromAnalysis: true }, [fixed], () => true)).toEqual([]);
    expect(mergeCandidates({ ...bank, source: 'manual' }, [fixed], () => true)).toEqual([]);
    expect(mergeCandidates(bank, [{ ...fixed, updatedAt: null }], () => true)).toEqual([]);
  });
  it('explains which amount survives when amounts differ', () => {
    expect(mergeDescription({ entry: bank, fixed }, 'wydatek stały')).toContain('Kwoty są różne');
  });
});
