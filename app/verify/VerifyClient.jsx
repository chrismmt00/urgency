"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { useAuth } from "@/app/providers/AuthProvider";

export default function VerifyClient() {
  const search = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuth();
  const token = search?.get("token");
  const pending = search?.get("pending");
  const hasRunRef = useRef(false);
  const [status, setStatus] = useState(
    token ? "verifying" : pending ? "pending" : "missing"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || hasRunRef.current) return;
    let cancelled = false;
    async function verify() {
      try {
        // ensure the effect runs only once per mount
        hasRunRef.current = true;
        const res = await fetch(`/api/auth/verify?token=${token}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Verification failed.");
        }
        if (!cancelled) {
          setStatus("success");
          setMessage("Email verified! Redirecting you to the inbox…");
          setUser(data.user);
          setTimeout(() => router.push("/inbox"), 1500);
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(err.message);
        }
      }
    }
    verify();
    return () => {
      cancelled = true;
    };
  }, [token, router, setUser]);

  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <>
            <CircularProgress size={32} />
            <p>Verifying your email…</p>
          </>
        );
      case "success":
        return (
          <>
            <p className={styles.title}>You’re verified!</p>
            <p className={styles.subtitle}>{message}</p>
          </>
        );
      case "pending":
        return (
          <>
            <p className={styles.title}>Verification required</p>
            <p className={styles.subtitle}>
              Check your inbox for the verification link we just sent. Once you
              confirm, the inbox unlocks immediately.
            </p>
            <Button
              variant="contained"
              onClick={() => router.push("/")}
              className={styles.primaryBtn}
            >
              Back home
            </Button>
          </>
        );
      case "missing":
        return (
          <>
            <p className={styles.title}>Missing token</p>
            <p className={styles.subtitle}>
              That verification link is invalid. Request a new one from the sign
              up modal.
            </p>
            <Button
              variant="contained"
              onClick={() => router.push("/")}
              className={styles.primaryBtn}
            >
              Return home
            </Button>
          </>
        );
      case "error":
      default:
        return (
          <>
            <p className={styles.title}>Verification failed</p>
            <p className={styles.subtitle}>{message}</p>
            <Button
              variant="contained"
              onClick={() => router.push("/")}
              className={styles.primaryBtn}
            >
              Back to home
            </Button>
          </>
        );
    }
  };

  return <main className={styles.main}>{renderContent()}</main>;
}
