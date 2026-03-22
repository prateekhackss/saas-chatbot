"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, Mail, MessageSquareText, AlertTriangle, X } from "lucide-react";

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
  lead_captured: <Mail className="h-4 w-4 text-blue-500" />,
  new_conversation: <MessageSquareText className="h-4 w-4 text-emerald-500" />,
  usage_warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  // Fetch on mount and poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

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
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
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

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-[380px] rounded-2xl border border-stone-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-stone-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                <Bell className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs mt-1">
                  You&apos;ll see alerts for leads, conversations, and usage here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex gap-3 px-4 py-3 border-b border-stone-50 transition cursor-pointer hover:bg-stone-50 ${
                    !notif.is_read ? "bg-blue-50/40" : ""
                  }`}
                  onClick={() => {
                    if (!notif.is_read) markOneRead(notif.id);
                  }}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-100">
                    {TYPE_ICONS[notif.type] || <Bell className="h-4 w-4 text-stone-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-tight ${!notif.is_read ? "font-semibold text-stone-900" : "font-medium text-stone-700"}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="mt-1 text-[10px] text-stone-400">
                      {timeAgo(notif.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
