"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Tooltip,
} from "@mui/material";
import Section from "../components/Section";
import styles from "../page.module.css";
import RuleEditor from "../components/notifications/RuleEditor";
import RuleList from "../components/notifications/RuleList";
import { useEffect, useState } from "react";

export default function NotificationsTab({
  accounts = [],
  rules = [],
  rulesLoading = false,
  refreshRules,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Section>
        <Alert severity="info" sx={{ mb: 1 }}>
          <strong>Timer Rules</strong> — Timers help you keep pace. Start with a
          simple rule for important mail (24/48/72h), then customize.
        </Alert>

        <h3>Timer Rules</h3>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Tooltip title="Create rule from this preset" placement="top">
            <Chip
              size="small"
              color="primary"
              label="Important only"
              onClick={async () => {
                await fetch("/api/notifications/rules", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    name: "Important emails",
                    scope: "everyone",
                    criteriaImportance: ["high"],
                    time_buckets: [24, 48, 72],
                    allow_overdue: true,
                  }),
                });
                await refreshRules?.();
              }}
            />
          </Tooltip>
          <Tooltip title="Create rule from this preset" placement="top">
            <Chip
              size="small"
              label="All emails"
              onClick={async () => {
                await fetch("/api/notifications/rules", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    name: "All emails",
                    scope: "everyone",
                    time_buckets: [24, 48, 72],
                    allow_overdue: true,
                  }),
                });
                await refreshRules?.();
              }}
            />
          </Tooltip>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setDrawerOpen(true)}
          >
            New rule
          </Button>
        </Stack>
        {rulesLoading ? (
          <div>Loading rules…</div>
        ) : (
          <RuleList
            rules={rules}
            onDelete={async (id) => {
              await fetch(`/api/notifications/rules/${id}`, {
                method: "DELETE",
                credentials: "include",
              });
              await refreshRules?.();
            }}
          />
        )}

        <Divider sx={{ my: 1 }} />
      </Section>

      <RuleEditor
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        accounts={accounts}
        onSaved={refreshRules}
      />
    </>
  );
}
