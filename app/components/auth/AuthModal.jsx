"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import GoogleIcon from "@mui/icons-material/Google";
import OutlookIcon from "@mui/icons-material/AlternateEmail";
import CircularProgress from "@mui/material/CircularProgress";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import styles from "./AuthModal.module.css";

const FORM_DEFAULTS = {
  email: "",
  password: "",
  displayName: "",
  confirmPassword: "",
};

export default function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, setUser } = useAuth();
  const router = useRouter();
  const [formState, setFormState] = useState(FORM_DEFAULTS);
  const [mode, setMode] = useState(authModalMode);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (authModalOpen) {
      setMode(authModalMode);
      setFormState(FORM_DEFAULTS);
      setMessage("");
      setError("");
    }
  }, [authModalOpen, authModalMode]);

  const title = useMemo(
    () => (mode === "signup" ? "Create your account" : "Welcome back"),
    [mode]
  );

  if (!authModalOpen) return null;

  const handleClose = () => {
    if (isPending) return;
    closeAuthModal();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        if (mode === "signup") {
          // Validate confirm password before sending request
          if (formState.password !== formState.confirmPassword) {
            setError("Passwords do not match. Please confirm your password.");
            return;
          }
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formState.email,
              password: formState.password,
              displayName: formState.displayName,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || "Unable to sign up.");
          }
          setMessage(
            "Account created. Check your inbox for a verification link."
          );
        } else {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              email: formState.email,
              password: formState.password,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || "Unable to sign in.");
          }
          setUser(data.user);
          closeAuthModal();
          if (data.trialExpired || data.user.subscriptionStatus === "expired") {
            router.push("/subscribe?expired=1");
          } else {
            router.push("/inbox");
          }
        }
      } catch (err) {
        setError(err.message || "Something went wrong.");
      }
    });
  };

  const handleOAuth = (provider) => {
    window.location.href = `/api/auth/oauth/${provider}`;
  };

  const toggleMode = (next) => {
    if (isPending) return;
    setMode(next);
    setFormState(FORM_DEFAULTS);
    setError("");
    setMessage("");
  };

  return (
    <div className={styles.backdrop} onMouseDown={handleClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Close"
          onClick={handleClose}
          disabled={isPending}
        >
          ×
        </button>
        <div className={styles.tabs}>
          <button
            type="button"
            className={clsx(styles.tab, mode === "signin" && styles.active)}
            onClick={() => toggleMode("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={clsx(styles.tab, mode === "signup" && styles.active)}
            onClick={() => toggleMode("signup")}
          >
            Create account
          </button>
        </div>
        <div className={styles.content}>
          <h2 id="auth-modal-title" className={styles.title}>
            {title}
          </h2>
          <p className={styles.subtitle}>
            Connect with Outlook today. Gmail support arrives soon.
          </p>
          <div className={styles.oauthRow}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GoogleIcon fontSize="small" />}
              onClick={() => handleOAuth("google")}
              disabled={isPending}
              className={styles.oauthBtn}
            >
              Continue with Google
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<OutlookIcon fontSize="small" />}
              onClick={() => handleOAuth("outlook")}
              disabled={isPending}
              className={styles.oauthBtn}
            >
              Continue with Outlook
            </Button>
          </div>
          <div className={styles.divider}>
            <span>or use email</span>
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>
            {mode === "signup" && (
              <TextField
                label="Full name"
                name="displayName"
                value={formState.displayName}
                onChange={handleChange}
                fullWidth
                size="small"
                required
              />
            )}
            <TextField
              label="Email address"
              name="email"
              type="email"
              value={formState.email}
              onChange={handleChange}
              fullWidth
              size="small"
              required
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formState.password}
              onChange={handleChange}
              fullWidth
              size="small"
              required
            />
            {mode === "signup" && (
              <TextField
                label="Confirm password"
                name="confirmPassword"
                type="password"
                value={formState.confirmPassword}
                onChange={handleChange}
                fullWidth
                size="small"
                required
              />
            )}
            {error && <p className={styles.error}>{error}</p>}
            {message && <p className={styles.message}>{message}</p>}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isPending}
              className={styles.submitBtn}
            >
              {isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : mode === "signup" ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          {mode === "signin" && (
            <button
              type="button"
              className={styles.link}
              onClick={() => alert("Password resets arrive soon.")}
            >
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
