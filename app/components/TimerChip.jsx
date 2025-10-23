"use client";
import { Chip } from "@mui/material";

export default function TimerChip({ receivedISO, ttlHours = 24 }) {
  const total = ttlHours * 3600;
  const secsLeft = Math.max(
    0,
    Math.floor(
      (new Date(receivedISO).getTime() + ttlHours * 3600 * 1000 - Date.now()) /
        1000
    )
  );
  const pct = total ? secsLeft / total : 0;

  const color = pct > 0.5 ? "success" : pct > 0.15 ? "warning" : "error";

  const h = Math.floor(secsLeft / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((secsLeft % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (secsLeft % 60).toString().padStart(2, "0");

  return (
    <Chip
      color={color}
      label={`${h}:${m}:${s}`}
      variant="filled"
      sx={{ fontWeight: 700 }}
    />
  );
}
