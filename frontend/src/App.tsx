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

function minimax(cells: (Player | null)[], isMaximizing: boolean, computerSym: Player): number {
  const humanSym: Player = computerSym === 'O' ? 'X' : 'O';
  const winner = calculateWinner(cells);
  if (winner === computerSym) return 10;
  if (winner === humanSym) return -10;
  if (isBoardFull(cells)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!cells[i]) {
        cells[i] = computerSym;
        best = Math.max(best, minimax(cells, false, computerSym));
        cells[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!cells[i]) {
        cells[i] = humanSym;
        best = Math.min(best, minimax(cells, true, computerSym));
        cells[i] = null;
      }
    }
    return best;
  }
}

function getBestMove(cells: (Player | null)[], computerSym: Player): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (!cells[i]) {
      cells[i] = computerSym;
      const score = minimax(cells, false, computerSym);
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
  const [humanFirst, setHumanFirst] = useState(true);

  const humanSymbol: Player = humanFirst ? 'X' : 'O';
  const computerSymbol: Player = humanFirst ? 'O' : 'X';
  const isComputerTurn = humanFirst ? !isXTurn : isXTurn;

  const winner = calculateWinner(cells);
  const isDraw = !winner && isBoardFull(cells);

  const makeAiMove = useCallback((currentCells: (Player | null)[]) => {
    const move = getBestMove([...currentCells], computerSymbol);
    if (move !== -1) {
      const newCells = [...currentCells];
      newCells[move] = computerSymbol;
      setCells(newCells);
      setIsXTurn(computerSymbol === 'O');
    }
  }, [computerSymbol]);

  useEffect(() => {
    if (mode === 'pvc' && isComputerTurn && !winner && !isDraw) {
      const timeout = setTimeout(() => makeAiMove(cells), 300);
      return () => clearTimeout(timeout);
    }
  }, [isXTurn, cells, winner, isDraw, mode, makeAiMove, isComputerTurn]);

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
    setIsXTurn(true);
  }

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    setCells(Array(9).fill(null));
    setIsXTurn(true);
    setHumanFirst(true);
  }

  function handleFirstChange(first: boolean) {
    setHumanFirst(first);
    setCells(Array(9).fill(null));
    setIsXTurn(true);
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
        <div className="first-selector">
          <span>First move:</span>
          <button
            className={humanFirst ? 'active' : ''}
            onClick={() => handleFirstChange(true)}
          >
            You (X)
          </button>
          <button
            className={!humanFirst ? 'active' : ''}
            onClick={() => handleFirstChange(false)}
          >
            Computer (X)
          </button>
        </div>
      )}
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
