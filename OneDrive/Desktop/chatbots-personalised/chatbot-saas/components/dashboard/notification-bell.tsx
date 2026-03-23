"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Mail, MessageSquareText, AlertTriangle, X } from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  client_id: string | null;
  is_read: boolean;
  created_at: string;
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  lead_captured: <Mail className="h-4 w-4 text-blue-400" />,
  new_conversation: <MessageSquareText className="h-4 w-4 text-emerald-400" />,
  usage_warning: <AlertTriangle className="h-4 w-4 text-amber-400" />,
};

export function NotificationBell({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const setIsOpen = onToggle;

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications?limit=15");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, setIsOpen]);

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
    setLoading(false);
  };

  const markOneRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <button
      onClick={() => {
        setIsOpen(!isOpen);
        if (!isOpen) fetchNotifications();
      }}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 transition hover:bg-stone-50 hover:text-stone-900"
      aria-label="Notifications"
    >
      <Bell className="h-4.5 w-4.5" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}

/* Separate sidebar panel — rendered by DashboardChrome outside the header */
export function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkOneRead,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkOneRead: (id: string) => void;
  loading: boolean;
}) {
  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <>
      {/* Backdrop — all screens */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={onClose}>
          <div className="absolute inset-0 bg-stone-950/30 lg:bg-transparent" />
        </div>
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-screen w-[280px] flex-col border-l border-neutral-800 bg-[#0A0A0A] text-neutral-100 shadow-2xl transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="border-b border-neutral-800 px-5 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-[#EF4444]" />
              <span className="text-sm font-semibold tracking-tight text-white">
                Notifications
              </span>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {unreadCount > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                {unreadCount} unread
              </span>
              <button
                onClick={onMarkAllRead}
                disabled={loading}
                className="flex items-center gap-1 text-[10px] font-medium text-neutral-500 transition hover:text-white disabled:opacity-50"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            </div>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs font-medium">No notifications yet</p>
              <p className="text-[10px] mt-1 text-neutral-600 text-center px-4">
                Alerts for leads, conversations, and usage will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  className={`w-full text-left flex gap-2.5 rounded-2xl px-3 py-3 transition ${
                    !notif.is_read
                      ? "bg-white/5 border border-neutral-800"
                      : "border border-transparent hover:bg-white/5"
                  }`}
                  onClick={() => {
                    if (!notif.is_read) onMarkOneRead(notif.id);
                  }}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      !notif.is_read ? "bg-[#EF4444]/15" : "bg-neutral-900"
                    }`}
                  >
                    {TYPE_ICONS[notif.type] || <Bell className="h-4 w-4 text-neutral-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <p
                        className={`text-xs leading-tight ${
                          !notif.is_read ? "font-semibold text-white" : "font-medium text-neutral-400"
                        }`}
                      >
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#EF4444]" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="mt-1 block text-[10px] text-neutral-600">
                      {timeAgo(notif.created_at)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
