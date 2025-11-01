"use client";
import { useEffect, useMemo, useState } from "react";

// Big, readable countdown used on the homepage hero
// Defaults to starting now and counting down from ttlHours
export default function HeroTimer({ receivedISO, ttlHours = 24 }) {
  // Start time: now if not provided (demo)
  const startMs = useMemo(
    () => (receivedISO ? new Date(receivedISO).getTime() : Date.now()),
    [receivedISO]
  );
  const total = ttlHours * 3600; // seconds

  const calcLeft = () => {
    const secsLeft = Math.max(
      0,
      Math.floor(startMs / 1000 + total - Math.floor(Date.now() / 1000))
    );
    return secsLeft;
  };

  const [secsLeft, setSecsLeft] = useState(calcLeft);

  useEffect(() => {
    const id = setInterval(() => {
      setSecsLeft((prev) => {
        const next = calcLeft();
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startMs, ttlHours]);

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
    <div className={`heroTimer ${color}`}>
      <div className="timerDigits" aria-live="polite" aria-atomic="true">
        <span className="dd">{h}</span>
        <span className="colon">:</span>
        <span className="dd">{m}</span>
        <span className="colon">:</span>
        <span className="dd">{s}</span>
      </div>
      <div className="timerSub">
        Time left of {ttlHours}h window
      </div>
      <div className="timerBar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)}>
        <div className="timerBarFill" style={{ width: `${pct * 100}%` }} />
      </div>
      <style jsx>{`
        .heroTimer {
          display: grid;
          gap: 14px;
        }
        .timerDigits {
          font-weight: 800;
          letter-spacing: -0.02em;
          font-size: clamp(2.2rem, 7vw + 0.5rem, 3.8rem);
          line-height: 1.1;
          display: flex;
          align-items: baseline;
          justify-content: center;
        }
        .timerSub {
          text-align: center;
          font-size: 0.95rem;
          opacity: 0.72;
        }
        .dd {
          display: inline-block;
          min-width: 2ch;
        }
        .colon {
          opacity: 0.6;
          padding: 0 4px;
        }
        .timerBar {
          height: 8px;
          border-radius: 999px;
          background: var(--surface);
          border: 1px solid var(--border);
          overflow: hidden;
        }
        .timerBarFill {
          height: 100%;
          background: var(--chip-success);
          transition: width 0.4s ease;
        }
        .heroTimer.warning .timerBarFill { background: var(--chip-warning); }
        .heroTimer.error .timerBarFill { background: var(--chip-error); }
      `}</style>
    </div>
  );
}
