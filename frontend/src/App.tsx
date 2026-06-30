import { useCallback, useEffect, useState } from 'react';
import Board from './components/Board';

type Player = 'X' | 'O';
type Mode = 'pvp' | 'pvc';
type Difficulty = 'easy' | 'medium' | 'hard';

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function calculateWinner(cells: (Player | null)[]): Player | null {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return cells[a];
    }
  }
  return null;
}

function isBoardFull(cells: (Player | null)[]): boolean {
  return cells.every((cell) => cell !== null);
}

// Alpha-Beta Pruning with depth-aware scoring
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
  if (winner === computerSym) return 10 - depth; // prefer faster wins
  if (winner === humanSym) return depth - 10;     // prefer slower losses
  if (isBoardFull(cells)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!cells[i]) {
        cells[i] = computerSym;
        best = Math.max(best, alphaBeta(cells, depth + 1, alpha, beta, false, computerSym));
        cells[i] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break; // prune
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
        if (beta <= alpha) break; // prune
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
  const available = cells.reduce<number[]>((acc, cell, i) => {
    if (!cell) acc.push(i);
    return acc;
  }, []);
  return available[Math.floor(Math.random() * available.length)];
}

function getMove(cells: (Player | null)[], computerSym: Player, difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      // 20% chance of optimal move, 80% random
      return Math.random() < 0.2
        ? getOptimalMove(cells, computerSym)
        : getRandomMove(cells);
    case 'medium':
      // 60% chance of optimal move, 40% random
      return Math.random() < 0.6
        ? getOptimalMove(cells, computerSym)
        : getRandomMove(cells);
    case 'hard':
      // Always optimal (unbeatable)
      return getOptimalMove(cells, computerSym);
  }
}

function App() {
  const [cells, setCells] = useState<(Player | null)[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [mode, setMode] = useState<Mode>('pvc');
  const [humanSymbol, setHumanSymbol] = useState<Player>('X');
  const [humanFirst, setHumanFirst] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');

  const computerSymbol: Player = humanSymbol === 'X' ? 'O' : 'X';
  const isComputerTurn = isXTurn ? computerSymbol === 'X' : computerSymbol === 'O';

  const winner = calculateWinner(cells);
  const isDraw = !winner && isBoardFull(cells);

  const makeAiMove = useCallback((currentCells: (Player | null)[]) => {
    const move = getMove([...currentCells], computerSymbol, difficulty);
    if (move !== -1) {
      const newCells = [...currentCells];
      newCells[move] = computerSymbol;
      setCells(newCells);
      setIsXTurn(computerSymbol !== 'X');
    }
  }, [computerSymbol, difficulty]);

  useEffect(() => {
    if (mode === 'pvc' && isComputerTurn && !winner && !isDraw) {
      const timeout = setTimeout(() => makeAiMove(cells), 300);
      return () => clearTimeout(timeout);
    }
  }, [cells, winner, isDraw, mode, makeAiMove, isComputerTurn]);

  function handleCellClick(index: number) {
    if (cells[index] || winner) return;
    if (mode === 'pvc' && isComputerTurn) return;

    const newCells = [...cells];
    newCells[index] = isXTurn ? 'X' : 'O';
    setCells(newCells);
    setIsXTurn(!isXTurn);
  }

  function handleRestart() {
    setCells(Array(9).fill(null));
    const firstMoverSym = humanFirst ? humanSymbol : computerSymbol;
    setIsXTurn(firstMoverSym === 'X');
  }

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    setCells(Array(9).fill(null));
    setHumanSymbol('X');
    setHumanFirst(true);
    setIsXTurn(true);
  }

  function handleSymbolChange(sym: Player) {
    setHumanSymbol(sym);
    setCells(Array(9).fill(null));
    const compSym = sym === 'X' ? 'O' : 'X';
    const firstMoverSym = humanFirst ? sym : compSym;
    setIsXTurn(firstMoverSym === 'X');
  }

  function handleFirstChange(first: boolean) {
    setHumanFirst(first);
    setCells(Array(9).fill(null));
    const firstMoverSym = first ? humanSymbol : computerSymbol;
    setIsXTurn(firstMoverSym === 'X');
  }

  function handleDifficultyChange(d: Difficulty) {
    setDifficulty(d);
    setCells(Array(9).fill(null));
    const firstMoverSym = humanFirst ? humanSymbol : computerSymbol;
    setIsXTurn(firstMoverSym === 'X');
  }

  let status: string;
  if (winner) {
    status = mode === 'pvc'
      ? (winner === computerSymbol ? 'Computer Wins!' : 'You Win!')
      : `${winner} Wins!`;
  } else if (isDraw) {
    status = 'Draw!';
  } else {
    status = mode === 'pvc'
      ? (isComputerTurn ? 'Computer thinking...' : `Your turn (${humanSymbol})`)
      : `Next turn: ${isXTurn ? 'X' : 'O'}`;
  }

  return (
    <div className="app">
      <h1>Tic Tac Toe</h1>
      <div className="mode-selector">
        <button
          className={mode === 'pvc' ? 'active' : ''}
          onClick={() => handleModeChange('pvc')}
        >
          vs Computer
        </button>
        <button
          className={mode === 'pvp' ? 'active' : ''}
          onClick={() => handleModeChange('pvp')}
        >
          2 Players
        </button>
      </div>
      {mode === 'pvc' && (
        <>
          <div className="difficulty-selector">
            <span>Difficulty:</span>
            <button
              className={difficulty === 'easy' ? 'active' : ''}
              onClick={() => handleDifficultyChange('easy')}
            >
              Easy
            </button>
            <button
              className={difficulty === 'medium' ? 'active' : ''}
              onClick={() => handleDifficultyChange('medium')}
            >
              Medium
            </button>
            <button
              className={difficulty === 'hard' ? 'active' : ''}
              onClick={() => handleDifficultyChange('hard')}
            >
              Hard
            </button>
          </div>
          <div className="first-selector">
            <span>First move:</span>
            <button
              className={humanFirst ? 'active' : ''}
              onClick={() => handleFirstChange(true)}
            >
              You
            </button>
            <button
              className={!humanFirst ? 'active' : ''}
              onClick={() => handleFirstChange(false)}
            >
              Computer
            </button>
          </div>
          {humanFirst && (
            <div className="first-selector">
              <span>Play as:</span>
              <button
                className={humanSymbol === 'X' ? 'active' : ''}
                onClick={() => handleSymbolChange('X')}
              >
                X
              </button>
              <button
                className={humanSymbol === 'O' ? 'active' : ''}
                onClick={() => handleSymbolChange('O')}
              >
                O
              </button>
            </div>
          )}
        </>
      )}
      <Board cells={cells} onCellClick={handleCellClick} />
      {(winner || isDraw) && (
        <div className="winning-message show">
          <span>{status}</span>
          <button onClick={handleRestart}>Restart</button>
        </div>
      )}
      {!winner && !isDraw && <p className="status">{status}</p>}
      <footer className="author">
        <p>Built by <strong>Rehan Khan</strong></p>
        <p className="author-tags">DevSecOps | MLOps | GenAIOps | AI/ML/RL</p>
        <div className="author-links">
          <a href="https://github.com/devopsRehan" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/rehan-khan-devops/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
