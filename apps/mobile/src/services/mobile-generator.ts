import { createLessonGenerator } from "@scenespeak/core/ai/lesson-generator";
import { createLessonMatcher } from "@scenespeak/core/ai/lesson-match";
import type { LessonGenerator } from "@scenespeak/core/lesson/generator";
import type { LibraryStore } from "@scenespeak/core/library/library";
import { routeAiCall } from "@scenespeak/core/routing/route";
import { CATALOG } from "@scenespeak/core/scene/catalog/catalog";
import type { Catalog } from "@scenespeak/core/scene/catalog/catalog-types";
import { createLibraryFinder } from "@scenespeak/core/services/library-finder";
import type { MobileAiDeps } from "./mobile-grader";
import { createPortModels } from "./port-models";

export interface MobileGeneratorDeps extends MobileAiDeps {
  catalog?: Catalog;
  /** When set, requests already covered by a published lesson suggest that lesson instead. */
  library?: LibraryStore;
}

/** Mirrors the web's createLiveGenerator: screen routed like a short task, writing in the cloud, over the native port. */
export const createMobileGenerator = ({ port, deviceKind, isOnline, catalog = CATALOG, library }: MobileGeneratorDeps): LessonGenerator => {
  const model = createPortModels(port, catalog);
  return (request) => {
    const common = { device: deviceKind(), language: request.language, online: isOnline() };
    const screenRoute = routeAiCall({ ...common, task: "screen", inputChars: request.prompt.length });
    const writeRoute = routeAiCall({ ...common, task: "generate" });
    const matchRoute = routeAiCall({ ...common, task: "match" });
    const generate = createLessonGenerator({
      screenModel: model("screen", screenRoute.mode),
      writeModel: model("write", writeRoute.mode),
      catalog,
      ...(library ? { findExisting: createLibraryFinder({ library, match: createLessonMatcher(model("match", matchRoute.mode)) }) } : {}),
    });
    return generate(request);
  };
};
