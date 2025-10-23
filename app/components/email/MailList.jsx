"use client";
import { useMemo } from "react";
import { Checkbox, Divider, IconButton, List, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArchiveIcon from "@mui/icons-material/Archive";
import DraftsIcon from "@mui/icons-material/Drafts";
import MailListItem from "./MailListItem";
import { useMail } from "./MailProvider";
import styles from "./MailList.module.css";

export default function MailList() {
  const {
    emails,
    folder,
    query,
    selectedIds,
    setSelectedIds,
    setEmails,
    setActiveId,
  } = useMail();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return emails.filter((e) => {
      const inFolder = e.folder === folder;
      if (!q) return inFolder;
      const hay =
        `${e.subject} ${e.fromName} ${e.fromEmail} ${e.snippet}`.toLowerCase();
      return inFolder && hay.includes(q);
    });
  }, [emails, folder, query]);

  const toggleAll = (checked) =>
    setSelectedIds(checked ? new Set(filtered.map((m) => m.id)) : new Set());

  const markRead = () => {
    setEmails((prev) =>
      prev.map((e) => (selectedIds.has(e.id) ? { ...e, unread: false } : e))
    );
    setSelectedIds(new Set());
  };

  const remove = () => {
    setEmails((prev) => prev.filter((e) => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    setActiveId(filtered[0]?.id ?? null);
  };

  const allSelected =
    selectedIds.size === filtered.length && filtered.length > 0;
  const indeterminate =
    selectedIds.size > 0 && selectedIds.size < filtered.length;

  return (
    <div className={styles.pane}>
      <div className={styles.bulk}>
        <Checkbox
          size="small"
          checked={allSelected}
          indeterminate={indeterminate}
          onChange={(e) => toggleAll(e.target.checked)}
        />
        <Tooltip title="Mark as read">
          <span>
            <IconButton
              size="small"
              disabled={selectedIds.size === 0}
              onClick={markRead}
            >
              <DraftsIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Archive">
          <span>
            <IconButton size="small" disabled={selectedIds.size === 0}>
              <ArchiveIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Delete">
          <span>
            <IconButton
              size="small"
              disabled={selectedIds.size === 0}
              onClick={remove}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </div>

      <Divider />

      <List dense disablePadding className={styles.listScroll}>
        {filtered.map((mail) => (
          <MailListItem key={mail.id} mail={mail} />
        ))}
        {filtered.length === 0 && (
          <div className={styles.empty}>No messages</div>
        )}
      </List>
    </div>
  );
}
