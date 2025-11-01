import "server-only";

import { cookies } from "next/headers";

const ACCESS_COOKIE = "urgency_access_token";
const REFRESH_COOKIE = "urgency_refresh_token";

const isProduction = process.env.NODE_ENV === "production";

export async function setAuthCookies({
  accessToken,
  refreshToken,
  refreshExpiresAt,
}) {
  const store = cookies();
  store.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
  const maxAge = refreshExpiresAt
    ? Math.max(
        0,
        Math.floor((new Date(refreshExpiresAt).getTime() - Date.now()) / 1000)
      )
    : undefined;
  store.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function clearAuthCookies() {
  const store = cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function readAuthCookies() {
  const store = cookies();
  return {
    accessToken: store.get(ACCESS_COOKIE)?.value,
    refreshToken: store.get(REFRESH_COOKIE)?.value,
  };
}
