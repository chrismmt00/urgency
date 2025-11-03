"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const MailCtx = createContext(null);
export const useMail = () => useContext(MailCtx);

export default function MailProvider({ children }) {
  // Connected accounts pulled from server
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(null);
  // Folders: important | starred | sent | spam | trash | all
  const [activeFolder, setActiveFolder] = useState("important");

  const [folder, setFolder] = useState("Inbox"); // legacy field used by UI filtering; kept for compatibility
  const [query, setQuery] = useState("");
  const [emails, setEmails] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeId, setActiveId] = useState(null);

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
      // Accounts & folders
      accounts,
      activeAccountId,
      setActiveAccountId,
      activeFolder,
      setActiveFolder,
      // legacy folder for existing components (maps from activeFolder)
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
          const params = new URLSearchParams();
          params.set("pageToken", nextPageToken);
          if (activeAccountId) params.set("accountId", activeAccountId);
          if (activeFolder) params.set("folder", activeFolder);
          const res = await fetch(`/api/mail/messages?${params.toString()}`, {
            credentials: "include",
          });
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
      accounts,
      activeAccountId,
      activeFolder,
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

  // Load connected accounts once and set default active account
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/connections", { credentials: "include" });
        const data = await res.json().catch(() => []);
        if (!cancelled && Array.isArray(data)) {
          setAccounts(data);
          if (!activeAccountId) {
            const def = data.find((a) => a.is_default);
            if (def?.id) setActiveAccountId(def.id);
            else if (data[0]?.id) setActiveAccountId(data[0].id);
          }
        }
      } catch {
        // ignore; accounts remain empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeAccountId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (activeAccountId) params.set("accountId", activeAccountId);
        if (activeFolder) params.set("folder", activeFolder);
        const res = await fetch(`/api/mail/messages?${params.toString()}`, {
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
    // Map activeFolder to legacy folder label
    const legacy =
      activeFolder === "important"
        ? "Important"
        : activeFolder === "starred"
        ? "Starred"
        : activeFolder === "primary"
        ? "Inbox"
        : activeFolder === "sent"
        ? "Sent"
        : activeFolder === "spam"
        ? "Spam"
        : activeFolder === "trash"
        ? "Trash"
        : activeFolder === "all"
        ? "All Mail"
        : "Inbox";
    setFolder(legacy);
    setSelectedIds(new Set());
    setActiveId(null);
    if (activeAccountId) {
      load();
    } else {
      setEmails([]);
      setNextPageToken(null);
    }
    return () => {
      cancelled = true;
    };
  }, [activeAccountId, activeFolder]);

  return <MailCtx.Provider value={value}>{children}</MailCtx.Provider>;
}
