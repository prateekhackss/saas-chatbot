"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";

type LogoutButtonProps = {
  compact?: boolean;
  tone?: "light" | "dark";
};

export function LogoutButton({
  compact = false,
  tone = "light",
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    // Submit to server-side signout route which properly clears httpOnly cookies
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/signout";
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className={`${compact ? "inline-flex h-11 items-center justify-center" : "inline-flex h-12 w-full items-center justify-center"} gap-2 rounded-2xl px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
        tone === "dark"
          ? "border border-stone-700 bg-stone-900 text-stone-100 hover:border-stone-600 hover:bg-stone-800"
          : "border border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:text-stone-900"
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing out...
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          Logout
        </>
      )}
    </button>
  );
}
