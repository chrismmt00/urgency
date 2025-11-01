"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AuthModal from "./auth/AuthModal";
import NavBar from "./NavBar";
import { useAuth } from "@/app/providers/AuthProvider";

export default function AppClientRoot({ children }) {
  const { openAuthModal } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authParam = searchParams?.get("auth");
    if (authParam === "required") {
      openAuthModal("signin");
      const params = new URLSearchParams(searchParams.toString());
      params.delete("auth");
      const next = params.toString();
      router.replace(`${pathname}${next ? `?${next}` : ""}`);
    }
  }, [searchParams, openAuthModal, router, pathname]);

  return (
    <>
      {pathname && !pathname.startsWith("/inbox") && <NavBar />}
      {children}
      <AuthModal />
    </>
  );
}
