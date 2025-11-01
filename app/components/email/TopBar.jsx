"use client";

import { useRef, useEffect, useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import styles from "./TopBar.module.css";

import { useMail } from "./MailProvider";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useColorMode } from "@/app/providers/ColorModeProvider";
import UserMenu from "@/app/components/UserMenu";

const DRAWER_WIDTH = 240;
const LIST_WIDTH = 520;

export default function TopBar({ onOpenSidebar }) {
  const { query, setQuery, mobileView, setMobileView } = useMail();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const showBack = !isDesktop && mobileView === "reader";
  const { mode, toggle } = useColorMode();

  // measure right cluster so search never runs under the scrollbar
  const rightRef = useRef(null);
  const [rightW, setRightW] = useState(160);
  useEffect(() => {
    const update = () => {
      const w = rightRef.current?.getBoundingClientRect().width || 160;
      setRightW(Math.ceil(w));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className={styles.topbar}>
      {/* LEFT */}
      <div className={styles.left}>
        {showBack ? (
          <button
            className={styles.iconBtn}
            aria-label="Back"
            onClick={() => setMobileView("list")}
          >
            <ArrowBackIcon fontSize="small" />
          </button>
        ) : (
          <button
            className={styles.iconBtn}
            aria-label="Open menu"
            onClick={onOpenSidebar}
            style={{ display: isDesktop ? "none" : "inline-flex" }}
          >
            <MenuIcon fontSize="small" />
          </button>
        )}

        <div className={styles.brandWrap}>
          <MailOutlineIcon className={styles.logoIcon} />
          <div className={styles.brand}>Urgency</div>
        </div>
      </div>

      {/* CENTER — search pill */}
      <div
        className={styles.searchWrap}
        data-desktop={isDesktop ? "1" : "0"}
        style={
          isDesktop
            ? {
                left: `${DRAWER_WIDTH}px`,
                right: `${rightW + 12}px`,
                maxWidth: `${LIST_WIDTH}px`,
              }
            : undefined
        }
      >
        <div className={styles.searchIcon}>
          <SearchIcon fontSize="small" />
        </div>
        <input
          className={styles.searchInput}
          placeholder="Search mail"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className={styles.iconBtn} aria-label="Refresh">
          <RefreshIcon fontSize="small" />
        </button>
      </div>

      {/* RIGHT */}
      <div className={styles.right} ref={rightRef}>
        <button
          className={styles.iconBtn}
          aria-label="Toggle theme"
          onClick={toggle}
        >
          {mode === "light" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </button>
        <UserMenu />
      </div>
    </div>
  );
}
