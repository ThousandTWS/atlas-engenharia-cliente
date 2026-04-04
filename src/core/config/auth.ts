export type AuthMode = "cookie" | "bearer";

const resolveAuthMode = (): AuthMode => {
  const rawValue = (import.meta.env.VITE_AUTH_MODE ?? "bearer")
    .trim()
    .toLowerCase();
  return rawValue === "bearer" ? "bearer" : "cookie";
};

export const AUTH_MODE: AuthMode = resolveAuthMode();

export const isCookieAuthMode = (): boolean => AUTH_MODE === "cookie";
