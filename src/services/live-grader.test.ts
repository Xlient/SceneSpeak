import type { InferenceSource } from "firebase/ai";
import { describe, expect, it, vi } from "vitest";
import { askName, goodGradeJson, scenario } from "../ai/grade-fixtures";
import { createLiveGrader } from "./live-grader";

const request = () => ({ scenario, line: askName, reply: "Me llamo Sam", signal: new AbortController().signal });
const fakeModel = () => ({
  generateText: vi.fn(async () => ({ text: goodGradeJson, source: "on_device" as InferenceSource | undefined })),
});

describe("createLiveGrader", () => {
  it("doesn't build the model until the first grade", () => {
    const makeModel = vi.fn(fakeModel);
    createLiveGrader(makeModel);
    expect(makeModel).not.toHaveBeenCalled();
  });

  it("builds the model once and reuses it", async () => {
    const makeModel = vi.fn(fakeModel);
    const grader = createLiveGrader(makeModel);

    await grader(request());
    await grader(request());

    expect(makeModel).toHaveBeenCalledTimes(1);
  });

  it("grades with the model", async () => {
    await expect(createLiveGrader(fakeModel)(request())).resolves.toMatchObject({ grade: { score: 90 }, source: "on_device" });
  });

  it("turns a setup error into a rejected promise instead of throwing", async () => {
    const grader = createLiveGrader(() => {
      throw new Error("Firebase config is missing");
    });
    await expect(grader(request())).rejects.toThrow("Firebase config is missing");
  });
});
