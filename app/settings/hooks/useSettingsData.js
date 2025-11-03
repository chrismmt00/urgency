"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";

export default function useSettingsData({ initialAccounts = [] } = {}) {
  const { user } = useAuth();

  // Accounts
  const [accounts, setAccounts] = useState(initialAccounts || []);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState(null);

  const refreshAccounts = async () => {
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const res = await fetch("/api/connections", { credentials: "include" });
      const data = await res.json().catch(() => []);
      setAccounts(Array.isArray(data) ? data : []);
    } catch (e) {
      setAccountsError("Failed to load connections");
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    // Load accounts on mount (if not provided or to refresh)
    refreshAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rules
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);

  const refreshRules = async () => {
    setRulesLoading(true);
    try {
      const res = await fetch("/api/notifications/rules", {
        credentials: "include",
      });
      const data = await res.json().catch(() => []);
      setRules(Array.isArray(data) ? data : []);
    } catch (e) {
      setRules([]);
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    refreshRules();
  }, []);

  return {
    user,
    accounts,
    accountsLoading,
    accountsError,
    refreshAccounts,
    rules,
    setRules,
    rulesLoading,
    refreshRules,
  };
}
