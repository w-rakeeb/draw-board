import type { OrderedExcalidrawElement } from "@excalidraw/element/types";
import type { BinaryFiles, Collaborator } from "@excalidraw/excalidraw/types";

export const MAX_ROOM_BYTES = 16 * 1024 * 1024;
export const parseRoom = (hash: string) => {
  const match = /^#room=([a-f0-9]{32}),([A-Za-z0-9_-]{22})$/.exec(hash);
  return match ? { id: match[1], key: match[2] } : null;
};

export type ScenePacket = {
  type: "scene";
  elements: readonly OrderedExcalidrawElement[];
  files: BinaryFiles;
  background: { color: string; clock: number; author: string };
};
export type PresencePacket = {
  type: "presence";
  username: string;
  pointer?: Collaborator["pointer"];
  button?: Collaborator["button"];
  selectedElementIds?: Collaborator["selectedElementIds"];
  viewport?: readonly [number, number, number, number];
  following?: string | null;
};
export type EncryptedPacket = { data: ArrayBuffer; iv: Uint8Array };

export const sceneFingerprint = (scene: ScenePacket) =>
  JSON.stringify([
    scene.elements.map((e) => [e.id, e.version, e.versionNonce, e.index]),
    Object.keys(scene.files).sort(),
    scene.background,
  ]);

export const newerBackground = (
  local: ScenePacket["background"],
  remote: ScenePacket["background"],
) =>
  remote.clock > local.clock ||
  (remote.clock === local.clock && remote.author > local.author)
    ? remote
    : local;
