import { webcrypto } from "node:crypto";
import { beforeAll, expect, it, vi } from "vitest";

import { createSnapshotLink, loadSnapshotLink } from "./snapshotLink";

beforeAll(() => {
  vi.stubGlobal("crypto", webcrypto);
});

it("restores an encrypted snapshot without a storage request", async () => {
  const link = await createSnapshotLink(
    [],
    { viewBackgroundColor: "#fffce8" },
    {},
    "https://draw.example",
  );
  const restored = await loadSnapshotLink(new URL(link).hash);
  expect(restored.elements).toEqual([]);
  expect(restored.appState?.viewBackgroundColor).toBe("#fffce8");
});

it("rejects damaged ciphertext", async () => {
  const link = await createSnapshotLink([], {}, {}, "https://draw.example");
  const hash = new URL(link).hash;
  const index = hash.indexOf(",") - 20;
  const damaged = `${hash.slice(0, index)}${
    hash[index] === "A" ? "B" : "A"
  }${hash.slice(index + 1)}`;
  await expect(loadSnapshotLink(damaged)).rejects.toThrow();
});

it("rejects malformed and oversized input", async () => {
  await expect(loadSnapshotLink("#draw=bad")).rejects.toThrow();
  await expect(
    loadSnapshotLink(`#draw=${"A".repeat(1_000_001)}`),
  ).rejects.toThrow();
});
