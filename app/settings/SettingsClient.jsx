"use client";

import { useMemo, useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import styles from "./page.module.css";
import { useAuth } from "@/app/providers/AuthProvider";

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

  // Profile state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileBusy, setProfileBusy] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

  // Preferences state
  const [enableTimers, setEnableTimers] = useState(true);
  const [timerBucket, setTimerBucket] = useState("24h");
  const [enableSound, setEnableSound] = useState(false);
  const [soundTheme, setSoundTheme] = useState("soft");
  const [phone, setPhone] = useState("");
  const [sms, setSms] = useState(false);
  const [pushPref, setPushPref] = useState("mentions");
  const [prefMsg, setPrefMsg] = useState(null);
  const [prefBusy, setPrefBusy] = useState(false);

  const connectedAccounts = useMemo(
    () =>
      serverConnectedAccounts && serverConnectedAccounts.length
        ? serverConnectedAccounts
        : user?.connectedAccounts || [],
    [serverConnectedAccounts, user]
  );

  const saveProfile = async () => {
    setProfileMsg(null);
    setProfileBusy(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        setProfileMsg({
          type: "warning",
          text: data?.message || "Not implemented yet",
        });
      } else {
        setProfileMsg({ type: "success", text: "Saved" });
      }
    } catch (e) {
      setProfileMsg({ type: "error", text: "Failed to save profile" });
    } finally {
      setProfileBusy(false);
    }
  };

  const savePassword = async () => {
    setPasswordMsg(null);
    setPasswordBusy(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        setPasswordMsg({
          type: "warning",
          text: data?.message || "Not implemented yet",
        });
      } else {
        setPasswordMsg({ type: "success", text: "Password updated" });
      }
    } catch (e) {
      setPasswordMsg({ type: "error", text: "Failed to update password" });
    } finally {
      setPasswordBusy(false);
    }
  };

  const savePreferences = async () => {
    setPrefMsg(null);
    setPrefBusy(true);
    try {
      const res = await fetch("/api/settings/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          enableTimers,
          timerBucket,
          enableSound,
          soundTheme,
          phone,
          sms,
          pushPref,
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        setPrefMsg({
          type: "warning",
          text: data?.message || "Not implemented yet",
        });
      } else {
        setPrefMsg({ type: "success", text: "Preferences saved" });
      }
    } catch (e) {
      setPrefMsg({ type: "error", text: "Failed to save preferences" });
    } finally {
      setPrefBusy(false);
    }
  };

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
            <Tab label="Connected Accounts" />
            <Tab label="Notifications" />
            <Tab label="Billing" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <section className={styles.section}>
              <div className={styles.row}>
                <TextField
                  label="Display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  size="small"
                />
                <div className={styles.row}>
                  <Button variant="outlined" size="small">
                    Upload Avatar (stub)
                  </Button>
                </div>
                <div className={styles.formActions}>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={profileBusy}
                    onClick={saveProfile}
                  >
                    Save
                  </Button>
                </div>
                {profileMsg && (
                  <Alert severity={profileMsg.type}>{profileMsg.text}</Alert>
                )}
              </div>

              <Divider sx={{ my: 1 }} />

              <div className={styles.row}>
                <TextField
                  label="Current password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  size="small"
                />
                <TextField
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  size="small"
                />
                <div className={styles.formActions}>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={passwordBusy}
                    onClick={savePassword}
                  >
                    Change password
                  </Button>
                </div>
                {passwordMsg && (
                  <Alert severity={passwordMsg.type}>{passwordMsg.text}</Alert>
                )}
              </div>
            </section>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <section className={styles.section}>
              <div className={styles.row}>
                {(connectedAccounts.length
                  ? connectedAccounts
                  : ["No accounts connected yet"]
                ).map((a) => (
                  <div key={a}>{typeof a === "string" ? a : a.provider}</div>
                ))}
              </div>
              <div className={styles.formActions}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    fetch("/api/connections/outlook", { method: "POST" })
                  }
                >
                  Connect Outlook
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    window.location.href =
                      "/api/auth/oauth/google?intent=connect";
                  }}
                >
                  Connect Google
                </Button>
              </div>
              {connectedAccounts.map((a) => (
                <div key={a.provider} className={styles.row}>
                  <div>
                    <strong>{a.provider}</strong>
                    {a.email ? ` — ${a.email}` : ""}
                  </div>
                  {a.provider === "gmail" && (
                    <div className={styles.formActions}>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() =>
                          fetch("/api/connections/google", {
                            method: "DELETE",
                          }).then(() => window.location.reload())
                        }
                      >
                        Disconnect
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </section>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <section className={styles.section}>
              <div className={styles.row}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Switch
                    checked={enableTimers}
                    onChange={(e) => setEnableTimers(e.target.checked)}
                  />
                  <span>Enable timers</span>
                </Box>
                <FormControl size="small">
                  <InputLabel id="timer-bucket-label">Time bucket</InputLabel>
                  <Select
                    labelId="timer-bucket-label"
                    label="Time bucket"
                    value={timerBucket}
                    onChange={(e) => setTimerBucket(e.target.value)}
                  >
                    <MenuItem value="24h">24 hours</MenuItem>
                    <MenuItem value="48h">48 hours</MenuItem>
                    <MenuItem value="72h">72 hours</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <div className={styles.row}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Switch
                    checked={enableSound}
                    onChange={(e) => setEnableSound(e.target.checked)}
                  />
                  <span>Sound alerts</span>
                </Box>
                <FormControl size="small">
                  <InputLabel id="sound-theme-label">Sound theme</InputLabel>
                  <Select
                    labelId="sound-theme-label"
                    label="Sound theme"
                    value={soundTheme}
                    onChange={(e) => setSoundTheme(e.target.value)}
                  >
                    <MenuItem value="soft">Soft</MenuItem>
                    <MenuItem value="gentle">Gentle</MenuItem>
                    <MenuItem value="sharp">Sharp</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <div className={styles.row}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Switch
                    checked={sms}
                    onChange={(e) => setSms(e.target.checked)}
                  />
                  <span>SMS nudges</span>
                </Box>
                <TextField
                  label="Phone number"
                  placeholder="+1 555 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  size="small"
                />
              </div>

              <div className={styles.row}>
                <FormControl size="small">
                  <InputLabel id="push-pref-label">Mobile push</InputLabel>
                  <Select
                    labelId="push-pref-label"
                    label="Mobile push"
                    value={pushPref}
                    onChange={(e) => setPushPref(e.target.value)}
                  >
                    <MenuItem value="all">All activity</MenuItem>
                    <MenuItem value="mentions">Mentions only</MenuItem>
                    <MenuItem value="none">Off</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <div className={styles.formActions}>
                <Button
                  variant="contained"
                  size="small"
                  disabled={prefBusy}
                  onClick={savePreferences}
                >
                  Save preferences
                </Button>
              </div>
              {prefMsg && <Alert severity={prefMsg.type}>{prefMsg.text}</Alert>}
            </section>
          </TabPanel>

          <TabPanel value={tab} index={3}>
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
