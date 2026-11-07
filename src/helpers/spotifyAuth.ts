import { SPOTIFY_CLIENT_ID } from "../config/config";

const SCOPE = [
  "user-read-private",
  "user-read-email",
  "user-modify-playback-state",
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-read-playback-position",
  "app-remote-control",
  "streaming",
].join(" ");

const VERIFIER_KEY = "spotify.pkce.verifier";
const STATE_KEY = "spotify.pkce.state";
const TOKEN_KEY = "spotify.token";

interface StoredToken {
  accessToken: string;
  expiresAt: number;
}

const randomString = (length: number) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
};

const base64url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export const spotifyRedirectUri = () =>
  `${window.location.origin}${window.location.pathname}`;

/** Redirects the browser to Spotify's consent page (Authorization Code + PKCE). */
export const startSpotifyLogin = async () => {
  const verifier = randomString(64);
  const state = randomString(16);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope: SCOPE,
    redirect_uri: spotifyRedirectUri(),
    state,
    code_challenge_method: "S256",
    code_challenge: base64url(digest),
  });
  window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
};

// Spotify accepts each authorization code exactly once. React StrictMode runs
// effects twice in development, so concurrent exchanges of the same code share
// one promise instead of racing.
const pendingExchanges = new Map<string, Promise<string>>();

/** Exchanges the `code` from the callback URL for an access token. */
export const finishSpotifyLogin = (code: string, state: string): Promise<string> => {
  const pending = pendingExchanges.get(code);
  if (pending) return pending;
  const exchange = exchangeCode(code, state).finally(() => pendingExchanges.delete(code));
  pendingExchanges.set(code, exchange);
  return exchange;
};

const exchangeCode = async (code: string, state: string): Promise<string> => {
  const expectedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!expectedState || state !== expectedState) {
    throw new Error("Spotify login state mismatch. Please try again.");
  }
  if (!verifier) {
    throw new Error("Missing PKCE verifier. Please try again.");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: spotifyRedirectUri(),
      client_id: SPOTIFY_CLIENT_ID,
      code_verifier: verifier,
    }),
  });
  if (!response.ok) {
    throw new Error(`Spotify token exchange failed (${response.status})`);
  }
  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  const stored: StoredToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
  return stored.accessToken;
};

export const loadSpotifyToken = (): string | null => {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredToken;
    if (stored.expiresAt - 60_000 < Date.now()) {
      sessionStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return stored.accessToken;
  } catch {
    return null;
  }
};

export const clearSpotifyToken = () => sessionStorage.removeItem(TOKEN_KEY);
