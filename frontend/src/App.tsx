import { useCallback, useEffect, useState } from 'react';
import Board from './components/Board';

type Player = 'X' | 'O';
type Mode = 'pvp' | 'pvc';
type Difficulty = 'easy' | 'medium' | 'hard';
type Rules = 'classic' | 'vanish';

const MAX_MARKS = 3; // each player can have at most 3 marks
const MAX_TOTAL_MOVES = 50; // draw if no winner after this many moves

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

// Simulate placing a mark with vanishing logic
function placeWithVanish(
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

  // If this player already has MAX_MARKS, remove the oldest
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

// Alpha-Beta Pruning with vanishing marks
function alphaBeta(
  cells: (Player | null)[],
  xMoves: number[],
  oMoves: number[],
  depth: number,
  maxDepth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  computerSym: Player,
): number {
  const humanSym: Player = computerSym === 'O' ? 'X' : 'O';
  const winner = calculateWinner(cells);
  if (winner === computerSym) return 10 - depth;
  if (winner === humanSym) return depth - 10;
  if (depth >= maxDepth) return 0; // depth limit to avoid infinite search

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!cells[i]) {
        const { newCells, newXMoves, newOMoves } = placeWithVanish(cells, i, computerSym, xMoves, oMoves);
        // Check if vanishing caused opponent to lose a win — skip if vanish breaks state
        best = Math.max(best, alphaBeta(newCells, newXMoves, newOMoves, depth + 1, maxDepth, alpha, beta, false, computerSym));
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
    }
    return best === -Infinity ? 0 : best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!cells[i]) {
        const { newCells, newXMoves, newOMoves } = placeWithVanish(cells, i, humanSym, xMoves, oMoves);
        best = Math.min(best, alphaBeta(newCells, newXMoves, newOMoves, depth + 1, maxDepth, alpha, beta, true, computerSym));
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
    }
    return best === Infinity ? 0 : best;
  }
}

