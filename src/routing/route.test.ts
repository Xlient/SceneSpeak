import { describe, expect, it } from "vitest";
import { MAX_ON_DEVICE_CHARS, type RouteInput, routeAiCall } from "./route";

const grade = (overrides: Partial<RouteInput> = {}): RouteInput => ({
  task: "grade",
  device: "ready",
  language: "es",
  online: true,
  inputChars: 20,
  ...overrides,
});

describe("routeAiCall", () => {
  it("grades short Spanish replies on-device first when Nano is ready", () => {
    expect(routeAiCall(grade())).toMatchObject({ mode: "prefer_on_device", rule: "on-device" });
  });

  it("still tries on-device when setup hasn't been clicked, since Nano may already be downloaded", () => {
    expect(routeAiCall(grade({ device: "idle" }))).toMatchObject({ mode: "prefer_on_device" });
  });

  it.each(["grade-voice", "speak", "paint", "generate"] as const)("sends %s to the cloud: Nano can't do it", (task) => {
    expect(routeAiCall(grade({ task }))).toMatchObject({ mode: "only_in_cloud", rule: "capability" });
  });

  it("sends languages Nano doesn't support to the cloud", () => {
    expect(routeAiCall(grade({ language: "fr" }))).toMatchObject({ mode: "only_in_cloud", rule: "language" });
  });

  it("matches region tags by their base language", () => {
    expect(routeAiCall(grade({ language: "es-MX" })).rule).toBe("on-device");
  });

  it("goes on-device only when offline and Nano is ready", () => {
    expect(routeAiCall(grade({ online: false }))).toMatchObject({ mode: "only_on_device", rule: "offline" });
  });

  it("explains it can't work offline without Nano", () => {
    expect(routeAiCall(grade({ online: false, device: "unavailable" }))).toMatchObject({ mode: "only_in_cloud", rule: "offline" });
  });

  it("prefers the cloud for long input", () => {
    expect(routeAiCall(grade({ inputChars: MAX_ON_DEVICE_CHARS + 1 }))).toMatchObject({
      mode: "prefer_in_cloud",
      rule: "long-input",
    });
    expect(routeAiCall(grade({ inputChars: MAX_ON_DEVICE_CHARS })).rule).toBe("on-device");
  });

  it.each(["checking", "downloading"] as const)("uses the cloud while Nano is %s instead of waiting", (device) => {
    expect(routeAiCall(grade({ device }))).toMatchObject({ mode: "only_in_cloud", rule: "device-busy" });
  });

  it.each(["unavailable", "not-supported"] as const)("skips the on-device check when Nano is %s", (device) => {
    expect(routeAiCall(grade({ device }))).toMatchObject({ mode: "only_in_cloud", rule: "device-missing" });
  });

  it("puts capability before connectivity: voice offline is still cloud-only", () => {
    expect(routeAiCall(grade({ task: "grade-voice", online: false })).rule).toBe("capability");
  });

  it("gives a short reason that starts with where it runs", () => {
    expect(routeAiCall(grade()).reason).toMatch(/^Device/);
    expect(routeAiCall(grade({ task: "speak" })).reason).toMatch(/^Cloud/);
  });
});
