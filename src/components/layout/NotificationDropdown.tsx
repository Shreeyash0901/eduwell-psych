import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bell,
  AlertTriangle,
  ClipboardList,
  MessageSquareHeart,
  CheckCircle2,
  X,
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  type: 'URGENT' | 'ASSESSMENT' | 'FEEDBACK' | 'SYSTEM';
  isRead: boolean;
  entityType?: string;
  entityId?: number;
}

interface NotificationDropdownProps {
  onNavigateTab?: (tab: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Allow all logged-in staff/users to view notifications
  const canReceiveNotifications = Boolean(user);

  const fetchNotifications = useCallback(async () => {
    if (!canReceiveNotifications) return;
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.notifications) {
          setNotifications(json.data.notifications);
          setUnreadCount(json.data.unreadCount ?? 0);
        }
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  }, [canReceiveNotifications]);

  const fetchUnreadCount = useCallback(async () => {
    if (!canReceiveNotifications || isOpen) return; // Don't just poll count if dropdown is open (it fetches full)
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (res.ok) {
        const json = await res.json();
        if (typeof json?.count === 'number') {
          setUnreadCount(json.count);
        }
      }
    } catch (e) {
      console.error('Failed to fetch unread count', e);
    }
  }, [canReceiveNotifications, isOpen]);

  // Polling for unread count every 60s
  useEffect(() => {
    if (!canReceiveNotifications) return;
    fetchUnreadCount(); // Initial fetch
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, canReceiveNotifications]);

  // Fetch full notifications when opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Handle outside click & escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Convert entityType to app tab
    let targetTab = '';
    if (notification.entityType === 'OBSERVATION') targetTab = 'observations';
    if (notification.entityType === 'ASSESSMENT') targetTab = 'assessments';
    if (notification.entityType === 'REPORT') targetTab = 'reports';

    if (targetTab && onNavigateTab) {
      onNavigateTab(targetTab);
      setIsOpen(false);
    }
  };

  const displayedNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.isRead : true
  );

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'URGENT':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'ASSESSMENT':
        return <ClipboardList className="w-4 h-4 text-blue-600" />;
      case 'FEEDBACK':
        return <MessageSquareHeart className="w-4 h-4 text-amber-600" />;
      case 'SYSTEM':
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getIconBg = (type: AppNotification['type']) => {
    switch (type) {
      case 'URGENT':
        return 'bg-rose-50 border-rose-100';
      case 'ASSESSMENT':
        return 'bg-blue-50 border-blue-100';
      case 'FEEDBACK':
        return 'bg-amber-50 border-amber-100';
      case 'SYSTEM':
      default:
        return 'bg-emerald-50 border-emerald-100';
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`p-2 rounded-lg transition-all relative cursor-pointer ${
          isOpen
            ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filter === 'unread'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {filter === 'unread'
                    ? 'No unread alerts at this time.'
                    : 'No notifications to display.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer relative group ${
                    !item.isRead ? 'bg-blue-50/20' : ''
                  }`}
                >
                  {/* Icon Indicator */}
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getIconBg(
                      item.type
                    )}`}
                  >
                    {getIcon(item.type)}
                  </div>

                  {/* Body Content */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs font-bold truncate ${
                          !item.isRead ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-400 shrink-0">
                        {getTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {item.message}
                    </p>

                    {item.entityType && (
                      <div className="pt-0.5 flex items-center gap-1 text-[10px] font-bold text-blue-700 group-hover:underline">
                        <span>View record</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Unread Dot */}
                  <div className="flex flex-col items-center justify-start pt-1 self-stretch shrink-0">
                    {!item.isRead ? (
                      <span className="w-2 h-2 rounded-full bg-blue-600 mt-1"></span>
                    ) : (
                      <span className="w-2 h-2"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
