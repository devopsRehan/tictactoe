import Cell from './Cell';

interface BoardProps {
  cells: (string | null)[];
  onCellClick: (index: number) => void;
  currentPlayer: 'X' | 'O';
}

function Board({ cells, onCellClick, currentPlayer }: BoardProps) {
  return (
    <div className={`board ${currentPlayer.toLowerCase()}`}>
      {cells.map((value, index) => (
        <Cell key={index} value={value} onClick={() => onCellClick(index)} />
      ))}
    </div>
  );
}

export default Board;
