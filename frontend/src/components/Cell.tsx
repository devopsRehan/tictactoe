import { memo, useCallback } from 'react';
import type { Player } from '../ai/types';

interface CellProps {
  index: number;
  value: Player | null;
  onClick: (index: number) => void;
  fading: boolean;
  winning: boolean;
}

const Cell = memo(function Cell({ index, value, onClick, fading, winning }: CellProps) {
  const className = `cell${value ? ` ${value.toLowerCase()}` : ''}${fading ? ' fading' : ''}${winning ? ' winning' : ''}`;

  const handleClick = useCallback(() => onClick(index), [onClick, index]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <div
      className={className}
      role="button"
      tabIndex={0}
      aria-label={value ? `Cell ${value}` : 'Empty cell'}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {value}
    </div>
  );
});

export default Cell;
