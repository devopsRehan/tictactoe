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

function ucb1(node: MCTSNode, parentVisits: number): number {
  if (node.visits === 0) return Infinity;
  return (node.wins / node.visits) + 1.41 * Math.sqrt(Math.log(parentVisits) / node.visits);
}

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

function simulate(node: MCTSNode, computerSym: Player): number {
  let cells = [...node.cells];
  let xMoves = [...node.xMoves];
  let oMoves = [...node.oMoves];
  let isXTurn = node.isXTurn;
  const maxPlayoutMoves = 30;

  for (let i = 0; i < maxPlayoutMoves; i++) {
    const winner = calculateWinner(cells);
    if (winner === computerSym) return 1;
    if (winner) return -1;

    const available = getAvailableMoves(cells);
    if (available.length === 0) return 0;

    const move = available[Math.floor(Math.random() * available.length)];
    const player: Player = isXTurn ? 'X' : 'O';
    const result = placeWithVanish(cells, move, player, xMoves, oMoves);
    cells = result.newCells;
    xMoves = result.newXMoves;
    oMoves = result.newOMoves;
    isXTurn = !isXTurn;
  }
  return 0;
}

function backpropagate(node: MCTSNode | null, result: number, computerSym: Player) {
  while (node) {
    node.visits++;
    // Who moved to reach this node? (the opposite of whose turn it is here)
    const mover: Player = node.isXTurn ? 'O' : 'X';
    // Store wins from the mover's perspective so UCB1 selects best for the current player
    node.wins += (mover === computerSym) ? result : -result;
    node = node.parent;
  }
}

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
    let node = root;
    while (node.untriedMoves.length === 0 && node.children.length > 0) {
      node = selectChild(node);
    }

    if (node.untriedMoves.length > 0 && !calculateWinner(node.cells)) {
      node = expand(node);
    }

    const result = simulate(node, computerSym);
    backpropagate(node, result, computerSym);
  }

  let bestChild = root.children[0];
  for (const child of root.children) {
    if (child.visits > bestChild.visits) {
      bestChild = child;
    }
  }
  return bestChild ? bestChild.move : getAvailableMoves(cells)[0];
}

export interface MCTSWorkerRequest {
  cells: (Player | null)[];
  computerSym: Player;
  xMoves: number[];
  oMoves: number[];
  isXTurn: boolean;
  difficulty: Difficulty;
}

export interface MCTSWorkerResponse {
  move: number;
}

// Web Worker message handler
self.onmessage = (e: MessageEvent<MCTSWorkerRequest>) => {
  const { cells, computerSym, xMoves, oMoves, isXTurn, difficulty } = e.data;
  const iterationsByDifficulty = { easy: 500, medium: 3000, hard: 10000 };
  const iterations = iterationsByDifficulty[difficulty];
  const move = mctsSearch(cells, xMoves, oMoves, isXTurn, computerSym, iterations);
  const response: MCTSWorkerResponse = { move };
  self.postMessage(response);
};
