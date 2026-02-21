const REQUIRED_FIREBASE_ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

const getFirebaseConfigFromNextPublicEnv = (
  env: Record<string, string | undefined>,
) => {
  const config = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const providedKeyCount = REQUIRED_FIREBASE_ENV_KEYS.filter(
    (key) => !!env[key],
  ).length;

  if (providedKeyCount === REQUIRED_FIREBASE_ENV_KEYS.length) {
    return config as Record<string, string>;
  }

  if (providedKeyCount > 0) {
    console.warn(
      `Incomplete Firebase env config. Expected ${REQUIRED_FIREBASE_ENV_KEYS.length} NEXT_PUBLIC_FIREBASE_* keys, received ${providedKeyCount}.`,
    );
  }

  return null;
};

export const getFirebaseConfig = (): Record<string, any> => {
  const env = import.meta.env as Record<string, string | undefined>;
  const rawJsonConfig = env.VITE_APP_FIREBASE_CONFIG;

  if (rawJsonConfig) {
    try {
      const parsedConfig = JSON.parse(rawJsonConfig);
      if (parsedConfig && typeof parsedConfig === "object") {
        return parsedConfig;
      }
      console.warn("Invalid Firebase config JSON. Expected an object value.");
    } catch {
      console.warn(
        "Error parsing VITE_APP_FIREBASE_CONFIG JSON. Falling back to NEXT_PUBLIC_FIREBASE_* env vars.",
      );
    }
  }

  return getFirebaseConfigFromNextPublicEnv(env) ?? {};
};
