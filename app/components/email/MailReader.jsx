"use client";
import { Avatar, Button, Paper, Stack, Typography } from "@mui/material";
import { useMail } from "./MailProvider";
import TimerChip from "@/app/components/TimerChip";
import styles from "./MailReader.module.css";

export default function MailReader() {
  const { emails, activeId } = useMail();
  const mail = emails.find((e) => e.id === activeId);

  if (!mail) {
    return <div className={styles.empty}>Select a message to read</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {mail.subject}
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{ marginTop: 8, marginBottom: 16 }}
        >
          <Avatar sx={{ width: 28, height: 28 }}>{mail.fromName[0]}</Avatar>
          <Typography>{mail.fromName}</Typography>
          <Typography color="text.secondary">
            &lt;{mail.fromEmail}&gt;
          </Typography>
          <TimerChip receivedISO={mail.receivedISO} ttlHours={mail.ttl} />
        </Stack>

        <Paper
          variant="outlined"
          sx={{ padding: 16, whiteSpace: "pre-wrap", borderRadius: 8 }}
        >
          {mail.body}
        </Paper>

        <Stack direction="row" spacing={1} sx={{ marginTop: 16 }}>
          <Button variant="contained">Reply</Button>
          <Button variant="outlined">Forward</Button>
        </Stack>
      </div>
    </div>
  );
}
