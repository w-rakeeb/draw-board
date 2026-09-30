import { Footer } from "@excalidraw/excalidraw";
import React from "react";
export const AppFooter = React.memo(() => (
  <Footer>
    <span
      style={{
        fontSize: 11,
        color: "var(--color-gray-50)",
        whiteSpace: "nowrap",
      }}
    >
      Made by Wrakeeb
    </span>
  </Footer>
));
