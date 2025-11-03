"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Tooltip,
} from "@mui/material";
import styles from "../../page.module.css";

export default function RuleEditor({ open, onClose, accounts = [], onSaved }) {
  const [ruleForm, setRuleForm] = useState({
    scope: "everyone",
    scope_value: "",
    time_buckets: [24, 48, 72],
    allow_overdue: true,
    match_mode: "any",
    active: true,
    name: "",
    criteriaImportance: ["high"],
    push_enabled: true,
    email_enabled: false,
    mobile_enabled: false,
    accountId: "",
    overdue_limit_hours: 72,
    senders: [],
    channel_chip: true,
    channel_inapp: false,
    channel_email: false,
    channel_push: false,
  });
  const [labels, setLabels] = useState([]);
  const [testOpen, setTestOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    // reset when opened
    setRuleForm((f) => ({
      ...f,
      scope: "everyone",
      scope_value: "",
      time_buckets: [24, 48, 72],
      allow_overdue: true,
      match_mode: "any",
      active: true,
      name: "",
      criteriaImportance: ["high"],
      push_enabled: true,
      email_enabled: false,
      mobile_enabled: false,
      accountId: "",
      overdue_limit_hours: 72,
      senders: [],
      channel_chip: true,
      channel_inapp: false,
      channel_email: false,
      channel_push: false,
    }));
  }, [open]);

  // Load labels per selected account
  useEffect(() => {
    let cancelled = false;
    async function loadLabels() {
      if (!ruleForm.accountId) {
        setLabels([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/mail/labels?accountId=${encodeURIComponent(
            ruleForm.accountId
          )}`,
          { credentials: "include" }
        );
        const data = await res.json().catch(() => ({}));
        if (!cancelled)
          setLabels(Array.isArray(data?.labels) ? data.labels : []);
      } catch (_) {
        if (!cancelled) setLabels([]);
      }
    }
    loadLabels();
    return () => {
      cancelled = true;
    };
  }, [ruleForm.accountId]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{ width: 380, p: 2, display: "grid", gap: 1.25 }}
        role="dialog"
        aria-label="New rule"
      >
        <Typography variant="h6">New timer rule</Typography>
        <FormControl fullWidth size="small">
          <InputLabel id="acc-label">Account</InputLabel>
          <Select
            labelId="acc-label"
            label="Account"
            value={ruleForm.accountId}
            onChange={(e) =>
              setRuleForm((f) => ({ ...f, accountId: e.target.value }))
            }
          >
            {accounts.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.email}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Rule name"
          value={ruleForm.name}
          onChange={(e) => setRuleForm((f) => ({ ...f, name: e.target.value }))}
        />
        <FormControl fullWidth size="small">
          <InputLabel id="scope2-label">Scope</InputLabel>
          <Select
            labelId="scope2-label"
            label="Scope"
            value={ruleForm.scope}
            onChange={(e) =>
              setRuleForm((f) => ({ ...f, scope: e.target.value }))
            }
          >
            <MenuItem value="everyone">All messages</MenuItem>
            <MenuItem value="label">Specific label</MenuItem>
            <MenuItem value="sender">Specific sender(s)</MenuItem>
            <MenuItem value="domain">Specific domain</MenuItem>
            <MenuItem value="important">Important inbox</MenuItem>
          </Select>
        </FormControl>
        {ruleForm.scope === "label" && (
          <Autocomplete
            options={labels}
            loading={!labels.length}
            getOptionLabel={(opt) => opt.name || ""}
            onChange={(_, val) =>
              setRuleForm((f) => ({ ...f, scope_value: val?.name || "" }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Choose a label"
                size="small"
                helperText="Labels from the selected account"
              />
            )}
          />
        )}
        {ruleForm.scope === "sender" && (
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={ruleForm.senders}
            onChange={(_, val) =>
              setRuleForm((f) => ({
                ...f,
                senders: val,
                scope_value: (val || []).join(","),
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Sender emails"
                placeholder="name@company.com"
                helperText="Add one or more sender emails"
              />
            )}
          />
        )}
        <FormControl component="fieldset">
          <Typography variant="subtitle2">Importance</Typography>
          <RadioGroup
            row
            value={ruleForm.criteriaImportance?.[0] || "high"}
            onChange={(e) =>
              setRuleForm((f) => ({
                ...f,
                criteriaImportance: [e.target.value],
              }))
            }
          >
            <FormControlLabel
              value="high"
              control={<Radio size="small" />}
              label="High"
            />
            <FormControlLabel
              value="normal"
              control={<Radio size="small" />}
              label="Normal"
            />
            <FormControlLabel
              value="low"
              control={<Radio size="small" />}
              label="Low"
            />
          </RadioGroup>
        </FormControl>
        <Typography variant="subtitle2">Time buckets</Typography>
        <ToggleButtonGroup
          size="small"
          value={ruleForm.time_buckets}
          onChange={(_, vals) =>
            vals &&
            vals.length &&
            setRuleForm((f) => ({ ...f, time_buckets: vals }))
          }
          aria-label="time buckets"
        >
          {[24, 48, 72].map((h) => (
            <ToggleButton key={h} value={h} aria-label={`${h} hours`}>
              {h}h
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="subtitle2">Alerts</Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              label="Timer chip"
              color={ruleForm.channel_chip ? "primary" : "default"}
              onClick={() =>
                setRuleForm((f) => ({ ...f, channel_chip: !f.channel_chip }))
              }
            />
            <Chip
              label="In-app"
              color={ruleForm.channel_inapp ? "primary" : "default"}
              onClick={() =>
                setRuleForm((f) => ({ ...f, channel_inapp: !f.channel_inapp }))
              }
            />
            <Chip
              label="Email"
              color={ruleForm.channel_email ? "primary" : "default"}
              onClick={() =>
                setRuleForm((f) => ({ ...f, channel_email: !f.channel_email }))
              }
            />
            <Chip
              label="Push"
              color={ruleForm.channel_push ? "primary" : "default"}
              onClick={() =>
                setRuleForm((f) => ({ ...f, channel_push: !f.channel_push }))
              }
            />
          </Stack>
        </Box>
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="subtitle2">Overdue</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={ruleForm.allow_overdue}
                onChange={(e) =>
                  setRuleForm((f) => ({
                    ...f,
                    allow_overdue: e.target.checked,
                  }))
                }
              />
            }
            label="Keep counting when overdue"
          />
          <TextField
            size="small"
            type="number"
            label="Auto-dismiss after hours"
            value={ruleForm.overdue_limit_hours}
            onChange={(e) =>
              setRuleForm((f) => ({
                ...f,
                overdue_limit_hours: parseInt(e.target.value || "0", 10) || 72,
              }))
            }
            helperText="When overdue exceeds this limit, the chip hides automatically."
          />
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => setTestOpen(true)}>
            Test rule
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={
              !ruleForm.accountId ||
              !ruleForm.name ||
              (ruleForm.scope === "label" && !ruleForm.scope_value)
            }
            onClick={async () => {
              const res = await fetch("/api/notifications/rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  accountId: ruleForm.accountId,
                  name: ruleForm.name,
                  scope:
                    ruleForm.scope === "important" ? "label" : ruleForm.scope,
                  scope_value:
                    ruleForm.scope === "important"
                      ? "IMPORTANT"
                      : ruleForm.scope_value || null,
                  time_buckets: ruleForm.time_buckets,
                  allow_overdue: !!ruleForm.allow_overdue,
                  overdue_limit_hours: ruleForm.overdue_limit_hours,
                  match_mode: ruleForm.match_mode,
                  active: true,
                  criteriaImportance: ruleForm.criteriaImportance || [],
                }),
              });
              if (res.ok) {
                onClose?.();
                onSaved?.();
              } else {
                alert("Failed to save rule");
              }
            }}
          >
            Save
          </Button>
        </Stack>
        <Alert severity="info">
          Scope tips: "Important inbox" maps to Gmail's IMPORTANT label.
          "Specific label" lists labels from the selected account.
        </Alert>

        {/* Test rule dialog */}
        <Dialog open={open && testOpen} onClose={() => setTestOpen(false)}>
          <DialogTitle>Test rule</DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 1 }}>
            <TextField
              size="small"
              label="From email"
              value={ruleForm.test_from || ""}
              onChange={(e) =>
                setRuleForm((f) => ({ ...f, test_from: e.target.value }))
              }
            />
            <TextField
              size="small"
              label="Subject"
              value={ruleForm.test_subject || ""}
              onChange={(e) =>
                setRuleForm((f) => ({ ...f, test_subject: e.target.value }))
              }
            />
            <Alert severity="info">
              This is a lightweight preview. Final matching uses server rules
              and live labels.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTestOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Drawer>
  );
}
