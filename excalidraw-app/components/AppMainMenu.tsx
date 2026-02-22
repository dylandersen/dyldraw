import {
  loginIcon,
  eyeIcon,
  save,
  downloadIcon,
} from "@excalidraw/excalidraw/components/icons";
import { MainMenu } from "@excalidraw/excalidraw/index";
import React from "react";

import { isDevEnv } from "@excalidraw/common";

import type { Theme } from "@excalidraw/element/types";

import { LanguageList } from "../app-language/LanguageList";

import { DyldrawLogoIcon } from "./DyldrawLogo";

import { saveDebugState } from "./DebugCanvas";

export const AppMainMenu: React.FC<{
  onCollabDialogOpen: () => any;
  onAuthDialogOpen: () => void;
  onCloudSave: () => void;
  onCloudLoad: () => void;
  onSignOut: () => void;
  isAuthenticated: boolean;
  signedInLabel: string | null;
  cloudSyncLabel: string | null;
  isCloudActionInProgress: boolean;
  isCollaborating: boolean;
  isCollabEnabled: boolean;
  theme: Theme | "system";
  setTheme: (theme: Theme | "system") => void;
  refresh: () => void;
}> = React.memo((props) => {
  return (
    <MainMenu>
      <MainMenu.DefaultItems.LoadScene />
      <MainMenu.DefaultItems.SaveToActiveFile />
      <MainMenu.DefaultItems.Export />
      <MainMenu.DefaultItems.SaveAsImage />
      {props.isCollabEnabled && (
        <MainMenu.DefaultItems.LiveCollaborationTrigger
          isCollaborating={props.isCollaborating}
          onSelect={() => props.onCollabDialogOpen()}
        />
      )}
      <MainMenu.DefaultItems.CommandPalette className="highlighted" />
      <MainMenu.DefaultItems.SearchMenu />
      <MainMenu.DefaultItems.Help />
      <MainMenu.DefaultItems.ClearCanvas />
      <MainMenu.Separator />
      <MainMenu.ItemLink
        icon={<DyldrawLogoIcon />}
        href="https://dyldraw.com"
        className=""
      >
        Dyldraw
      </MainMenu.ItemLink>
      {props.isAuthenticated ? (
        <>
          <MainMenu.Item
            icon={save}
            onSelect={props.onCloudSave}
            className="highlighted"
          >
            Save to Dyldraw
          </MainMenu.Item>
          <MainMenu.Item icon={downloadIcon} onSelect={props.onCloudLoad}>
            Load from Dyldraw
          </MainMenu.Item>
          <MainMenu.Item icon={loginIcon} onSelect={props.onSignOut}>
            Sign out
          </MainMenu.Item>
          {props.signedInLabel && (
            <MainMenu.Item disabled>{props.signedInLabel}</MainMenu.Item>
          )}
          {props.cloudSyncLabel && (
            <MainMenu.Item disabled>{props.cloudSyncLabel}</MainMenu.Item>
          )}
        </>
      ) : (
        <MainMenu.Item
          icon={loginIcon}
          onSelect={props.onAuthDialogOpen}
          className="highlighted"
        >
          Sign in
        </MainMenu.Item>
      )}
      {isDevEnv() && (
        <MainMenu.Item
          icon={eyeIcon}
          onSelect={() => {
            if (window.visualDebug) {
              delete window.visualDebug;
              saveDebugState({ enabled: false });
            } else {
              window.visualDebug = { data: [] };
              saveDebugState({ enabled: true });
            }
            props?.refresh();
          }}
        >
          Visual Debug
        </MainMenu.Item>
      )}
      <MainMenu.Separator />
      <MainMenu.DefaultItems.Preferences />
      <MainMenu.DefaultItems.ToggleTheme
        allowSystemTheme
        theme={props.theme}
        onSelect={props.setTheme}
      />
      <MainMenu.ItemCustom>
        <LanguageList style={{ width: "100%" }} />
      </MainMenu.ItemCustom>
      <MainMenu.DefaultItems.ChangeCanvasBackground />
    </MainMenu>
  );
});
