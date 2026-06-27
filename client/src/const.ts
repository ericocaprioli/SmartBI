export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  if (!oauthPortalUrl || !appId) {
    console.warn(
      "VITE_OAUTH_PORTAL_URL or VITE_APP_ID is not configured. Falling back to root path."
    );
    return "/";
  }

  const portalUrl = oauthPortalUrl.replace(/\/$/, "");

  try {
    const url = new URL(`${portalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch (error) {
    console.warn(
      "Invalid VITE_OAUTH_PORTAL_URL value:",
      oauthPortalUrl,
      error
    );
    return "/";
  }
};

export const isAuthConfigured = () =>
  Boolean(import.meta.env.VITE_OAUTH_PORTAL_URL && import.meta.env.VITE_APP_ID);
