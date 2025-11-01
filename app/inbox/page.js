"use client";

import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useMail } from "@/app/components/email/MailProvider";
import MailList from "@/app/components/email/MailList";
import MailReader from "@/app/components/email/MailReader";
import styles from "./page.module.css";

export default function InboxPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const { mobileView } = useMail();

  return (
    <div className={styles.row}>
      {isDesktop ? (
        <>
          <div className={styles.listCol}>
            <MailList />
          </div>
          <div className={styles.readerCol}>
            <MailReader />
          </div>
        </>
      ) : mobileView === "list" ? (
        <div className={styles.single}>
          <MailList />
        </div>
      ) : (
        <div className={styles.single}>
          <MailReader />
        </div>
      )}
    </div>
  );
}
