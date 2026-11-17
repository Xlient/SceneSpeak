import { loadCommunityLessons } from "./community-lesson";

// Bundled at build time; adding a lesson is just adding a JSON file under lessons/.
export const COMMUNITY_LESSONS = loadCommunityLessons(import.meta.glob("../../../lessons/**/*.json", { eager: true, import: "default" }));
