import { describe, it, expect } from 'vitest';
import { calculateWinner, isBoardFull, placeWithVanish, getAvailableMoves, Player } from '../ai/types';

type Cell = Player | null;

describe('calculateWinner', () => {
  it('returns null for empty board', () => {
    const cells: Cell[] = Array(9).fill(null);
    expect(calculateWinner(cells)).toBeNull();
  });

  it('detects horizontal win', () => {
    const cells: Cell[] = ['X', 'X', 'X', null, null, null, null, null, null];
    expect(calculateWinner(cells)).toBe('X');
  });

  it('detects vertical win', () => {
    const cells: Cell[] = ['O', null, null, 'O', null, null, 'O', null, null];
    expect(calculateWinner(cells)).toBe('O');
  });

  it('detects diagonal win', () => {
    const cells: Cell[] = ['X', null, null, null, 'X', null, null, null, 'X'];
    expect(calculateWinner(cells)).toBe('X');
  });

  it('detects anti-diagonal win', () => {
    const cells: Cell[] = [null, null, 'O', null, 'O', null, 'O', null, null];
    expect(calculateWinner(cells)).toBe('O');
  });

  it('returns null when no winner', () => {
    const cells: Cell[] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(calculateWinner(cells)).toBeNull();
  });
});

describe('isBoardFull', () => {
  it('returns false for empty board', () => {
    expect(isBoardFull(Array(9).fill(null))).toBe(false);
  });

  it('returns true for full board', () => {
    const cells: Cell[] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(isBoardFull(cells)).toBe(true);
  });

  it('returns false with one empty cell', () => {
    const cells: Cell[] = ['X', 'O', 'X', 'X', null, 'O', 'O', 'X', 'X'];
    expect(isBoardFull(cells)).toBe(false);
  });
});

describe('getAvailableMoves', () => {
  it('returns all indices for empty board', () => {
    expect(getAvailableMoves(Array(9).fill(null))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('returns empty array for full board', () => {
    const cells: Cell[] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(getAvailableMoves(cells)).toEqual([]);
  });

  it('returns only empty indices', () => {
    const cells: Cell[] = ['X', null, 'O', null, 'X', null, null, null, 'O'];
    expect(getAvailableMoves(cells)).toEqual([1, 3, 5, 6, 7]);
  });
});

describe('placeWithVanish', () => {
  it('places mark normally when under limit', () => {
    const cells: Cell[] = Array(9).fill(null);
    const { newCells, newXMoves } = placeWithVanish(cells, 0, 'X', [], []);
    expect(newCells[0]).toBe('X');
    expect(newXMoves).toEqual([0]);
  });

  it('removes oldest mark when at limit', () => {
    const cells: Cell[] = [null, 'X', 'X', 'X', null, null, null, null, null];
    const xMoves = [1, 2, 3];
    const { newCells, newXMoves } = placeWithVanish(cells, 0, 'X', xMoves, []);
    expect(newCells[0]).toBe('X');
    expect(newCells[1]).toBeNull(); // oldest vanished
    expect(newCells[2]).toBe('X');
    expect(newCells[3]).toBe('X');
    expect(newXMoves).toEqual([2, 3, 0]);
  });

  it('does not affect other player moves', () => {
    const cells: Cell[] = ['O', null, 'X', 'X', 'X', null, null, null, null];
    const xMoves = [2, 3, 4];
    const oMoves = [0];
    const { newCells, newOMoves } = placeWithVanish(cells, 5, 'O', xMoves, oMoves);
    expect(newCells[0]).toBe('O');
    expect(newCells[5]).toBe('O');
    expect(newOMoves).toEqual([0, 5]);
  });
});
