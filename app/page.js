"use client";
import Button from "@mui/material/Button";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import styles from "./page.module.css";
import HeroTimer from "./components/HeroTimer";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";

const FEATURES = [
  {
    icon: AccessTimeIcon,
    title: "Live countdowns",
    text: "Each email gets its own ticking timer based on your preset (24/48/72/custom).",
  },
  {
    icon: ColorLensIcon,
    title: "Color clarity",
    text: "Green to yellow to red - your brain always knows what to tackle first.",
  },
  {
    icon: CheckCircleIcon,
    title: "Gentle nudges",
    text: "Optional sounds, haptics, and push reminders before time runs out.",
  },
];

export default function Home() {
  const { user, openAuthModal } = useAuth();
  const router = useRouter();

  const handleHeroPrimary = () => {
    if (user) router.push("/inbox");
    else openAuthModal("signup");
  };
  return (
    <>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroInner}>
              <div className={styles.heroCopy}>
                <span className={styles.tagline}>Inbox triage made visual</span>
                <h1 className={styles.headline}>
                  Beat your inbox with{" "}
                  <span className={styles.highlight}>color-coded</span> timers.
                </h1>
                <p className={styles.description}>
                  MailTickr starts a countdown on each new email and gently
                  nudges you: green to yellow to red. For brains that love
                  visual cues.
                </p>
                <div className={styles.ctaRow}>
                  <Button
                    onClick={handleHeroPrimary}
                    size="large"
                    variant="contained"
                    className={styles.buttonPrimary}
                  >
                    Try Inbox Demo
                  </Button>
                  <Button
                    href="#features"
                    size="large"
                    variant="outlined"
                    className={styles.buttonSecondary}
                  >
                    See Features
                  </Button>
                </div>
              </div>
              <div className={styles.heroMedia}>
                <div className={styles.heroFrame}>
                  <HeroTimer ttlHours={24} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.featuresHeader}>
              <h2>Why it works</h2>
              <p>
                Urgency stays visible without feeling frantic. Your next move is
                always obvious.
              </p>
            </div>
            <div className={styles.featuresGrid}>
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className={styles.featureCard}>
                  <span className={styles.featureIcon}>
                    <Icon fontSize="small" />
                  </span>
                  <h3 className={styles.featureTitle}>{title}</h3>
                  <p className={styles.featureText}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="get-started" className={styles.ctaSection}>
          <div className={styles.container}>
            <h2>Ready to see your emails differently?</h2>
            <p>
              Connect Outlook (Gmail soon) and let the timers guide your day.
            </p>
            <div className={styles.ctaButtons}>
              <Button
                href="/inbox"
                variant="contained"
                size="large"
                className={styles.buttonPrimary}
              >
                Open Inbox Demo
              </Button>
              <Button
                href="#"
                variant="outlined"
                size="large"
                className={styles.buttonSecondary}
              >
                Join Beta
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
