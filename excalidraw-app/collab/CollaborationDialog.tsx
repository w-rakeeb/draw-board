import { useEffect, useState } from "react";
import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import { useEditorInterface } from "@excalidraw/excalidraw/components/App";
import { LiveCollaborationTrigger } from "@excalidraw/excalidraw";

import "./collaboration.scss";

import type { useCollaboration } from "./useCollaboration";

export const CollaborationButton = ({
  collaboration: c,
}: {
  collaboration: ReturnType<typeof useCollaboration>;
}) => (
  <LiveCollaborationTrigger
    isCollaborating={c.isCollaborating}
    onSelect={c.open}
    aria-label="Live collaboration"
    editorInterface={useEditorInterface()}
  />
);

export const CollaborationDialog = ({
  collaboration: c,
}: {
  collaboration: ReturnType<typeof useCollaboration>;
}) => {
  const [copied, setCopied] = useState(false);
  const [dialogNode, setDialogNode] = useState<HTMLDivElement | null>(null);
  const close = c.close;
  useEffect(() => setCopied(false), [c.link]);
  useEffect(() => {
    if (!c.isDialogOpen || !dialogNode) {
      return;
    }
    const ownerDocument = dialogNode.ownerDocument;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
      }
    };
    ownerDocument.addEventListener("keydown", onKeyDown, true);
    return () => ownerDocument.removeEventListener("keydown", onKeyDown, true);
  }, [c.isDialogOpen, close, dialogNode]);
  if (!c.isDialogOpen) {
    return null;
  }
  return (
    <Dialog title="Live collaboration" size="small" onCloseRequest={c.close}>
      <div className="draw-board-collaboration" ref={setDialogNode}>
        <p>
          Draw together in real time. Invite anyone with a link. No account
          needed.
        </p>
        <label>
          Your name
          <input
            aria-label="Your name"
            maxLength={40}
            value={c.username}
            onChange={(event) => c.setUsername(event.target.value)}
          />
        </label>
        {c.isCollaborating ? (
          <>
            <p role="status">
              {c.status} · {c.people} {c.people === 1 ? "person" : "people"} in
              this room
            </p>
            <label>
              Invite link
              <input
                aria-label="Invite link"
                autoFocus
                value={c.link}
                readOnly
                onFocus={(event) => event.target.select()}
              />
            </label>
            <button
              className="draw-board-primary"
              onClick={() => {
                void c
                  .copyLink()
                  .then(() => setCopied(true))
                  .catch(() => setCopied(false));
              }}
            >
              {copied ? "Copied!" : "Copy invite link"}
            </button>
            <p className="draw-board-room-note">
              Anyone with this link can view and edit. The drawing is encrypted
              before it leaves your browser. Save a file to keep a copy; rooms
              are temporary.
            </p>
            <div className="draw-board-room-actions">
              <button onClick={() => c.leave(false)}>
                Leave and restore my drawing
              </button>
              <button onClick={() => c.leave(true)}>
                Leave and keep this drawing
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              className="draw-board-primary"
              disabled={!c.configured}
              onClick={() => {
                void c.start();
              }}
            >
              Start a shared room
            </button>
            <p className="draw-board-room-note">
              Your current drawing will be shared. You can restore your private
              drawing when you leave.
            </p>
            {!c.configured && (
              <p role="status">
                Live collaboration is being set up. You can keep drawing and
                saving files.
              </p>
            )}
          </>
        )}
        {c.error && <p role="alert">{c.error}</p>}
        <button onClick={c.close}>Close</button>
      </div>
    </Dialog>
  );
};
