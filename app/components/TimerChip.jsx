"use client";
import { Chip } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

// Props:
// - receivedISO, ttlHours: legacy inputs
// - timerDueAt: ISO string of due time
// - allowOverdue: boolean (default true)
// - status: 'active' | 'resolved' | 'suppressed' (hide if not active)
// - onMarkDone: optional click handler to mark resolved
export default function TimerChip({
  receivedISO,
  ttlHours = 24,
  timerDueAt,
  allowOverdue = true,
  status = "active",
  onMarkDone,
  overdueLimitHours = 72,
}) {
  if (status !== "active") return null;

  const due = timerDueAt
    ? new Date(timerDueAt)
    : receivedISO
    ? new Date(new Date(receivedISO).getTime() + ttlHours * 3600 * 1000)
    : null;
  if (!due || isNaN(due.getTime())) return null;

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    // TODO: Live countdown tick — consider adaptive intervals (e.g., 30s when far from due,
    // 1s in the last few minutes) to balance smoothness and performance.
    // Update every second for a smooth countdown experience
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { label, color } = useMemo(() => {
    const total = ttlHours * 3600;
    let secsLeft = Math.floor((due.getTime() - now) / 1000);
    const isOverdue = secsLeft < 0;
    if (!allowOverdue) secsLeft = Math.max(0, secsLeft);
    const pct = total ? Math.max(0, Math.min(1, secsLeft / total)) : 0;
    const clr = isOverdue
      ? "error"
      : pct > 0.5
      ? "success"
      : pct > 0.15
      ? "warning"
      : "error";
    const abs = Math.abs(secsLeft);
    const h = Math.floor(abs / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((abs % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (abs % 60).toString().padStart(2, "0");
    const sign = isOverdue && allowOverdue ? "−" : ""; // unicode minus
    return { label: `${sign}${h}:${m}:${s}`, color: clr };
  }, [now, allowOverdue, ttlHours, due]);

  // TODO: Overdue auto-dismiss logic — currently hides chip after overdueLimitHours.
  // Could be extended with user-configurable behavior per rule.
  // Auto-hide if overdue beyond limit
  const hoursOver = (now - due.getTime()) / 3600000;
  if (hoursOver > overdueLimitHours) return null;

  return (
    <Chip
      color={color}
      label={label}
      variant="filled"
      sx={{
        fontWeight: 800,
        cursor: onMarkDone ? "pointer" : "default",
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        letterSpacing: "-0.02em",
        px: 1,
        py: 0,
      }}
      onClick={onMarkDone || undefined}
      title={onMarkDone ? "Mark done" : undefined}
    />
  );
}
