import {
  Excalidraw,
  CaptureUpdateAction,
  ExcalidrawAPIProvider,
  useExcalidrawAPI,
} from "@excalidraw/excalidraw";
import {
  EVENT,
  debounce,
  preventUnload,
  resolvablePromise,
} from "@excalidraw/common";

import { newElementWith, isInitializedImageElement } from "@excalidraw/element";

import {
  CommandPalette,
  DEFAULT_CATEGORIES,
} from "@excalidraw/excalidraw/components/CommandPalette/CommandPalette";
import { OverwriteConfirmDialog } from "@excalidraw/excalidraw/components/OverwriteConfirm/OverwriteConfirm";
import { useHandleLibrary } from "@excalidraw/excalidraw/data/library";
import polyfill from "@excalidraw/excalidraw/polyfill";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  AppState,
  BinaryFiles,
  ExcalidrawInitialDataState,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/element/types";
import type { ResolvablePromise } from "@excalidraw/common/utils";

import CustomStats from "./CustomStats";
import { Provider, appJotaiStore, useAtomValue } from "./app-jotai";
import { STORAGE_KEYS, SYNC_BROWSER_TABS_TIMEOUT } from "./app_constants";
import { AppFooter } from "./components/AppFooter";
import { AppMainMenu } from "./components/AppMainMenu";
import { AppWelcomeScreen } from "./components/AppWelcomeScreen";
import { TopErrorBoundary } from "./components/TopErrorBoundary";
import { updateStaleImageStatuses } from "./data/FileManager";
import { FileStatusStore } from "./data/fileStatusStore";
import { importFromLocalStorage } from "./data/localStorage";
import {
  LibraryIndexedDBAdapter,
  LibraryLocalStorageMigrationAdapter,
  LocalData,
  localStorageQuotaExceededAtom,
} from "./data/LocalData";
import { isBrowserStorageStateNewer } from "./data/tabSync";
import { useHandleAppTheme } from "./useHandleAppTheme";
import { getPreferredLanguage } from "./app-language/language-detector";
import { useAppLangCode } from "./app-language/language-state";
import "./index.scss";
import { useCollaboration } from "./collab/useCollaboration";
import {
  CollaborationButton,
  CollaborationDialog,
} from "./collab/CollaborationDialog";

