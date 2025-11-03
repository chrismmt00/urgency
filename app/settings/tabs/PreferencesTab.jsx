"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from "@mui/material";
import Section from "../components/Section";
import styles from "../page.module.css";

export default function PreferencesTab() {
  const [enableTimers, setEnableTimers] = useState(true);
  const [timerBucket, setTimerBucket] = useState("24h");
  const [enableSound, setEnableSound] = useState(false);
  const [soundTheme, setSoundTheme] = useState("soft");
  const [phone, setPhone] = useState("");
  const [sms, setSms] = useState(false);
  const [pushPref, setPushPref] = useState("mentions");
  const [prefMsg, setPrefMsg] = useState(null);
  const [prefBusy, setPrefBusy] = useState(false);

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
    <Section>
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
          <Switch checked={sms} onChange={(e) => setSms(e.target.checked)} />
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
    </Section>
  );
}
