"use client";

import { Box, Button, Chip, Stack } from "@mui/material";
import Section from "../components/Section";
import styles from "../page.module.css";

export default function AccountsTab({
  accounts = [],
  loading = false,
  error = null,
  refresh,
}) {
  return (
    <Section>
      <div className={styles.row}>
        {loading ? (
          <div>Loading accounts…</div>
        ) : accounts && accounts.length ? (
          <Stack direction="column" spacing={1} sx={{ width: "100%" }}>
            {accounts.map((a, idx) => (
              <Box
                key={`${a.provider}-${a.email || idx}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={a.provider === "gmail" ? "Gmail" : a.provider}
                  />
                  <span>{a.email || ""}</span>
                  {a.is_default && (
                    <Chip
                      size="small"
                      variant="outlined"
                      color="success"
                      label="Default"
                    />
                  )}
                </Stack>
                <div className={styles.formActions}>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={!!a.is_default}
                    onClick={async () => {
                      await fetch(`/api/connections/${a.id}/default`, {
                        method: "POST",
                        credentials: "include",
                      });
                      await refresh?.();
                    }}
                  >
                    Make default
                  </Button>
                </div>
                <div className={styles.formActions}>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={async () => {
                      await fetch(`/api/connections/${a.id}`, {
                        method: "DELETE",
                        credentials: "include",
                      });
                      await refresh?.();
                    }}
                  >
                    Disconnect
                  </Button>
                </div>
              </Box>
            ))}
          </Stack>
        ) : (
          <div>{error || "No accounts connected yet"}</div>
        )}
      </div>
      <div className={styles.formActions}>
        <Button variant="outlined" size="small" disabled>
          Connect Outlook (coming soon)
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            window.location.href = "/api/auth/oauth/google?intent=connect";
          }}
        >
          Connect another Gmail
        </Button>
      </div>
    </Section>
  );
}
