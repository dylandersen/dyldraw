import { loginIcon } from "@excalidraw/excalidraw/components/icons";
import { useI18n } from "@excalidraw/excalidraw/i18n";
import { WelcomeScreen } from "@excalidraw/excalidraw/index";
import React from "react";

import { DyldrawWelcomeLogo } from "./DyldrawLogo";

export const AppWelcomeScreen: React.FC<{
  onCollabDialogOpen: () => any;
  onAuthDialogOpen: () => void;
  onCloudLoad: () => void;
  isAuthenticated: boolean;
  isCollabEnabled: boolean;
}> = React.memo((props) => {
  const { t } = useI18n();
  const headingContent = (
    <>
      Draw ideas fast with Dyldraw.
      <br />
      Collaborate live.
      <br />
      Keep your flow moving.
    </>
  );

  return (
    <WelcomeScreen>
      <WelcomeScreen.Hints.MenuHint>
        {t("welcomeScreen.app.menuHint")}
      </WelcomeScreen.Hints.MenuHint>
      <WelcomeScreen.Hints.ToolbarHint />
      <WelcomeScreen.Hints.HelpHint />
      <WelcomeScreen.Center>
        <WelcomeScreen.Center.Logo>
          <DyldrawWelcomeLogo />
        </WelcomeScreen.Center.Logo>
        <WelcomeScreen.Center.Heading>
          {headingContent}
        </WelcomeScreen.Center.Heading>
        <WelcomeScreen.Center.Menu>
          <WelcomeScreen.Center.MenuItemLoadScene />
          <WelcomeScreen.Center.MenuItemHelp />
          {props.isCollabEnabled && (
            <WelcomeScreen.Center.MenuItemLiveCollaborationTrigger
              onSelect={() => props.onCollabDialogOpen()}
            />
          )}
          {props.isAuthenticated ? (
            <WelcomeScreen.Center.MenuItem
              onSelect={props.onCloudLoad}
              shortcut={null}
              icon={loginIcon}
            >
              Load from Dyldraw Cloud
            </WelcomeScreen.Center.MenuItem>
          ) : (
            <WelcomeScreen.Center.MenuItem
              onSelect={props.onAuthDialogOpen}
              shortcut={null}
              icon={loginIcon}
            >
              Sign in
            </WelcomeScreen.Center.MenuItem>
          )}
        </WelcomeScreen.Center.Menu>
      </WelcomeScreen.Center>
    </WelcomeScreen>
  );
});
