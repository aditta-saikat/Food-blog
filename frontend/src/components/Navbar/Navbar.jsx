import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, Trash2 } from 'lucide-react';
import { getMyNotifications, markNotificationAsRead, deleteNotification } from '../../lib/api/Notification';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);

  const fetchNotifications = async (retryCount = 3) => {
    if (!currentUser) return;
    try {
      const data = await getMyNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      if (err.message.includes('log in')) {
        setError('Session expired. Please log in again.');
        logout();
        navigate('/login');
      } else if (retryCount > 0) {
        setTimeout(() => fetchNotifications(retryCount - 1), 5000);
      } else {
        setError('Failed to fetch notifications. Please try again later.');
      }
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      if (unreadNotifications.length === 0) return;

      await Promise.all(
        unreadNotifications.map((n) =>
          markNotificationAsRead(n._id).catch((err) => {
            console.error(`Error marking notification ${n._id} as read:`, err);
            return null;
          })
        )
      );

      setNotifications((prev) =>
        prev.map((n) => (unreadNotifications.some((un) => un._id === n._id) ? { ...n, isRead: true } : n))
      );
      setUnreadCount(0);
      setError(null);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark notifications as read. Please try again.');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => prev - (notifications.find((n) => n._id === id && !n.isRead) ? 1 : 0));
      setError(null);
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification.');
    }
  };

  const handleToggleNotifications = () => {
    if (!notificationOpen) {
      markAllAsRead();
    }
    setNotificationOpen(!notificationOpen);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <nav className="bg-white shadow-md">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 text-sm text-center">
          {error}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-primary-600">FoodCritic</span>
            </Link>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <Link to="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600">
              Home
            </Link>
            {currentUser ? (
              <>
                <Link to="/dashboard" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600">
                  Dashboard
                </Link>
                <div className="relative">
                  <button
                    onClick={handleToggleNotifications}
                    className="p-2 text-gray-700 hover:text-primary-600 relative"
                    disabled={!currentUser}
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {notificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto scroll-smooth">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className={`p-3 border-b border-gray-100 flex items-start justify-between ${
                                notification.isRead ? 'bg-gray-50' : 'bg-white'
                              }`}
                            >
                              <div className="flex-1">
                                <p className="text-sm text-gray-800">{notification.message}</p>
                                <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleDeleteNotification(notification._id)}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="p-4 text-sm text-gray-500">No notifications</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-2 text-sm font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600">
                  Login
                </Link>
                <Link to="/register" className="px-3 py-2 text-sm font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700">
                  Register
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleToggleNotifications();
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 relative"
                  disabled={!currentUser}
                >
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notificationOpen && (
                  <div className="bg-white border-t border-gray-200 max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-3 border-b border-gray-100 flex items-start justify-between ${
                            notification.isRead ? 'bg-gray-50' : 'bg-white'
                          }`}
                        >
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{notification.message}</p>
                            <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDeleteNotification(notification._id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-sm text-gray-500">No notifications</p>
                    )}
                  </div>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;