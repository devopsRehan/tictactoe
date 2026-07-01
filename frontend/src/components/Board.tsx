import { memo } from 'react';
import Cell from './Cell';
import type { Player } from '../ai/types';

interface BoardProps {
  cells: (Player | null)[];
  onCellClick: (index: number) => void;
  fadingIndices: number[];
}

const Board = memo(function Board({ cells, onCellClick, fadingIndices }: BoardProps) {
  return (
    <div className="board" role="grid" aria-label="Tic Tac Toe board">
      {cells.map((value, index) => (
        <Cell key={index} value={value} onClick={() => onCellClick(index)} fading={fadingIndices.includes(index)} />
      ))}
    </div>
  );
});

export default Board;
