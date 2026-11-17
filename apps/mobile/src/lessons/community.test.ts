/// <reference types="node" />
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COMMUNITY_FILES } from "./community.generated";

describe("bundled community lessons", () => {
  it("lists every lesson file (run `pnpm gen-lessons` after adding one)", () => {
    const onDisk = readdirSync(join(__dirname, "../../../../packages/core/lessons"), { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith(".json"))
      .map((file) => `lessons/${file}`)
      .sort();
    expect(Object.keys(COMMUNITY_FILES).sort()).toEqual(onDisk);
  });
});
