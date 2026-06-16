interface CellProps {
  value: string | null;
  onClick: () => void;
}

function Cell({ value, onClick }: CellProps) {
  const className = `cell${value ? ` ${value.toLowerCase()}` : ''}`;

  return (
    <div className={className} onClick={onClick}>
      {value}
    </div>
  );
}

export default Cell;
