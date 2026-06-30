type Player = 'X' | 'O';

interface CellProps {
  value: Player | null;
  onClick: () => void;
}

function Cell({ value, onClick }: CellProps) {
  const className = `cell${value ? ` ${value.toLowerCase()}` : ''}`;

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
}

export default Cell;
