"use client";
import { useMemo } from "react";
import {
  Button,
  Checkbox,
  Divider,
  IconButton,
  List,
  Tooltip,
} from "@mui/material";
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
    accounts,
    activeAccountId,
    activeFolder,
    query,
    selectedIds,
    setSelectedIds,
    setEmails,
    setActiveId,
    nextPageToken,
    loading,
    loadMore,
  } = useMail();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return emails.filter((e) => {
      const inFolder = folder === "All Mail" ? true : e.folder === folder;
      if (!q) return inFolder;
      const hay =
        `${e.subject} ${e.fromName} ${e.fromEmail} ${e.snippet}`.toLowerCase();
      return inFolder && hay.includes(q);
    });
  }, [emails, folder, query]);

  const toggleAll = (checked) => {
    setSelectedIds(checked ? new Set(filtered.map((m) => m.id)) : new Set());
  };

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
    <div className={styles.root}>
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

      {/* Active account + folder indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "4px 8px",
        }}
      >
        <span
          style={{ color: "var(--mui-palette-text-secondary)", fontSize: 12 }}
        >
          {(() => {
            const acct = (accounts || []).find((a) => a.id === activeAccountId);
            const folderLabel =
              activeFolder === "important"
                ? "Important"
                : activeFolder === "starred"
                ? "Starred"
                : activeFolder === "primary"
                ? "Inbox"
                : activeFolder === "sent"
                ? "Sent"
                : activeFolder === "spam"
                ? "Spam"
                : activeFolder === "trash"
                ? "Trash"
                : activeFolder === "all"
                ? "All Mail"
                : folder;
            return `${acct?.email || ""} — ${folderLabel}`;
          })()}
        </span>
      </div>

      <Divider />

      <List dense disablePadding className={styles.scroll}>
        {filtered.map((mail) => (
          <MailListItem key={mail.id} mail={mail} />
        ))}
        {filtered.length === 0 && (
          <div className={styles.empty}>No messages</div>
        )}
        {nextPageToken && (
          <div
            style={{ display: "flex", justifyContent: "center", padding: 8 }}
          >
            <Button size="small" onClick={loadMore} disabled={loading}>
              {loading ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </List>
    </div>
  );
}
