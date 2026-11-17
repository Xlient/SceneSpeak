import { describe, expect, it } from "vitest";
import { installIntlDisplayNames, languageName } from "./intl-display-names";

describe("languageName", () => {
  it("names known codes and their regional variants", () => {
    expect(languageName("es")).toBe("Spanish");
    expect(languageName("es-MX")).toBe("Spanish");
    expect(languageName("zh-Hans")).toBe("Simplified Chinese");
    expect(languageName("xx")).toBeUndefined();
  });
});

describe("installIntlDisplayNames", () => {
  it("fills in a missing DisplayNames and keeps a native one", () => {
    const bare: { DisplayNames?: unknown } = {};
    installIntlDisplayNames(bare);
    const Polyfill = bare.DisplayNames as new () => { of(code: string): string | undefined };
    expect(new Polyfill().of("es")).toBe("Spanish");

    const native = { DisplayNames: Intl.DisplayNames };
    installIntlDisplayNames(native);
    expect(native.DisplayNames).toBe(Intl.DisplayNames);
  });
});
