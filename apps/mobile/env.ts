// API configuration
// Set EXPO_PUBLIC_API_BASE_URL (including the /api suffix) in .env for local
// development, or per build profile in eas.json. The WebSocket URL is derived
// from it (http → ws, https → wss).
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "https://popularly-penicillate-earnest.ngrok-free.dev/api";

export const API_CONFIG = {
  BASE_URL,
  // TIMEOUT: 10000,
  WS_URL: BASE_URL.replace(/^http/, "ws"),
} as const;
