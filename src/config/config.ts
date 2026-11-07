// Keep the full `import.meta.env.PUBLIC_*` expressions: rsbuild replaces them
// at build time by exact match. Aliasing `import.meta.env` to a variable
// silently yields undefined in production.
export const LDN_WEBSOCKET_ENDPOINT =
  import.meta.env.PUBLIC_WEBSOCKET_ENDPOINT || "wss://tools.bonjack.club/ws";
export const API_HTTP_ENDPOINT =
  import.meta.env.PUBLIC_HTTP_ENDPOINT || "https://tools.bonjack.club/api";

export const AUTH0_DOMAIN = import.meta.env.PUBLIC_AUTH0_DOMAIN ?? "";
export const AUTH0_CLIENT_ID = import.meta.env.PUBLIC_AUTH0_CLIENT_ID ?? "";
export const AUTH0_AUDIENCE = import.meta.env.PUBLIC_AUTH0_AUDIENCE ?? "";

export const SPOTIFY_CLIENT_ID =
  import.meta.env.PUBLIC_SPOTIFY_CLIENT_ID || "8ad1f30ed686473cb11eb34ce677c3fe";
