'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedNotification } from '@/app/(dashboard)/student/notifications/page';
import { markNotificationAsReadAction } from '@/lib/notifications/user-actions';
import { 
  Bell, Briefcase, BookOpen, Clock, Megaphone, CheckCheck, 
  ChevronRight, FileText, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnifiedNotificationFeedProps {
  initialNotifications: UnifiedNotification[];
}

type FilterType = 'All' | 'Placements' | 'Preparation' | 'Reminders' | 'Applications' | 'Faculty';

const FILTER_TYPES: FilterType[] = ['All', 'Placements', 'Preparation', 'Reminders', 'Applications', 'Faculty'];

export function UnifiedNotificationFeed({ initialNotifications }: UnifiedNotificationFeedProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleMarkAsRead = (id: string, sourceType: string) => {
    if (sourceType === 'faculty') return; // Faculty announcements don't have per-user read state yet
    
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
    
    startTransition(async () => {
      await markNotificationAsReadAction(id);
    });
  };

  const handleMarkAllAsRead = () => {
    const unread = notifications.filter(n => !n.isRead && n.sourceType === 'admin');
    
    setNotifications(prev => prev.map(n => 
      n.sourceType === 'admin' ? { ...n, isRead: true } : n
    ));

    startTransition(async () => {
      for (const n of unread) {
        await markNotificationAsReadAction(n.id);
      }
    });
  };

  const handleNotificationClick = (n: UnifiedNotification) => {
    if (!n.isRead && n.sourceType === 'admin') {
      handleMarkAsRead(n.id, n.sourceType);
    }

    const type = n.type.toLowerCase();
    const title = n.title.toLowerCase();

    // Routing logic
    if (type.includes('placement') || type.includes('drive') || type.includes('company')) {
      router.push('/student/placements');
    } else if (type.includes('preparation') || type.includes('resource') || type.includes('test')) {
      router.push('/student/preparation');
    } else if (type.includes('application') || title.includes('shortlisted') || title.includes('selected')) {
      router.push('/student/placements');
    } else if (type.includes('interview') || type.includes('deadline') || type.includes('reminder')) {
      router.push('/student/placements');
    } else {
      // Faculty or general, just stay on page (it expands or is already readable)
    }
  };

  const getIcon = (type: string, title: string) => {
    const t = type.toLowerCase();
    const txt = title.toLowerCase();
    
    if (t.includes('placement') || t.includes('company')) return Briefcase;
    if (t.includes('preparation') || t.includes('resource')) return BookOpen;
    if (t.includes('application')) return FileText;
    if (t.includes('interview') || t.includes('deadline') || t.includes('reminder') || txt.includes('tomorrow') || txt.includes('hours')) return Clock;
    if (t.includes('faculty') || t.includes('notice') || t.includes('announcement')) return Megaphone;
    
    return Bell;
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      }
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getFilteredNotifications = () => {
    if (activeFilter === 'All') return notifications;
    
    return notifications.filter(n => {
      const t = n.type.toLowerCase();
      const txt = n.title.toLowerCase() + ' ' + n.message.toLowerCase();
      
      switch (activeFilter) {
        case 'Placements':
          return t.includes('placement') || t.includes('drive') || txt.includes('company');
        case 'Preparation':
          return t.includes('preparation') || t.includes('resource') || txt.includes('test');
        case 'Reminders':
          return t.includes('reminder') || t.includes('deadline') || t.includes('interview') || txt.includes('tomorrow');
        case 'Applications':
          return t.includes('application') || txt.includes('shortlist') || txt.includes('select');
        case 'Faculty':
          return n.sourceType === 'faculty' || t.includes('faculty') || t.includes('announcement');
        default:
          return true;
      }
    });
  };

  const filtered = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.isRead && n.sourceType === 'admin').length;

  return (
    <div className="space-y-6">
      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_TYPES.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                activeFilter === filter 
                  ? 'bg-accent text-white' 
                  : 'bg-elevated text-muted hover:text-foreground border border-border'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAllAsRead}
            disabled={isPending}
            className="text-xs text-muted hover:text-foreground h-8"
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Feed */}
      <div className="border border-border bg-surface rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-elevated border border-border flex items-center justify-center mb-3">
              <Bell className="w-5 h-5 text-muted opacity-50" />
            </div>
            <h3 className="text-sm font-medium text-foreground">No {activeFilter.toLowerCase()} notifications</h3>
            <p className="text-xs text-muted mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1A1A1A]">
            {filtered.map(n => {
              const Icon = getIcon(n.type, n.title);
              const isUnread = !n.isRead && n.sourceType === 'admin';
              
              return (
                <div 
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start gap-4 p-4 cursor-pointer transition-colors group ${
                    isUnread ? 'bg-[#16110B]' : 'hover:bg-elevated'
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isUnread ? 'bg-accent/10 text-accent' : 'bg-[#1A1A1A] text-muted'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className={`text-sm truncate ${isUnread ? 'text-foreground font-semibold' : 'text-[#CCCCCC] font-medium'}`}>
                        {n.title}
                      </h4>
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      )}
                    </div>
                    <p className={`text-xs line-clamp-2 ${isUnread ? 'text-[#CCCCCC]' : 'text-muted'}`}>
                      {n.message}
                    </p>
                  </div>
                  
                  <div className="shrink-0 flex items-center gap-3">
                    <span className="text-[11px] text-[#666666] font-mono whitespace-nowrap">
                      {formatTime(n.date)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#333333] group-hover:text-[#666666] transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
