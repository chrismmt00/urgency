"use client";

import { useState } from "react";
import { Alert, Button, TextField } from "@mui/material";
import Section from "../components/Section";
import styles from "../page.module.css";
import { useAuth } from "@/app/providers/AuthProvider";

export default function ProfileTab() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileBusy, setProfileBusy] = useState(false);

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

  return (
    <Section>
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
    </Section>
  );
}
