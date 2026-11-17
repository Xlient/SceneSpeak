import type { InferenceSource } from "firebase/ai";
import { describe, expect, it, vi } from "vitest";
import { askName, goodGradeJson, scenario } from "./grade-fixtures";
import { GradeParseError } from "./grade-parse";
import { buildGradePrompt } from "./grade-prompt";
import { type GradingModel, createModelGrader } from "./model-grader";
import { AiTimeoutError } from "./with-timeout";

const fakeModel = (...replies: Array<string | Error>) => {
  let call = 0;
  const generateText = vi.fn(async (_prompt: string, _options?: { signal?: AbortSignal }) => {
    const reply = replies[Math.min(call++, replies.length - 1)];
    if (reply instanceof Error) throw reply;
    return { text: reply ?? "", source: "on_device" as InferenceSource | undefined };
  });
  return { generateText } satisfies GradingModel;
};

const request = (reply: string) => ({ scenario, line: askName, reply, signal: new AbortController().signal });

describe("createModelGrader", () => {
  it("skips the model when the reply matches the example exactly", async () => {
    const model = fakeModel(goodGradeJson);
    const result = await createModelGrader(model)(request("me llamo alex"));

    expect(model.generateText).not.toHaveBeenCalled();
    expect(result).toMatchObject({ grade: { ok: true, score: 100 }, source: "on_device" });
  });

  it("sends the grade prompt and the caller's signal to the model", async () => {
    const model = fakeModel(goodGradeJson);
    const req = request("Me llamo Sam");
    await createModelGrader(model)(req);

    expect(model.generateText).toHaveBeenCalledWith(
      buildGradePrompt(req),
      expect.objectContaining({ signal: req.signal }),
    );
  });

  it("returns the parsed grade and where it ran", async () => {
    const model = {
      generateText: vi.fn(async () => ({ text: goodGradeJson, source: "in_cloud" as InferenceSource | undefined })),
    };
    const result = await createModelGrader(model)(request("Me llamo Sam"));

    expect(result).toEqual({ grade: expect.objectContaining({ score: 90, goalId: "say-name" }), source: "in_cloud" });
  });

  it("retries once when the model returns bad JSON", async () => {
    const model = fakeModel("Great job!", goodGradeJson);
    const result = await createModelGrader(model)(request("Me llamo Sam"));

    expect(model.generateText).toHaveBeenCalledTimes(2);
    expect(result.grade.score).toBe(90);
  });

  it("gives up with GradeParseError after the retry also fails", async () => {
    const model = fakeModel("Great job!", "Still not JSON");
    await expect(createModelGrader(model)(request("Me llamo Sam"))).rejects.toBeInstanceOf(GradeParseError);
    expect(model.generateText).toHaveBeenCalledTimes(2);
  });

  it("doesn't retry other errors like timeouts", async () => {
    const model = fakeModel(new AiTimeoutError(100));
    await expect(createModelGrader(model)(request("Me llamo Sam"))).rejects.toBeInstanceOf(AiTimeoutError);
    expect(model.generateText).toHaveBeenCalledTimes(1);
  });
});
