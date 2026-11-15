export type Player = "X" | "O";

export type CellValue = Player | null;

export type BoardState = readonly CellValue[];

export type WinningLine = readonly [number, number, number];

export type GameOutcomeStatus = "playing" | "won" | "draw";

export interface WinEvaluation {
  readonly winner: Player;
  readonly line: WinningLine;
}

export interface GameState {
  readonly board: BoardState;
  readonly currentPlayer: Player;
  readonly status: GameOutcomeStatus;
  readonly winner: Player | null;
  readonly winningLine: WinningLine | null;
  readonly moveCount: number;
  readonly roundNumber: number;
  readonly lastMoveIndex: number | null;
}

export interface MoveResult {
  readonly applied: boolean;
  readonly state: GameState;
  readonly placedPlayer: Player | null;
  readonly placedIndex: number | null;
}

export interface ScoreBoardData {
  readonly xWins: number;
  readonly oWins: number;
  readonly draws: number;
}

export interface AudioPreferences {
  readonly soundEnabled: boolean;
  readonly voiceEnabled: boolean;
}
