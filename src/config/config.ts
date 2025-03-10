export const LDN_WEBSOCKET_ENDPOINT =
  import.meta.env.PUBLIC_WEBSOCKET_ENDPOINT || "wss://tools.bonjack.club/ws/";
export const API_HTTP_ENDPOINT =
  import.meta.env.PUBLIC_HTTP_ENDPOINT || "https://tools.bonjack.club/api";
export const EXPENSE_MANAGER_HTTP_ENDPOINT =
  import.meta.env.PUBLIC_WEBSOCKET_ENDPOINT ? `${import.meta.env.PUBLIC_WEBSOCKET_ENDPOINT}/em` :
  "https://tools.bonjack.club/api/em";
