import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Game } from "@/components/Game";
import { AUDIO_PREFS_STORAGE_KEY, SCOREBOARD_STORAGE_KEY } from "@/lib/game/storage";

function installBrowserMocks() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  const spokenTexts: string[] = [];
  const cancel = vi.fn();
  const speak = vi.fn((utterance: { text: string }) => {
    spokenTexts.push(utterance.text);
  });

  Object.defineProperty(window, "speechSynthesis", {
    writable: true,
    configurable: true,
    value: {
      cancel,
      speak,
      resume: vi.fn(),
      paused: false,
      getVoices: () => [
        {
          name: "Samantha",
          lang: "en-US",
          localService: true,
          default: true,
          voiceURI: "Samantha",
        },
      ],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });

  globalThis.SpeechSynthesisUtterance = vi.fn(function (
    this: Record<string, unknown>,
    text: string
  ) {
    this.text = text;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.lang = "en-US";
    this.voice = null;
  }) as unknown as typeof SpeechSynthesisUtterance;

  return { spokenTexts, cancel, speak };
}

describe("Tic-Tac-Toe full UI integration", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("plays a complete game to Blue victory, blocks post-win moves, updates scoreboard, and starts a clean New Game", async () => {
    const user = userEvent.setup();
    const { spokenTexts } = installBrowserMocks();

    render(<Game />);

    expect(screen.getByTestId("game-status").textContent).toBe("BLUE'S TURN");
    expect(screen.getByTestId("score-x").textContent).toBe("0");
    expect(screen.getByTestId("score-o").textContent).toBe("0");
    expect(screen.getByTestId("score-draws").textContent).toBe("0");

    // X moves 0, O moves 3, X moves 1, O moves 4
    await user.click(screen.getByTestId("cell-0"));
    expect(screen.getByTestId("game-status").textContent).toBe("RED'S TURN");
    expect(screen.getByTestId("cell-0").getAttribute("aria-disabled")).toBe("true");

    // Clicking an occupied cell does not alter turn or mark
    await user.click(screen.getByTestId("cell-0"));
    expect(screen.getByTestId("game-status").textContent).toBe("RED'S TURN");

    await user.click(screen.getByTestId("cell-3"));
    expect(screen.getByTestId("game-status").textContent).toBe("BLUE'S TURN");

    await user.click(screen.getByTestId("cell-1"));
    await user.click(screen.getByTestId("cell-4"));
    await user.click(screen.getByTestId("cell-2")); // Blue wins top row [0, 1, 2]

    expect(screen.getByTestId("game-status").textContent).toBe("BLUE WINS!");
    expect(screen.getByTestId("score-x").textContent).toBe("1");
    expect(screen.getByTestId("winning-line")).toBeDefined();
    expect(screen.getByTestId("cell-0").getAttribute("data-winning")).toBe("true");
    expect(screen.getByTestId("cell-1").getAttribute("data-winning")).toBe("true");
    expect(screen.getByTestId("cell-2").getAttribute("data-winning")).toBe("true");

    // Moves after game ends are prevented
    await user.click(screen.getByTestId("cell-8"));
    expect(screen.getByTestId("cell-8").getAttribute("aria-label")).toContain(
      "Empty, game over"
    );
    expect(screen.getByTestId("score-x").textContent).toBe("1");

    await waitFor(() => {
      expect(spokenTexts).toContain("Blue wins!");
    });

    // New Game resets board while keeping scoreboard intact
    await user.click(screen.getByTestId("new-game-btn"));
    expect(screen.getByTestId("game-status").textContent).toBe("BLUE'S TURN");
    expect(screen.getByTestId("score-x").textContent).toBe("1");
    await waitFor(() => {
      expect(screen.queryByTestId("winning-line")).toBeNull();
    });
    expect(screen.getByTestId("cell-0").getAttribute("aria-disabled")).toBe("false");
  });

  it("handles a draw game cleanly without winning line and updates draw counter", async () => {
    const user = userEvent.setup();
    const { spokenTexts } = installBrowserMocks();

    render(<Game />);

    // Draw sequence: 0(X), 1(O), 2(X), 4(O), 3(X), 5(O), 7(X), 6(O), 8(X)
    for (const idx of [0, 1, 2, 4, 3, 5, 7, 6, 8]) {
      await user.click(screen.getByTestId(`cell-${idx}`));
    }

    expect(screen.getByTestId("game-status").textContent).toBe("IT'S A DRAW!");
    expect(screen.getByTestId("score-draws").textContent).toBe("1");
    expect(screen.queryByTestId("winning-line")).toBeNull();

    await waitFor(() => {
      expect(spokenTexts).toContain("It's a draw!");
    });
  });

  it("persists scoreboard and audio toggles across remounts and supports Reset Scoreboard", async () => {
    const user = userEvent.setup();
    const { cancel } = installBrowserMocks();

    const firstRender = render(<Game />);

    // Play quick O win: X->0, O->1, X->2, O->4, X->8, O->7
    for (const idx of [0, 1, 2, 4, 8, 7]) {
      await user.click(screen.getByTestId(`cell-${idx}`));
    }
    expect(screen.getByTestId("game-status").textContent).toBe("RED WINS!");
    expect(screen.getByTestId("score-o").textContent).toBe("1");

    // Toggle sound and voice off
    await user.click(screen.getByTestId("toggle-sound"));
    await user.click(screen.getByTestId("toggle-voice"));
    expect(cancel).toHaveBeenCalled();

    expect(screen.getByTestId("toggle-sound").getAttribute("aria-checked")).toBe(
      "false"
    );
    expect(screen.getByTestId("toggle-voice").getAttribute("aria-checked")).toBe(
      "false"
    );

    // Unmount and remount to simulate browser reload
    firstRender.unmount();
    render(<Game />);

    expect(screen.getByTestId("score-o").textContent).toBe("1");
    expect(screen.getByTestId("toggle-sound").getAttribute("aria-checked")).toBe(
      "false"
    );
    expect(screen.getByTestId("toggle-voice").getAttribute("aria-checked")).toBe(
      "false"
    );

    expect(window.localStorage.getItem(SCOREBOARD_STORAGE_KEY)).toContain('"oWins":1');
    expect(window.localStorage.getItem(AUDIO_PREFS_STORAGE_KEY)).toContain(
      '"voiceEnabled":false'
    );

    // Reset scoreboard zeroes counters without altering audio preferences
    await user.click(screen.getByTestId("reset-scores-btn"));
    expect(screen.getByTestId("score-x").textContent).toBe("0");
    expect(screen.getByTestId("score-o").textContent).toBe("0");
    expect(screen.getByTestId("score-draws").textContent).toBe("0");
    expect(screen.getByTestId("toggle-sound").getAttribute("aria-checked")).toBe(
      "false"
    );
  });

  it("supports 2D arrow-key keyboard navigation across the 3x3 grid", async () => {
    const user = userEvent.setup();
    installBrowserMocks();

    render(<Game />);

    const cell0 = screen.getByTestId("cell-0");
    cell0.focus();
    expect(document.activeElement).toBe(cell0);

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByTestId("cell-1"));

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByTestId("cell-4"));

    await user.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByTestId("cell-8"));

    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(screen.getByTestId("cell-0"));

    await user.keyboard("{Enter}");
    expect(screen.getByTestId("game-status").textContent).toBe("RED'S TURN");
  });

  it("cancels queued rapid-move speech announcements to prevent overlapping audio", async () => {
    const user = userEvent.setup();
    const { spokenTexts } = installBrowserMocks();

    render(<Game />);

    // Rapidly play two moves before the 110ms speech debounce fires
    await user.click(screen.getByTestId("cell-0"));
    await user.click(screen.getByTestId("cell-1"));

    await waitFor(() => {
      expect(spokenTexts).toContain("Blue's turn!");
    });
    // The superseded "Red's turn!" from move 1 should have been cancelled before speaking
    expect(spokenTexts).toEqual(["Blue's turn!"]);
  });
});
