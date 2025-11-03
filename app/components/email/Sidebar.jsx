"use client";
import React from "react";
import {
  Badge,
  Button,
  Chip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import SendIcon from "@mui/icons-material/Send";
import ReportIcon from "@mui/icons-material/Report";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import LabelIcon from "@mui/icons-material/Label";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import LabelImportantOutlinedIcon from "@mui/icons-material/LabelImportantOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { useMail } from "./MailProvider";
import styles from "./Sidebar.module.css";

const DRAWER_WIDTH = 240;
const FOLDERS = [
  {
    key: "important",
    label: "Important",
    icon: <LabelImportantOutlinedIcon />,
  },
  { key: "starred", label: "Starred", icon: <StarBorderOutlinedIcon /> },
  { key: "sent", label: "Sent", icon: <SendIcon /> },
  { key: "spam", label: "Spam", icon: <ReportIcon /> },
  { key: "trash", label: "Trash", icon: <DeleteOutlineOutlinedIcon /> },
  { key: "all", label: "All Mail", icon: <AllInboxIcon /> },
];

export default function Sidebar({
  mobileOpen,
  onClose,
  accounts: propAccounts,
  activeAccountId: propActiveAccountId,
  onAccountChange,
  activeFolder: propActiveFolder,
  onFolderChange,
}) {
  const {
    emails,
    accounts: ctxAccounts,
    activeAccountId: ctxActiveAccountId,
    setActiveAccountId,
    activeFolder: ctxActiveFolder,
    setActiveFolder,
    setSelectedIds,
    setActiveId,
    openComposer,
  } = useMail();
  const accounts = propAccounts || ctxAccounts || [];
  const activeAccountId = propActiveAccountId ?? ctxActiveAccountId;
  const activeFolder = propActiveFolder ?? ctxActiveFolder;
  const handleAccountChange = onAccountChange || setActiveAccountId;
  const handleFolderChange = onFolderChange || setActiveFolder;

  const unreadCount = emails.filter((e) => e.unread).length;

  // Account selector menu
  const [anchorEl, setAnchorEl] = React.useState(null);
  const menuOpen = Boolean(anchorEl);
  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const providerIcon = (provider) =>
    provider === "gmail" ? (
      <MailOutlineIcon fontSize="small" />
    ) : provider === "outlook" ? (
      <AlternateEmailIcon fontSize="small" />
    ) : (
      <AlternateEmailIcon fontSize="small" />
    );

  const content = (
    <div className={styles.wrapper}>
      <Toolbar />
      <div className={styles.accountBar}>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          className={styles.accountBtn}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <span className={styles.accountBtnInner}>
            <span className={styles.accountBtnLeft}>
              <span className={styles.accountIconCircle}>
                {providerIcon(activeAccount?.provider)}
              </span>
              <span className={styles.accountEmail}>
                {activeAccount?.email || "Select account"}
              </span>
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {activeAccount?.is_default ? (
                <StarRoundedIcon fontSize="small" color="warning" />
              ) : null}
              <ExpandMoreIcon fontSize="small" />
            </span>
          </span>
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          {accounts.map((a) => (
            <MenuItem
              key={a.id}
              selected={a.id === activeAccountId}
              onClick={() => {
                handleAccountChange(a.id);
                setAnchorEl(null);
                onClose?.();
              }}
            >
              <ListItemIcon>
                <span className={styles.accountIconCircle}>
                  {providerIcon(a.provider)}
                </span>
              </ListItemIcon>
              <ListItemText
                primary={a.email}
                secondary={
                  a.is_default
                    ? "Default"
                    : a.provider === "gmail"
                    ? "Gmail"
                    : a.provider
                }
              />
            </MenuItem>
          ))}
        </Menu>
      </div>

      <div style={{ padding: 12 }}>
        <Button
          fullWidth
          variant="contained"
          size="small"
          onClick={() => openComposer({ mode: "new", initialTo: "" })}
        >
          Compose
        </Button>
      </div>
      <List>
        {FOLDERS.map((f) => (
          <ListItem key={f.key} disablePadding>
            <ListItemButton
              selected={activeFolder === f.key}
              onClick={() => {
                handleFolderChange(f.key);
                setSelectedIds(new Set());
                setActiveId(null);
                onClose?.();
              }}
            >
              <ListItemIcon>{f.icon}</ListItemIcon>
              <ListItemText primary={f.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider className={styles.sep} />

      <LabelsSection activeAccountId={activeAccountId} />
    </div>
  );

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: "reset",
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
          display: { xs: "none", md: "block" },
        }}
        open
      >
        {content}
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        sx={{
          display: { xs: "block", md: "none" },
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH },
        }}
      >
        {content}
      </Drawer>
    </>
  );
}

function LabelsSection({ activeAccountId }) {
  const [labels, setLabels] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const load = React.useCallback(async () => {
    if (!activeAccountId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/mail/labels?accountId=${encodeURIComponent(activeAccountId)}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load labels");
      setLabels(Array.isArray(data?.labels) ? data.labels : []);
    } catch (e) {
      setError(e.message || "Failed to load labels");
    } finally {
      setLoading(false);
    }
  }, [activeAccountId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function createLabel() {
    const name = prompt("Create label", "New label");
    if (!name) return;
    try {
      const res = await fetch(
        `/api/mail/labels?accountId=${encodeURIComponent(activeAccountId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create label");
      await load();
    } catch (e) {
      alert(e.message || "Failed to create label");
    }
  }

  return (
    <div className={styles.labels}>
      <Typography variant="overline" color="text.secondary">
        Labels
      </Typography>
      <div className={styles.labelsRow}>
        {loading && <Typography variant="caption">Loading…</Typography>}
        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}
        {labels
          .filter((l) => l.type === "user")
          .slice(0, 12)
          .map((l) => (
            <Chip key={l.id} size="small" icon={<LabelIcon />} label={l.name} />
          ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Button size="small" variant="outlined" onClick={createLabel}>
          Create label
        </Button>
        <Button
          size="small"
          variant="text"
          onClick={() =>
            window.open(
              "https://mail.google.com/mail/u/0/#settings/labels",
              "_blank"
            )
          }
        >
          Manage labels
        </Button>
      </div>
    </div>
  );
}
