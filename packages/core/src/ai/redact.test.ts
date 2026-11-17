import { describe, expect, it } from "vitest";
import { redactPii } from "./redact";

describe("redactPii", () => {
  it("leaves ordinary requests alone", () => {
    expect(redactPii("ordering coffee at a café")).toEqual({ text: "ordering coffee at a café", redacted: 0 });
  });

  it("replaces email addresses", () => {
    expect(redactPii("email me at sam.lee+es@example.com please")).toEqual({
      text: "email me at [email] please",
      redacted: 1,
    });
  });

  it("replaces phone numbers written with spaces, dashes or dots", () => {
    expect(redactPii("call 416-555-0199 or +1 (416) 555 0123").text).toBe("call [phone] or [phone]");
  });

  it("replaces long digit runs like card or account numbers", () => {
    expect(redactPii("my card 4111111111111111").text).toBe("my card [number]");
  });

  it("keeps short numbers that are part of the scene", () => {
    expect(redactPii("buying 2 tickets for 10 euros at 9:30").text).toBe("buying 2 tickets for 10 euros at 9:30");
  });

  it("counts every replacement", () => {
    expect(redactPii("a@b.co and c@d.co, 416-555-0199").redacted).toBe(3);
  });
});
