import { describe, expect, it } from "vitest";
import { encodeWav, toBase64 } from "./wav";

describe("encodeWav", () => {
  const wav = encodeWav(new Float32Array([0, 1, -1, 2]), 16_000);
  const view = new DataView(wav.buffer);
  const text = (offset: number) => String.fromCharCode(...wav.subarray(offset, offset + 4));

  it("writes a 16-bit mono PCM header", () => {
    expect([text(0), text(8), text(12), text(36)]).toEqual(["RIFF", "WAVE", "fmt ", "data"]);
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16_000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(8);
    expect(wav.length).toBe(44 + 8);
  });

  it("scales samples and clamps out-of-range ones", () => {
    expect([0, 1, 2, 3].map((i) => view.getInt16(44 + i * 2, true))).toEqual([0, 32767, -32767, 32767]);
  });
});

describe("toBase64", () => {
  it("encodes bytes, including buffers larger than one chunk", () => {
    expect(toBase64(new Uint8Array([72, 105]))).toBe("SGk=");
    const big = new Uint8Array(100_000).fill(65);
    expect(atob(toBase64(big)).length).toBe(100_000);
  });
});
