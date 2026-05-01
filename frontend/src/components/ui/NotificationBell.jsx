import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { notificationService } from '../../services';
import { formatDateTime } from '../../utils';
import toast from 'react-hot-toast';

export default function NotificationBell() {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 660; // E5
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // Browser might block AudioContext if no user interaction
      console.log('Audio disabled automatically by browser');
    }
  };

  useEffect(() => {
    // Fetch initial notifications
    notificationService.getNotifications(20).then(res => {
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotification = (notification) => {
      playNotificationSound();
      toast.custom((t) => (
        <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-4 w-80 flex items-start gap-3 transform transition-all">
          <div className="bg-primary-100 text-primary-600 p-2 rounded-full shrink-0">
            <Bell size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">{notification.title}</h4>
            <p className="text-sm text-slate-600 mt-0.5">{notification.message}</p>
          </div>
        </div>
      ), { duration: 4000 });

      setNotifications(prev => [notification, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    setIsOpen(false);
    
    // Logic to navigate
    if (notification.type === 'BOOKING' || notification.type === 'PAYMENT') {
      const userRoleUrlPart = window.location.pathname.includes('/provider') ? 'provider' : 'patient';
      // Navigate to bookings view
      navigate(`/dashboard/${userRoleUrlPart}/bookings`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 flex flex-col overflow-hidden z-50">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && <span className="bg-primary-100 text-primary-700 text-xs py-0.5 px-2 rounded-full font-bold">{unreadCount}</span>}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-[70vh] overflow-y-auto w-full custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-3">
                  <Bell size={24} />
                </div>
                <p className="text-sm font-medium text-slate-600">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">We'll let you know when something arrives.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(notification => (
                  <div 
                    key={notification._id} 
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 items-start ${!notification.isRead ? 'bg-primary-50/30' : ''}`}
                  >
                    <div className={`mt-0.5 shrink-0 ${!notification.isRead ? 'text-primary-500' : 'text-slate-300'}`}>
                      {!notification.isRead ? <Circle size={10} fill="currentColor" /> : <CheckCircle2 size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm mb-1 ${!notification.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-slate-500 leading-snug line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-medium">
                        <Clock size={12} /> {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-xs font-semibold text-slate-500">Showing restricted history</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
