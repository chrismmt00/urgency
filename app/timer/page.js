"use client";

import { useState, useEffect } from "react";

export default function Timer() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [percentLeft, setPercentLeft] = useState(100);

  // Set timer duration
  const setTimerDuration = (hours) => {
    const milliseconds = hours * 60 * 60 * 1000;
    setTimeLeft(milliseconds);
    setTotalTime(milliseconds);
    setIsRunning(true);
  };

  // Handle custom timer input
  const handleCustomTimer = () => {
    const hours = prompt("Enter timer duration in hours:", "");
    if (hours === null || hours === "") return;

    const parsedHours = parseFloat(hours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      alert("Please enter a valid positive number");
      return;
    }

    setTimerDuration(parsedHours);
  };

  // Format time display
  const formatTime = (milliseconds) => {
    if (milliseconds <= 0) return "00:00:00";

    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  };

  // Determine timer color based on percentage left
  const getTimerColor = () => {
    if (percentLeft > 50) return "green";
    if (percentLeft > 15) return "gold";
    return "red";
  };

  // Update timer every second
  useEffect(() => {
    let interval = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1000;
          const newPercentLeft = (newTime / totalTime) * 100;
          setPercentLeft(newPercentLeft);
          return newTime;
        });
      }, 1000);
    } else if (timeLeft <= 0 && isRunning) {
      setIsRunning(false);
      // Play sound when timer reaches 0
      const audio = new Audio("/audio/ding.wav");
      audio.play().catch((e) => console.log("Error playing sound:", e));
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, totalTime]);

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "var(--font-geist-sans)",
        textAlign: "center",
      }}
    >
      <h1 style={{ marginBottom: "2rem" }}>Email Urgency Timer</h1>

      <div
        style={{
          fontSize: "3rem",
          fontWeight: "bold",
          marginBottom: "2rem",
          fontFamily: "var(--font-geist-mono)",
          color: isRunning ? getTimerColor() : "black",
        }}
      >
        {formatTime(timeLeft)}
      </div>

      {!isRunning ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <button onClick={() => setTimerDuration(24)} style={buttonStyle}>
            24 h
          </button>
          <button onClick={() => setTimerDuration(48)} style={buttonStyle}>
            48 h
          </button>
          <button onClick={() => setTimerDuration(72)} style={buttonStyle}>
            72 h
          </button>
          <button onClick={handleCustomTimer} style={buttonStyle}>
            Custom
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsRunning(false)}
          style={{
            ...buttonStyle,
            backgroundColor: "#e53e3e",
          }}
        >
          Stop Timer
        </button>
      )}

      <p style={{ marginTop: "2rem" }}>
        <a
          href="/"
          style={{
            color: "#0070f3",
            textDecoration: "none",
          }}
        >
          ← Back to Home
        </a>
      </p>
    </div>
  );
}

// Button styles
const buttonStyle = {
  backgroundColor: "#0070f3",
  color: "white",
  border: "none",
  padding: "0.75rem 1.5rem",
  borderRadius: "4px",
  fontSize: "1rem",
  fontWeight: "bold",
  cursor: "pointer",
};
