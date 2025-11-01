"use client";

import { Avatar, Button, Divider, Paper, Typography } from "@mui/material";
import TimerChip from "@/app/components/TimerChip";
import { useMail } from "./MailProvider";
import styles from "./MailReader.module.css";

export default function MailReader() {
  const { emails, activeId } = useMail();
  const mail = emails.find((e) => e.id === activeId);

  if (!mail) {
    return <div className={styles.empty}>Select a message to read</div>;
  }

  const received = new Date(mail.receivedISO).toLocaleString();

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Subject */}
        <Typography variant="h5" className={styles.subject}>
          {mail.subject}
        </Typography>

        {/* Meta row */}
        <div className={styles.metaRow}>
          <div className={styles.fromBlock}>
            <Avatar className={styles.avatar}>
              {mail.fromName?.[0] || "?"}
            </Avatar>
            <div className={styles.fromText}>
              <div className={styles.fromLine}>
                <span className={styles.fromName}>{mail.fromName}</span>
                <span className={styles.fromEmail}>
                  &lt;{mail.fromEmail}&gt;
                </span>
              </div>
              <div className={styles.date}>{received}</div>
            </div>
          </div>

          <div className={styles.toolsRight}>
            <TimerChip receivedISO={mail.receivedISO} ttlHours={mail.ttl} />
          </div>
        </div>

        <Divider className={styles.divider} />

        {/* Message body */}
        <Paper variant="outlined" className={styles.message}>
          {/* If you later store HTML, you can switch to dangerouslySetInnerHTML safely */}
          <Typography className={styles.bodyText}>{mail.body}</Typography>
        </Paper>

        {/* Actions */}
        <div className={styles.actions}>
          <Button variant="contained">Reply</Button>
          <Button variant="outlined">Forward</Button>
        </div>
      </div>
    </div>
  );
}
