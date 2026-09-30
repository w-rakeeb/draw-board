import { getDefaultAppState } from "../appState";
import { loadFromBlob, normalizeFile, parseLibraryJSON } from "../data/blob";
import { serializeAsJSON, serializeLibraryAsJSON } from "../data/json";
import { API } from "./helpers/api";

const rectangle = () =>
  API.createElement({
    type: "rectangle",
    id: "saved-shape",
    width: 100,
    height: 80,
  });

describe("Draw Board files and previous drawing compatibility", () => {
  it.each(["drawboard", "excalidraw"])(
    "restores %s scenes without losing drawing geometry",
    async (type) => {
      const json = JSON.parse(
        serializeAsJSON([rectangle()], getDefaultAppState(), {}, "local"),
      );
      expect(json.type).toBe("drawboard");
      json.type = type;
      const scene = await loadFromBlob(
        new Blob([JSON.stringify(json)], { type: "application/json" }),
        null,
        null,
      );
      expect(scene.elements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "saved-shape",
            type: "rectangle",
            width: 100,
            height: 80,
          }),
        ]),
      );
    },
  );

  it.each(["drawboardlib", "excalidrawlib"])(
    "restores %s libraries with reusable shapes",
    async (type) => {
      const json = JSON.parse(
        serializeLibraryAsJSON([
          {
            id: "saved-library",
            status: "unpublished",
            created: 1,
            elements: [rectangle()],
          },
        ]),
      );
      expect(json.type).toBe("drawboardlib");
      json.type = type;
      const library = parseLibraryJSON(JSON.stringify(json));
      expect(library[0].elements[0].id).toBe("saved-shape");
    },
  );

  it.each(["drawboard", "drawboardlib"])(
    "normalizes .%s files supplied with an unknown MIME type",
    async (extension) => {
      const file = await normalizeFile(
        new File(["{}"], `drawing.${extension}`, {
          type: "application/octet-stream",
        }),
      );
      expect(file.type).not.toBe("application/octet-stream");
      expect(file.name).toBe(`drawing.${extension}`);
    },
  );
});
