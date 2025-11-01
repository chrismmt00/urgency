"use client";

import { useState } from "react";
import TopBar from "@/app/components/email/TopBar"; // keep your current (or swap later)
import Sidebar from "@/app/components/email/Sidebar"; // will wrap in a plain div container
import MailProvider from "@/app/components/email/MailProvider";
import styles from "./layout.module.css";

export default function InboxLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <MailProvider>
      <div className={styles.shell}>
        {/* Header (no fixed; participates in flow) */}
        <header className={styles.header}>
          <TopBar onOpenSidebar={() => setMobileOpen(true)} />
        </header>

        {/* Main row: sidebar + content */}
        <div className={styles.main}>
          {/* Sidebar column */}
          <aside
            className={`${styles.sidebar} ${
              mobileOpen ? styles.sidebarOpen : ""
            }`}
            aria-hidden={!mobileOpen}
          >
            {/* simple close layer (mobile only) */}
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

          {/* Content column */}
          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </MailProvider>
  );
}
