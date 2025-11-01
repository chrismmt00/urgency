"use client";

import Button from "@mui/material/Button";
import CheckIcon from "@mui/icons-material/CheckRounded";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { useAuth } from "@/app/providers/AuthProvider";

const BENEFITS = [
  "Connect Outlook today (Gmail support soon).",
  "Color-coded urgency timers for every email.",
  "Smart nudges before deadlines slip away.",
  "Priority support during business hours.",
];

export default function SubscribeClient() {
  const { user, openAuthModal } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const expired = search?.get("expired");

  const handleStartTrial = () => {
    if (!user) {
      openAuthModal("signup");
      return;
    }
    router.push("/inbox");
  };

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            {expired ? (
              <span className={styles.badge}>Trial expired</span>
            ) : (
              <span className={styles.badge}>Limited beta</span>
            )}
            <h1>Elevate your inbox flow.</h1>
            <p>
              Visual timers, smart nudges, and priority filtering tailored for
              operators who thrive on clarity. Keep the focus on what matters.
            </p>
            <div className={styles.heroActions}>
              <Button
                variant="contained"
                size="large"
                onClick={handleStartTrial}
                className={styles.primaryBtn}
              >
                {user ? "Return to Inbox" : "Start 3-day trial"}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push("/#features")}
                className={styles.secondaryBtn}
              >
                Explore Features
              </Button>
            </div>
            <p className={styles.note}>
              Secure payments are handled by Stripe. We charge only after your
              3-day trial wraps.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.plans}>
        <div className={styles.container}>
          <div className={styles.planCard}>
            <div className={styles.planHeader}>
              <h2>Urgency Pro</h2>
              <p>Everything you need to stay ahead of your inbox.</p>
              <div className={styles.price}>
                <span className={styles.amount}>$18</span>
                <span className={styles.term}>/ month</span>
              </div>
            </div>
            <ul className={styles.planList}>
              {BENEFITS.map((benefit) => (
                <li key={benefit}>
                  <CheckIcon fontSize="small" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="contained"
              size="large"
              onClick={handleStartTrial}
              className={styles.primaryBtn}
            >
              {user ? "Manage Billing" : "Start Trial"}
            </Button>
            <p className={styles.disclaimer}>
              No card charged today. We’ll ask for payment details when Stripe
              goes live.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
