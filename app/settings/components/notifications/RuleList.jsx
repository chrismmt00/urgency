"use client";

import { Box, Button, Chip, Stack } from "@mui/material";
import styles from "../../page.module.css";

export default function RuleList({ rules = [], onDelete }) {
  if (!rules?.length) return <div>No rules yet</div>;
  return (
    <Stack direction="column" spacing={1} sx={{ width: "100%" }}>
      {rules.map((r) => (
        <Box
          key={r.id}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={r.name || r.scope} />
            {r.scope_value && (
              <Chip size="small" variant="outlined" label={r.scope_value} />
            )}
            <Chip
              size="small"
              color={r.active ? "success" : "default"}
              label={r.active ? "Active" : "Inactive"}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`Buckets: ${(r.time_buckets || []).join(",") || ""}`}
            />
            {Array.isArray(r.criteria_importance) &&
              r.criteria_importance.length > 0 && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Importance: ${r.criteria_importance.join("/")}`}
                />
              )}
          </Stack>
          <div className={styles.formActions}>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => onDelete?.(r.id)}
            >
              Delete
            </Button>
          </div>
        </Box>
      ))}
    </Stack>
  );
}
