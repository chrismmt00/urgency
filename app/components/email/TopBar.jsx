"use client";
import {
  AppBar,
  Avatar,
  IconButton,
  TextField,
  Toolbar,
  Typography,
  InputAdornment,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AppsIcon from "@mui/icons-material/Apps";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { useMail } from "./MailProvider";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import styles from "./TopBar.module.css";

export default function TopBar({ onOpenSidebar }) {
  const { query, setQuery, mobileView, setMobileView } = useMail();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const showBack = !isMdUp && mobileView === "reader";

  return (
    <AppBar
      color="inherit"
      elevation={0}
      position="fixed"
      sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
    >
      <Toolbar disableGutters className={styles.toolbar}>
        {/* LEFT: menu + logo */}
        <div className={styles.left}>
          {showBack ? (
            <IconButton onClick={() => setMobileView("list")}>
              <ArrowBackIcon />
            </IconButton>
          ) : (
            <IconButton
              onClick={onOpenSidebar}
              sx={{ display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <div className={styles.brandWrap}>
            <MailOutlineIcon className={styles.logoIcon} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              MailTickr
            </Typography>
          </div>
        </div>

        {/* CENTER: search field */}
        <div className={styles.searchWrap}>
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
          <IconButton className={styles.refreshBtn}>
            <RefreshIcon />
          </IconButton>
        </div>

        {/* RIGHT: icons + avatar */}
        <div className={styles.right}>
          <IconButton>
            <HelpOutlineIcon />
          </IconButton>
          <IconButton>
            <SettingsOutlinedIcon />
          </IconButton>
          <IconButton>
            <AppsIcon />
          </IconButton>
          <Avatar sx={{ width: 32, height: 32 }}>CG</Avatar>
        </div>
      </Toolbar>
    </AppBar>
  );
}
