import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App Integration', () => {
  it('renders the board with 9 empty cells', () => {
    render(<App />);
    const cells = screen.getAllByRole('button', { name: /Row \d, Column \d/ });
    expect(cells).toHaveLength(9);
  });

  it('places X on first click in PvP mode', () => {
    render(<App />);
    // Switch to PvP to avoid AI interference
    fireEvent.click(screen.getByText('2 Players'));
    const cells = screen.getAllByRole('button', { name: /Row \d, Column \d/ });
    fireEvent.click(cells[0]);
    expect(cells[0]).toHaveTextContent('X');
  });

  it('alternates X and O in PvP mode', () => {
    render(<App />);
    fireEvent.click(screen.getByText('2 Players'));
    const cells = screen.getAllByRole('button', { name: /Row \d, Column \d/ });
    fireEvent.click(cells[0]);
    fireEvent.click(cells[1]);
    expect(cells[0]).toHaveTextContent('X');
    expect(cells[1]).toHaveTextContent('O');
  });

  it('prevents clicking on occupied cell', () => {
    render(<App />);
    fireEvent.click(screen.getByText('2 Players'));
    const cells = screen.getAllByRole('button', { name: /Row \d, Column \d/ });
    fireEvent.click(cells[0]);
    fireEvent.click(cells[0]); // Click same cell again
    expect(cells[0]).toHaveTextContent('X'); // Still X, not O
  });

  it('detects a winner and shows restart button', () => {
    render(<App />);
    fireEvent.click(screen.getByText('2 Players'));
    const cells = screen.getAllByRole('button', { name: /Row \d, Column \d/ });
    // X wins with top row: cells 0, 1, 2
    fireEvent.click(cells[0]); // X
    fireEvent.click(cells[3]); // O
    fireEvent.click(cells[1]); // X
    fireEvent.click(cells[4]); // O
    fireEvent.click(cells[2]); // X wins
    expect(screen.getByText('X Wins!')).toBeInTheDocument();
    expect(screen.getByText('Restart')).toBeInTheDocument();
  });

  it('restarts game when restart button clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByText('2 Players'));
    const cells = screen.getAllByRole('button', { name: /Row \d, Column \d/ });
    // Play to a win
    fireEvent.click(cells[0]);
    fireEvent.click(cells[3]);
    fireEvent.click(cells[1]);
    fireEvent.click(cells[4]);
    fireEvent.click(cells[2]); // X wins
    fireEvent.click(screen.getByText('Restart'));
    // Board should be empty again
    const freshCells = screen.getAllByRole('button', { name: /Row \d, Column \d/ });
    freshCells.forEach(cell => {
      expect(cell).toHaveTextContent('');
    });
  });

  it('detects draw in classic PvP', () => {
    render(<App />);
    fireEvent.click(screen.getByText('2 Players'));
    const cells = screen.getAllByRole('button', { name: /Row \d, Column \d/ });
    // Play a draw: X O X / X X O / O X O
    fireEvent.click(cells[0]); // X
    fireEvent.click(cells[1]); // O
    fireEvent.click(cells[2]); // X
    fireEvent.click(cells[5]); // O
    fireEvent.click(cells[3]); // X
    fireEvent.click(cells[6]); // O
    fireEvent.click(cells[4]); // X
    fireEvent.click(cells[8]); // O
    fireEvent.click(cells[7]); // X - board full, draw? Let's check
    // Board: X O X / X X O / O X O - no winner = draw
    expect(screen.getByText('Draw!')).toBeInTheDocument();
  });

  it('switches rules to Vanish mode', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Vanish'));
    expect(screen.getByText('Vanish')).toHaveAttribute('aria-pressed', 'true');
    // DOS terminal should show vanish rules
    expect(screen.getByText(/VANISH MODE/)).toBeInTheDocument();
  });

  it('has accessible aria-live region', () => {
    render(<App />);
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });
});
