export type Player = 'X' | 'O';
export type Difficulty = 'easy' | 'medium' | 'hard';

export const MAX_MARKS = 3;

export const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function calculateWinner(cells: (Player | null)[]): Player | null {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return cells[a];
    }
  }
  return null;
}

export function isBoardFull(cells: (Player | null)[]): boolean {
  return cells.every((cell) => cell !== null);
}

export function getAvailableMoves(cells: (Player | null)[]): number[] {
  const moves: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (!cells[i]) moves.push(i);
  }
  return moves;
}

export function placeWithVanish(
  cells: (Player | null)[],
  index: number,
  player: Player,
  xMoves: number[],
  oMoves: number[],
): { newCells: (Player | null)[]; newXMoves: number[]; newOMoves: number[] } {
  const newCells = [...cells];
  const newXMoves = [...xMoves];
  const newOMoves = [...oMoves];

  const moves = player === 'X' ? newXMoves : newOMoves;

  if (moves.length >= MAX_MARKS) {
    const oldest = moves.shift()!;
    newCells[oldest] = null;
  }

  newCells[index] = player;
  if (player === 'X') {
    newXMoves.push(index);
  } else {
    newOMoves.push(index);
  }

  return { newCells, newXMoves, newOMoves };
}
