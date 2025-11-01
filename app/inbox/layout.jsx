import { redirect } from "next/navigation";
import { isAfter } from "date-fns";
import InboxShell from "./InboxShell";
import { readAuthCookies, setAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";
import { findUserById, rotateSession } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

export default async function InboxLayout({ children }) {
  const { accessToken, refreshToken } = await readAuthCookies();
  let user = null;

  if (accessToken) {
    const payload = verifyAccessToken(accessToken);
    if (payload?.sub) {
      user = await findUserById(payload.sub);
    }
  }

  if (!user && refreshToken) {
    try {
      const {
        user: refreshedUser,
        session,
        accessToken: newAccess,
      } = await rotateSession({ refreshToken });
      await setAuthCookies({
        accessToken: newAccess,
        refreshToken,
        refreshExpiresAt: session.expires_at,
      });
      user = refreshedUser;
    } catch (err) {
      console.warn("Failed to refresh session for inbox:", err);
    }
  }

  if (!user) {
    redirect("/?auth=required");
  }

  if (!user.is_verified) {
    redirect("/verify?pending=1");
  }

  const trialExpired =
    user.subscription_status === "trial" &&
    user.trial_ends_at &&
    isAfter(new Date(), new Date(user.trial_ends_at));

  const inactiveSubscription =
    trialExpired ||
    ["expired", "cancelled"].includes(user.subscription_status || "none");

  if (inactiveSubscription) {
    redirect("/subscribe?expired=1");
  }

  return <InboxShell>{children}</InboxShell>;
}
