"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MAIL } from "./mockMail";

const MailCtx = createContext(null);
export const useMail = () => useContext(MailCtx);

export default function MailProvider({ children }) {
  const [folder, setFolder] = useState("Inbox");
  const [query, setQuery] = useState("");
  const [emails, setEmails] = useState(MAIL);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeId, setActiveId] = useState(MAIL[0]?.id ?? null);

  // loading/paging state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);

  // Global composer control
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerProps, setComposerProps] = useState(null);
  const openComposer = (props) => {
    setComposerProps(props || {});
    setComposerOpen(true);
  };
  const closeComposer = () => {
    setComposerOpen(false);
    setComposerProps(null);
  };

  // NEW: on mobile, show either "list" or "reader"
  const [mobileView, setMobileView] = useState("list"); // 'list' | 'reader'

  const value = useMemo(
    () => ({
      folder,
      setFolder,
      query,
      setQuery,
      emails,
      setEmails,
      selectedIds,
      setSelectedIds,
      activeId,
      setActiveId,
      mobileView,
      setMobileView, // <- expose
      // new
      loading,
      error,
      nextPageToken,
      loadMore: async () => {
        if (!nextPageToken || loading) return;
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(
            `/api/mail/messages?pageToken=${encodeURIComponent(nextPageToken)}`,
            { credentials: "include" }
          );
          const data = await res.json();
          if (res.ok && data?.ok) {
            if (Array.isArray(data.messages) && data.messages.length) {
              setEmails((prev) => [...prev, ...data.messages]);
            }
            setNextPageToken(data.nextPageToken || null);
          } else {
            setError(data?.error || "Failed to load more messages");
          }
        } catch (e) {
          setError("Failed to load more messages");
        } finally {
          setLoading(false);
        }
      },
      // composer controls
      composerOpen,
      composerProps,
      openComposer,
      closeComposer,
    }),
    [
      folder,
      query,
      emails,
      selectedIds,
      activeId,
      mobileView,
      loading,
      error,
      nextPageToken,
      composerOpen,
      composerProps,
    ]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/mail/messages", {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data?.ok) {
          if (Array.isArray(data.messages) && data.messages.length) {
            setEmails(data.messages);
            setActiveId(data.messages[0]?.id || null);
          }
          setNextPageToken(data.nextPageToken || null);
        } else if (!cancelled) {
          setError(data?.error || "Failed to load messages");
        }
      } catch (e) {
        if (!cancelled) setError("Failed to load messages");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return <MailCtx.Provider value={value}>{children}</MailCtx.Provider>;
}