polyfill();
window.EXCALIDRAW_THROTTLE_RENDER = true;

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DrawBoardEditor = () => {
  const excalidrawAPI = useExcalidrawAPI();
  const rootRef = useRef<HTMLDivElement>(null);
  const [localReady, setLocalReady] = useState(false);
  const collaboration = useCollaboration(excalidrawAPI, rootRef, localReady);
  const onCollaborativeChange = collaboration.onChange;
  const installPromptRef = useRef<InstallPromptEvent | null>(null);
  const { editorTheme, appTheme, setAppTheme } = useHandleAppTheme();
  const [langCode, setLangCode] = useAppLangCode();
  const quotaExceeded = useAtomValue(localStorageQuotaExceededAtom);
  const initialDataRef =
    useRef<ResolvablePromise<ExcalidrawInitialDataState | null> | null>(null);
  if (!initialDataRef.current) {
    initialDataRef.current =
      resolvablePromise<ExcalidrawInitialDataState | null>();
  }
  useHandleLibrary({
    excalidrawAPI,
    adapter: LibraryIndexedDBAdapter,
    migrationAdapter: LibraryLocalStorageMigrationAdapter,
  });

  const loadImages = useCallback(async () => {
    if (!excalidrawAPI) {
      return;
    }
    const elements = excalidrawAPI.getSceneElementsIncludingDeleted();
    const files = excalidrawAPI.getFiles();
    const fileIds = elements
      .filter(isInitializedImageElement)
      .map((element) => element.fileId)
      .filter((id) => !files[id]);
    if (fileIds.length) {
      const { loadedFiles, erroredFiles } =
        await LocalData.fileStorage.getFiles(fileIds);
      excalidrawAPI.addFiles(loadedFiles);
      updateStaleImageStatuses({
        excalidrawAPI,
        erroredFiles,
        elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
      });
    }
  }, [excalidrawAPI]);

  useEffect(() => {
    if (!excalidrawAPI || !rootRef.current) {
      return;
    }
    const ownerDocument = rootRef.current.ownerDocument;
    const ownerWindow = ownerDocument.defaultView!;
    let cancelled = false;
    const restoreLocalDrawing = async () => {
      const scene = importFromLocalStorage();
      const fileIds = scene.elements
        .filter(isInitializedImageElement)
        .map((element) => element.fileId);
      const { loadedFiles } = await LocalData.fileStorage.getFiles(fileIds);
      if (!cancelled) {
        initialDataRef.current!.resolve({
          ...scene,
          files: Object.fromEntries(loadedFiles.map((file) => [file.id, file])),
        });
        ownerWindow.setTimeout(() => !cancelled && setLocalReady(true), 0);
        void LocalData.fileStorage.clearObsoleteFiles({
          currentFileIds: fileIds,
        });
      }
    };
    void restoreLocalDrawing().catch((error) => {
      if (!cancelled) {
        console.error(error);
        initialDataRef.current!.resolve(importFromLocalStorage());
        ownerWindow.setTimeout(() => !cancelled && setLocalReady(true), 0);
      }
    });
    const syncData = debounce(() => {
      if (LocalData.isSavePaused()) {
        return;
      }
      if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_DATA_STATE)) {
        excalidrawAPI.updateScene({
          ...importFromLocalStorage(),
          captureUpdate: CaptureUpdateAction.NEVER,
        });
        setLangCode(getPreferredLanguage());
        void LibraryIndexedDBAdapter.load().then((data) => {
          if (data && !cancelled) {
            void excalidrawAPI.updateLibrary({
              libraryItems: data.libraryItems,
            });
          }
        });
      }
      if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_FILES)) {
        void loadImages();
      }
    }, SYNC_BROWSER_TABS_TIMEOUT);
    const flushSave = () => LocalData.flushSave();
    const onVisibilityChange = () => {
      if (ownerDocument.hidden) {
        flushSave();
      } else {
        syncData();
      }
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      flushSave();
      if (
        LocalData.fileStorage.shouldPreventUnload(
          excalidrawAPI.getSceneElements(),
        )
      ) {
        preventUnload(event);
      }
    };
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      installPromptRef.current = event as InstallPromptEvent;
    };
    ownerWindow.addEventListener(EVENT.UNLOAD, flushSave);
    ownerWindow.addEventListener(EVENT.BLUR, flushSave);
    ownerWindow.addEventListener(EVENT.FOCUS, syncData);
    ownerWindow.addEventListener("storage", syncData);
    ownerWindow.addEventListener(EVENT.BEFORE_UNLOAD, beforeUnload);
    ownerWindow.addEventListener("beforeinstallprompt", onInstallPrompt);
    ownerDocument.addEventListener(EVENT.VISIBILITY_CHANGE, onVisibilityChange);
    return () => {
      cancelled = true;
      flushSave();
      syncData.cancel();
      ownerWindow.removeEventListener(EVENT.UNLOAD, flushSave);
      ownerWindow.removeEventListener(EVENT.BLUR, flushSave);
      ownerWindow.removeEventListener(EVENT.FOCUS, syncData);
      ownerWindow.removeEventListener("storage", syncData);
      ownerWindow.removeEventListener(EVENT.BEFORE_UNLOAD, beforeUnload);
      ownerWindow.removeEventListener("beforeinstallprompt", onInstallPrompt);
      ownerDocument.removeEventListener(
        EVENT.VISIBILITY_CHANGE,
        onVisibilityChange,
      );
    };
  }, [excalidrawAPI, loadImages, setLangCode]);

  const onChange = useCallback(
    (
      elements: readonly OrderedExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles,
    ) => {
      if (onCollaborativeChange(elements, appState, files)) {
        return;
      }
      LocalData.save(elements, appState, files, () => {
        if (!excalidrawAPI) {
          return;
        }
        let changed = false;
        const updatedElements = excalidrawAPI
          .getSceneElementsIncludingDeleted()
          .map((element) => {
            if (LocalData.fileStorage.shouldUpdateImageElementStatus(element)) {
              changed = true;
              return newElementWith(element, { status: "saved" });
            }
            return element;
          });
        if (changed) {
          excalidrawAPI.updateScene({
            elements: updatedElements,
            captureUpdate: CaptureUpdateAction.NEVER,
          });
        }
      });
    },
    [excalidrawAPI, onCollaborativeChange],
  );

  const onExport: Required<ExcalidrawProps>["onExport"] = useCallback(
    async function* () {
      let snapshot = FileStatusStore.getSnapshot();
      let { pending, total } = FileStatusStore.getPendingCount(snapshot.value);
      while (pending > 0) {
        yield {
          type: "progress",
          progress: (total - pending) / total,
          message: `Loading images (${total - pending}/${total})...`,
        };
        snapshot = await FileStatusStore.pull(snapshot.version);
        ({ pending, total } = FileStatusStore.getPendingCount(snapshot.value));
      }
    },
    [],
  );

  return (
    <div className="excalidraw-app" style={{ height: "100%" }} ref={rootRef}>
      <Excalidraw
        onChange={onChange}
        onExport={onExport}
        initialData={initialDataRef.current}
        aiEnabled={false}
        isCollaborating={collaboration.isCollaborating}
        onPointerUpdate={collaboration.onPointerUpdate}
        onUserFollow={collaboration.onUserFollow}
        userToFollow={collaboration.userToFollow}
        onScrollChange={collaboration.onScrollChange}
        renderTopRightUI={(isMobile) =>
          isMobile ? null : (
            <CollaborationButton collaboration={collaboration} />
          )
        }
        UIOptions={{
          canvasActions: {
            toggleTheme: true,
            export: { saveFileToDisk: true },
          },
        }}
        langCode={langCode}
        renderCustomStats={(elements, appState) => (
          <CustomStats
            setToast={(message) => excalidrawAPI?.setToast({ message })}
            appState={appState}
            elements={elements}
          />
        )}
        detectScroll={false}
        handleKeyboardGlobally={true}
        autoFocus={true}
        theme={editorTheme}
        onThemeChange={setAppTheme}
      >
        <AppMainMenu
          theme={appTheme}
          onCollaboration={collaboration.open}
          isCollaborating={collaboration.isCollaborating}
        />
        <AppWelcomeScreen onCollaboration={collaboration.open} />
        <CollaborationDialog collaboration={collaboration} />
        <OverwriteConfirmDialog>
          <OverwriteConfirmDialog.Actions.SaveToDisk />
        </OverwriteConfirmDialog>
        <AppFooter />
        {collaboration.isCollaborating && collaboration.status !== "Connected" && (
          <div className="excalidraw-notice" role="status">
            {collaboration.status} Your drawing stays open. Save a file to keep
            a copy.
          </div>
        )}
        {quotaExceeded && (
          <div className="excalidraw-notice">
            Your browser storage is full. Save your drawing to a file to keep a
            copy.
          </div>
        )}
        <CommandPalette
          customCommandPaletteItems={[
            {
              label: "Live collaboration",
              category: DEFAULT_CATEGORIES.app,
              perform: collaboration.open,
            },
            {
              label: "Install Draw Board",
              category: DEFAULT_CATEGORIES.app,
              predicate: () => !!installPromptRef.current,
              perform: async () => {
                const prompt = installPromptRef.current;
                if (prompt) {
                  await prompt.prompt();
                  await prompt.userChoice;
                  installPromptRef.current = null;
                }
              },
            },
          ]}
        />
      </Excalidraw>
    </div>
  );
};

const DrawBoardApp = () => (
  <TopErrorBoundary>
    <Provider store={appJotaiStore}>
      <ExcalidrawAPIProvider>
        <DrawBoardEditor />
      </ExcalidrawAPIProvider>
    </Provider>
  </TopErrorBoundary>
);
export default DrawBoardApp;
