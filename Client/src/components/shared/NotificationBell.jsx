import React, { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
    Bell,
    CheckCheck,
    Calendar,
    CheckCircle2,
    RotateCcw,
    XCircle,
    Clock,
    Award,
    Loader2,
    BellOff,
    ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { NOTIFICATION_API_END_POINT } from '@/utils/constant';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const navigate = useNavigate();
    const { user } = useSelector(store => store.auth);

    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all' or 'unread'

    // Fetch unread count for the badge
    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const response = await axios.get(`${NOTIFICATION_API_END_POINT}/unread-count`, {
                withCredentials: true,
            });
            if (response.data.success) {
                setUnreadCount(response.data.unreadCount || 0);
            }
        } catch (_) {
            // Silently ignore background poll errors
        }
    }, [user]);

    // Fetch full notification list
    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await axios.get(`${NOTIFICATION_API_END_POINT}`, {
                withCredentials: true,
            });
            if (response.data.success) {
                setNotifications(response.data.notifications || []);
                setUnreadCount(response.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch & polling interval (every 25 seconds)
    useEffect(() => {
        if (!user) return;
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 25000);
        return () => clearInterval(interval);
    }, [user, fetchUnreadCount]);

    // Fetch when popover opens
    const handleOpenChange = (isOpen) => {
        setOpen(isOpen);
        if (isOpen) {
            fetchNotifications();
        }
    };

    // Mark single notification as read & navigate
    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                await axios.patch(`${NOTIFICATION_API_END_POINT}/${notif._id}/read`, {}, {
                    withCredentials: true,
                });
                setNotifications(prev =>
                    prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (_) {
                // Silently continue navigation
            }
        }

        setOpen(false);

        // Navigate to appropriate interview view
        if (user?.role === 'recruiter') {
            navigate('/admin/interviews');
        } else {
            navigate('/interviews');
        }
    };

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await axios.patch(`${NOTIFICATION_API_END_POINT}/mark-all-read`, {}, {
                withCredentials: true,
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Format relative time (e.g. 5m ago, 2h ago, Yesterday)
    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const now = new Date();
        const past = new Date(dateString);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    // Icon helper by notification type
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'INTERVIEW_SCHEDULED':
                return (
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                    </div>
                );
            case 'INTERVIEW_CONFIRMED':
                return (
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                );
            case 'RESCHEDULE_REQUESTED':
                return (
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-4 h-4" />
                    </div>
                );
            case 'INTERVIEW_RESCHEDULED':
                return (
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                    </div>
                );
            case 'INTERVIEW_CANCELLED':
                return (
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                        <XCircle className="w-4 h-4" />
                    </div>
                );
            case 'INTERVIEW_COMPLETED':
                return (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4" />
                    </div>
                );
        }
    };

    if (!user) return null;

    const displayedNotifications = filter === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications;

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full cursor-pointer transition focus:outline-none"
                    aria-label={`Notifications (${unreadCount} unread)`}
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs animate-in zoom-in">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent className="w-80 sm:w-96 p-0 shadow-lg rounded-2xl border border-gray-100 overflow-hidden" align="end">
                {/* Header */}
                <div className="p-3.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900">Notifications</h4>
                        {unreadCount > 0 && (
                            <Badge className="bg-[#6A38C2] text-white text-[10px] px-1.5 py-0">
                                {unreadCount} new
                            </Badge>
                        )}
                    </div>

                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-[#6A38C2] hover:text-[#5b30a6] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex border-b border-gray-100 px-3 py-1.5 bg-white text-xs">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition ${filter === 'all'
                            ? 'bg-purple-50 text-[#6A38C2] font-semibold'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        All ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition ${filter === 'unread'
                            ? 'bg-purple-50 text-[#6A38C2] font-semibold'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        Unread ({unreadCount})
                    </button>
                </div>

                {/* List Body */}
                <div className="max-h-84 overflow-y-auto divide-y divide-gray-50">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-[#6A38C2]" />
                            <span className="text-xs">Loading notifications...</span>
                        </div>
                    ) : displayedNotifications.length === 0 ? (
                        <div className="py-12 px-4 text-center text-gray-400">
                            <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs font-medium text-gray-600">
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                Interview updates, confirmations, and alerts will appear here.
                            </p>
                        </div>
                    ) : (
                        displayedNotifications.map((notif) => (
                            <div
                                key={notif._id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-3.5 flex items-start gap-3 cursor-pointer transition hover:bg-gray-50/80 ${!notif.isRead ? 'bg-purple-50/30' : ''
                                    }`}
                            >
                                {getNotificationIcon(notif.type)}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <p className={`text-xs ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                            {notif.title}
                                        </p>
                                        <span className="text-[10px] text-gray-400 shrink-0">
                                            {formatTimeAgo(notif.createdAt)}
                                        </span>
                                    </div>

                                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                                        {notif.message}
                                    </p>
                                </div>

                                {!notif.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-[#6A38C2] shrink-0 mt-1" />
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer link to full interviews view */}
                <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                    <button
                        onClick={() => {
                            setOpen(false);
                            if (user?.role === 'recruiter') {
                                navigate('/admin/interviews');
                            } else {
                                navigate('/interviews');
                            }
                        }}
                        className="text-xs text-[#6A38C2] hover:text-[#5b30a6] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                        <span>View All Interviews</span>
                        <ExternalLink className="w-3 h-3" />
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;
