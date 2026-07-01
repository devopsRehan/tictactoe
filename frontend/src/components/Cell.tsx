import { memo } from 'react';
import type { Player } from '../ai/types';

interface CellProps {
  value: Player | null;
  onClick: () => void;
  fading: boolean;
}

const Cell = memo(function Cell({ value, onClick, fading }: CellProps) {
  const className = `cell${value ? ` ${value.toLowerCase()}` : ''}${fading ? ' fading' : ''}`;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <div
      className={className}
      role="button"
      tabIndex={0}
      aria-label={value ? `Cell ${value}` : 'Empty cell'}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {value}
    </div>
  );
});

export default Cell;
