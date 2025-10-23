"use client";
import {
  Checkbox,
  Chip,
  ListItem,
  ListItemButton,
  Typography,
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
  } = useMail();
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

  return (
    <ListItem
      disablePadding
      sx={{ bgcolor: activeId === mail.id ? "action.selected" : "transparent" }}
    >
      <ListItemButton onClick={openMail} sx={{ py: 0.75, pr: 1, pl: 0 }}>
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
              {(mail.labels || []).slice(0, 2).map((l) => (
                <Chip key={l} label={l} size="small" variant="outlined" />
              ))}
            </div>
            <Typography color="text.secondary" noWrap>
              {mail.fromName} &lt;{mail.fromEmail}&gt; — {mail.snippet}
            </Typography>
          </div>

          <div className={styles.timer}>
            <TimerChip receivedISO={mail.receivedISO} ttlHours={mail.ttl} />
          </div>
        </div>
      </ListItemButton>
    </ListItem>
  );
}
