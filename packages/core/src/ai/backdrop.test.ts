import type { GenerateContentResult } from "firebase/ai";
import { describe, expect, it, vi } from "vitest";
import { BACKDROP_TIMEOUT_MS, NoImageError, createModelBackdropPainter } from "./backdrop-painter";
import { buildBackdropPrompt } from "./backdrop-prompt";

const theme = { room: "bakery", gradient: ["#ffe1ea", "#ffd2b8"] } as const;
const request = (setting = "A sunny bakery. Rosa sells bread rolls.") => ({ cacheKey: "k", setting, theme, signal: new AbortController().signal });

const imageResult = (parts: { mimeType: string; data: string }[], finishReason?: string): GenerateContentResult => ({
  response: {
    text: () => "",
    inlineDataParts: () => (parts.length ? parts.map((inlineData) => ({ type: "inlineData" as const, inlineData })) : undefined),
    functionCalls: () => undefined,
    thoughtSummary: () => undefined,
    ...(finishReason ? { candidates: [{ index: 0, content: { role: "model", parts: [] }, finishReason } as never] } : {}),
  },
});

describe("buildBackdropPrompt", () => {
  const prompt = buildBackdropPrompt(request());

  it("names the room, the scene and the room's own colours", () => {
    expect(prompt).toContain("a sunny little bakery");
    expect(prompt).toContain("Rosa sells bread rolls");
    expect(prompt).toContain("#ffe4ea");
    expect(prompt).toContain("#ffe1ea to #ffd2b8");
  });

  it("asks for a plain backdrop that leaves room for the 3D set", () => {
    expect(prompt).toMatch(/back wall/);
    expect(prompt).toMatch(/edge to edge: no border, frame, pillars, side walls, ceiling or floor/);
    expect(prompt).toMatch(/bottom third plain/);
    expect(prompt).toMatch(/Never include people.*text/);
  });

  it("flattens and trims a long setting", () => {
    const long = buildBackdropPrompt(request(`A bakery.\n\n${"x".repeat(1000)}`));
    expect(long).not.toContain("\n\n");
    expect(long.length).toBeLessThan(1600);
  });
});

describe("createModelBackdropPainter", () => {
  it("sends the prompt with a timeout and returns the image as a Blob", async () => {
    const generateContent = vi.fn(async () => imageResult([{ mimeType: "image/png", data: btoa("PNGDATA") }]));
    const blob = await createModelBackdropPainter({ generateContent })(request());
    expect(blob.type).toBe("image/png");
    expect(await blob.text()).toBe("PNGDATA");
    expect(generateContent).toHaveBeenCalledWith(expect.stringContaining("bakery"), expect.objectContaining({ timeout: BACKDROP_TIMEOUT_MS, signal: expect.any(AbortSignal) }));
  });

  it("skips non-image parts and fails when there's no image", async () => {
    const onlyText = vi.fn(async () => imageResult([{ mimeType: "text/plain", data: btoa("hi") }]));
    await expect(createModelBackdropPainter({ generateContent: onlyText })(request())).rejects.toBeInstanceOf(NoImageError);
    const none = vi.fn(async () => imageResult([], "NO_IMAGE"));
    await expect(createModelBackdropPainter({ generateContent: none })(request())).rejects.toThrow("NO_IMAGE");
  });

  it("rejects an absurdly large image", async () => {
    const huge = vi.fn(async () => imageResult([{ mimeType: "image/png", data: "A".repeat(12_000_000) }]));
    await expect(createModelBackdropPainter({ generateContent: huge })(request())).rejects.toThrow("too large");
  });
});
