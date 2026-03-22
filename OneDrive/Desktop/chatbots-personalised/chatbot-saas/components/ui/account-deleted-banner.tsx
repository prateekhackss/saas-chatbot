"use client";

import { useState } from "react";
import { CheckCircle, X } from "lucide-react";

export function AccountDeletedBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 shrink-0" />
        <span>Your account and all associated data have been permanently deleted.</span>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="ml-4 rounded-lg p-1 transition hover:bg-green-700"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
