import Cell from './Cell';

type Player = 'X' | 'O';

interface BoardProps {
  cells: (Player | null)[];
  onCellClick: (index: number) => void;
  fadingIndex: number;
}

function Board({ cells, onCellClick, fadingIndex }: BoardProps) {
  return (
    <div className="board">
      {cells.map((value, index) => (
        <Cell key={index} value={value} onClick={() => onCellClick(index)} fading={index === fadingIndex} />
      ))}
    </div>
  );
}

export default Board;
