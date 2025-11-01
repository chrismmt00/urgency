import SettingsClient from "./SettingsClient";
import { readAuthCookies } from "@/lib/auth-cookies";
import { verifyAccessToken } from "@/lib/jwt";
import { listConnectedAccounts } from "@/lib/connected-accounts";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Settings | Urgency",
};

export default async function SettingsPage() {
  const { accessToken } = await readAuthCookies();
  const payload = accessToken && verifyAccessToken(accessToken);
  if (!payload?.sub) {
    redirect("/?auth=required");
  }
  const accounts = await listConnectedAccounts(payload.sub);
  return <SettingsClient serverConnectedAccounts={accounts} />;
}
