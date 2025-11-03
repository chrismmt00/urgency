"use client";

export function useTimerRules() {
  const createRule = async (payload) => {
    const res = await fetch("/api/notifications/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return res.ok;
  };

  const updateRule = async (id, patch) => {
    const res = await fetch(`/api/notifications/rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(patch),
    });
    return res.ok;
  };

  const deleteRule = async (id) => {
    const res = await fetch(`/api/notifications/rules/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  };

  return { createRule, updateRule, deleteRule };
}
