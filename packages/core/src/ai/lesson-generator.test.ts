import type { InferenceSource } from "firebase/ai";
import { describe, expect, it, vi } from "vitest";
import type { GenerationProgress, GenerationResult, LibraryMatch } from "../lesson/generator";
import { CATALOG } from "../scene/catalog/catalog";
import { UnsafeRequestError, type TextModel, createLessonGenerator } from "./lesson-generator";
import { goodLesson, goodLessonJson, lessonJsonWith, safeScreenJson } from "./lesson-fixtures";
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

const lessonOf = (result: GenerationResult) => {
  if (result.kind !== "generated") throw new Error("expected a generated lesson");
  return result.lesson;
};

const setup = (
  screenReplies: Array<string | Error> = [safeScreenJson],
  writeReplies: Array<string | Error> = [goodLessonJson],
  findExisting?: Parameters<typeof createLessonGenerator>[0]["findExisting"],
) => {
  const screenModel = model("on_device", ...screenReplies);
  const writeModel = model("in_cloud", ...writeReplies);
  const generate = createLessonGenerator({ screenModel, writeModel, catalog: CATALOG, ...(findExisting ? { findExisting } : {}) });
  const progress: GenerationProgress[] = [];
  const signal = new AbortController().signal;
  const run = (prompt = "meeting my new neighbour", allowExisting?: boolean) =>
    generate({ prompt, language: "es", signal, onProgress: (p) => progress.push(p), ...(allowExisting === undefined ? {} : { allowExisting }) });
  return { screenModel, writeModel, run, progress, signal };
};

const promptOf = (m: ReturnType<typeof model>, call = 0) => m.generateText.mock.calls[call]?.[0] ?? "";

describe("createLessonGenerator", () => {
  it("returns the generated scenario and recipe", async () => {
    const { run } = setup();
    const lesson = lessonOf(await run());
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

  it("gives the writer the learner's redacted words, not just the device summary", async () => {
    const drifted = JSON.stringify({ safe: true, reason: null, topic: "asking for directions to the bank", intents: ["ask_directions"] });
    const { run, writeModel } = setup([drifted]);
    await run("how to exchange money at the bank, my email is sam@example.com");
    expect(promptOf(writeModel)).toContain("how to exchange money at the bank");
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

  describe("short lessons", () => {
    const shortJson = lessonJsonWith({ scenario: { lines: goodLesson.scenario.lines.slice(0, 4) } });

    it("asks once for a fuller lesson and uses it", async () => {
      const { run, writeModel } = setup(undefined, [shortJson, goodLessonJson]);
      const lesson = lessonOf(await run());
      expect(lesson.scenario.lines).toHaveLength(goodLesson.scenario.lines.length);
      expect(writeModel.generateText).toHaveBeenCalledTimes(2);
      expect(promptOf(writeModel, 1)).toMatch(/only 4 lines/);
    });

    it("keeps the short lesson when the retry is broken or times out", async () => {
      for (const retry of ["not json", new AiTimeoutError(100)]) {
        const { run } = setup(undefined, [shortJson, retry]);
        expect(lessonOf(await run()).scenario.lines).toHaveLength(4);
      }
    });

    it("doesn't retry a full lesson", async () => {
      const { run, writeModel } = setup();
      await run();
      expect(writeModel.generateText).toHaveBeenCalledTimes(1);
    });
  });

  describe("library check", () => {
    const match: LibraryMatch = { id: "lib-1", title: "Meeting the neighbours", votes: 7 };

    it("suggests an existing lesson instead of writing a new one", async () => {
      const findExisting = vi.fn(async () => match);
      const { run, writeModel, progress } = setup(undefined, undefined, findExisting);

      expect(await run()).toEqual({ kind: "existing", match });
      expect(findExisting).toHaveBeenCalledWith(expect.objectContaining({ topic: "meeting a new neighbour", language: "es" }));
      expect(progress.map((p) => p.step)).toEqual(["device-check", "library-check"]);
      expect(writeModel.generateText).not.toHaveBeenCalled();
    });

    it("writes a new lesson when nothing matches, keeping the topic and intents", async () => {
      const { run, progress } = setup(undefined, undefined, async () => null);
      const result = await run();
      expect(result).toMatchObject({ kind: "generated", topic: "meeting a new neighbour" });
      expect(progress.map((p) => p.step)).toEqual(["device-check", "library-check", "cloud-write"]);
    });

    it("skips the check for make-mine-anyway", async () => {
      const findExisting = vi.fn(async () => match);
      const { run } = setup(undefined, undefined, findExisting);
      expect((await run("meeting my new neighbour", false)).kind).toBe("generated");
      expect(findExisting).not.toHaveBeenCalled();
    });

    it("carries on when the check fails, but not when cancelled", async () => {
      const failing = setup(undefined, undefined, async () => Promise.reject(new Error("offline")));
      expect((await failing.run()).kind).toBe("generated");

      const cancelled = setup(undefined, undefined, async () => Promise.reject(new AiAbortedError()));
      await expect(cancelled.run()).rejects.toBeInstanceOf(AiAbortedError);
      expect(cancelled.writeModel.generateText).not.toHaveBeenCalled();
    });
  });
});