function getOptimalMove(cells: (Player | null)[], computerSym: Player, xMoves: number[], oMoves: number[]): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  // Limit search depth to keep AI responsive with vanishing
  const maxDepth = 8;
  for (let i = 0; i < 9; i++) {
    if (!cells[i]) {
      const { newCells, newXMoves, newOMoves } = placeWithVanish(cells, i, computerSym, xMoves, oMoves);
      const score = alphaBeta(newCells, newXMoves, newOMoves, 0, maxDepth, -Infinity, Infinity, false, computerSym);
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

function getMove(cells: (Player | null)[], computerSym: Player, difficulty: Difficulty, xMoves: number[], oMoves: number[]): number {
  switch (difficulty) {
    case 'easy':
      return Math.random() < 0.2
        ? getOptimalMove(cells, computerSym, xMoves, oMoves)
        : getRandomMove(cells);
    case 'medium':
      return Math.random() < 0.6
        ? getOptimalMove(cells, computerSym, xMoves, oMoves)
        : getRandomMove(cells);
    case 'hard':
      return getOptimalMove(cells, computerSym, xMoves, oMoves);
  }
}

function isBoardFull(cells: (Player | null)[]): boolean {
  return cells.every((cell) => cell !== null);
}

function App() {
  const [cells, setCells] = useState<(Player | null)[]>(Array(9).fill(null));
  const [xMoves, setXMoves] = useState<number[]>([]);
  const [oMoves, setOMoves] = useState<number[]>([]);
  const [isXTurn, setIsXTurn] = useState(true);
  const [mode, setMode] = useState<Mode>('pvc');
  const [rules, setRules] = useState<Rules>('classic');
  const [humanSymbol, setHumanSymbol] = useState<Player>('X');
  const [humanFirst, setHumanFirst] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [totalMoves, setTotalMoves] = useState(0);

  const computerSymbol: Player = humanSymbol === 'X' ? 'O' : 'X';
  const isComputerTurn = isXTurn ? computerSymbol === 'X' : computerSymbol === 'O';

  const winner = calculateWinner(cells);
  const isDraw = !winner && (rules === 'classic' ? isBoardFull(cells) : totalMoves >= MAX_TOTAL_MOVES);

  // Determine which cell will vanish next for each player (only in vanish mode)
  const xFading = rules === 'vanish' && xMoves.length >= MAX_MARKS ? xMoves[0] : -1;
  const oFading = rules === 'vanish' && oMoves.length >= MAX_MARKS ? oMoves[0] : -1;

  const makeAiMove = useCallback((currentCells: (Player | null)[], curXMoves: number[], curOMoves: number[]) => {
    if (rules === 'vanish') {
      const move = getMove([...currentCells], computerSymbol, difficulty, curXMoves, curOMoves);
      if (move !== -1 && move !== undefined) {
        const { newCells, newXMoves, newOMoves } = placeWithVanish(currentCells, move, computerSymbol, curXMoves, curOMoves);
        setCells(newCells);
        setXMoves(newXMoves);
        setOMoves(newOMoves);
        setIsXTurn(computerSymbol !== 'X');
        setTotalMoves((m) => m + 1);
      }
    } else {
      const move = getMove([...currentCells], computerSymbol, difficulty, [], []);
      if (move !== -1 && move !== undefined) {
        const newCells = [...currentCells];
        newCells[move] = computerSymbol;
        setCells(newCells);
        setIsXTurn(computerSymbol !== 'X');
      }
    }
  }, [computerSymbol, difficulty, rules]);

  useEffect(() => {
    if (mode === 'pvc' && isComputerTurn && !winner && !isDraw) {
      const timeout = setTimeout(() => makeAiMove(cells, xMoves, oMoves), 300);
      return () => clearTimeout(timeout);
    }
  }, [cells, xMoves, oMoves, winner, isDraw, mode, makeAiMove, isComputerTurn]);

  function handleCellClick(index: number) {
    if (cells[index] || winner || isDraw) return;
    if (mode === 'pvc' && isComputerTurn) return;

    const currentPlayer: Player = isXTurn ? 'X' : 'O';
    if (rules === 'vanish') {
      const { newCells, newXMoves, newOMoves } = placeWithVanish(cells, index, currentPlayer, xMoves, oMoves);
      setCells(newCells);
      setXMoves(newXMoves);
      setOMoves(newOMoves);
      setIsXTurn(!isXTurn);
      setTotalMoves((m) => m + 1);
    } else {
      const newCells = [...cells];
      newCells[index] = currentPlayer;
      setCells(newCells);
      setIsXTurn(!isXTurn);
    }
  }

  function handleRestart() {
    setCells(Array(9).fill(null));
    setXMoves([]);
    setOMoves([]);
    setTotalMoves(0);
    const firstMoverSym = humanFirst ? humanSymbol : computerSymbol;
    setIsXTurn(firstMoverSym === 'X');
  }

  function handleRulesChange(r: Rules) {
    setRules(r);
    setCells(Array(9).fill(null));
    setXMoves([]);
    setOMoves([]);
    setTotalMoves(0);
    const firstMoverSym = humanFirst ? humanSymbol : computerSymbol;
    setIsXTurn(firstMoverSym === 'X');
  }

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    setCells(Array(9).fill(null));
    setXMoves([]);
    setOMoves([]);
    setTotalMoves(0);
    setHumanSymbol('X');
    setHumanFirst(true);
    setIsXTurn(true);
  }

  function handleSymbolChange(sym: Player) {
    setHumanSymbol(sym);
    setCells(Array(9).fill(null));
    setXMoves([]);
    setOMoves([]);
    setTotalMoves(0);
    const compSym = sym === 'X' ? 'O' : 'X';
    const firstMoverSym = humanFirst ? sym : compSym;
    setIsXTurn(firstMoverSym === 'X');
  }

  function handleFirstChange(first: boolean) {
    setHumanFirst(first);
    setCells(Array(9).fill(null));
    setXMoves([]);
    setOMoves([]);
    setTotalMoves(0);
    const firstMoverSym = first ? humanSymbol : computerSymbol;
    setIsXTurn(firstMoverSym === 'X');
  }

  function handleDifficultyChange(d: Difficulty) {
    setDifficulty(d);
    setCells(Array(9).fill(null));
    setXMoves([]);
    setOMoves([]);
    setTotalMoves(0);
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
      <div className="rules-selector">
        <span>Rules:</span>
        <div className="seg-group">
          <button
            className={rules === 'classic' ? 'active' : ''}
            onClick={() => handleRulesChange('classic')}
          >
            Classic
          </button>
          <button
            className={rules === 'vanish' ? 'active' : ''}
            onClick={() => handleRulesChange('vanish')}
          >
            Vanish
          </button>
        </div>
      </div>
      {mode === 'pvc' && (
        <>
          <div className="difficulty-selector">
            <span>Difficulty:</span>
            <div className="seg-group">
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
          </div>
          <div className="first-selector">
            <span>First move:</span>
            <div className="seg-group">
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
          </div>
          {humanFirst && (
            <div className="first-selector">
              <span>Play as:</span>
              <div className="seg-group">
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
            </div>
          )}
        </>
      )}
      <Board cells={cells} onCellClick={handleCellClick} fadingIndices={[xFading, oFading].filter(i => i !== -1)} />
      {(winner || isDraw) && (
        <div className="winning-message show">
          <span>{status}</span>
          <button onClick={handleRestart}>Restart</button>
        </div>
      )}
      {!winner && !isDraw && <p className="status">{status}</p>}
      <div className="dos-terminal">
        <div className="dos-titlebar">C:\TICTACTOE\RULES.TXT</div>
        <div className="dos-body">
          {rules === 'classic' ? (
            <>
              <p>&gt; CLASSIC MODE</p>
              <p>─────────────────────────────</p>
              <p>1. Two players take turns</p>
              <p>2. X always goes first</p>
              <p>3. Place your mark on any</p>
              <p>   empty cell</p>
              <p>4. Get 3 in a row (horizontal,</p>
              <p>   vertical, or diagonal) to win</p>
              <p>5. If all 9 cells are filled</p>
              <p>   with no winner, it's a draw</p>
              <p>─────────────────────────────</p>
              <p className="dos-blink">_</p>
            </>
          ) : (
            <>
              <p>&gt; VANISH MODE</p>
              <p>─────────────────────────────</p>
              <p>1. Each player can have only</p>
              <p>   3 marks on the board</p>
              <p>2. When you place a 4th mark,</p>
              <p>   your oldest mark vanishes!</p>
              <p>3. Fading marks show which</p>
              <p>   piece will disappear next</p>
              <p>4. Get 3 in a row to win</p>
              <p>5. The game never fills up -</p>
              <p>   think ahead!</p>
              <p>─────────────────────────────</p>
              <p className="dos-blink">_</p>
            </>
          )}
        </div>
      </div>
      <footer className="author">
        <p>Built by <strong>Rehan Khan</strong></p>
        <p className="author-tags">DevSecOps | MLOps | AI/ML/RL</p>
        <div className="author-links">
          <a href="https://github.com/k2n-rehan" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/rehan-khan-devops/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
