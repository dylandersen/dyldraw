import React, { useState } from "react";

import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import DialogActionButton from "@excalidraw/excalidraw/components/DialogActionButton";

import "./DyldrawAuthDialog.scss";
import { DyldrawLogoIcon } from "./DyldrawLogo";
import { GoogleLogoIcon } from "./GoogleLogoIcon";

export const DyldrawAuthDialog = ({
  isOpen,
  onClose,
  onSignInWithEmail,
  onSignUpWithEmail,
  onSignInWithGoogle,
  isSubmitting,
  errorMessage,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSignInWithEmail: (email: string, password: string) => Promise<void>;
  onSignUpWithEmail: (email: string, password: string) => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  isSubmitting: boolean;
  errorMessage: string | null;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) {
    return null;
  }

  const emailReady = email.trim().length > 0 && password.length > 0;

  return (
    <Dialog size="small" onCloseRequest={onClose} title="Sign in to Dyldraw">
      <div className="dyldraw-auth-dialog">
        <div className="dyldraw-auth-dialog__brand">
          <DyldrawLogoIcon size={20} rounded />
          <span>Dyldraw Cloud</span>
        </div>
        <p className="dyldraw-auth-dialog__copy">
          Use your account to save your canvas to Dyldraw Cloud.
        </p>
        <label className="dyldraw-auth-dialog__label" htmlFor="dyldraw-email">
          Email
        </label>
        <input
          id="dyldraw-email"
          className="dyldraw-auth-dialog__input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          disabled={isSubmitting}
        />
        <label
          className="dyldraw-auth-dialog__label"
          htmlFor="dyldraw-password"
        >
          Password
        </label>
        <input
          id="dyldraw-password"
          className="dyldraw-auth-dialog__input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          placeholder="••••••••"
          disabled={isSubmitting}
        />
        {errorMessage && (
          <div className="dyldraw-auth-dialog__error">{errorMessage}</div>
        )}
        <div className="dyldraw-auth-dialog__actions">
          <DialogActionButton
            label="Sign in"
            actionType="primary"
            isLoading={isSubmitting}
            disabled={!emailReady || isSubmitting}
            onClick={() => onSignInWithEmail(email.trim(), password)}
          >
            <DyldrawLogoIcon size={16} rounded />
          </DialogActionButton>
          <DialogActionButton
            label="Create account"
            isLoading={isSubmitting}
            disabled={!emailReady || isSubmitting}
            onClick={() => onSignUpWithEmail(email.trim(), password)}
          />
        </div>
        <div className="dyldraw-auth-dialog__divider">or</div>
        <DialogActionButton
          label="Continue with Google"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          onClick={() => onSignInWithGoogle()}
        >
          <GoogleLogoIcon size={16} />
        </DialogActionButton>
      </div>
    </Dialog>
  );
};
