import type { Grader } from "../lesson/grader";
import { GradeParseError, parseGrade } from "./grade-parse";
import { buildGradePrompt } from "./grade-prompt";
import type { AppModel } from "./model";
import { capPartialReply, quickGrade } from "./quick-grade";

export type GradingModel = Pick<AppModel, "generateText">;

export const createModelGrader =
  (model: GradingModel): Grader =>
  async (request) => {
    const quick = quickGrade(request.line, request.reply);
    if (quick) return { grade: quick, source: "on_device" };

    const prompt = buildGradePrompt(request);
    const attempt = async () => {
      const result = await model.generateText(prompt, { signal: request.signal });
      return { grade: capPartialReply(parseGrade(result.text, request.line), request.line, request.reply), source: result.source ?? "on_device" };
    };

    try {
      return await attempt();
    } catch (error) {
      // Bad JSON is often a one-off from a small model; timeouts and cancels aren't worth retrying.
      if (error instanceof GradeParseError) return attempt();
      throw error;
    }
  };
