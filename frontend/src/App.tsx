import { useState } from 'react';
import Board from './components/Board';

type Player = 'X' | 'O';

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

function App() {
  const [cells, setCells] = useState<(Player | null)[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);

  const winner = calculateWinner(cells);
  const isDraw = !winner && cells.every((cell) => cell !== null);

  function handleCellClick(index: number) {
    if (cells[index] || winner) return;

    const newCells = [...cells];
    newCells[index] = isXTurn ? 'X' : 'O';
    setCells(newCells);
    setIsXTurn(!isXTurn);
  }

  function handleRestart() {
    setCells(Array(9).fill(null));
    setIsXTurn(true);
  }

  let status: string;
  if (winner) {
    status = `${winner} Wins!`;
  } else if (isDraw) {
    status = 'Draw!';
  } else {
    status = `Next turn: ${isXTurn ? 'X' : 'O'}`;
  }

  return (
    <div className="app">
      <h1>Tic Tac Toe</h1>
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
