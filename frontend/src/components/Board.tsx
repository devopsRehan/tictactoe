import Cell from './Cell';

type Player = 'X' | 'O';

interface BoardProps {
  cells: (Player | null)[];
  onCellClick: (index: number) => void;
}

function Board({ cells, onCellClick }: BoardProps) {
  return (
    <div className="board">
      {cells.map((value, index) => (
        <Cell key={index} value={value} onClick={() => onCellClick(index)} />
      ))}
    </div>
  );
}

export default Board;
