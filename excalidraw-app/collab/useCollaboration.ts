import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { CaptureUpdateAction, zoomToFitBounds } from "@excalidraw/excalidraw";
import { getVisibleSceneBounds } from "@excalidraw/element";
import { restoreElements } from "@excalidraw/excalidraw/data/restore";
import { reconcileElements } from "@excalidraw/excalidraw/data/reconcile";
import {
  decryptData,
  encryptData,
  generateEncryptionKey,
} from "@excalidraw/excalidraw/data/encryption";

import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import type {
  AppState,
  BinaryFiles,
  Collaborator,
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
  SocketId,
  UserToFollow,
} from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/element/types";

import { LocalData } from "../data/LocalData";
import {
  importUsernameFromLocalStorage,
  saveUsernameToLocalStorage,
} from "../data/localStorage";

import {
  MAX_ROOM_BYTES,
  newerBackground,
  parseRoom,
  sceneFingerprint,
} from "./protocol";

import type { EncryptedPacket, PresencePacket, ScenePacket } from "./protocol";

type Draft = {
  elements: readonly OrderedExcalidrawElement[];
  appState: AppState;
  files: BinaryFiles;
};
type Session = {
  id: string;
  key: string;
  author: string;
  socket: Socket;
  backup: Draft;
  background: ScenePacket["background"];
  lastSent: string;
  ready: boolean;
  blocked: boolean;
  applying: boolean;
  sendTimer?: number;
  queue: Promise<void>;
  receiveQueue: Promise<void>;
  members: Set<string>;
  collaborators: Map<SocketId, Collaborator>;
  presence: Map<string, PresencePacket>;
  following: string | null;
};

const SERVER_URL = import.meta.env.VITE_APP_COLLABORATION_SERVER || "";

