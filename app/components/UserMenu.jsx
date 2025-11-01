"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import styles from "./UserMenu.module.css";
import { useAuth } from "@/app/providers/AuthProvider";

function initialsFromName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserMenu() {
  const { user, logout, openAuthModal } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const router = useRouter();

  const initials = useMemo(() => {
    if (!user) return "";
    const name = user.displayName || user.email || "User";
    return initialsFromName(name);
  }, [user]);

  if (!user) {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className={styles.signInBtn}
          onClick={() => openAuthModal("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={styles.signInBtn}
          onClick={() => {
            window.location.href = "/api/auth/oauth/google?intent=login";
          }}
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const goInbox = () => {
    handleClose();
    router.push("/inbox");
  };
  const goSettings = () => {
    handleClose();
    router.push("/settings");
  };
  const doLogout = async () => {
    handleClose();
    await logout();
    router.push("/");
  };

  return (
    <div className={styles.root}>
      <button type="button" className={styles.chipBtn} onClick={handleOpen}>
        <span className={styles.avatar}>{initials}</span>
        <span className={styles.label}>{user.displayName || user.email}</span>
      </button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem className={styles.menuItem} onClick={goInbox}>
          Inbox
        </MenuItem>
        <MenuItem className={styles.menuItem} onClick={goSettings}>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem className={styles.menuItem} onClick={doLogout}>
          Log out
        </MenuItem>
      </Menu>
    </div>
  );
}
