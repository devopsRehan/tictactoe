import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Player, Difficulty, MAX_MARKS, calculateWinner, getWinningLine, isBoardFull, placeWithVanish } from '../ai/types';
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
  const pendingMoveRef = useRef<{
    cells: (Player | null)[];
    computerSymbol: Player;
    xMoves: number[];
    oMoves: number[];
  } | null>(null);

  // Ref to hold latest game state for stable handleCellClick
  const stateRef = useRef({
    cells, xMoves, oMoves, isXTurn, mode, rules,
    winner: null as Player | null,
    isDraw: false,
    isComputerTurn: false,
  });

  const computerSymbol: Player = humanSymbol === 'X' ? 'O' : 'X';
  const isComputerTurn = isXTurn ? computerSymbol === 'X' : computerSymbol === 'O';

  const winner = useMemo(() => calculateWinner(cells), [cells]);
  const winningLine = useMemo(() => winner ? getWinningLine(cells) : null, [winner, cells]);
  const isDraw = useMemo(
    () => !winner && (rules === 'classic' ? isBoardFull(cells) : totalMoves >= MAX_TOTAL_MOVES),
    [winner, rules, cells, totalMoves]
  );

  const xFading = rules === 'vanish' && xMoves.length >= MAX_MARKS ? xMoves[0] : -1;
  const oFading = rules === 'vanish' && oMoves.length >= MAX_MARKS ? oMoves[0] : -1;

  // Keep stateRef in sync for stable callbacks
  stateRef.current = { cells, xMoves, oMoves, isXTurn, mode, rules, winner, isDraw, isComputerTurn };

  // Initialize Web Worker for MCTS with stable onmessage handler
  useEffect(() => {
    const worker = new Worker(
      new URL('../ai/mcts.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e: MessageEvent<MCTSWorkerResponse>) => {
      const { move } = e.data;
      const pending = pendingMoveRef.current;
      if (move !== -1 && move !== undefined && pending) {
        const { newCells, newXMoves, newOMoves } = placeWithVanish(
          pending.cells, move, pending.computerSymbol,
          pending.xMoves, pending.oMoves
        );
        setCells(newCells);
        setXMoves(newXMoves);
        setOMoves(newOMoves);
        setIsXTurn(pending.computerSymbol !== 'X');
        setTotalMoves((m) => m + 1);
      }
      pendingMoveRef.current = null;
    };

    worker.onerror = () => {
      // If worker crashes, clear pending so UI doesn't hang on "Computer thinking..."
      pendingMoveRef.current = null;
    };

    workerRef.current = worker;
    return () => {
      worker.terminate();
    };
  }, []);

  const resetBoard = useCallback((firstPlayer?: Player) => {
    pendingMoveRef.current = null; // Cancel any in-flight worker response
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

      pendingMoveRef.current = { cells: currentCells, computerSymbol, xMoves: curXMoves, oMoves: curOMoves };

      const request: MCTSWorkerRequest = {
        cells: [...currentCells],
        computerSym: computerSymbol,
        xMoves: curXMoves,
        oMoves: curOMoves,
        isXTurn: computerSymbol === 'X',
        difficulty,
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

  const handleCellClick = useCallback((index: number) => {
    const { cells: curCells, winner: w, isDraw: d, mode: m, isComputerTurn: ct, isXTurn: xt, rules: r, xMoves: xm, oMoves: om } = stateRef.current;
    if (curCells[index] || w || d) return;
    if (m === 'pvc' && ct) return;

    const currentPlayer: Player = xt ? 'X' : 'O';
    if (r === 'vanish') {
      const { newCells, newXMoves, newOMoves } = placeWithVanish(curCells, index, currentPlayer, xm, om);
      setCells(newCells);
      setXMoves(newXMoves);
      setOMoves(newOMoves);
      setIsXTurn(!xt);
      setTotalMoves((n) => n + 1);
    } else {
      const newCells = [...curCells];
      newCells[index] = currentPlayer;
      setCells(newCells);
      setIsXTurn(!xt);
    }
  }, []);

  const handleRestart = useCallback(() => {
    const firstMoverSym = humanFirst ? humanSymbol : computerSymbol;
    resetBoard(firstMoverSym);
  }, [humanFirst, humanSymbol, computerSymbol, resetBoard]);

  const handleRulesChange = useCallback((r: Rules) => {
    setRules(r);
    const firstMoverSym = humanFirst ? humanSymbol : computerSymbol;
    resetBoard(firstMoverSym);
  }, [humanFirst, humanSymbol, computerSymbol, resetBoard]);

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    setHumanSymbol('X');
    setHumanFirst(true);
    resetBoard('X');
  }, [resetBoard]);

  const handleSymbolChange = useCallback((sym: Player) => {
    setHumanSymbol(sym);
    const compSym = sym === 'X' ? 'O' : 'X';
    const firstMoverSym = humanFirst ? sym : compSym;
    resetBoard(firstMoverSym);
  }, [humanFirst, resetBoard]);

  const handleFirstChange = useCallback((first: boolean) => {
    setHumanFirst(first);
    const firstMoverSym = first ? humanSymbol : computerSymbol;
    resetBoard(firstMoverSym);
  }, [humanSymbol, computerSymbol, resetBoard]);

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    setDifficulty(d);
    const firstMoverSym = humanFirst ? humanSymbol : computerSymbol;
    resetBoard(firstMoverSym);
  }, [humanFirst, humanSymbol, computerSymbol, resetBoard]);

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
    winningLine,
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
