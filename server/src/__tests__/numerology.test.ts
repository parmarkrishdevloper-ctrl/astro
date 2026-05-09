import { describe, it, expect } from 'vitest';
import { calculateNumerology, reduceToSingle, chaldeanNameNumber } from '../services/numerology.service';

describe('numerology', () => {
  it('reduces multi-digit numbers to a single digit', () => {
    expect(reduceToSingle(15)).toBe(6);
    expect(reduceToSingle(28)).toBe(1);
    expect(reduceToSingle(9)).toBe(9);
    expect(reduceToSingle(0)).toBe(1); // empty defaults to 1
  });

  it('computes Chaldean name number from letter mapping', () => {
    // A=1 R=2 J=1 U=6 N=5 → 15 → 6
    const r = chaldeanNameNumber('Arjun');
    expect(r.sum).toBe(15);
    expect(r.root).toBe(6);
  });

  it('computes Moolank from birth day', () => {
    const r = calculateNumerology(new Date('1990-08-15'));
    expect(r.moolank.number).toBe(6);            // 1+5
    expect(r.moolank.rulingPlanet).toBe('Venus');
  });

  it('computes Bhagyank from full DOB', () => {
    // 1990-08-15 → 1+9+9+0 + 0+8 + 1+5 = 33 → 6
    const r = calculateNumerology(new Date('1990-08-15'));
    expect(r.bhagyank.number).toBe(6);
  });

  it('attaches name number when name supplied', () => {
    const r = calculateNumerology(new Date('1990-08-15'), 'Arjun Sharma');
    expect(r.nameNumber).toBeDefined();
    expect(r.nameNumber!.number).toBeGreaterThanOrEqual(1);
    expect(r.nameNumber!.number).toBeLessThanOrEqual(9);
  });
});
