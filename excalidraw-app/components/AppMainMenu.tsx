import { GithubIcon } from "@excalidraw/excalidraw/components/icons";
import { MainMenu } from "@excalidraw/excalidraw";
import React from "react";

import type { Theme } from "@excalidraw/element/types";

import { DRAW_BOARD_REPOSITORY } from "../branding";
import { LanguageList } from "../app-language/LanguageList";

export const AppMainMenu: React.FC<{
  theme: Theme | "system";
  onCollaboration: () => void;
  isCollaborating: boolean;
}> = React.memo(({ theme, onCollaboration, isCollaborating }) => (
  <MainMenu>
    <MainMenu.DefaultItems.LoadScene />
    <MainMenu.DefaultItems.SaveToActiveFile />
    <MainMenu.DefaultItems.Export />
    <MainMenu.DefaultItems.SaveAsImage />
    <MainMenu.DefaultItems.LiveCollaborationTrigger
      onSelect={onCollaboration}
      isCollaborating={isCollaborating}
    />
    <MainMenu.DefaultItems.CommandPalette className="highlighted" />
    <MainMenu.DefaultItems.SearchMenu />
    <MainMenu.DefaultItems.Help />
    <MainMenu.DefaultItems.ClearCanvas />
    <MainMenu.Separator />
    <MainMenu.ItemLink icon={GithubIcon} href={DRAW_BOARD_REPOSITORY}>
      Draw Board by Wrakeeb
    </MainMenu.ItemLink>
    <MainMenu.Separator />
    <MainMenu.DefaultItems.Preferences />
    <MainMenu.DefaultItems.ToggleTheme allowSystemTheme theme={theme} />
    <MainMenu.ItemCustom>
      <LanguageList style={{ width: "100%" }} />
    </MainMenu.ItemCustom>
    <MainMenu.DefaultItems.ChangeCanvasBackground />
  </MainMenu>
));