export const useCollaboration = (
  api: ExcalidrawImperativeAPI | null,
  root: React.RefObject<HTMLDivElement | null>,
  localReady: boolean,
) => {
  const active = useRef<Session | null>(null);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState("Not connected");
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [people, setPeople] = useState(0);
  const [userToFollow, setUserToFollow] = useState<UserToFollow | null>(null);
  const [username, setUsername] = useState(
    () => importUsernameFromLocalStorage() || "Guest",
  );
  const nameRef = useRef(username);
  const pointerTime = useRef(0);
  const ownPresence = useRef<PresencePacket>({
    type: "presence",
    username,
  });

  const getScene = useCallback(
    (session: Session): ScenePacket => {
      const elements = api!.getSceneElementsIncludingDeleted();
      const allFiles = api!.getFiles();
      const files: BinaryFiles = {};
      for (const element of elements) {
        if (
          element.type === "image" &&
          element.fileId &&
          allFiles[element.fileId]
        ) {
          files[element.fileId] = allFiles[element.fileId];
        }
      }
      return { type: "scene", elements, files, background: session.background };
    },
    [api],
  );

  const sendPresence = useCallback(
    (session: Session) => {
      if (!session.socket.connected || !session.ready) {
        return;
      }
      const packet = {
        ...ownPresence.current,
        username: nameRef.current,
        selectedElementIds: api!.getAppState().selectedElementIds,
        viewport: getVisibleSceneBounds(api!.getAppState()),
        following: session.following,
      };
      void encryptData(session.key, JSON.stringify(packet))
        .then(({ encryptedBuffer, iv }) => {
          if (active.current === session && session.socket.connected) {
            session.socket.volatile.emit("presence", session.id, {
              data: encryptedBuffer,
              iv,
            });
          }
        })
        .catch(() => {});
    },
    [api],
  );

  const sendScene = useCallback(
    (session: Session, force = false) => {
      session.queue = session.queue
        .then(async () => {
          if (
            active.current !== session ||
            !session.ready ||
            !session.socket.connected
          ) {
            return;
          }
          const scene = getScene(session);
          const fingerprint = sceneFingerprint(scene);
          if (!force && fingerprint === session.lastSent) {
            return;
          }
          const json = JSON.stringify(scene);
          if (
            new TextEncoder().encode(json).byteLength >
            MAX_ROOM_BYTES - 100
          ) {
            setError(
              "This drawing is too large to share live (16 MB limit). Remove large images or save a file.",
            );
            return;
          }
          const { encryptedBuffer, iv } = await encryptData(session.key, json);
          if (active.current !== session || !session.socket.connected) {
            return;
          }
          session.socket
            .timeout(15000)
            .emit(
              "scene",
              session.id,
              { data: encryptedBuffer, iv },
              (
                timeout: Error | null,
                response: { ok?: boolean; error?: string },
              ) => {
                if (active.current !== session) {
                  return;
                }
                if (timeout || !response?.ok) {
                  session.lastSent = "";
                  setError(
                    response?.error ||
                      "Your latest changes haven't reached the room. Reconnect or save a file.",
                  );
                } else {
                  setError("");
                }
              },
            );
          session.lastSent = fingerprint;
        })
        .catch(() => {
          if (active.current === session) {
            setError(
              "Couldn't share this update. Save a file to keep your changes.",
            );
          }
        });
    },
    [getScene],
  );

  const leave = useCallback(
    (keepDrawing = false) => {
      const session = active.current;
      if (!session || !api || !root.current) {
        setDialogOpen(false);
        return;
      }
      const ownerWindow = root.current.ownerDocument.defaultView!;
      active.current = null;
      ownerWindow.clearTimeout(session.sendTimer);
      session.socket.disconnect();
      ownerWindow.history.replaceState(
        null,
        "",
        `${ownerWindow.location.pathname}${ownerWindow.location.search}`,
      );
      api.updateScene({
        ...(keepDrawing ? {} : { elements: session.backup.elements }),
        appState: {
          ...(keepDrawing ? api.getAppState() : session.backup.appState),
          collaborators: new Map(),
          selectedElementIds: {},
        },
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      api.addFiles(Object.values(session.backup.files));
      api.history.clear();
      LocalData.resumeSave("collaboration");
      LocalData.save(
        api.getSceneElementsIncludingDeleted(),
        api.getAppState(),
        api.getFiles(),
        () => {},
      );
      setIsCollaborating(false);
      setPeople(0);
      setUserToFollow(null);
      setStatus("Not connected");
      setError("");
      setLink("");
      setDialogOpen(false);
    },
    [api, root],
  );

  const connect = useCallback(
    (room: { id: string; key: string }, joining: boolean) => {
      if (!api || !root.current || active.current) {
        return;
      }
      if (!SERVER_URL) {
        setError(
          "Live collaboration is being set up. You can keep drawing and saving files.",
        );
        setDialogOpen(true);
        return;
      }
      const ownerWindow = root.current.ownerDocument.defaultView!;
      const author = Array.from(
        ownerWindow.crypto.getRandomValues(new Uint8Array(8)),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
      LocalData.flushSave();
      LocalData.pauseSave("collaboration");
      const socket = io(SERVER_URL, {
        autoConnect: false,
        reconnection: true,
        timeout: 45000,
      });
      const session: Session = {
        ...room,
        author,
        socket,
        backup: {
          elements: api.getSceneElementsIncludingDeleted(),
          appState: api.getAppState(),
          files: { ...api.getFiles() },
        },
        background: {
          color: joining ? "#ffffff" : api.getAppState().viewBackgroundColor,
          clock: joining ? 0 : Date.now(),
          author,
        },
        lastSent: "",
        ready: false,
        blocked: false,
        applying: false,
        queue: Promise.resolve(),
        receiveQueue: Promise.resolve(),
        members: new Set(),
        collaborators: new Map(),
        presence: new Map(),
        following: null,
      };
      active.current = session;
      setIsCollaborating(true);
      setError("");
      setStatus("Connecting…");
      const roomLink = `${ownerWindow.location.origin}${ownerWindow.location.pathname}${ownerWindow.location.search}#room=${room.id},${room.key}`;
      ownerWindow.history.replaceState(null, "", roomLink);
      setLink(roomLink);
      if (joining) {
        api.updateScene({
          elements: [],
          appState: {
            viewBackgroundColor: "#ffffff",
            selectedElementIds: {},
            collaborators: new Map(),
          },
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      }
      api.history.clear();

      const receive = (
        sender: string,
        encrypted: EncryptedPacket,
        initial = false,
      ) => {
        session.receiveQueue = session.receiveQueue
          .then(async () => {
            if (active.current !== session) {
              return;
            }
            const data = await decryptData(
              new Uint8Array(encrypted.iv),
              encrypted.data,
              session.key,
            );
            const packet: ScenePacket | PresencePacket = JSON.parse(
              new TextDecoder().decode(data),
            );
            if (active.current !== session) {
              return;
            }
            if (packet.type === "presence") {
              if (!session.members.has(sender) || sender === socket.id) {
                return;
              }
              session.presence.set(sender, packet);
              if (
                session.following === sender &&
                packet.following !== socket.id &&
                packet.viewport?.length === 4 &&
                packet.viewport.every(Number.isFinite)
              ) {
                api.updateScene({
                  appState: zoomToFitBounds({
                    appState: api.getAppState(),
                    bounds: packet.viewport,
                    fit: "contain",
                  }).appState,
                });
              }
              session.collaborators.set(sender as SocketId, {
                socketId: sender as SocketId,
                username: String(packet.username || "Guest").slice(0, 40),
                ...(packet.pointer &&
                Number.isFinite(packet.pointer.x) &&
                Number.isFinite(packet.pointer.y)
                  ? {
                      pointer: {
                        x: packet.pointer.x,
                        y: packet.pointer.y,
                        tool:
                          packet.pointer.tool === "laser" ? "laser" : "pointer",
                      },
                    }
                  : {}),
                button: packet.button === "down" ? "down" : "up",
                selectedElementIds: packet.selectedElementIds || {},
              });
              api.updateScene({
                collaborators: new Map(session.collaborators),
              });
              return;
            }
            if (
              packet.type !== "scene" ||
              !Array.isArray(packet.elements) ||
              packet.elements.length > 50000 ||
              !packet.files ||
              !packet.background ||
              !/^#[a-f0-9]{3,8}$/i.test(packet.background.color) ||
              !Number.isFinite(packet.background.clock)
            ) {
              throw new Error("Invalid room update");
            }
            const remote = restoreElements(packet.elements, null);
            const merged = reconcileElements(
              api.getSceneElementsIncludingDeleted(),
              remote as RemoteExcalidrawElement[],
              api.getAppState(),
            );
            session.background = newerBackground(
              session.background,
              packet.background,
            );
            session.applying = true;
            try {
              api.addFiles(
                Object.values(packet.files).filter(
                  (file) =>
                    file &&
                    typeof file.dataURL === "string" &&
                    /^data:image\//.test(file.dataURL),
                ),
              );
              api.updateScene({
                elements: merged,
                appState: { viewBackgroundColor: session.background.color },
                captureUpdate: CaptureUpdateAction.NEVER,
              });
            } finally {
              session.applying = false;
            }
            if (initial) {
              api.history.clear();
            }
            // Republish only if reconciliation added local changes to the remote snapshot.
            // This keeps the relay's encrypted snapshot converged after simultaneous edits.
            const mergedFingerprint = sceneFingerprint(getScene(session));
            if (mergedFingerprint === sceneFingerprint(packet)) {
              session.lastSent = mergedFingerprint;
            } else {
              sendScene(session);
            }
            setError("");
          })
          .catch(() => {
            if (active.current === session) {
              if (initial) {
                session.blocked = true;
                setStatus("Invalid invite link");
                setDialogOpen(true);
              }
              setError(
                "Couldn't open this room update. Check the complete invite link, or save your drawing before leaving.",
              );
            }
          });
        return session.receiveQueue;
      };

      socket.on("connect", () => {
        session.ready = false;
        session.lastSent = "";
        setStatus("Connecting…");
        socket.timeout(45000).emit(
          "join",
          room.id,
          async (
            timeout: Error | null,
            response: {
              ok?: boolean;
              snapshot?: EncryptedPacket;
              error?: string;
            },
          ) => {
            if (active.current !== session) {
              return;
            }
            if (timeout || !response?.ok) {
              setStatus("Connection failed");
              setError(
                response?.error ||
                  "Couldn't join the room. The server may be starting; it will retry automatically.",
              );
              socket.disconnect();
              ownerWindow.setTimeout(() => {
                if (active.current === session) {
                  socket.connect();
                }
              }, 3000);
              return;
            }
            if (response.snapshot) {
              await receive("", response.snapshot, true);
            }
            if (active.current !== session || session.blocked) {
              return;
            }
            session.ready = true;
            setStatus("Connected");
            sendScene(session, true);
            sendPresence(session);
            socket.emit("request-sync", room.id);
          },
        );
      });
      socket.on("scene", (sender: string, encrypted: EncryptedPacket) => {
        void receive(sender, encrypted);
      });
      socket.on("presence", (sender: string, encrypted: EncryptedPacket) => {
        void receive(sender, encrypted);
      });
      socket.on("sync-requested", () => {
        sendScene(session, true);
        sendPresence(session);
      });
      socket.on("members", (members: string[]) => {
        if (active.current !== session) {
          return;
        }
        session.members = new Set(members);
        for (const id of session.collaborators.keys()) {
          if (!session.members.has(id)) {
            session.collaborators.delete(id);
            session.presence.delete(id);
          }
        }
        for (const id of members) {
          if (id !== socket.id && !session.collaborators.has(id as SocketId)) {
            session.collaborators.set(id as SocketId, {
              username: "Guest",
              socketId: id as SocketId,
            });
          }
        }
        api.updateScene({ collaborators: new Map(session.collaborators) });
        setPeople(members.length);
        if (session.following && !session.members.has(session.following)) {
          session.following = null;
          setUserToFollow(null);
        }
        sendPresence(session);
      });
      socket.on("disconnect", () => {
        if (active.current === session) {
          session.ready = false;
          setStatus("Reconnecting…");
          session.collaborators.clear();
          api.updateScene({ collaborators: new Map() });
          setPeople(0);
        }
      });
      socket.on("connect_error", () => {
        if (active.current === session) {
          setStatus("Reconnecting…");
          setError(
            "The room server is unavailable or waking up. Your drawing stays open; reconnecting automatically.",
          );
        }
      });
      socket.connect();
    },
    [api, root, getScene, sendScene, sendPresence],
  );

  const start = useCallback(async () => {
    if (!root.current || !localReady) {
      return;
    }
    const ownerWindow = root.current.ownerDocument.defaultView!;
    const id = Array.from(
      ownerWindow.crypto.getRandomValues(new Uint8Array(16)),
      (b) => b.toString(16).padStart(2, "0"),
    ).join("");
    try {
      const key = await generateEncryptionKey();
      connect({ id, key }, false);
    } catch {
      setError(
        "Couldn't start a secure room. Open Draw Board over HTTPS or on localhost.",
      );
    }
  }, [connect, localReady, root]);

  const onChange = useCallback(
    (
      elements: readonly OrderedExcalidrawElement[],
      appState: AppState,
      _files: BinaryFiles,
    ) => {
      const session = active.current;
      if (!session) {
        return false;
      }
      if (!session.applying && root.current) {
        if (appState.viewBackgroundColor !== session.background.color) {
          session.background = {
            color: appState.viewBackgroundColor,
            clock: Math.max(Date.now(), session.background.clock + 1),
            author: session.author,
          };
        }
        const ownerWindow = root.current.ownerDocument.defaultView!;
        if (session.sendTimer === undefined) {
          session.sendTimer = ownerWindow.setTimeout(() => {
            session.sendTimer = undefined;
            sendScene(session);
          }, 120);
        }
      }
      return true;
    },
    [root, sendScene],
  );

  const onPointerUpdate: NonNullable<ExcalidrawProps["onPointerUpdate"]> =
    useCallback(
      (payload) => {
        ownPresence.current = {
          type: "presence",
          username: nameRef.current,
          pointer: payload.pointer,
          button: payload.button,
        };
        const session = active.current;
        if (session && Date.now() - pointerTime.current > 33) {
          pointerTime.current = Date.now();
          sendPresence(session);
        }
      },
      [sendPresence],
    );

  useEffect(() => {
    if (!api || !root.current || !localReady) {
      return;
    }
    const ownerWindow = root.current.ownerDocument.defaultView!;
    const joinFromLink = () => {
      const room = parseRoom(ownerWindow.location.hash);
      if (room && !active.current) {
        connect(room, true);
      } else if (ownerWindow.location.hash.startsWith("#room=") && !room) {
        setError("This invite link is incomplete. Ask for the full link.");
        setDialogOpen(true);
      }
    };
    joinFromLink();
    ownerWindow.addEventListener("hashchange", joinFromLink);
    const heartbeat = ownerWindow.setInterval(() => {
      if (active.current) {
        sendPresence(active.current);
        sendScene(active.current);
      }
    }, 10000);
    return () => {
      ownerWindow.removeEventListener("hashchange", joinFromLink);
      ownerWindow.clearInterval(heartbeat);
      const session = active.current;
      if (session) {
        ownerWindow.clearTimeout(session.sendTimer);
        session.socket.disconnect();
        active.current = null;
        LocalData.resumeSave("collaboration");
      }
    };
  }, [api, root, localReady, connect, sendPresence, sendScene]);

  const open = useCallback(() => setDialogOpen(true), []);
  const onUserFollow: NonNullable<ExcalidrawProps["onUserFollow"]> =
    useCallback(
      (payload) => {
        const session = active.current;
        if (!session || !api) {
          return;
        }
        session.following =
          payload.action === "FOLLOW" ? payload.userToFollow.socketId : null;
        setUserToFollow(session.following ? payload.userToFollow : null);
        const presence =
          session.following && session.presence.get(session.following);
        if (
          presence &&
          presence.following !== session.socket.id &&
          presence.viewport?.length === 4 &&
          presence.viewport.every(Number.isFinite)
        ) {
          api.updateScene({
            appState: zoomToFitBounds({
              appState: api.getAppState(),
              bounds: presence.viewport,
              fit: "contain",
            }).appState,
          });
        }
        sendPresence(session);
      },
      [api, sendPresence],
    );
  const onScrollChange = useCallback(() => {
    if (active.current && Date.now() - pointerTime.current > 33) {
      pointerTime.current = Date.now();
      sendPresence(active.current);
    }
  }, [sendPresence]);
  const close = useCallback(() => {
    setDialogOpen(false);
    root.current?.querySelector<HTMLElement>(".excalidraw")?.focus();
  }, [root]);

  return {
    isCollaborating,
    isDialogOpen,
    status,
    error,
    link,
    people,
    userToFollow,
    onUserFollow,
    onScrollChange,
    username,
    configured: !!SERVER_URL,
    start,
    leave,
    onChange,
    onPointerUpdate,
    isActive: () => !!active.current,
    open,
    close,
    setUsername: (name: string) => {
      const value = name.slice(0, 40);
      nameRef.current = value || "Guest";
      setUsername(value);
      saveUsernameToLocalStorage(value);
      if (active.current) {
        sendPresence(active.current);
      }
    },
    copyLink: async () => {
      if (root.current) {
        await root.current.ownerDocument.defaultView!.navigator.clipboard.writeText(
          link,
        );
      }
    },
  };
};
