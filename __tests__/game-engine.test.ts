import { describe, expect, it } from "vitest";
import {
  WINNING_COMBINATIONS,
  createInitialGameState,
  createNextRoundState,
  checkWinner,
  makeMove,
  getStatusLabel,
  getSpeechText,
} from "@/lib/game/engine";

describe("Tic-Tac-Toe pure game engine", () => {
  it("initializes an empty 9-cell board with Player X (Blue) starting", () => {
    const state = createInitialGameState();
    expect(state.board).toHaveLength(9);
    expect(state.board.every((cell) => cell === null)).toBe(true);
    expect(state.currentPlayer).toBe("X");
    expect(state.status).toBe("playing");
    expect(state.winner).toBeNull();
    expect(state.winningLine).toBeNull();
    expect(state.moveCount).toBe(0);
    expect(state.roundNumber).toBe(1);
  });

  it("alternates turns between X and O on valid moves", () => {
    let state = createInitialGameState();
    const first = makeMove(state, 0);
    expect(first.applied).toBe(true);
    expect(first.placedPlayer).toBe("X");
    expect(first.state.board[0]).toBe("X");
    expect(first.state.currentPlayer).toBe("O");
    expect(first.state.moveCount).toBe(1);

    state = first.state;
    const second = makeMove(state, 4);
    expect(second.applied).toBe(true);
    expect(second.placedPlayer).toBe("O");
    expect(second.state.board[4]).toBe("O");
    expect(second.state.currentPlayer).toBe("X");
    expect(second.state.moveCount).toBe(2);
  });

  it("prevents selecting an already occupied cell", () => {
    const first = makeMove(createInitialGameState(), 2);
    const duplicate = makeMove(first.state, 2);

    expect(duplicate.applied).toBe(false);
    expect(duplicate.placedPlayer).toBeNull();
    expect(duplicate.state).toBe(first.state);
    expect(duplicate.state.currentPlayer).toBe("O");
    expect(duplicate.state.moveCount).toBe(1);
  });

  it("ignores out-of-bounds or non-integer cell indices safely", () => {
    const initial = createInitialGameState();
    for (const invalid of [-1, 9, 1.5, Number.NaN]) {
      const res = makeMove(initial, invalid);
      expect(res.applied).toBe(false);
      expect(res.state).toBe(initial);
    }
  });

  it.each(WINNING_COMBINATIONS.map((combo, idx) => [idx, combo] as const))(
    "detects all 8 winning combinations (combo #%i: %j)",
    (_idx, combo) => {
      const [a, b, c] = combo;
      // Pick two filler indices for O that aren't in the winning line
      const fillers = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(
        (i) => i !== a && i !== b && i !== c
      );

      let state = createInitialGameState();
      state = makeMove(state, a).state; // X
      state = makeMove(state, fillers[0]).state; // O
      state = makeMove(state, b).state; // X
      state = makeMove(state, fillers[1]).state; // O
      const finalMove = makeMove(state, c); // X wins

      expect(finalMove.applied).toBe(true);
      expect(finalMove.state.status).toBe("won");
      expect(finalMove.state.winner).toBe("X");
      expect(finalMove.state.winningLine).toEqual(combo);
    }
  );

  it("detects Player O winning correctly", () => {
    let state = createInitialGameState();
    state = makeMove(state, 0).state; // X
    state = makeMove(state, 1).state; // O
    state = makeMove(state, 2).state; // X
    state = makeMove(state, 4).state; // O
    state = makeMove(state, 8).state; // X
    const oWins = makeMove(state, 7); // O wins [1, 4, 7]

    expect(oWins.state.status).toBe("won");
    expect(oWins.state.winner).toBe("O");
    expect(oWins.state.winningLine).toEqual([1, 4, 7]);
  });

  it("prioritizes a win over a draw when the 9th cell completes a winning line", () => {
    // Board before 9th move (index 8):
    // X O X
    // X O O
    // O X _
    // Placing X at 8 completes [0, 4, 8]? Wait: let's build [2, 5, 8] for X:
    // X O X
    // O O X
    // X X _ -> Wait: O at 1,3,4,6? Let's trace carefully:
    // Move 1: X -> 0
    // Move 2: O -> 1
    // Move 3: X -> 2
    // Move 4: O -> 4
    // Move 5: X -> 7
    // Move 6: O -> 6
    // Move 7: X -> 3
    // Move 8: O -> 5 -> no winner yet
    // Move 9: X -> 8 -> Wait: check if X has [0,3,6]? No 6 is O. [2,5,8]? 5 is O.
    // Let's use explicit moves for a real 9th-move win [6, 7, 8]:
    // 1: X->6, 2: O->0, 3: X->7, 4: O->1, 5: X->2, 6: O->4, 7: X->3, 8: O->5, 9: X->8
    let state = createInitialGameState();
    const moves = [6, 0, 7, 1, 2, 4, 3, 5, 8];
    for (const idx of moves) {
      state = makeMove(state, idx).state;
    }
    expect(state.moveCount).toBe(9);
    expect(state.status).toBe("won");
    expect(state.winner).toBe("X");
    expect(state.winningLine).toEqual([6, 7, 8]);
  });

  it("detects a draw when all 9 cells are filled with no winner", () => {
    // Classic draw:
    // X O X
    // X O O
    // O X X
    // Moves: 0(X), 1(O), 2(X), 4(O), 3(X), 5(O), 7(X), 6(O), 8(X)
    let state = createInitialGameState();
    const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8];
    for (const idx of moves) {
      state = makeMove(state, idx).state;
    }

    expect(state.moveCount).toBe(9);
    expect(state.status).toBe("draw");
    expect(state.winner).toBeNull();
    expect(state.winningLine).toBeNull();
    expect(checkWinner(state.board)).toBeNull();
  });

  it("prevents additional moves after the game has ended in win or draw", () => {
    let wonState = createInitialGameState();
    for (const idx of [0, 3, 1, 4, 2]) {
      wonState = makeMove(wonState, idx).state;
    }
    expect(wonState.status).toBe("won");

    const postWin = makeMove(wonState, 5);
    expect(postWin.applied).toBe(false);
    expect(postWin.state).toBe(wonState);
  });

  it("resets the board for a new round while incrementing roundNumber", () => {
    let state = createInitialGameState();
    for (const idx of [0, 3, 1, 4, 2]) {
      state = makeMove(state, idx).state;
    }

    const next = createNextRoundState(state);
    expect(next.board.every((cell) => cell === null)).toBe(true);
    expect(next.currentPlayer).toBe("X");
    expect(next.status).toBe("playing");
    expect(next.winner).toBeNull();
    expect(next.winningLine).toBeNull();
    expect(next.moveCount).toBe(0);
    expect(next.roundNumber).toBe(2);
  });

  it("returns exact UI status labels and speech phrases for every state", () => {
    const playingX = createInitialGameState();
    expect(getStatusLabel(playingX)).toBe("BLUE'S TURN");
    expect(getSpeechText(playingX)).toBe("Blue's turn!");

    const playingO = makeMove(playingX, 0).state;
    expect(getStatusLabel(playingO)).toBe("RED'S TURN");
    expect(getSpeechText(playingO)).toBe("Red's turn!");

    let xWins = playingX;
    for (const idx of [0, 3, 1, 4, 2]) xWins = makeMove(xWins, idx).state;
    expect(getStatusLabel(xWins)).toBe("BLUE WINS!");
    expect(getSpeechText(xWins)).toBe("Blue wins!");

    let oWins = playingX;
    for (const idx of [0, 1, 2, 4, 8, 7]) oWins = makeMove(oWins, idx).state;
    expect(getStatusLabel(oWins)).toBe("RED WINS!");
    expect(getSpeechText(oWins)).toBe("Red wins!");

    let draw = playingX;
    for (const idx of [0, 1, 2, 4, 3, 5, 7, 6, 8]) draw = makeMove(draw, idx).state;
    expect(getStatusLabel(draw)).toBe("IT'S A DRAW!");
    expect(getSpeechText(draw)).toBe("It's a draw!");
  });
});
