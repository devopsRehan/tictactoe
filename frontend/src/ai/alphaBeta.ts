// ═══════════════════════════════════════════════════════
// Minimax with Alpha-Beta Pruning
// Perfect play for a fully solvable game tree (Classic mode).
// ═══════════════════════════════════════════════════════

import { Player, Difficulty, calculateWinner, isBoardFull, getAvailableMoves } from './types';

function alphaBeta(
  cells: (Player | null)[],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  computerSym: Player,
): number {
  const humanSym: Player = computerSym === 'O' ? 'X' : 'O';
  const winner = calculateWinner(cells);
  if (winner === computerSym) return 10 - depth;
  if (winner === humanSym) return depth - 10;
  if (isBoardFull(cells)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!cells[i]) {
        cells[i] = computerSym;
        best = Math.max(best, alphaBeta(cells, depth + 1, alpha, beta, false, computerSym));
        cells[i] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!cells[i]) {
        cells[i] = humanSym;
        best = Math.min(best, alphaBeta(cells, depth + 1, alpha, beta, true, computerSym));
        cells[i] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  }
}

function getOptimalMove(cells: (Player | null)[], computerSym: Player): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (!cells[i]) {
      cells[i] = computerSym;
      const score = alphaBeta(cells, 0, -Infinity, Infinity, false, computerSym);
      cells[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function getRandomMove(cells: (Player | null)[]): number {
  const available = getAvailableMoves(cells);
  return available[Math.floor(Math.random() * available.length)];
}

export function getClassicMove(cells: (Player | null)[], computerSym: Player, difficulty: Difficulty): number {
  const board = [...cells];
  switch (difficulty) {
    case 'easy':
      return Math.random() < 0.2 ? getOptimalMove(board, computerSym) : getRandomMove(board);
    case 'medium':
      return Math.random() < 0.6 ? getOptimalMove(board, computerSym) : getRandomMove(board);
    case 'hard':
      return getOptimalMove(board, computerSym);
  }
}
