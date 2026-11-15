import type { InferenceSource } from "firebase/ai";
import { describe, expect, it, vi } from "vitest";
import type { GenerationProgress } from "../lesson/generator";
import { CATALOG } from "../scene/catalog/catalog";
import { UnsafeRequestError, type TextModel, createLessonGenerator } from "./lesson-generator";
import { goodLessonJson, lessonJsonWith, safeScreenJson } from "./lesson-fixtures";
import { LessonParseError } from "./lesson-parse";
import { AiAbortedError, AiTimeoutError } from "./with-timeout";

const model = (source: InferenceSource, ...replies: Array<string | Error>) => {
  let call = 0;
  const generateText = vi.fn(async (_prompt: string, _options?: { signal?: AbortSignal }) => {
    const reply = replies[Math.min(call++, replies.length - 1)];
    if (reply instanceof Error) throw reply;
    return { text: reply ?? "", source: source as InferenceSource | undefined };
  });
  return { generateText } satisfies TextModel;
};

const setup = (screenReplies: Array<string | Error> = [safeScreenJson], writeReplies: Array<string | Error> = [goodLessonJson]) => {
  const screenModel = model("on_device", ...screenReplies);
  const writeModel = model("in_cloud", ...writeReplies);
  const generate = createLessonGenerator({ screenModel, writeModel, catalog: CATALOG });
  const progress: GenerationProgress[] = [];
  const signal = new AbortController().signal;
  const run = (prompt = "meeting my new neighbour") =>
    generate({ prompt, language: "es", signal, onProgress: (p) => progress.push(p) });
  return { screenModel, writeModel, run, progress, signal };
};

const promptOf = (m: ReturnType<typeof model>, call = 0) => m.generateText.mock.calls[call]?.[0] ?? "";

describe("createLessonGenerator", () => {
  it("returns the generated scenario and recipe", async () => {
    const { run } = setup();
    const lesson = await run();
    expect(lesson.scenario.id).toBe("meet-the-neighbour");
    expect(lesson.recipe.room).toBe("wood-workshop");
  });

  it("reports the device check, then the cloud write", async () => {
    const { run, progress } = setup();
    await run();
    expect(progress).toEqual([{ step: "device-check" }, { step: "cloud-write", source: "in_cloud" }]);
  });

  it("passes the caller's signal to both models", async () => {
    const { run, screenModel, writeModel, signal } = setup();
    await run();
    expect(screenModel.generateText).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal }));
    expect(writeModel.generateText).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal }));
  });

  it("removes personal details before any model sees the request", async () => {
    const { run, screenModel, writeModel } = setup(["not json"]);
    await run("practise with my tutor sam@example.com");
    expect(promptOf(screenModel)).not.toContain("sam@example.com");
    expect(promptOf(writeModel)).not.toContain("sam@example.com");
  });

  it("writes the lesson from the screened topic and intents", async () => {
    const { run, writeModel } = setup();
    await run();
    expect(promptOf(writeModel)).toContain("meeting a new neighbour");
    expect(promptOf(writeModel)).toContain("say_origin");
  });

  it("stops with UnsafeRequestError and never calls the cloud when the request isn't safe", async () => {
    const unsafe = JSON.stringify({ safe: false, reason: "Not suitable for a family app.", topic: "x", intents: [] });
    const { run, writeModel } = setup([unsafe]);

    await expect(run()).rejects.toThrow(UnsafeRequestError);
    await expect(run()).rejects.toThrow("Not suitable for a family app.");
    expect(writeModel.generateText).not.toHaveBeenCalled();
  });

  it("carries on with the redacted request when the device check fails", async () => {
    const { run, writeModel } = setup([new AiTimeoutError(100)]);
    await expect(run("ordering tapas")).resolves.toBeDefined();
    expect(promptOf(writeModel)).toContain("ordering tapas");
  });

  it("stops without calling the cloud when the caller cancels during the device check", async () => {
    const { run, writeModel } = setup([new AiAbortedError()]);
    await expect(run()).rejects.toBeInstanceOf(AiAbortedError);
    expect(writeModel.generateText).not.toHaveBeenCalled();
  });

  it("repairs a bad lesson once, telling the model what was wrong", async () => {
    const broken = lessonJsonWith({ scenario: { lines: [] } });
    const { run, writeModel } = setup(undefined, [broken, goodLessonJson]);

    await expect(run()).resolves.toBeDefined();
    expect(writeModel.generateText).toHaveBeenCalledTimes(2);
    expect(promptOf(writeModel, 1)).toContain(broken);
    expect(promptOf(writeModel, 1)).toMatch(/lines/);
  });

  it("gives up with LessonParseError when the repair fails too", async () => {
    const { run, writeModel } = setup(undefined, ["nope", "still nope"]);
    await expect(run()).rejects.toBeInstanceOf(LessonParseError);
    expect(writeModel.generateText).toHaveBeenCalledTimes(2);
  });

  it("doesn't retry cloud errors like timeouts", async () => {
    const { run, writeModel } = setup(undefined, [new AiTimeoutError(100)]);
    await expect(run()).rejects.toBeInstanceOf(AiTimeoutError);
    expect(writeModel.generateText).toHaveBeenCalledTimes(1);
  });
});
