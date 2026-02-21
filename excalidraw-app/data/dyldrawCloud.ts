import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadString,
} from "firebase/storage";

import { loadFromBlob } from "@excalidraw/excalidraw/data/blob";
import { serializeAsJSON } from "@excalidraw/excalidraw/data/json";

import type { User } from "firebase/auth";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/element/types";

let FIREBASE_CONFIG: Record<string, any>;
try {
  FIREBASE_CONFIG = JSON.parse(import.meta.env.VITE_APP_FIREBASE_CONFIG);
} catch (error: any) {
  console.warn(
    `Error JSON parsing firebase config. Supplied value: ${
      import.meta.env.VITE_APP_FIREBASE_CONFIG
    }`,
  );
  FIREBASE_CONFIG = {};
}

const getFirebaseApp = () => {
  if (getApps().length) {
    return getApp();
  }
  return initializeApp(FIREBASE_CONFIG);
};

const userScenePath = (uid: string) => `users/${uid}/latest.excalidraw.json`;

export const subscribeToDyldrawAuth = (
  listener: (user: User | null) => void,
) => {
  return onAuthStateChanged(getAuth(getFirebaseApp()), listener);
};

export const signInToDyldrawWithEmail = async (
  email: string,
  password: string,
) => {
  return signInWithEmailAndPassword(getAuth(getFirebaseApp()), email, password);
};

export const signUpToDyldrawWithEmail = async (
  email: string,
  password: string,
) => {
  return createUserWithEmailAndPassword(
    getAuth(getFirebaseApp()),
    email,
    password,
  );
};

export const signInToDyldrawWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(getAuth(getFirebaseApp()), provider);
};

export const signOutFromDyldraw = async () => {
  return signOut(getAuth(getFirebaseApp()));
};

export const saveSceneToDyldrawCloud = async ({
  uid,
  elements,
  appState,
  files,
}: {
  uid: string;
  elements: readonly OrderedExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
}) => {
  const sceneJson = serializeAsJSON(elements, appState, files, "database");
  const storage = getStorage(getFirebaseApp());

  await uploadString(ref(storage, userScenePath(uid)), sceneJson, "raw", {
    contentType: "application/json",
    cacheControl: "private, max-age=0, no-transform",
  });

  const firestore = getFirestore(getFirebaseApp());
  await setDoc(
    doc(firestore, "users", uid, "private", "latestScene"),
    {
      updatedAt: serverTimestamp(),
      bytes: sceneJson.length,
    },
    { merge: true },
  );
};

export const loadSceneFromDyldrawCloud = async (
  uid: string,
): Promise<ExcalidrawInitialDataState | null> => {
  const storage = getStorage(getFirebaseApp());
  try {
    const downloadUrl = await getDownloadURL(ref(storage, userScenePath(uid)));
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error("Unable to download cloud scene");
    }
    return loadFromBlob(await response.blob(), null, null);
  } catch (error: any) {
    if (error?.code === "storage/object-not-found") {
      return null;
    }
    throw error;
  }
};
