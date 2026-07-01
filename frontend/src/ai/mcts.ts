// ═══════════════════════════════════════════════════════
// Monte Carlo Tree Search (MCTS)
// Handles infinite game trees via random simulations (Vanish mode).
// ═══════════════════════════════════════════════════════

import { Player, Difficulty, calculateWinner, getAvailableMoves, placeWithVanish } from './types';

interface MCTSNode {
  cells: (Player | null)[];
  xMoves: number[];
  oMoves: number[];
  isXTurn: boolean;
  move: number;
  parent: MCTSNode | null;
  children: MCTSNode[];
  wins: number;
  visits: number;
  untriedMoves: number[];
}

function createNode(
  cells: (Player | null)[],
  xMoves: number[],
  oMoves: number[],
  isXTurn: boolean,
  move: number,
  parent: MCTSNode | null,
): MCTSNode {
  return {
    cells: [...cells],
    xMoves: [...xMoves],
    oMoves: [...oMoves],
    isXTurn,
    move,
    parent,
    children: [],
    wins: 0,
    visits: 0,
    untriedMoves: getAvailableMoves(cells),
  };
}

// UCB1 formula for node selection (exploration vs exploitation)
function ucb1(node: MCTSNode, parentVisits: number): number {
  if (node.visits === 0) return Infinity;
  return (node.wins / node.visits) + 1.41 * Math.sqrt(Math.log(parentVisits) / node.visits);
}

// Select the most promising child using UCB1
function selectChild(node: MCTSNode): MCTSNode {
  let best = node.children[0];
  let bestScore = -Infinity;
  for (const child of node.children) {
    const score = ucb1(child, node.visits);
    if (score > bestScore) {
      bestScore = score;
      best = child;
    }
  }
  return best;
}

// Expand: add a new child node for an untried move
function expand(node: MCTSNode): MCTSNode {
  const moveIdx = Math.floor(Math.random() * node.untriedMoves.length);
  const move = node.untriedMoves.splice(moveIdx, 1)[0];

  const currentPlayer: Player = node.isXTurn ? 'X' : 'O';
  const { newCells, newXMoves, newOMoves } = placeWithVanish(
    node.cells, move, currentPlayer, node.xMoves, node.oMoves
  );

  const child = createNode(newCells, newXMoves, newOMoves, !node.isXTurn, move, node);
  node.children.push(child);
  return child;
}

// Simulate: play random moves until a terminal state
function simulate(node: MCTSNode, computerSym: Player): number {
  let cells = [...node.cells];
  let xMoves = [...node.xMoves];
  let oMoves = [...node.oMoves];
  let isXTurn = node.isXTurn;
  const maxPlayoutMoves = 30;

  for (let i = 0; i < maxPlayoutMoves; i++) {
    const winner = calculateWinner(cells);
    if (winner === computerSym) return 1;   // win
    if (winner) return -1;                   // loss

    const available = getAvailableMoves(cells);
    if (available.length === 0) return 0;    // draw

    const move = available[Math.floor(Math.random() * available.length)];
    const player: Player = isXTurn ? 'X' : 'O';
    const result = placeWithVanish(cells, move, player, xMoves, oMoves);
    cells = result.newCells;
    xMoves = result.newXMoves;
    oMoves = result.newOMoves;
    isXTurn = !isXTurn;
  }
  return 0; // draw if playout limit reached (likely a cycle)
}

// Backpropagate the result up the tree
function backpropagate(node: MCTSNode | null, result: number) {
  while (node) {
    node.visits++;
    node.wins += result;
    result = -result; // flip perspective at each level
    node = node.parent;
  }
}

// Main MCTS search: run iterations and return best move
function mctsSearch(
  cells: (Player | null)[],
  xMoves: number[],
  oMoves: number[],
  isXTurn: boolean,
  computerSym: Player,
  iterations: number,
): number {
  const root = createNode(cells, xMoves, oMoves, isXTurn, -1, null);

  for (let i = 0; i < iterations; i++) {
    // 1. Selection
    let node = root;
    while (node.untriedMoves.length === 0 && node.children.length > 0) {
      node = selectChild(node);
    }

    // 2. Expansion
    if (node.untriedMoves.length > 0 && !calculateWinner(node.cells)) {
      node = expand(node);
    }

    // 3. Simulation
    const result = simulate(node, computerSym);

    // 4. Backpropagation
    backpropagate(node, result);
  }

  // Pick the child with the most visits (most robust choice)
  let bestChild = root.children[0];
  for (const child of root.children) {
    if (child.visits > bestChild.visits) {
      bestChild = child;
    }
  }
  return bestChild ? bestChild.move : getAvailableMoves(cells)[0];
}

export function getVanishMove(
  cells: (Player | null)[],
  computerSym: Player,
  xMoves: number[],
  oMoves: number[],
  isXTurn: boolean,
  difficulty: Difficulty,
): number {
  const iterationsByDifficulty = { easy: 100, medium: 500, hard: 2000 };
  const iterations = iterationsByDifficulty[difficulty];
  return mctsSearch(cells, xMoves, oMoves, isXTurn, computerSym, iterations);
}
