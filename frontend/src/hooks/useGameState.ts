import { useCallback, useEffect, useRef, useState } from 'react';
import { Player, Difficulty, MAX_MARKS, calculateWinner, isBoardFull, placeWithVanish } from '../ai/types';
import { getClassicMove } from '../ai/alphaBeta';
import type { MCTSWorkerRequest, MCTSWorkerResponse } from '../ai/mcts.worker';

type Mode = 'pvp' | 'pvc';
type Rules = 'classic' | 'vanish';

const MAX_TOTAL_MOVES = 50;

export type { Mode, Rules };
export { MAX_MARKS };

export function useGameState() {
  const [cells, setCells] = useState<(Player | null)[]>(Array(9).fill(null));
  const [xMoves, setXMoves] = useState<number[]>([]);
  const [oMoves, setOMoves] = useState<number[]>([]);
  const [isXTurn, setIsXTurn] = useState(true);
  const [mode, setMode] = useState<Mode>('pvc');
  const [rules, setRules] = useState<Rules>('classic');
  const [humanSymbol, setHumanSymbol] = useState<Player>('X');
  const [humanFirst, setHumanFirst] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [totalMoves, setTotalMoves] = useState(0);

  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker for MCTS
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../ai/mcts.worker.ts', import.meta.url),
      { type: 'module' }
    );
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const computerSymbol: Player = humanSymbol === 'X' ? 'O' : 'X';
  const isComputerTurn = isXTurn ? computerSymbol === 'X' : computerSymbol === 'O';

  const winner = calculateWinner(cells);
  const isDraw = !winner && (rules === 'classic' ? isBoardFull(cells) : totalMoves >= MAX_TOTAL_MOVES);

  const xFading = rules === 'vanish' && xMoves.length >= MAX_MARKS ? xMoves[0] : -1;
  const oFading = rules === 'vanish' && oMoves.length >= MAX_MARKS ? oMoves[0] : -1;

  const resetBoard = useCallback((firstPlayer?: Player) => {
    setCells(Array(9).fill(null));
    setXMoves([]);
    setOMoves([]);
    setTotalMoves(0);
    if (firstPlayer !== undefined) {
      setIsXTurn(firstPlayer === 'X');
    }
  }, []);

  const makeAiMove = useCallback((currentCells: (Player | null)[], curXMoves: number[], curOMoves: number[]) => {
    if (rules === 'vanish') {
      // MCTS via Web Worker (non-blocking)
      const worker = workerRef.current;
      if (!worker) return;

      const request: MCTSWorkerRequest = {
        cells: [...currentCells],
        computerSym: computerSymbol,
        xMoves: curXMoves,
        oMoves: curOMoves,
        isXTurn: computerSymbol === 'X',
        difficulty,
      };

      worker.onmessage = (e: MessageEvent<MCTSWorkerResponse>) => {
        const { move } = e.data;
        if (move !== -1 && move !== undefined) {
          const { newCells, newXMoves, newOMoves } = placeWithVanish(currentCells, move, computerSymbol, curXMoves, curOMoves);
          setCells(newCells);
          setXMoves(newXMoves);
          setOMoves(newOMoves);
          setIsXTurn(computerSymbol !== 'X');
          setTotalMoves((m) => m + 1);
        }
      };

      worker.postMessage(request);
    } else {
      // Alpha-Beta for classic mode (fast enough for main thread)
      const move = getClassicMove([...currentCells], computerSymbol, difficulty);
      if (move !== -1 && move !== undefined) {
        const newCells = [...currentCells];
        newCells[move] = computerSymbol;
        setCells(newCells);
        setIsXTurn(computerSymbol !== 'X');
      }
    }
  }, [computerSymbol, difficulty, rules]);

  useEffect(() => {
    if (mode === 'pvc' && isComputerTurn && !winner && !isDraw) {
      const timeout = setTimeout(() => makeAiMove(cells, xMoves, oMoves), 300);
      return () => clearTimeout(timeout);
    }
  }, [cells, xMoves, oMoves, winner, isDraw, mode, makeAiMove, isComputerTurn]);

  function handleCellClick(index: number) {
    if (cells[index] || winner || isDraw) return;
    if (mode === 'pvc' && isComputerTurn) return;

    const currentPlayer: Player = isXTurn ? 'X' : 'O';
    if (rules === 'vanish') {
      const { newCells, newXMoves, newOMoves } = placeWithVanish(cells, index, currentPlayer, xMoves, oMoves);
      setCells(newCells);
      setXMoves(newXMoves);
      setOMoves(newOMoves);
      setIsXTurn(!isXTurn);
      setTotalMoves((m) => m + 1);
    } else {
      const newCells = [...cells];
      newCells[index] = currentPlayer;
      setCells(newCells);
      setIsXTurn(!isXTurn);
    }
  }

  function handleRestart() {
    const firstMoverSym = humanFirst ? humanSymbol : computerSymbol;
    resetBoard(firstMoverSym);
  }

  function handleRulesChange(r: Rules) {
    setRules(r);
    const firstMoverSym = humanFirst ? humanSymbol : computerSymbol;
    resetBoard(firstMoverSym);
  }

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    setHumanSymbol('X');
    setHumanFirst(true);
    resetBoard('X');
  }

  function handleSymbolChange(sym: Player) {
    setHumanSymbol(sym);
    const compSym = sym === 'X' ? 'O' : 'X';
    const firstMoverSym = humanFirst ? sym : compSym;
    resetBoard(firstMoverSym);
  }

  function handleFirstChange(first: boolean) {
    setHumanFirst(first);
    const firstMoverSym = first ? humanSymbol : computerSymbol;
    resetBoard(firstMoverSym);
  }

  function handleDifficultyChange(d: Difficulty) {
    setDifficulty(d);
    const firstMoverSym = humanFirst ? humanSymbol : computerSymbol;
    resetBoard(firstMoverSym);
  }

  let status: string;
  if (winner) {
    status = mode === 'pvc'
      ? (winner === computerSymbol ? 'Computer Wins!' : 'You Win!')
      : `${winner} Wins!`;
  } else if (isDraw) {
    status = 'Draw!';
  } else {
    status = mode === 'pvc'
      ? (isComputerTurn ? 'Computer thinking...' : `Your turn (${humanSymbol})`)
      : `Next turn: ${isXTurn ? 'X' : 'O'}`;
  }

  return {
    cells,
    xFading,
    oFading,
    mode,
    rules,
    difficulty,
    humanSymbol,
    humanFirst,
    winner,
    isDraw,
    status,
    isComputerTurn,
    handleCellClick,
    handleRestart,
    handleRulesChange,
    handleModeChange,
    handleSymbolChange,
    handleFirstChange,
    handleDifficultyChange,
  };
}
