import { memo, useMemo } from 'react';
import Cell from './Cell';
import type { Player } from '../ai/types';

interface BoardProps {
  cells: (Player | null)[];
  onCellClick: (index: number) => void;
  fadingIndices: number[];
  winningIndices: number[] | null;
}

const Board = memo(function Board({ cells, onCellClick, fadingIndices, winningIndices }: BoardProps) {
  const fadingSet = useMemo(() => new Set(fadingIndices), [fadingIndices]);
  const winningSet = useMemo(() => new Set(winningIndices), [winningIndices]);

  return (
    <div className="board" role="grid" aria-label="Tic Tac Toe board">
      {cells.map((value, index) => (
        <Cell
          key={index}
          index={index}
          value={value}
          onClick={onCellClick}
          fading={fadingSet.has(index)}
          winning={winningSet.has(index)}
        />
      ))}
    </div>
  );
});

export default Board;
