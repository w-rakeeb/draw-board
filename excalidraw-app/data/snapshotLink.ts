import {
  compressData,
  decompressData,
} from "@excalidraw/excalidraw/data/encode";
import { generateEncryptionKey } from "@excalidraw/excalidraw/data/encryption";
import { serializeAsJSON } from "@excalidraw/excalidraw/data/json";
import { loadFromBlob } from "@excalidraw/excalidraw/data/blob";

import type { ExcalidrawElement } from "@excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";

// Self-contained snapshots keep sharing usable without a separately hosted API.
// The payload and key stay in the URL fragment, which is not sent to Vercel.
export const MAX_SNAPSHOT_LINK_BYTES = 1_000_000;

export const createSnapshotLink = async (
  elements: readonly ExcalidrawElement[],
  appState: Partial<AppState>,
  files: BinaryFiles,
  origin: string,
) => {
  const key = await generateEncryptionKey("string");
  const bytes = await compressData(
    new TextEncoder().encode(
      serializeAsJSON(elements, appState, files, "local"),
    ),
    { encryptionKey: key },
  );
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  const payload = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const url = `${origin}/#draw=${payload},${key}`;
  if (url.length > MAX_SNAPSHOT_LINK_BYTES) {
    throw new Error(
      "This drawing is too large for a share link. Save it as an .excalidraw file instead.",
    );
  }
  return url;
};

export const loadSnapshotLink = async (hash: string) => {
  if (hash.length > MAX_SNAPSHOT_LINK_BYTES) {
    throw new Error("The drawing link is too large.");
  }
  const match = hash.match(/^#draw=([A-Za-z0-9_-]+),([A-Za-z0-9_-]+)$/);
  if (!match) {
    throw new Error("Invalid drawing link.");
  }
  const binary = atob(match[1].replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const { data } = await decompressData(bytes, { decryptionKey: match[2] });
  return loadFromBlob(
    new Blob([new Uint8Array(data)], { type: "application/json" }),
    null,
    null,
  );
};
