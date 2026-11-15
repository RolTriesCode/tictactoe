import type {
  BoardState,
  GameState,
  MoveResult,
  Player,
  WinEvaluation,
  WinningLine,
} from "./types";

/**
 * Canonical 3x3 winning line index triples (rows, columns, diagonals).
 */
export const WINNING_COMBINATIONS: readonly WinningLine[] = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Center column
  [2, 5, 8], // Right column
  [0, 4, 8], // Main diagonal
  [2, 4, 6], // Anti-diagonal
] as const;

export const INITIAL_BOARD: BoardState = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
] as const;

/**
 * Creates a fresh Tic-Tac-Toe state with Player X (Blue) moving first.
 */
export function createInitialGameState(roundNumber = 1): GameState {
  return {
    board: [...INITIAL_BOARD],
    currentPlayer: "X",
    status: "playing",
    winner: null,
    winningLine: null,
    moveCount: 0,
    roundNumber,
    lastMoveIndex: null,
  };
}

/**
 * Resets the board for the next consecutive round while preserving round progression.
 */
export function createNextRoundState(previousState: GameState): GameState {
  return createInitialGameState(previousState.roundNumber + 1);
}

/**
 * Evaluates all eight winning combinations and returns the winner + line if present.
 */
export function checkWinner(board: BoardState): WinEvaluation | null {
  for (const line of WINNING_COMBINATIONS) {
    const [a, b, c] = line;
    const candidate = board[a];
    if (candidate !== null && candidate === board[b] && candidate === board[c]) {
      return {
        winner: candidate,
        line,
      };
    }
  }
  return null;
}

/**
 * Returns true when every cell on the board is occupied.
 */
export function isBoardFull(board: BoardState): boolean {
  return board.every((cell) => cell !== null);
}

/**
 * Checks whether a move at `index` is valid in the current game state.
 */
export function canMakeMove(state: GameState, index: number): boolean {
  if (state.status !== "playing") {
    return false;
  }
  if (!Number.isInteger(index) || index < 0 || index >= state.board.length) {
    return false;
  }
  return state.board[index] === null;
}

/**
 * Returns the opposing player.
 */
export function getNextPlayer(player: Player): Player {
  return player === "X" ? "O" : "X";
}

/**
 * Purely applies a move and evaluates win before draw so 9th-move wins resolve accurately.
 */
export function makeMove(state: GameState, index: number): MoveResult {
  if (!canMakeMove(state, index)) {
    return {
      applied: false,
      state,
      placedPlayer: null,
      placedIndex: null,
    };
  }

  const placedPlayer = state.currentPlayer;
  const nextBoard = [...state.board];
  nextBoard[index] = placedPlayer;

  const moveCount = state.moveCount + 1;
  const win = checkWinner(nextBoard);

  if (win !== null) {
    return {
      applied: true,
      placedPlayer,
      placedIndex: index,
      state: {
        board: nextBoard,
        currentPlayer: placedPlayer,
        status: "won",
        winner: win.winner,
        winningLine: win.line,
        moveCount,
        roundNumber: state.roundNumber,
        lastMoveIndex: index,
      },
    };
  }

  if (isBoardFull(nextBoard)) {
    return {
      applied: true,
      placedPlayer,
      placedIndex: index,
      state: {
        board: nextBoard,
        currentPlayer: placedPlayer,
        status: "draw",
        winner: null,
        winningLine: null,
        moveCount,
        roundNumber: state.roundNumber,
        lastMoveIndex: index,
      },
    };
  }

  return {
    applied: true,
    placedPlayer,
    placedIndex: index,
    state: {
      board: nextBoard,
      currentPlayer: getNextPlayer(placedPlayer),
      status: "playing",
      winner: null,
      winningLine: null,
      moveCount,
      roundNumber: state.roundNumber,
      lastMoveIndex: index,
    },
  };
}

/**
 * Returns the display status string matching product design specifications.
 */
export function getStatusLabel(state: GameState): string {
  if (state.status === "won") {
    return state.winner === "X" ? "BLUE WINS!" : "RED WINS!";
  }
  if (state.status === "draw") {
    return "IT'S A DRAW!";
  }
  return state.currentPlayer === "X" ? "BLUE'S TURN" : "RED'S TURN";
}

/**
 * Returns the exact spoken announcement text matching product specifications.
 */
export function getSpeechText(state: GameState): string {
  if (state.status === "won") {
    return state.winner === "X" ? "Blue wins!" : "Red wins!";
  }
  if (state.status === "draw") {
    return "It's a draw!";
  }
  return state.currentPlayer === "X" ? "Blue's turn!" : "Red's turn!";
}

/**
 * Returns a human-readable, screen-reader-friendly coordinate and occupancy label for a cell.
 */
export function getCellAriaLabel(
  index: number,
  value: BoardState[number],
  isGameOver: boolean,
  isWinningCell: boolean
): string {
  const row = Math.floor(index / 3) + 1;
  const col = (index % 3) + 1;
  const position = `Row ${row}, Column ${col}`;

  if (value === "X") {
    return isWinningCell
      ? `${position}: Blue X, winning cell`
      : `${position}: Blue X`;
  }
  if (value === "O") {
    return isWinningCell
      ? `${position}: Red O, winning cell`
      : `${position}: Red O`;
  }
  return isGameOver
    ? `${position}: Empty, game over`
    : `${position}: Empty`;
}
