"use client";
import Link from "next/link";
import Button from "@mui/material/Button";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import styles from "./NavBar.module.css";
import { useColorMode } from "@/app/providers/ColorModeProvider";

export default function NavBar() {
  const { mode, toggle } = useColorMode();

  return (
    <header className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brandWrap}>
          <MailOutlineIcon className={styles.logoIcon} fontSize="small" />
          <span className={styles.brand}>Urgency</span>
        </Link>

        <nav className={styles.links} aria-label="Primary">
          <Link href="#features" className={styles.link}>
            Features
          </Link>
          <Link href="#get-started" className={styles.link}>
            Get started
          </Link>
        </nav>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Toggle theme"
            onClick={toggle}
          >
            {mode === "light" ? (
              <DarkModeOutlinedIcon fontSize="small" />
            ) : (
              <LightModeOutlinedIcon fontSize="small" />
            )}
          </button>
          <Button
            href="/inbox"
            variant="outlined"
            size="small"
            className={styles.secondaryCta}
          >
            Try Inbox Demo
          </Button>
          <Button
            href="#get-started"
            variant="contained"
            size="small"
            className={styles.primaryCta}
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}
