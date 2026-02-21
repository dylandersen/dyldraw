const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;

export const normalizeUsername = (username: string) => username.trim().toLowerCase();

export const isValidUsername = (username: string) =>
  USERNAME_REGEX.test(normalizeUsername(username));

export const usernameToEmail = (username: string) =>
  `${normalizeUsername(username)}@dyldraw.local`;

export const usernameFromEmail = (email: string | null | undefined) =>
  email?.split("@")[0] ?? "";
