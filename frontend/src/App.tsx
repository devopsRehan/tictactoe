import { useCallback, useEffect, useState } from 'react';
import Board from './components/Board';

type Player = 'X' | 'O';
type Mode = 'pvp' | 'pvc';

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

function minimax(cells: (Player | null)[], isMaximizing: boolean): number {
  const winner = calculateWinner(cells);
  if (winner === 'O') return 10;
  if (winner === 'X') return -10;
  if (isBoardFull(cells)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!cells[i]) {
        cells[i] = 'O';
        best = Math.max(best, minimax(cells, false));
        cells[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!cells[i]) {
        cells[i] = 'X';
        best = Math.min(best, minimax(cells, true));
        cells[i] = null;
      }
    }
    return best;
  }
}

function getBestMove(cells: (Player | null)[]): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (!cells[i]) {
      cells[i] = 'O';
      const score = minimax(cells, false);
      cells[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function App() {
  const [cells, setCells] = useState<(Player | null)[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [mode, setMode] = useState<Mode>('pvc');

  const winner = calculateWinner(cells);
  const isDraw = !winner && isBoardFull(cells);

  const makeAiMove = useCallback((currentCells: (Player | null)[]) => {
    const move = getBestMove([...currentCells]);
    if (move !== -1) {
      const newCells = [...currentCells];
      newCells[move] = 'O';
      setCells(newCells);
      setIsXTurn(true);
    }
  }, []);

  useEffect(() => {
    if (mode === 'pvc' && !isXTurn && !winner && !isDraw) {
      const timeout = setTimeout(() => makeAiMove(cells), 300);
      return () => clearTimeout(timeout);
    }
  }, [isXTurn, cells, winner, isDraw, mode, makeAiMove]);

  function handleCellClick(index: number) {
    if (cells[index] || winner) return;
    if (mode === 'pvc' && !isXTurn) return;

    const newCells = [...cells];
    newCells[index] = isXTurn ? 'X' : 'O';
    setCells(newCells);
    setIsXTurn(!isXTurn);
  }

  function handleRestart() {
    setCells(Array(9).fill(null));
    setIsXTurn(true);
  }

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    setCells(Array(9).fill(null));
    setIsXTurn(true);
  }

  let status: string;
  if (winner) {
    status = mode === 'pvc'
      ? (winner === 'X' ? 'You Win!' : 'Computer Wins!')
      : `${winner} Wins!`;
  } else if (isDraw) {
    status = 'Draw!';
  } else {
    status = mode === 'pvc'
      ? (isXTurn ? 'Your turn' : 'Computer thinking...')
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
      <Board cells={cells} onCellClick={handleCellClick} currentPlayer={isXTurn ? 'X' : 'O'} />
      {(winner || isDraw) && (
        <div className="winning-message show">
          <span>{status}</span>
          <button onClick={handleRestart}>Restart</button>
        </div>
      )}
      {!winner && !isDraw && <p className="status">{status}</p>}
    </div>
  );
}

export default App;
