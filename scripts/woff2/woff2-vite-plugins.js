/** Serve the bundled drawing fonts from this website. */
/** @returns {import("vite").PluginOption} */
module.exports.woff2BrowserPlugin = () => ({
  name: "drawBoardLocalFonts",
  enforce: "pre",
  transform(code, id) {
    if (id.endsWith("excalidraw-app/index.html")) {
      return code.replace("<!-- PLACEHOLDER:EXCALIDRAW_APP_FONTS -->",
        `<script>window.EXCALIDRAW_ASSET_PATH = window.location.origin;</script>`);
    }
  },
});
