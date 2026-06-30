import Cell from './Cell';

type Player = 'X' | 'O';

interface BoardProps {
  cells: (Player | null)[];
  onCellClick: (index: number) => void;
  fadingIndices: number[];
}

function Board({ cells, onCellClick, fadingIndices }: BoardProps) {
  return (
    <div className="board">
      {cells.map((value, index) => (
        <Cell key={index} value={value} onClick={() => onCellClick(index)} fading={fadingIndices.includes(index)} />
      ))}
    </div>
  );
}

export default Board;
