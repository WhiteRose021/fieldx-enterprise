"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Menu, 
  Bell, 
  Search, 
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: any;
}

export default function Header({
  sidebarOpen,
  setSidebarOpen,
  user,
}: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New message from John Doe",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "Meeting scheduled with Client XYZ",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 3,
      title: "Task 'Update documentation' is due tomorrow",
      time: "Yesterday",
      read: true,
    },
  ]);
  
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    setMounted(true);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-20 flex h-16 bg-white border-b border-gray-200 shadow-sm">
      {/* Left: Hamburger and Search */}
      <div className="flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 mr-2 text-gray-500 rounded-md lg:hidden hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 md:w-64"
          >
            <Search size={16} className="mr-2" />
            <span className="hidden md:inline">Search...</span>
          </button>

          {searchOpen && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-md shadow-lg p-2 z-30">
              <div className="flex items-center bg-gray-100 rounded-md px-3 py-2">
                <Search size={16} className="text-gray-500 mr-2" />
                <input
                  type="text"
                  className="bg-transparent border-none outline-none w-full text-sm"
                  placeholder="Search anything..."
                  autoFocus
                />
              </div>
              <div className="mt-2 text-xs text-gray-500 px-2">
                <p>Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Enter</kbd> to search</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Notifications, Theme, User Menu */}
      <div className="flex items-center ml-auto px-4 space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-gray-500 rounded-md hover:bg-gray-100"
          >
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                {unreadNotifications}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-30">
              <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <h3 className="font-medium">Notifications</h3>
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-[#0071BC] hover:underline"
                >
                  Mark all as read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-800">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No notifications
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-gray-200 text-center">
                <Link
                  href="/notifications"
                  className="text-xs text-[#0071BC] hover:underline"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 rounded-md hover:bg-gray-100"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
          >
            <div className="w-8 h-8 rounded-full bg-[#0071BC] text-white flex items-center justify-center font-medium">
              {user?.name.charAt(0)}
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700">
              {user?.name}
            </span>
            <ChevronDown size={16} className="hidden md:block text-gray-500" />
          </button>

          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-30">
              <div className="p-3 border-b border-gray-200">
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{user?.role}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User size={16} className="mr-3 text-gray-500" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings size={16} className="mr-3 text-gray-500" />
                  Settings
                </Link>
                <Link
                  href="/help"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <HelpCircle size={16} className="mr-3 text-gray-500" />
                  Help & Support
                </Link>
              </div>
              <div className="py-1 border-t border-gray-200">
                <button
                  onClick={logout}
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} className="mr-3" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}