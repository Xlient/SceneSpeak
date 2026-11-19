import { describe, expect, it, vi } from "vitest";
import { BackdropOfflineError, createLiveBackdropPainter } from "./live-backdrops";

const request = () => ({ cacheKey: "k", setting: "A shop", theme: { room: "shop", gradient: ["#fff", "#eee"] } as const, signal: new AbortController().signal });
const port = () => ({
  generateContent: vi.fn(async () => ({
    response: {
      text: () => "",
      inlineDataParts: () => [{ type: "inlineData" as const, inlineData: { mimeType: "image/png", data: btoa("img") } }],
      functionCalls: () => undefined,
      thoughtSummary: () => undefined,
    },
  })),
});

describe("createLiveBackdropPainter", () => {
  it("builds the image model once, on first use", async () => {
    const makePort = vi.fn(port);
    const paint = createLiveBackdropPainter({ isOnline: () => true, makePort });
    expect(makePort).not.toHaveBeenCalled();
    await paint(request());
    await paint(request());
    expect(makePort).toHaveBeenCalledTimes(1);
  });

  it("fails fast offline", async () => {
    const makePort = vi.fn(port);
    await expect(createLiveBackdropPainter({ isOnline: () => false, makePort })(request())).rejects.toBeInstanceOf(BackdropOfflineError);
    expect(makePort).not.toHaveBeenCalled();
  });

  it("turns a setup error into a rejected promise", async () => {
    const paint = createLiveBackdropPainter({
      isOnline: () => true,
      makePort: () => {
        throw new Error("Firebase config is missing");
      },
    });
    await expect(paint(request())).rejects.toThrow("Firebase config is missing");
  });
});
