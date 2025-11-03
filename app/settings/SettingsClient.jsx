"use client";

import { useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import styles from "./page.module.css";
import { useAuth } from "@/app/providers/AuthProvider";
import useSettingsData from "./hooks/useSettingsData";
import ProfileTab from "./tabs/ProfileTab";
import PasswordTab from "./tabs/PasswordTab";
import PreferencesTab from "./tabs/PreferencesTab";
import NotificationsTab from "./tabs/NotificationsTab";
import AccountsTab from "./tabs/AccountsTab";

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsClient({ serverConnectedAccounts = [] }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const {
    accounts,
    accountsLoading,
    accountsError,
    refreshAccounts,
    rules,
    rulesLoading,
    refreshRules,
  } = useSettingsData({ initialAccounts: serverConnectedAccounts });

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p>Manage your profile, connections, and notifications.</p>
        </div>

        <div className={styles.tabsWrap}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            aria-label="settings tabs"
          >
            <Tab label="Profile" />
            <Tab label="Password" />
            <Tab label="Preferences" />
            <Tab label="Notifications" />
            <Tab label="Connected Accounts" />
            <Tab label="Billing" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <ProfileTab />
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <PasswordTab />
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <PreferencesTab />
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <NotificationsTab
              accounts={accounts}
              rules={rules}
              rulesLoading={rulesLoading}
              refreshRules={refreshRules}
            />
          </TabPanel>

          <TabPanel value={tab} index={4}>
            <AccountsTab
              accounts={accounts}
              loading={accountsLoading}
              error={accountsError}
              refresh={refreshAccounts}
            />
          </TabPanel>

          <TabPanel value={tab} index={5}>
            <section className={styles.section}>
              <div className={styles.row}>
                <div>
                  <strong>Plan status:</strong>{" "}
                  {user?.subscriptionStatus || "unknown"}
                </div>
                {user?.trialEndsAt && (
                  <div>
                    <strong>Trial ends:</strong>{" "}
                    {new Date(user.trialEndsAt).toLocaleString()}
                  </div>
                )}
              </div>
              <p>
                Your subscription powers priority routing and smart timers. You
                can manage payment details any time.
              </p>
              <div className={styles.formActions}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={async () => {
                    const res = await fetch("/api/billing/portal", {
                      method: "POST",
                      credentials: "include",
                    });
                    const data = await res.json();
                    if (!res.ok || data?.ok === false) {
                      alert(data?.message || "Billing portal not configured");
                    }
                  }}
                >
                  Update payment details
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={async () => {
                    const res = await fetch("/api/billing/cancel", {
                      method: "POST",
                      credentials: "include",
                    });
                    const data = await res.json();
                    alert(data?.message || "Cancel flow not implemented yet");
                  }}
                >
                  Cancel subscription
                </Button>
              </div>
            </section>
          </TabPanel>
        </div>
      </div>
    </main>
  );
}
