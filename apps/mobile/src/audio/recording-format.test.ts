import { describe, expect, it } from "vitest";
import { recordingMimeType } from "./recording-format";

describe("recordingMimeType", () => {
  it("maps the formats each phone records to Gemini MIME types", () => {
    expect(recordingMimeType("file:///cache/Audio/reply.aac")).toBe("audio/aac");
    expect(recordingMimeType("file:///tmp/ExpoAudio/reply.WAV")).toBe("audio/wav");
  });

  it("rejects formats Gemini doesn't list", () => {
    expect(recordingMimeType("file:///cache/reply.m4a")).toBeUndefined();
    expect(recordingMimeType("blob:http://x/abc")).toBeUndefined();
  });
});
