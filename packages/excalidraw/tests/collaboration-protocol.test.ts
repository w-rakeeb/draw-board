import { describe, expect, it } from "vitest";

import {
  newerBackground,
  parseRoom,
} from "../../../excalidraw-app/collab/protocol";

describe("Draw Board room invitations", () => {
  const id = "a".repeat(32);
  const key = "b".repeat(22);
  it("accepts a complete room capability", () => {
    expect(parseRoom(`#room=${id},${key}`)).toEqual({ id, key });
  });
  it.each([
    "",
    "#room=short,key",
    `#room=${id}`,
    `#room=${id},${key}extra`,
    `#room=${id},${"+".repeat(22)}`,
    `#room=${id},${key}&other=value`,
  ])("rejects malformed or incomplete invites: %s", (hash) => {
    expect(parseRoom(hash)).toBeNull();
  });
});

describe("Concurrent room backgrounds", () => {
  const a = { color: "#fff0f6", clock: 100, author: "a" };
  const b = { color: "#ffffff", clock: 100, author: "b" };
  it("converges independent of arrival order when clocks tie", () => {
    expect(newerBackground(a, b)).toEqual(b);
    expect(newerBackground(b, a)).toEqual(b);
  });
  it("never rolls back to an older background", () => {
    const newer = { ...a, clock: 101 };
    expect(newerBackground(newer, b)).toEqual(newer);
    expect(newerBackground(b, newer)).toEqual(newer);
  });
});
