"use client";
import { createContext, useContext, useMemo, useState } from "react";
import { MAIL } from "./mockMail";

const MailCtx = createContext(null);
export const useMail = () => useContext(MailCtx);

export default function MailProvider({ children }) {
  const [folder, setFolder] = useState("Inbox");
  const [query, setQuery] = useState("");
  const [emails, setEmails] = useState(MAIL);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeId, setActiveId] = useState(MAIL[0]?.id ?? null);

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
    }),
    [folder, query, emails, selectedIds, activeId, mobileView]
  );

  return <MailCtx.Provider value={value}>{children}</MailCtx.Provider>;
}
