"use client";
import {
  Badge,
  Chip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SendIcon from "@mui/icons-material/Send";
import DraftsIcon from "@mui/icons-material/Drafts";
import LabelIcon from "@mui/icons-material/Label";
import { useMail } from "./MailProvider";
import styles from "./Sidebar.module.css";

const DRAWER_WIDTH = 240;
const FOLDERS = [
  { key: "Inbox", icon: <InboxIcon />, badgeFrom: "unread" },
  { key: "Snoozed", icon: <ScheduleIcon /> },
  { key: "Sent", icon: <SendIcon /> },
  { key: "Drafts", icon: <DraftsIcon /> },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { folder, setFolder, emails, setSelectedIds, setActiveId } = useMail();
  const unreadCount = emails.filter(
    (e) => e.folder === "Inbox" && e.unread
  ).length;

  const content = (
    <div className={styles.wrapper}>
      <Toolbar />
      <List>
        {FOLDERS.map((f) => (
          <ListItem key={f.key} disablePadding>
            <ListItemButton
              selected={folder === f.key}
              onClick={() => {
                setFolder(f.key);
                setSelectedIds(new Set());
                setActiveId(null);
                onClose?.();
              }}
            >
              <ListItemIcon>
                {f.badgeFrom === "unread" ? (
                  <Badge color="error" badgeContent={unreadCount || 0}>
                    {f.icon}
                  </Badge>
                ) : (
                  f.icon
                )}
              </ListItemIcon>
              <ListItemText primary={f.key} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider className={styles.sep} />

      <div className={styles.labels}>
        <Typography variant="overline" color="text.secondary">
          Labels
        </Typography>
        <div className={styles.labelsRow}>
          {["Work", "Admin", "Meetings", "Newsletters"].map((l) => (
            <Chip key={l} size="small" icon={<LabelIcon />} label={l} />
          ))}
        </div>
      </div>
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
