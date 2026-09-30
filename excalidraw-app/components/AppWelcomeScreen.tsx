import { useI18n } from "@excalidraw/excalidraw/i18n";
import { WelcomeScreen } from "@excalidraw/excalidraw";
import React from "react";

import { DRAW_BOARD_NAME, DrawBoardMark } from "../branding";

export const AppWelcomeScreen = React.memo(() => {
  const { t } = useI18n();
  return (
    <WelcomeScreen>
      <WelcomeScreen.Hints.MenuHint>
        {t("welcomeScreen.app.menuHint")}
      </WelcomeScreen.Hints.MenuHint>
      <WelcomeScreen.Hints.ToolbarHint />
      <WelcomeScreen.Hints.HelpHint />
      <WelcomeScreen.Center>
        <WelcomeScreen.Center.Logo>
          <DrawBoardMark />
          <span style={{ color: "var(--color-primary)" }}>
            {DRAW_BOARD_NAME.toUpperCase()}
          </span>
        </WelcomeScreen.Center.Logo>
        <WelcomeScreen.Center.Heading>
          Draw, write, and make room for your ideas.
          <br />
          Your work saves in this browser. Save a file to keep a copy.
        </WelcomeScreen.Center.Heading>
        <WelcomeScreen.Center.Menu>
          <WelcomeScreen.Center.MenuItemLoadScene />
          <WelcomeScreen.Center.MenuItemHelp />
        </WelcomeScreen.Center.Menu>
      </WelcomeScreen.Center>
    </WelcomeScreen>
  );
});
