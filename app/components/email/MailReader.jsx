"use client";

import { Avatar, Button, Divider, Paper, Typography } from "@mui/material";
import TimerChip from "@/app/components/TimerChip";
import { useMail } from "./MailProvider";
import DOMPurify from "dompurify";
import styles from "./MailReader.module.css";

export default function MailReader() {
  const { emails, activeId, openComposer } = useMail();
  const mail = emails.find((e) => e.id === activeId);

  if (!mail) {
    return <div className={styles.empty}>Select a message to read</div>;
  }

  const received = new Date(mail.receivedISO).toLocaleString();

  const replySubject = mail.subject?.startsWith("Re:")
    ? mail.subject
    : `Re: ${mail.subject || ""}`;
  const fwdSubject = mail.subject?.startsWith("Fwd:")
    ? mail.subject
    : `Fwd: ${mail.subject || ""}`;
  const headerTo = mail.headers?.to || "";
  const toList = headerTo
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const quoted = `\n\nOn ${received}, ${
    mail.fromName || mail.fromEmail
  } wrote:\n> ${(mail.plainText || mail.snippet || "").replace(/\n/g, "\n> ")}`;

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
          {(() => {
            const hasHtml = Boolean((mail.html || "").trim());
            const hasText = Boolean(
              (mail.plainText || mail.snippet || "").trim()
            );
            if (hasHtml) {
              const safe = DOMPurify.sanitize(mail.html);
              return (
                <div
                  className={styles.htmlBody}
                  dangerouslySetInnerHTML={{ __html: safe }}
                />
              );
            }
            if (hasText) {
              return (
                <pre className={styles.plainBody}>
                  {mail.plainText || mail.snippet}
                </pre>
              );
            }
            return (
              <div className={`${styles.plainBody} ${styles.emptyBody}`}>
                No content available
              </div>
            );
          })()}
        </Paper>

        {Array.isArray(mail.attachments) && mail.attachments.length > 0 && (
          <div className={styles.actions}>
            <Typography variant="subtitle2">Attachments</Typography>
            <ul>
              {mail.attachments.map((a) => (
                <li key={a.attachmentId}>{a.filename}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            variant="contained"
            onClick={() =>
              openComposer({
                mode: "reply",
                initialTo: mail.fromEmail,
                initialSubject: replySubject,
                initialBody: quoted,
              })
            }
          >
            Reply
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              openComposer({
                mode: "replyAll",
                initialTo: [mail.fromEmail, ...toList].join(", "),
                initialSubject: replySubject,
                initialBody: quoted,
              })
            }
          >
            Reply all
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              openComposer({
                mode: "forward",
                initialTo: "",
                initialSubject: fwdSubject,
                initialBody: `\n\n---------- Forwarded message ----------${quoted}`,
              })
            }
          >
            Forward
          </Button>
        </div>
      </div>
    </div>
  );
}
