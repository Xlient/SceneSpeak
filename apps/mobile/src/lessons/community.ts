import { loadCommunityLessons } from "@scenespeak/core/lesson/community/community-lesson";
import { COMMUNITY_FILES } from "./community.generated";

export const COMMUNITY_LESSONS = loadCommunityLessons(COMMUNITY_FILES);
