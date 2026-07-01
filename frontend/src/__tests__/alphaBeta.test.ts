import { describe, it, expect } from 'vitest';
import { getClassicMove } from '../ai/alphaBeta';
import type { Player } from '../ai/types';

type Cell = Player | null;

describe('Alpha-Beta AI', () => {
  it('takes winning move when available', () => {
    const cells: Cell[] = ['X', 'X', null, 'O', 'O', null, null, null, null];
    const move = getClassicMove(cells, 'X', 'hard');
    expect(move).toBe(2);
  });

  it('blocks opponent winning move', () => {
    const cells: Cell[] = ['X', null, null, 'O', 'O', null, null, null, 'X'];
    const move = getClassicMove(cells, 'X', 'hard');
    expect(move).toBe(5);
  });

  it('returns a valid move on empty board', () => {
    const cells: Cell[] = Array(9).fill(null);
    const move = getClassicMove(cells, 'X', 'hard');
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(9);
  });

  it('easy mode returns a valid move', () => {
    const cells: Cell[] = Array(9).fill(null);
    const move = getClassicMove(cells, 'X', 'easy');
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(9);
  });
});
