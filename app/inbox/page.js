"use client";

import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import MailProvider, { useMail } from "@/app/components/email/MailProvider";
import TopBar from "@/app/components/email/TopBar";
import Sidebar from "@/app/components/email/Sidebar";
import MailList from "@/app/components/email/MailList";
import MailReader from "@/app/components/email/MailReader";

import styles from "./InboxPage.module.css";

const DRAWER_WIDTH = 240;

function Content() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const { mobileView } = useMail();

  return (
    <div className={`${styles.content} ${isMdUp ? styles.row : styles.col}`}>
      {isMdUp ? (
        <>
          <MailList />
          <MailReader />
        </>
      ) : mobileView === "list" ? (
        <MailList />
      ) : (
        <MailReader />
      )}
    </div>
  );
}

export default function InboxPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <MailProvider>
      <div className={styles.shell}>
        {/* Top bar (make sure TopBar sets zIndex above Drawer) */}
        <TopBar onOpenSidebar={() => setMobileOpen(true)} />

        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className={styles.main} data-width={DRAWER_WIDTH}>
          {/* Spacer equals AppBar height so content sits below it */}
          <div className={styles.appbarSpacer} />
          <Content />
        </div>
      </div>
    </MailProvider>
  );
}
