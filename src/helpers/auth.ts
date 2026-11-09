import { useAuth0 } from "@auth0/auth0-react";
import { useSyncExternalStore } from "react";
import { AUTH0_AUDIENCE, AUTH0_DOMAIN, DEV_SUBJECT } from "../config/config";

/**
 * True when Auth0 is configured. When it is not (local development without
 * PUBLIC_AUTH0_* set), the app bypasses Auth0 and sends a plain dev identity
 * as the bearer token; the backend without JWT uses it verbatim as the subject
 * (see `go run ./cmd/swissdev`). Production behaviour is unchanged.
 */
export const AUTH_CONFIGURED = AUTH0_DOMAIN !== "";

/** localStorage key overriding `PUBLIC_DEV_SUBJECT` at runtime (dev only). */
export const DEV_SUBJECT_STORAGE_KEY = "devSubject";
const DEV_SUBJECT_EVENT = "dev-subject-change";

const readDevSubject = (): string => {
  try {
    return localStorage.getItem(DEV_SUBJECT_STORAGE_KEY)?.trim() || DEV_SUBJECT;
  } catch {
    return DEV_SUBJECT;
  }
};

/** Current dev identity: localStorage override, else `PUBLIC_DEV_SUBJECT`, else "dev". */
export const getDevSubject = readDevSubject;

/** Change the dev identity without reloading; empty value restores the default. */
export const setDevSubject = (subject: string) => {
  try {
    const value = subject.trim();
    if (value === "" || value === DEV_SUBJECT) {
      localStorage.removeItem(DEV_SUBJECT_STORAGE_KEY);
    } else {
      localStorage.setItem(DEV_SUBJECT_STORAGE_KEY, value);
    }
  } catch {
    // Storage unavailable: the default identity stays in effect.
  }
  window.dispatchEvent(new Event(DEV_SUBJECT_EVENT));
};

const subscribeDevSubject = (onChange: () => void) => {
  window.addEventListener(DEV_SUBJECT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(DEV_SUBJECT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};

/** The dev identity as React state, re-rendering when `setDevSubject` is called. */
export const useDevSubject = () =>
  useSyncExternalStore(subscribeDevSubject, readDevSubject, () => DEV_SUBJECT);

/** The caller's identity as the API sees it: Auth0 `sub`, or the dev identity locally. */
export const useCallerIdentity = () => {
  const { isAuthenticated, user } = useAuth0();
  const devSubject = useDevSubject();
  if (!AUTH_CONFIGURED) return { isAuthenticated: true, sub: devSubject };
  return { isAuthenticated, sub: user?.sub };
};

/** Resolve an API access token, failing clearly when none is available. */
export const useAccessToken = () => {
  const { getAccessTokenSilently } = useAuth0();
  return async (): Promise<string> => {
    if (!AUTH_CONFIGURED) return readDevSubject();
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: AUTH0_AUDIENCE },
    });
    if (!token) {
      throw new Error("Could not get an access token, please log in again.");
    }
    return token;
  };
};
