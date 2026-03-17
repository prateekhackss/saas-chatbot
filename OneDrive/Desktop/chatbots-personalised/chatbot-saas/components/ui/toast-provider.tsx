"use client";

import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastRecord = ToastInput & {
  id: string;
};

type ToastContextValue = {
  pushToast: (toast: ToastInput) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ duration = 3200, variant = "info", ...toast }: ToastInput) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      setToasts((current) => [...current, { id, variant, duration, ...toast }]);

      window.setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast],
  );

  const value = useMemo(
    () => ({
      pushToast,
      removeToast,
    }),
    [pushToast, removeToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-4 sm:justify-end sm:px-6">
        <div className="flex w-full max-w-sm flex-col gap-3">
          {toasts.map((toast) => (
            <ToastCard
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: () => void;
}) {
  const icon =
    toast.variant === "success" ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
    ) : toast.variant === "error" ? (
      <AlertCircle className="h-5 w-5 text-rose-600" />
    ) : (
      <Info className="h-5 w-5 text-teal-600" />
    );

  const palette =
    toast.variant === "success"
      ? "border-emerald-200 bg-emerald-50/95"
      : toast.variant === "error"
        ? "border-rose-200 bg-rose-50/95"
        : "border-teal-200 bg-white/95";

  return (
    <div
      className={`pointer-events-auto rounded-[1.5rem] border px-4 py-4 shadow-lg shadow-stone-900/10 backdrop-blur ${palette}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-tight text-stone-950">
            {toast.title}
          </p>
          {toast.description ? (
            <p className="mt-1 text-sm leading-6 text-stone-600">
              {toast.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 transition hover:bg-white/70 hover:text-stone-600"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
