"use client";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import styles from "./SearchBar.module.css";

export default function SearchBar({
  value,
  onChange,
  rightClusterWidth = 160, // px measured by TopBar (fallback given)
  drawerWidth = 240, // keep in sync with Sidebar
  listWidth = 520, // keep in sync with MailList
  isDesktop = false,
}) {
  return (
    <div
      className={styles.searchWrap}
      style={
        isDesktop
          ? {
              // Desktop: pin between drawer edge and right cluster; no 100vw math
              left: `${drawerWidth}px`,
              right: `${rightClusterWidth + 12}px`, // small safety pad
              maxWidth: `${listWidth}px`,
            }
          : {}
      }
      data-desktop={isDesktop ? "1" : "0"}
    >
      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search mail"
        size="small"
        fullWidth
        variant="outlined"
        className={styles.searchInput}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      <IconButton
        className={styles.refreshBtn}
        aria-label="Refresh"
        size="small"
      >
        <RefreshIcon />
      </IconButton>
    </div>
  );
}
