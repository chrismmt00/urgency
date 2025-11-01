"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from "@mui/material";

export default function MessageComposer({
  open = false,
  mode = "new",
  initialTo = "",
  initialSubject = "",
  initialBody = "",
  onClose,
}) {
  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to, cc, subject, text: body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setError(data?.message || "Failed to send");
      } else {
        onClose?.();
      }
    } catch (e) {
      setError("Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === "new" && "New message"}
        {mode === "reply" && "Reply"}
        {mode === "replyAll" && "Reply all"}
        {mode === "forward" && "Forward"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1} sx={{ mt: 1 }}>
          <TextField
            label="To"
            size="small"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
          />
          <TextField
            label="Cc"
            size="small"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="cc@example.com"
          />
          <TextField
            label="Subject"
            size="small"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <TextField
            label="Message"
            size="small"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            multiline
            minRows={8}
          />
          {error && (
            <div style={{ color: "#c00", fontSize: 12 }}>{String(error)}</div>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSend} disabled={sending}>
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}
