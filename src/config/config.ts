const env = import.meta.env;

export const LDN_WEBSOCKET_ENDPOINT =
  env.PUBLIC_WEBSOCKET_ENDPOINT || "wss://tools.bonjack.club/ws/";
export const API_HTTP_ENDPOINT =
  env.PUBLIC_HTTP_ENDPOINT || "https://tools.bonjack.club/api";

export const AUTH0_DOMAIN = env.PUBLIC_AUTH0_DOMAIN ?? "";
export const AUTH0_CLIENT_ID = env.PUBLIC_AUTH0_CLIENT_ID ?? "";
export const AUTH0_AUDIENCE = env.PUBLIC_AUTH0_AUDIENCE ?? "";

export const SPOTIFY_CLIENT_ID =
  env.PUBLIC_SPOTIFY_CLIENT_ID || "8ad1f30ed686473cb11eb34ce677c3fe";
