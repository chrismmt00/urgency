"use client";
import {
  Checkbox,
  Chip,
  ListItem,
  ListItemButton,
  Typography,
  Tooltip,
} from "@mui/material";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import { useMail } from "./MailProvider";
import TimerChip from "@/app/components/TimerChip";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import styles from "./MailListItem.module.css";

export default function MailListItem({ mail }) {
  const {
    selectedIds,
    setSelectedIds,
    activeId,
    setActiveId,
    setEmails,
    setMobileView,
    activeAccountId,
  } = useMail();
  // TODO: Visual cleanup — keep the layout consistent with theme tokens,
  // reduce clutter, and consider responsive refinements for smaller screens.
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const openMail = () => {
    setActiveId(mail.id);
    if (mail.unread) {
      setEmails((prev) =>
        prev.map((e) => (e.id === mail.id ? { ...e, unread: false } : e))
      );
    }
    if (!isMdUp) setMobileView("reader");
  };

  const toggleSelect = () => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(mail.id) ? n.delete(mail.id) : n.add(mail.id);
      return n;
    });
  };

  const toggleStar = (e) => {
    e.stopPropagation();
    setEmails((prev) =>
      prev.map((e2) =>
        e2.id === mail.id ? { ...e2, starred: !e2.starred } : e2
      )
    );
  };

  const ts = new Date(mail.receivedISO).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const labelBadges = [];
  if ((mail.labels || []).includes("IMPORTANT")) labelBadges.push("Important");

  return (
    <ListItem
      disablePadding
      sx={{ bgcolor: activeId === mail.id ? "action.selected" : "transparent" }}
    >
      <ListItemButton onClick={openMail} sx={{ py: 1, pr: 1.25, pl: 0 }}>
        <div className={styles.row}>
          <div className={styles.checkbox}>
            <Checkbox
              edge="start"
              tabIndex={-1}
              checked={selectedIds.has(mail.id)}
              onChange={toggleSelect}
              size="small"
            />
          </div>
          <div className={styles.star} onClick={toggleStar}>
            {mail.starred ? (
              <StarIcon color="warning" fontSize="small" />
            ) : (
              <StarBorderIcon fontSize="small" />
            )}
          </div>
          <div className={styles.text}>
            <div className={styles.subjectLine}>
              <Typography noWrap sx={{ fontWeight: mail.unread ? 700 : 500 }}>
                {mail.subject}
              </Typography>
              {labelBadges.map((l) => (
                <Tooltip key={l} title={l} placement="top">
                  <Chip size="small" variant="outlined" label={l} />
                </Tooltip>
              ))}
            </div>
            <Typography color="text.secondary" noWrap>
              {mail.fromName || mail.fromEmail} — {mail.snippet}
            </Typography>
          </div>
          <div className={styles.timer}>
            <span style={{ marginRight: 8, opacity: 0.7 }}>{ts}</span>
            <TimerChip
              receivedISO={mail.receivedISO}
              ttlHours={mail.ttl}
              timerDueAt={mail.timer_due_at}
              allowOverdue={mail.allow_overdue}
              status={mail.timer_status}
              overdueLimitHours={mail.overdue_limit_hours}
              onMarkDone={async (e) => {
                e.stopPropagation();
                try {
                  await fetch(`/api/mail/messages/${mail.id}/resolve`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ accountId: activeAccountId }),
                  });
                  setEmails((prev) =>
                    prev.map((m) =>
                      m.id === mail.id ? { ...m, timer_status: "resolved" } : m
                    )
                  );
                } catch {}
              }}
            />
          </div>
        </div>
      </ListItemButton>
    </ListItem>
  );
}
