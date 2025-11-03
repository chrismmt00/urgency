"use client";

import { useState } from "react";
import { Alert, Button, Divider, TextField } from "@mui/material";
import Section from "../components/Section";
import styles from "../page.module.css";

export default function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

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

  return (
    <Section>
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
        <TextField
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          size="small"
        />
        {newPassword && confirmPassword && newPassword !== confirmPassword && (
          <Alert severity="warning">
            New password and confirmation do not match.
          </Alert>
        )}
        <div className={styles.formActions}>
          <Button
            variant="contained"
            size="small"
            disabled={
              passwordBusy ||
              (newPassword &&
                confirmPassword &&
                newPassword !== confirmPassword)
            }
            onClick={savePassword}
          >
            Change password
          </Button>
        </div>
        {passwordMsg && (
          <Alert severity={passwordMsg.type}>{passwordMsg.text}</Alert>
        )}
      </div>
    </Section>
  );
}
