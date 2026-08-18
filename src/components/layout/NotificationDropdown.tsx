import React, { useState, useRef, useEffect } from 'react';
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

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'urgent' | 'assessment' | 'feedback' | 'system';
  isRead: boolean;
  linkTab?: string;
}

const initialNotifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'Urgent Behavioral Escalation',
    description: 'Mr. Davis logged a task refusal & classroom escalation observation for Marcus Thorne.',
    time: '10m ago',
    type: 'urgent',
    isRead: false,
    linkTab: 'observations',
  },
  {
    id: 'n2',
    title: 'Assessment Review Required',
    description: 'Cognitive Load assessment screener is ready for clinical interpretation (Alex Mercer).',
    time: '1h ago',
    type: 'assessment',
    isRead: false,
    linkTab: 'assessments',
  },
  {
    id: 'n3',
    title: 'New Parent Feedback Received',
    description: 'Sarah Johnson submitted home sleep observations & morning anxiety notes for Alex Johnson.',
    time: '3h ago',
    type: 'feedback',
    isRead: false,
    linkTab: 'parent_feedback',
  },
  {
    id: 'n4',
    title: 'IEP Accommodation Finalized',
    description: 'District 504 accommodation documentation has been archived for Elijah Vance.',
    time: 'Yesterday',
    type: 'system',
    isRead: true,
    linkTab: 'students',
  },
];

interface NotificationDropdownProps {
  onNavigateTab?: (tab: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigateTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id);
    if (notification.linkTab && onNavigateTab) {
      onNavigateTab(notification.linkTab);
      setIsOpen(false);
    }
  };

  const displayedNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.isRead : true
  );

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'assessment':
        return <ClipboardList className="w-4 h-4 text-blue-600" />;
      case 'feedback':
        return <MessageSquareHeart className="w-4 h-4 text-amber-600" />;
      case 'system':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getIconBg = (type: AppNotification['type']) => {
    switch (type) {
      case 'urgent':
        return 'bg-rose-50 border-rose-100';
      case 'assessment':
        return 'bg-blue-50 border-blue-100';
      case 'feedback':
        return 'bg-amber-50 border-amber-100';
      case 'system':
        return 'bg-emerald-50 border-emerald-100';
    }
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
                        {item.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    {item.linkTab && (
                      <div className="pt-0.5 flex items-center gap-1 text-[10px] font-bold text-blue-700 group-hover:underline">
                        <span>View record</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Unread Dot & Dismiss Button */}
                  <div className="flex flex-col items-center justify-between self-stretch shrink-0">
                    {!item.isRead ? (
                      <span className="w-2 h-2 rounded-full bg-blue-600 mt-1"></span>
                    ) : (
                      <span className="w-2 h-2"></span>
                    )}

                    <button
                      onClick={(e) => removeNotification(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 rounded transition-opacity cursor-pointer"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => {
                  if (onNavigateTab) {
                    onNavigateTab('observations');
                  }
                  setIsOpen(false);
                }}
                className="text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                View all priority triage queue &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
