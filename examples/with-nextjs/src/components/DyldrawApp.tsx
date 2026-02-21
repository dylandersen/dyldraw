"use client";

import {
  CaptureUpdateAction,
  Excalidraw,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";

import { isValidUsername, normalizeUsername, usernameFromEmail, usernameToEmail } from "../lib/auth";
import { auth, db, firebaseConfigReady } from "../lib/firebase";

type SavedScene = {
  id: string;
  name: string;
  data: string;
  updatedAt?: Timestamp;
};

type AuthMode = "login" | "signup";

const DEFAULT_SCENE_NAME = "Untitled";
const FIRESTORE_DOC_LIMIT_BYTES = 900_000;

const formatSceneDate = (updatedAt?: Timestamp) => {
  if (!updatedAt) {
    return "just now";
  }
  return updatedAt.toDate().toLocaleString();
};

const getFirebaseErrorMessage = (error: unknown) => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  if (code.includes("auth/invalid-credential")) {
    return "Invalid username or password.";
  }
  if (code.includes("auth/email-already-in-use")) {
    return "That username is already taken.";
  }
  if (code.includes("auth/weak-password")) {
    return "Password is too weak. Use at least 8 characters.";
  }
  if (code.includes("auth/too-many-requests")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  return "Something went wrong. Please try again.";
};

const DyldrawApp = () => {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [statusMessage, setStatusMessage] = useState(
    "Sign in to start saving drawings.",
  );
  const [sceneName, setSceneName] = useState(DEFAULT_SCENE_NAME);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [savedScenes, setSavedScenes] = useState<SavedScene[]>([]);
  const [sceneSaving, setSceneSaving] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
      if (!nextUser) {
        setSavedScenes([]);
        setActiveSceneId(null);
        setSceneName(DEFAULT_SCENE_NAME);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !user) {
      return;
    }

    const scenesQuery = query(
      collection(db, "users", user.uid, "scenes"),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      scenesQuery,
      (snapshot) => {
        const nextScenes = snapshot.docs.map((entry) => {
          const data = entry.data() as {
            name?: string;
            data?: string;
            updatedAt?: Timestamp;
          };

          return {
            id: entry.id,
            name: data.name || "Untitled",
            data: data.data || "",
            updatedAt: data.updatedAt,
          } satisfies SavedScene;
        });

        setSavedScenes(nextScenes);
      },
      () => {
        setStatusMessage("Could not load saved scenes.");
      },
    );

    return () => unsubscribe();
  }, [user]);

  const loggedInUsername = useMemo(() => usernameFromEmail(user?.email), [user]);

  const handleAuthSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!auth || !db) {
        return;
      }

      const normalizedUsername = normalizeUsername(usernameInput);

      if (!isValidUsername(normalizedUsername)) {
        setStatusMessage(
          "Username can only contain letters, numbers, periods, underscores, or dashes.",
        );
        return;
      }

      if (passwordInput.length < 8) {
        setStatusMessage("Use a password with at least 8 characters.");
        return;
      }

      if (authMode === "signup" && passwordInput !== confirmPasswordInput) {
        setStatusMessage("Passwords do not match.");
        return;
      }

      setAuthSubmitting(true);
      setStatusMessage(authMode === "signup" ? "Creating account..." : "Signing in...");

      try {
        if (authMode === "signup") {
          const credentials = await createUserWithEmailAndPassword(
            auth,
            usernameToEmail(normalizedUsername),
            passwordInput,
          );

          await setDoc(
            doc(db, "profiles", credentials.user.uid),
            {
              username: normalizedUsername,
              createdAt: serverTimestamp(),
            },
            { merge: true },
          );
          setStatusMessage("Account created. You're ready to draw.");
        } else {
          await signInWithEmailAndPassword(
            auth,
            usernameToEmail(normalizedUsername),
            passwordInput,
          );
          setStatusMessage("Welcome back.");
        }

        setPasswordInput("");
        setConfirmPasswordInput("");
      } catch (error) {
        setStatusMessage(getFirebaseErrorMessage(error));
      } finally {
        setAuthSubmitting(false);
      }
    },
    [authMode, confirmPasswordInput, passwordInput, usernameInput],
  );

  const handleSaveScene = useCallback(async () => {
    if (!user || !db || !excalidrawAPI) {
      return;
    }

    const trimmedName = sceneName.trim() || DEFAULT_SCENE_NAME;
    const payload = serializeAsJSON(
      excalidrawAPI.getSceneElementsIncludingDeleted(),
      excalidrawAPI.getAppState(),
      excalidrawAPI.getFiles(),
      "database",
    );

    if (payload.length > FIRESTORE_DOC_LIMIT_BYTES) {
      setStatusMessage(
        "This scene is too large for this storage mode. Remove some embedded data and try again.",
      );
      return;
    }

    setSceneSaving(true);
    setStatusMessage("Saving scene...");

    try {
      const scenesCollection = collection(db, "users", user.uid, "scenes");
      if (activeSceneId) {
        await updateDoc(doc(scenesCollection, activeSceneId), {
          name: trimmedName,
          data: payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        const newScene = await addDoc(scenesCollection, {
          name: trimmedName,
          data: payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setActiveSceneId(newScene.id);
      }

      setSceneName(trimmedName);
      setStatusMessage(`Saved "${trimmedName}".`);
    } catch {
      setStatusMessage("Failed to save the scene.");
    } finally {
      setSceneSaving(false);
    }
  }, [activeSceneId, excalidrawAPI, sceneName, user]);

  const handleLoadScene = useCallback(
    (scene: SavedScene) => {
      if (!excalidrawAPI) {
        return;
      }

      try {
        const parsed = JSON.parse(scene.data) as {
          elements?: readonly any[];
          appState?: Record<string, unknown>;
        };

        if (!Array.isArray(parsed.elements)) {
          setStatusMessage("This scene is invalid and could not be loaded.");
          return;
        }

        excalidrawAPI.updateScene({
          elements: parsed.elements,
          appState: parsed.appState || {},
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });

        setActiveSceneId(scene.id);
        setSceneName(scene.name);
        setStatusMessage(`Loaded "${scene.name}".`);
      } catch {
        setStatusMessage("Failed to parse the saved scene.");
      }
    },
    [excalidrawAPI],
  );

  const handleDeleteScene = useCallback(
    async (scene: SavedScene) => {
      if (!db || !user) {
        return;
      }

      const shouldDelete = window.confirm(`Delete "${scene.name}"?`);
      if (!shouldDelete) {
        return;
      }

      try {
        await deleteDoc(doc(db, "users", user.uid, "scenes", scene.id));
        if (scene.id === activeSceneId) {
          setActiveSceneId(null);
          setSceneName(DEFAULT_SCENE_NAME);
          excalidrawAPI?.resetScene();
        }
        setStatusMessage(`Deleted "${scene.name}".`);
      } catch {
        setStatusMessage("Failed to delete this scene.");
      }
    },
    [activeSceneId, excalidrawAPI, user],
  );

  const handleStartNewScene = useCallback(() => {
    excalidrawAPI?.resetScene();
    setActiveSceneId(null);
    setSceneName(DEFAULT_SCENE_NAME);
    setStatusMessage("Started a fresh canvas.");
  }, [excalidrawAPI]);

  const handleLogout = useCallback(async () => {
    if (!auth) {
      return;
    }
    await signOut(auth);
    setStatusMessage("Signed out.");
  }, []);

  if (!firebaseConfigReady) {
    return (
      <main className="dyldraw-auth-wrap">
        <section className="dyldraw-auth-card">
          <h1 className="dyldraw-auth-title">Dyldraw</h1>
          <p className="dyldraw-auth-subtitle">
            Missing Firebase config. Add values to
            <code> examples/with-nextjs/.env.local</code> from
            <code> examples/with-nextjs/.env.example</code>.
          </p>
        </section>
      </main>
    );
  }

  if (authLoading) {
    return (
      <main className="dyldraw-auth-wrap">
        <section className="dyldraw-auth-card">
          <h1 className="dyldraw-auth-title">Dyldraw</h1>
          <p className="dyldraw-auth-subtitle">Checking your session...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="dyldraw-auth-wrap">
        <section className="dyldraw-auth-card">
          <h1 className="dyldraw-auth-title">Dyldraw</h1>
          <p className="dyldraw-auth-subtitle">
            Your private Excalidraw fork with account-based scene storage.
          </p>

          <form onSubmit={handleAuthSubmit} style={{ display: "grid", gap: "0.75rem" }}>
            <label className="dyldraw-auth-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="dyldraw-auth-input"
              value={usernameInput}
              onChange={(event) => setUsernameInput(event.target.value)}
              placeholder="dylandersen"
              autoComplete="username"
              required
            />

            <label className="dyldraw-auth-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="dyldraw-auth-input"
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete={
                authMode === "signup" ? "new-password" : "current-password"
              }
              required
            />

            {authMode === "signup" && (
              <>
                <label className="dyldraw-auth-label" htmlFor="confirm-password">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  className="dyldraw-auth-input"
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(event) => setConfirmPasswordInput(event.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                />
              </>
            )}

            <button
              type="submit"
              className="dyldraw-btn dyldraw-btn-primary"
              disabled={authSubmitting}
            >
              {authMode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <button
            type="button"
            className="dyldraw-auth-switch"
            onClick={() => {
              setAuthMode((prev) => (prev === "login" ? "signup" : "login"));
              setStatusMessage("Sign in to start saving drawings.");
            }}
          >
            {authMode === "login"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>

          <div className="dyldraw-status">{statusMessage}</div>
        </section>
      </main>
    );
  }

  return (
    <main className="dyldraw-root">
      <section className="dyldraw-shell">
        <aside className="dyldraw-sidebar">
          <div className="dyldraw-brand">
            <h1>Dyldraw</h1>
            <p>Signed in as @{loggedInUsername}</p>
          </div>

          <label className="dyldraw-auth-label" htmlFor="scene-name">
            Scene name
          </label>
          <input
            id="scene-name"
            className="dyldraw-scene-name"
            value={sceneName}
            onChange={(event) => setSceneName(event.target.value)}
            placeholder={DEFAULT_SCENE_NAME}
          />

          <div className="dyldraw-actions">
            <button
              type="button"
              className="dyldraw-btn dyldraw-btn-primary"
              disabled={sceneSaving}
              onClick={() => void handleSaveScene()}
            >
              {sceneSaving ? "Saving..." : "Save scene"}
            </button>
            <button
              type="button"
              className="dyldraw-btn dyldraw-btn-ghost"
              onClick={handleStartNewScene}
            >
              New
            </button>
          </div>

          <div className="dyldraw-actions">
            <button
              type="button"
              className="dyldraw-btn dyldraw-btn-ghost"
              onClick={() => void handleLogout()}
            >
              Log out
            </button>
          </div>

          <div className="dyldraw-scene-list">
            {savedScenes.length === 0 && (
              <div className="dyldraw-empty">
                No saved drawings yet. Build one and click Save scene.
              </div>
            )}

            {savedScenes.map((scene) => (
              <div
                className={`dyldraw-scene-card ${
                  scene.id === activeSceneId ? "active" : ""
                }`}
                key={scene.id}
              >
                <button
                  type="button"
                  className="dyldraw-scene-open"
                  onClick={() => handleLoadScene(scene)}
                >
                  <span className="dyldraw-scene-card-name">{scene.name}</span>
                  <span className="dyldraw-scene-meta">
                    Updated {formatSceneDate(scene.updatedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  className="dyldraw-scene-delete"
                  onClick={() => void handleDeleteScene(scene)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          <div className="dyldraw-status">{statusMessage}</div>
        </aside>

        <div className="dyldraw-canvas-shell">
          <Excalidraw excalidrawAPI={(api) => setExcalidrawAPI(api)} />
        </div>
      </section>
    </main>
  );
};

export default DyldrawApp;
