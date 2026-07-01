import { useMemo } from 'react';
import Board from './components/Board';
import { useGameState } from './hooks/useGameState';

function App() {
  const {
    cells,
    xFading,
    oFading,
    winningLine,
    mode,
    rules,
    difficulty,
    humanSymbol,
    humanFirst,
    winner,
    isDraw,
    status,
    handleCellClick,
    handleRestart,
    handleRulesChange,
    handleModeChange,
    handleSymbolChange,
    handleFirstChange,
    handleDifficultyChange,
  } = useGameState();

  const fadingIndices = useMemo(
    () => [xFading, oFading].filter(i => i !== -1),
    [xFading, oFading]
  );

  return (
    <div className="app">
      <h1>Tic Tac Toe</h1>
      <div className="mode-selector" role="group" aria-label="Game mode">
        <button
          className={mode === 'pvc' ? 'active' : ''}
          aria-pressed={mode === 'pvc'}
          onClick={() => handleModeChange('pvc')}
        >
          vs Computer
        </button>
        <button
          className={mode === 'pvp' ? 'active' : ''}
          aria-pressed={mode === 'pvp'}
          onClick={() => handleModeChange('pvp')}
        >
          2 Players
        </button>
      </div>
      <div className="rules-selector">
        <span id="rules-label">Rules:</span>
        <div className="seg-group" role="group" aria-labelledby="rules-label">
          <button
            className={rules === 'classic' ? 'active' : ''}
            aria-pressed={rules === 'classic'}
            onClick={() => handleRulesChange('classic')}
          >
            Classic
          </button>
          <button
            className={rules === 'vanish' ? 'active' : ''}
            aria-pressed={rules === 'vanish'}
            onClick={() => handleRulesChange('vanish')}
          >
            Vanish
          </button>
        </div>
      </div>
      {mode === 'pvc' && (
        <>
          <div className="difficulty-selector">
            <span id="difficulty-label">Difficulty:</span>
            <div className="seg-group" role="group" aria-labelledby="difficulty-label">
              <button
                className={difficulty === 'easy' ? 'active' : ''}
                aria-pressed={difficulty === 'easy'}
                onClick={() => handleDifficultyChange('easy')}
              >
                Easy
              </button>
              <button
                className={difficulty === 'medium' ? 'active' : ''}
                aria-pressed={difficulty === 'medium'}
                onClick={() => handleDifficultyChange('medium')}
              >
                Medium
              </button>
              <button
                className={difficulty === 'hard' ? 'active' : ''}
                aria-pressed={difficulty === 'hard'}
                onClick={() => handleDifficultyChange('hard')}
              >
                Hard
              </button>
            </div>
          </div>
          <div className="first-selector">
            <span id="first-label">First move:</span>
            <div className="seg-group" role="group" aria-labelledby="first-label">
              <button
                className={humanFirst ? 'active' : ''}
                aria-pressed={humanFirst}
                onClick={() => handleFirstChange(true)}
              >
                You
              </button>
              <button
                className={!humanFirst ? 'active' : ''}
                aria-pressed={!humanFirst}
                onClick={() => handleFirstChange(false)}
              >
                Computer
              </button>
            </div>
          </div>
          {humanFirst && (
            <div className="first-selector">
              <span id="symbol-label">Play as:</span>
              <div className="seg-group" role="group" aria-labelledby="symbol-label">
                <button
                  className={humanSymbol === 'X' ? 'active' : ''}
                  aria-pressed={humanSymbol === 'X'}
                  onClick={() => handleSymbolChange('X')}
                >
                  X
                </button>
                <button
                  className={humanSymbol === 'O' ? 'active' : ''}
                  aria-pressed={humanSymbol === 'O'}
                  onClick={() => handleSymbolChange('O')}
                >
                  O
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <Board cells={cells} onCellClick={handleCellClick} fadingIndices={fadingIndices} winningIndices={winningLine} />
      <div aria-live="polite" aria-atomic="true">
        {(winner || isDraw) && (
          <div className="winning-message show">
            <span>{status}</span>
            <button onClick={handleRestart}>Restart</button>
          </div>
        )}
        {!winner && !isDraw && <p className="status">{status}</p>}
      </div>
      <div className="dos-terminal">
        <div className="dos-titlebar">C:\TICTACTOE\RULES.TXT</div>
        <div className="dos-body">
          {rules === 'classic' ? (
            <>
              <p>&gt; CLASSIC MODE</p>
              <p>─────────────────────────────</p>
              <p>1. Two players take turns</p>
              <p>2. X always goes first</p>
              <p>3. Place your mark on any</p>
              <p>   empty cell</p>
              <p>4. Get 3 in a row (horizontal,</p>
              <p>   vertical, or diagonal) to win</p>
              <p>5. If all 9 cells are filled</p>
              <p>   with no winner, it's a draw</p>
              <p>─────────────────────────────</p>
              <p className="dos-blink">_</p>
            </>
          ) : (
            <>
              <p>&gt; VANISH MODE</p>
              <p>─────────────────────────────</p>
              <p>1. Each player can have only</p>
              <p>   3 marks on the board</p>
              <p>2. When you place a 4th mark,</p>
              <p>   your oldest mark vanishes!</p>
              <p>3. Fading marks show which</p>
              <p>   piece will disappear next</p>
              <p>4. Get 3 in a row to win</p>
              <p>5. The game never fills up -</p>
              <p>   think ahead!</p>
              <p>─────────────────────────────</p>
              <p className="dos-blink">_</p>
            </>
          )}
        </div>
      </div>
      <footer className="author">
        <p>Built by <strong>Rehan Khan</strong></p>
        <p className="author-tags">DevSecOps | MLOps | AI/ML/RL</p>
        <div className="author-links">
          <a href="https://github.com/k2n-rehan" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/rehan-khan-devops/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
