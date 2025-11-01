"use client";

import { useState } from "react";
import TopBar from "@/app/components/email/TopBar";
import Sidebar from "@/app/components/email/Sidebar";
import MailProvider from "@/app/components/email/MailProvider";
import MessageComposer from "@/app/components/email/MessageComposer";
import { useMail } from "@/app/components/email/MailProvider";
import styles from "./layout.module.css";

function ComposerHost() {
  const { composerOpen, composerProps, closeComposer } = useMail();
  return (
    <MessageComposer
      open={composerOpen}
      onClose={closeComposer}
      {...(composerProps || {})}
    />
  );
}

export default function InboxShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <MailProvider>
      <div className={styles.shell}>
        <header className={styles.header}>
          <TopBar onOpenSidebar={() => setMobileOpen(true)} />
        </header>

        <div className={styles.main}>
          <aside
            className={`${styles.sidebar} ${
              mobileOpen ? styles.sidebarOpen : ""
            }`}
            aria-hidden={!mobileOpen}
          >
            <div
              className={styles.sidebarBackdrop}
              onClick={() => setMobileOpen(false)}
            />
            <div className={styles.sidebarPanel}>
              <Sidebar
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
              />
            </div>
          </aside>

          <main className={styles.content}>{children}</main>
        </div>

        {/* Composer Portal */}
        <ComposerHost />
      </div>
    </MailProvider>
  );
}
