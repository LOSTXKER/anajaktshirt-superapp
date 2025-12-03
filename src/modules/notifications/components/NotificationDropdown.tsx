'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { NOTIFICATION_TYPE_CONFIG } from '../types';

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'เมื่อกี้';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-[#F5F5F7] transition-colors"
      >
        <Bell className="w-5 h-5 text-[#86868B]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#FF3B30] rounded-full flex items-center justify-center text-[11px] font-bold text-[#1D1D1F]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-white rounded-2xl shadow-2xl border border-[#E8E8ED] overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F7]">
              <h3 className="font-semibold text-[#1D1D1F]">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="flex items-center gap-1.5 text-[13px] text-[#007AFF] hover:underline font-medium"
                >
                  <CheckCheck className="w-4 h-4" />
                  อ่านทั้งหมด
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#86868B]">
                  <Bell className="w-10 h-10 text-[#D2D2D7] mb-3" />
                  <p className="text-[14px]">ไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => {
                    const config = NOTIFICATION_TYPE_CONFIG[notification.type];
                    
                    return (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-[#F5F5F7] transition-colors cursor-pointer border-b border-[#F5F5F7] last:border-0 ${
                          !notification.is_read ? 'bg-[#007AFF]/5' : ''
                        }`}
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(notification.id);
                          }
                        }}
                      >
                        <div className={`p-2 rounded-xl ${config.bgColor} flex-shrink-0`}>
                          <span className="text-[18px]">{config.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-[14px] text-[#1D1D1F] truncate">
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="w-2 h-2 rounded-full bg-[#007AFF] flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[13px] text-[#86868B] line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[12px] text-[#A1A1A6] mt-1">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-[#F5F5F7] px-4 py-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center text-[13px] text-[#007AFF] font-medium py-1 hover:underline"
                >
                  ดูทั้งหมด
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

