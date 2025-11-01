"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import styles from "./NavBar.module.css";
import { useColorMode } from "@/app/providers/ColorModeProvider";
import { useAuth } from "@/app/providers/AuthProvider";
import UserMenu from "./UserMenu";

export default function NavBar() {
  const { mode, toggle } = useColorMode();
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleInbox = () => {
    if (user) {
      router.push("/inbox");
    } else {
      openAuthModal("signup");
    }
  };

  const handleSubscribe = () => {
    router.push("/subscribe");
  };

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
          <Link href="/subscribe" className={styles.link}>
            Pricing
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
            onClick={handleInbox}
            variant="outlined"
            size="small"
            className={styles.secondaryCta}
          >
            {user ? "Open Inbox" : "Try Inbox Demo"}
          </Button>
          {loading ? (
            <div className={styles.loadingWrap}>
              <CircularProgress size={20} />
            </div>
          ) : (
            <Button
              onClick={handleSubscribe}
              variant="contained"
              size="small"
              className={styles.primaryCta}
            >
              {user && user.subscriptionStatus === "active"
                ? "Manage Plan"
                : "Subscribe"}
            </Button>
          )}

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
