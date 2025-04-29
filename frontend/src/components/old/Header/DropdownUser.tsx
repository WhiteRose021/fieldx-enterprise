'use client';

import { useState, useEffect, memo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import ClickOutside from "@/components/ClickOutside";
import { useRouter } from "next/navigation";

const DropdownUser = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const router = useRouter();
  
  // Use a stable ref to track component mounting state
  const isMounted = useRef(false);
  const initialLoadCompleted = useRef(false);

  // Single useEffect for initialization and cleanup
  useEffect(() => {
    // Safety check for SSR
    if (typeof window === 'undefined') return;

    // Only run initialization logic once
    if (!initialLoadCompleted.current) {
      initialLoadCompleted.current = true;
      isMounted.current = true;
      console.log("DropdownUser mounted");
      
      try {
        const storedUserInfo = localStorage.getItem("user_session");
        if (storedUserInfo) {
          setUserInfo(JSON.parse(storedUserInfo));
        }
      } catch (error) {
        console.error("Error loading user info:", error);
      }
    }

    // Clean up function
    return () => {
      if (isMounted.current) {
        console.log("DropdownUser unmounting...");
        isMounted.current = false;
      }
    };
  }, []);

  const handleLogout = () => {
    try {
      console.log("Logging out...");
      setDropdownOpen(false);

      // Clear cookies & local storage
      document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict`;
      document.cookie = `user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict`;
      document.cookie = `is_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict`;
      localStorage.removeItem("user_session");
      localStorage.removeItem("auth_token");

      router.replace("/auth/signin");
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/auth/signin";
    }
  };

  // Don't render until we have user info
  if (!userInfo) return null;

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <div
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-4 cursor-pointer bg-[#ffffff] rounded-lg px-3 py-2 hover:bg-[#ffffff] transition-colors duration-200"
      >

      <span className="block text-sm font-medium text-black">
        {userInfo ? `${userInfo.salutationName || ""} ${userInfo.name || "Χρήστης"}` : "Επισκέπτης Χρήστης"}
      </span>
      <span className="block text-xs text-gray-400">
        {userInfo?.role || "Άγνωστος Ρόλος"}
      </span>

        <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-[#333]">
          <Image
            width={40}
            height={40}
            src="/images/user/user-01.png"
            alt="User"
            className="object-cover"
          />
        </div>

        <svg
          className="hidden fill-white sm:block"
          width="12"
          height="8"
          viewBox="0 0 12 8"
        >
          <path d="M0.41 0.91C0.74 0.59 1.26 0.59 1.59 0.91L6 5.32L10.41 0.91C10.74 0.59 11.26 0.59 11.59 0.91C11.91 1.24 11.91 1.76 11.59 2.09L6.59 7.09C6.26 7.41 5.74 7.41 5.41 7.09L0.41 2.09C0.09 1.76 0.09 1.24 0.41 0.91Z"/>
        </svg>
      </div>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-lg border border-[#333] bg-[#1C1C1C] shadow-lg">
          <ul className="border-b border-[#333] p-4 space-y-3">
<li>
  <Link
    href="/profile"
    className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors duration-200"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
    Το Προφίλ Μου
  </Link>
</li>
<li>
  <Link
    href="/settings"
    className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors duration-200"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
    Ρυθμίσεις
  </Link>
</li>
          </ul>
<button
onClick={handleLogout}
className="w-full p-4 text-left text-red-400 hover:text-red-300 transition-colors duration-200 flex items-center gap-3"
>
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
  <polyline points="16 17 21 12 16 7"/>
  <line x1="21" y1="12" x2="9" y2="12"/>
</svg>
Αποσύνδεση
</button>
        </div>
      )}
    </ClickOutside>
  );
};

// Add display name for debugging
DropdownUser.displayName = 'DropdownUser';

// Export with memo
export default memo(DropdownUser);