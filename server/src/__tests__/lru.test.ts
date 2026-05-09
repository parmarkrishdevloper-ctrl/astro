import { describe, it, expect } from 'vitest';
import { LRU } from '../utils/lru';

describe('LRU cache', () => {
  it('stores and retrieves values', () => {
    const c = new LRU<number>(3);
    c.set('a', 1); c.set('b', 2); c.set('c', 3);
    expect(c.get('a')).toBe(1);
    expect(c.get('b')).toBe(2);
    expect(c.get('c')).toBe(3);
  });

  it('evicts least-recently-used entry on overflow', () => {
    const c = new LRU<number>(3);
    c.set('a', 1); c.set('b', 2); c.set('c', 3);
    // Touch 'a' so 'b' becomes LRU
    c.get('a');
    c.set('d', 4);
    expect(c.has('b')).toBe(false);
    expect(c.has('a')).toBe(true);
    expect(c.has('d')).toBe(true);
  });

  it('refreshes recency on get', () => {
    const c = new LRU<number>(2);
    c.set('a', 1); c.set('b', 2);
    c.get('a');             // 'b' is now LRU
    c.set('c', 3);          // evicts 'b'
    expect(c.has('b')).toBe(false);
    expect(c.has('a')).toBe(true);
  });

  it('clears all entries', () => {
    const c = new LRU<number>(3);
    c.set('a', 1); c.set('b', 2);
    c.clear();
    expect(c.size).toBe(0);
  });
});
