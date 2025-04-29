"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Home, 
  Users, 
  Calendar, 
  Settings, 
  ChevronDown,
  ChevronLeft,
  LogOut,
  Upload,
  Clock,
  MapPin,
  Package,
  Network,
  Bug,
  ClipboardCheck,
  Map,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentPath: string;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen, currentPath }: SidebarProps) => {
  const { user, logout } = useAuth();
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  const menuRefs = useRef<Record<string, HTMLElement | null>>({});
  const popupRef = useRef<HTMLDivElement | null>(null);

  // Menu structure
  const menuGroups = [
    {
      name: "Μενού",
      menuItems: [
        {
          icon: <Upload className="h-5 w-5 text-[#E20074]" />,
          label: "Import",
          route: "/import",
        },
        {
          icon: <Home className="h-5 w-5 text-[#E20074]" />,
          label: "Αρχική",
          route: "/",
        },
        {
          icon: <Calendar className="h-5 w-5 text-[#0071BC]" />,
          label: "Ημερολόγιο",
          route: "/calendar",
        },
        {
          icon: <Clock className="h-5 w-5 text-[#0071BC]" />,
          label: "Timeline",
          route: "/timeline",
        },
        {
          icon: <MapPin className="h-5 w-5 text-[#3B9E4D]" />,
          label: "Live Tracking",
          route: "/livetracking",
        },
        {
          icon: <TrendingUp className="h-5 w-5 text-[#E20074]" />,
          label: "Smart Scheduling",
          route: "/smartscheduling",
        },
        {
          icon: <Package className="h-5 w-5 text-[#0071BC]" />,
          label: "Διαχείριση Αποθήκης",
          route: "/storage",
        },
        {
          icon: <Network className="h-5 w-5 text-[#E20074]" />,
          label: "FTTH - Β ΦΑΣΗ",
          route: "#",
          children: [
            { 
              icon: <ClipboardCheck className="h-5 w-5 text-[#0071BC]" />,
              label: "Αυτοψίες",
              route: "/ftthbphase/autopsies/",
            },
            { 
              icon: <Bug className="h-5 w-5 text-[#E20074]" />,
              label: "Βλάβες",
              route: "/ftthbphase/malfunctions/",
            },
            {
              icon: <Map className="h-5 w-5 text-[#3B9E4D]" />,
              label: "Master",
              route: "/ftthbphase/master/",
            },
            {
              icon: <DollarSign className="h-5 w-5 text-[#0071BC]" />,
              label: "Τιμολόγηση",
              route: "/billing",
            },
          ],
        },
        {
          icon: <Settings className="h-5 w-5 text-[#0071BC]" />,
          label: "Ρυθμίσεις",
          route: "/settings",
        },
      ],
    },
  ];

  // Handle initial mounting
  useEffect(() => {
    setMounted(true);
    setIsLoading(false);
    
    // Load open groups from localStorage if available
    try {
      const savedOpenGroups = localStorage.getItem('sidebarOpenGroups');
      if (savedOpenGroups) {
        setOpenGroups(JSON.parse(savedOpenGroups));
      }
    } catch (e) {
      console.error('Error loading sidebar state:', e);
    }
  }, []);
  
  // Handle clicks outside the popup to close it
  useEffect(() => {
    if (!activePopup) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current && 
        !popupRef.current.contains(event.target as Node) &&
        !menuRefs.current[activePopup]?.contains(event.target as Node)
      ) {
        setActivePopup(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePopup]);

  // Save open groups to localStorage when changed
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebarOpenGroups', JSON.stringify(openGroups));
    }
  }, [openGroups, mounted]);

  const toggleCollapse = () => {
    setSidebarOpen(!sidebarOpen);
    
    // Save sidebar collapsed state
    try {
      localStorage.setItem('sidebarCollapsed', (!sidebarOpen).toString());
    } catch (e) {
      console.error('Error saving sidebar collapsed state:', e);
    }
    
    // Close any active popup when expanding
    if (!sidebarOpen) {
      setActivePopup(null);
    }
  };
  
  // Toggle group function
  const toggleGroup = (label: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (!sidebarOpen) {
      // Toggle the popup state when sidebar is collapsed
      setActivePopup(activePopup === label ? null : label);
    } else {
      // Regular behavior when sidebar is expanded
      setOpenGroups(prev => ({
        ...prev,
        [label]: !prev[label]
      }));
    }
  };

  const isActive = (route: string) => pathname === route;
  
  const isParentActive = (item: any) => {
    if (pathname === item.route) return true;
    if (item.children) {
      return item.children.some((child: any) => pathname === child.route);
    }
    return false;
  };

  // Don't render anything until mounted to prevent FOUC
  if (!mounted) {
    return null;
  }

  const isCollapsed = !sidebarOpen;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 h-screen ${
          isCollapsed ? "w-20" : "w-64"
        } overflow-y-auto overflow-x-hidden bg-[#000000] text-white transition-all duration-300 ease-in-out shadow-lg ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isLoading ? "opacity-0" : "opacity-100"}`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-800">
          <Link href="/" className="flex items-center">
            {isCollapsed ? (
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-[#0071BC] text-white font-bold text-xl">
                F
              </div>
            ) : (
              <div className="relative h-10 w-32">
                <Image 
                  src="/FieldX.png" 
                  fill 
                  sizes="50vw"
                  alt="FieldX logo" 
                />
              </div>
            )}
          </Link>
        </div>

        {/* Sidebar content */}
        <div className={`sidebar-scrollbar flex-grow pt-4 overflow-y-auto overflow-x-hidden h-[calc(100vh-80px)] transition-all duration-300 ${isCollapsed ? "px-2" : "px-4"}`}>
          <nav>
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-4">
                {!isCollapsed && (
                  <h3 className="mb-4 text-sm font-medium text-gray-400 pl-2">{group.name}</h3>
                )}
                <ul className="flex flex-col gap-1">
                  {group.menuItems.map((menuItem, menuIndex) => (
                    <li key={menuIndex} className="relative">
                      {menuItem.children ? (
                        <div className="relative">
                          <button
                            ref={el => { menuRefs.current[menuItem.label] = el; }}
                            onClick={(e) => toggleGroup(menuItem.label, e)}
                            className={`group flex items-center w-full gap-3 p-2 rounded-lg text-left transition-all duration-200 ease-in-out
                              hover:bg-[#1A1A1A] ${
                                (openGroups[menuItem.label] || activePopup === menuItem.label || isParentActive(menuItem)) 
                                  ? "bg-[#1A1A1A]" 
                                  : ""
                              }`}
                          >
                            <span className={`flex items-center ${isCollapsed ? "justify-center w-full" : "gap-3"}`}>
                              {menuItem.icon}
                              {!isCollapsed && <span className="text-white truncate">{menuItem.label}</span>}
                            </span>
                            {!isCollapsed && (
                              <ChevronDown
                                className={`ml-auto text-white transition-transform duration-200 h-4 w-4 ${
                                  openGroups[menuItem.label] ? "rotate-180" : ""
                                }`}
                              />
                            )}
                          </button>
                        
                          {/* Popup for collapsed sidebar */}
                          {isCollapsed && activePopup === menuItem.label && (
                            <div 
                              ref={popupRef}
                              className="absolute left-20 top-0 bg-[#1A1A1A] text-white rounded-lg shadow-xl z-[9999] overflow-hidden"
                              style={{
                                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.8), 0 10px 10px -5px rgba(0,0,0,0.5)",
                                minWidth: "200px"
                              }}
                            >
                              {/* Arrow pointer */}
                              <div className="absolute left-0 top-5 transform -translate-x-1/2">
                                <div className="w-3 h-3 bg-[#1A1A1A] rotate-45"></div>
                              </div>
                              
                              <ul className="py-2 px-2 relative z-10">
                                {menuItem.children.map((child: any, childIndex: number) => (
                                  <li key={childIndex} className="mini-menu-item">
                                    <Link
                                      href={child.route}
                                      onClick={() => setActivePopup(null)}
                                      className={`flex items-center gap-3 px-4 py-2.5 hover:bg-black/30 rounded-md transition-colors w-full ${
                                        isActive(child.route) ? "bg-black/20" : ""
                                      }`}
                                    >
                                      <span className="flex items-center justify-center w-6">{child.icon}</span>
                                      <span className="text-sm whitespace-nowrap font-medium">{child.label}</span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={menuItem.route}
                          className={`group flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ease-in-out
                            hover:bg-[#1A1A1A] ${isActive(menuItem.route) ? "bg-[#1A1A1A]" : ""} 
                            ${isCollapsed ? "justify-center" : ""}`}
                        >
                          {menuItem.icon}
                          {!isCollapsed && <span className="text-white truncate">{menuItem.label}</span>}
                        </Link>
                      )}

                      {/* Submenu for expanded sidebar */}
                      {menuItem.children && !isCollapsed && openGroups[menuItem.label] && (
                        <div className="pl-4 mt-1 w-full">
                          <ul className="flex flex-col gap-1 w-full">
                            {menuItem.children.map((child: any, childIndex: number) => (
                              <li key={childIndex} className="w-full">
                                <Link
                                  href={child.route}
                                  className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ease-in-out
                                    hover:bg-[#1A1A1A] ${isActive(child.route) ? "bg-[#1A1A1A]" : ""} w-full`}
                                >
                                  {child.icon}
                                  <span className="text-white truncate">{child.label}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Collapse Button */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-4 top-12 z-50 flex h-8 w-8 items-center justify-center bg-black hover:bg-[#1A1A1A] rounded-full transition-colors"
        >
          <ChevronLeft
            className={`text-white text-sm transition-transform duration-300 h-4 w-4 ${isCollapsed ? "rotate-180" : ""}`}
          />
        </button>

        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 bg-[#1A1A1A] p-3">
          {isCollapsed ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#0071BC] text-white flex items-center justify-center font-medium">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-md text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#0071BC] text-white flex items-center justify-center font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-200 truncate max-w-[140px]">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate max-w-[140px]">
                    {user?.role || 'Role'}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 rounded-md text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Styles */}
      <style jsx global>{`
        /* Mini-menu animation */
        .mini-menu-item {
          opacity: 0;
          transform: translateX(-15px);
          animation: slideIn 0.4s ease forwards;
        }
        
        @keyframes slideIn {
          to { opacity: 1; transform: translateX(0); }
        }
        
        .mini-menu-item:nth-child(1) { animation-delay: 0.05s; }
        .mini-menu-item:nth-child(2) { animation-delay: 0.1s; }
        .mini-menu-item:nth-child(3) { animation-delay: 0.15s; }
        .mini-menu-item:nth-child(4) { animation-delay: 0.2s; }
        .mini-menu-item:nth-child(5) { animation-delay: 0.25s; }
        
        /* Custom scrollbar */
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .sidebar-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
      `}</style>
    </>
  );
};

export default Sidebar;