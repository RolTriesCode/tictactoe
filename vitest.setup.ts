import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

if (typeof HTMLCanvasElement !== "undefined") {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: () => null,
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
