// ============================================================
// LingoBite - Notification Bell
// Live-updating bell in the header. Currently powers a single
// notification type: someone left a peer-review comment on the
// signed-in student's graded work.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { Bell, MessageCircle, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  subscribeToNotifications, markNotificationRead, markAllNotificationsRead,
  fmtTimestamp,
} from '@/lib/firebase';
import { avatarFallback } from '@/lib/utils';
import type { AppNotification } from '@/types';
import type { QuerySnapshot, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

interface Props {
  // Lets the bell take the user somewhere useful (the Peer Feedback tab)
  // when a notification is clicked.
  onNavigateToPeerFeedback?: () => void;
}

const NotificationBell: React.FC<Props> = ({ onNavigateToPeerFeedback }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToNotifications(user.uid, (snap: QuerySnapshot<DocumentData>) => {
      const docs = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() })) as AppNotification[];
      setNotifications(docs);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && user && unreadCount > 0) {
      // Mark everything read as soon as the student opens the panel —
      // optimistic locally, persisted in the background.
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      try {
        await markAllNotificationsRead(user.uid);
      } catch (err) {
        console.error('Failed to mark notifications read:', err);
      }
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.read) {
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
      );
      try {
        await markNotificationRead(notification.id);
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
    setOpen(false);
    onNavigateToPeerFeedback?.();
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Notifications"
          className="relative rounded-full p-2 hover:bg-[#c9993f]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#c9993f]/50"
        >
          <Bell className="w-5 h-5 text-[#0d1b2a]/70" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#c9993f] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#faf6ef]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-white border-[#e5ddd0] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e5ddd0]">
          <h3 className="font-semibold text-sm text-[#0d1b2a]">Notifications</h3>
        </div>
        <div className="max-h-96 overflow-y-auto lb-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-[#0d1b2a]/40">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageCircle className="w-8 h-8 text-[#0d1b2a]/15 mx-auto mb-2" />
              <p className="text-sm text-[#0d1b2a]/40">No notifications yet</p>
            </div>
          ) : (
            notifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-[#e5ddd0] last:border-0 hover:bg-[#faf6ef] transition-colors ${
                  !notification.read ? 'bg-[#c9993f]/5' : ''
                }`}
              >
                <img
                  src={notification.fromUserPhotoURL || avatarFallback(32)}
                  alt={notification.fromUserName}
                  className="w-8 h-8 rounded-full border border-[#c9993f]/20 object-cover flex-shrink-0 mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#0d1b2a] leading-snug">
                    <span className="font-semibold">{notification.fromUserName}</span>
                    {' '}commented on your submission for{' '}
                    <span className="font-medium">{notification.lessonTitle}</span>
                  </p>
                  {notification.commentPreview && (
                    <p className="text-xs text-[#0d1b2a]/50 italic mt-1 line-clamp-2">
                      “{notification.commentPreview}”
                    </p>
                  )}
                  <p className="text-xs text-[#0d1b2a]/35 mt-1">
                    {fmtTimestamp(notification.createdAt)}
                  </p>
                </div>
                {!notification.read && (
                  <span className="w-2 h-2 rounded-full bg-[#c9993f] flex-shrink-0 mt-1.5" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
