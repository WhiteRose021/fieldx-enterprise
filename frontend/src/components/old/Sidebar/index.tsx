"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import useLocalStorage from "@/hooks/useLocalStorage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCalendarAlt,
  faCog,
  faChevronDown,
  faClipboardCheck,
  faBuilding,
  faMap,
  faChevronLeft,
  faFileImport,
  faMoneyBillWave,
  faNetworkWired,
  faSatelliteDish,
  faServer,
  faTools,
  faWrench,
  faBug,
  faChartLine,
  faMapMarkedAlt,
  faClock,
  faBoxOpen,
  faProjectDiagram,
  faList,
  faLightbulb
} from "@fortawesome/free-solid-svg-icons";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

interface SidebarState {
  isCollapsed: boolean;
  openGroups: Record<string, boolean>;
}

const menuGroups = [
  {
    name: "MENOY",
    menuItems: [
      {
        icon: <FontAwesomeIcon icon={faFileImport} style={{ color: "#E20074" }} className="text-lg" />,
        label: "Imports",
        route: "/Import",
      },
      {
        icon: <FontAwesomeIcon icon={faHome} style={{ color: "#E20074" }} className="text-lg" />,
        label: "Dashboards",
        route: "/",
      },
      {
        icon: <FontAwesomeIcon icon={faCalendarAlt} style={{ color: "#0071BC" }} className="text-lg" />,
        label: "Ημερολόγιο",
        route: "/Calendar",
      },
      {
        icon: <FontAwesomeIcon icon={faClock} style={{ color: "#0071BC" }} className="text-lg" />,
        label: "Timeline",
        route: "/Timeline",
      },
      {
        icon: <FontAwesomeIcon icon={faMapMarkedAlt} style={{ color: "#3B9E4D" }} className="text-lg" />,
        label: "Live Tracking",
        route: "/LiveTracking",
      },
      {
        icon: <FontAwesomeIcon icon={faChartLine} style={{ color: "#E20074" }} className="text-lg" />,
        label: "Smart Scheduling",
        route: "/SmartScheduling",
      },
      {
        icon: <FontAwesomeIcon icon={faBoxOpen} style={{ color: "#0071BC" }} className="text-lg" />,
        label: "Διαχείριση Αποθήκης",
        route: "/Storage",
      },
      {
        icon: <FontAwesomeIcon icon={faNetworkWired} style={{ color: "#E20074" }} className="text-lg" />,
        label: "FTTH - Β ΦΑΣΗ",
        children: [
          { 
            icon: <FontAwesomeIcon icon={faClipboardCheck} style={{ color: "#0071BC" }} />,
            label: "Αυτοψίες",
            route: "/FTTHBPhase/Autopsies/",
          },
          { 
            icon: <FontAwesomeIcon icon={faBug} style={{ color: "#E20074" }} />,
            label: "Βλάβες",
            route: "/FTTHBPhase/Malfunctions/",
          },
          {
            icon: <FontAwesomeIcon icon={faMap} style={{ color: "#3B9E4D" }} />,
            label: "Master",
            route: "/FTTHBPhase/Master",
          },
          {
            icon: <FontAwesomeIcon icon={faMoneyBillWave} style={{ color: "#0071BC" }} className="text-lg" />,
            label: "Τιμολόγηση",
            route: "/Billing",
          },
        ],
      },
      // {
      //   icon: <FontAwesomeIcon icon={faSatelliteDish} style={{ color: "#E20074" }} className="text-lg" />,
      //   label: "FTTH - Γ ΦΑΣΗ",
      //   children: [
      //     {
      //       icon: <FontAwesomeIcon icon={faBuilding} style={{ color: "#3B9E4D" }} />,
      //       label: "Last Drop",
      //       route: "/FTTHCPhase/LastDrop",
      //     },
      //   ],
      // },
      {
        icon: <FontAwesomeIcon icon={faCog} style={{ color: "#0071BC" }} className="text-lg" />,
        label: "Ρυθμίσεις",
        route: "/settings",
      },
    ],
  },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const menuRefs = useRef<Record<string, HTMLElement | null>>({});
  const popupRef = useRef<HTMLDivElement | null>(null);
  
  const [sidebarState, setSidebarState] = useLocalStorage<SidebarState>("sidebarState", {
    isCollapsed: false,
    openGroups: {}
  });

  // Handle initial mounting
  useEffect(() => {
    setIsMounted(true);
    setIsLoading(false);
  }, []);

  // Sync local storage collapsed state with parent's sidebarOpen state
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof setSidebarOpen === 'function') {
      // On initial load, sync the parent's sidebarOpen with our stored state
      setSidebarOpen(!sidebarState.isCollapsed);
    }
  }, [setSidebarOpen, sidebarState.isCollapsed]); // Add proper dependencies
  
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

  const toggleCollapse = () => {
    setSidebarState(prevState => {
      const newState = {
        ...prevState,
        isCollapsed: !prevState.isCollapsed
      };
      setSidebarOpen(!newState.isCollapsed);
      
      // Close any active popup when expanding
      if (!newState.isCollapsed) {
        setActivePopup(null);
      }
      
      return newState;
    });
  };
  
  // Simple toggle group function - no positioning calculation 
  const toggleGroup = (label: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (sidebarState.isCollapsed) {
      // Simply toggle the popup state
      setActivePopup(activePopup === label ? null : label);
    } else {
      // Regular behavior when sidebar is expanded
      setSidebarState(prevState => ({
        ...prevState,
        openGroups: {
          ...prevState.openGroups,
          [label]: !prevState.openGroups[label]
        }
      }));
    }
  };

  const isActive = (route: string) => pathname === route;

  // Don't render anything until mounted to prevent FOUC
  if (!isMounted) {
    return null;
  }

  return (
    <aside
      className={`fixed left-0 top-[95px] z-999 flex h-[calc(100vh-95px)] flex-col bg-[#000000] text-white duration-300 ease-in-out lg:translate-x-0 
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      ${sidebarState.isCollapsed ? "w-20" : "w-72.5"}
      ${isLoading ? "invisible" : "visible"}`}
      style={{ opacity: isLoading ? 0 : 1 }}
    >
      {/* Navigation Section */}
      <div className="flex flex-col h-full">
        <div className={`overflow-y-auto sidebar-scrollbar flex-grow pt-4 transition-all duration-300 ${sidebarState.isCollapsed ? "px-2" : "px-6"}`}>
        <nav>
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-4">
              {!sidebarState.isCollapsed && (
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
                              (sidebarState.openGroups[menuItem.label] || activePopup === menuItem.label) 
                                ? "bg-[#1A1A1A]" 
                                : ""
                            }`}
                        >
                          <span className={`flex items-center ${sidebarState.isCollapsed ? "justify-center w-full" : "gap-3"}`}>
                            {menuItem.icon}
                            {!sidebarState.isCollapsed && <span className="text-white">{menuItem.label}</span>}
                          </span>
                          {!sidebarState.isCollapsed && (
                            <FontAwesomeIcon
                              icon={faChevronDown}
                              className={`ml-auto text-white transition-transform duration-200 ${
                                sidebarState.openGroups[menuItem.label] ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </button>
                      
                        {/* Inline popup for collapsed sidebar instead of fixed positioned */}
                        {sidebarState.isCollapsed && activePopup === menuItem.label && (
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
                              {menuItem.children.map((child, childIndex) => (
                                <li key={childIndex} className="mini-menu-item">
                                  <Link
                                    href={child.route}
                                    onClick={() => setActivePopup(null)}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/30 rounded-md transition-colors w-full"
                                  >
                                    <span className="text-lg flex items-center justify-center w-6">{child.icon}</span>
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
                          ${sidebarState.isCollapsed ? "justify-center" : ""}`}
                      >
                        {menuItem.icon}
                        {!sidebarState.isCollapsed && <span className="text-white">{menuItem.label}</span>}
                      </Link>
                    )}

                    {/* Regular Submenu for expanded sidebar */}
                    {menuItem.children && !sidebarState.isCollapsed && sidebarState.openGroups[menuItem.label] && (
                      <div className="pl-4 mt-1">
                        <ul className="flex flex-col gap-1">
                          {menuItem.children.map((child, childIndex) => (
                            <li key={childIndex}>
                              <Link
                                href={child.route}
                                className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ease-in-out
                                  hover:bg-[#1A1A1A] ${isActive(child.route) ? "bg-[#1A1A1A]" : ""}`}
                              >
                                {child.icon}
                                <span className="text-white">{child.label}</span>
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
      </div>

      {/* Collapse Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-4 top-12 z-50 flex h-8 w-8 items-center justify-center bg-black hover:bg-[#1A1A1A] rounded-full transition-colors"
      >
        <FontAwesomeIcon
          icon={faChevronLeft}
          className={`text-white text-sm transition-transform duration-300 ${sidebarState.isCollapsed ? "rotate-180" : ""}`}
        />
      </button>
      
      {/* Animation styles for mini-menu */}
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
  
  /* Custom scrollbar styles */
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  /* Ensure scrollbar works properly */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    overflow-y: auto;
    max-height: calc(100vh - 95px);
  }
  
  /* Make sure content is scrollable */
  nav {
    min-height: min-content;
    width: 100%;
  }
`}</style>
    </aside>
  );
};

export default Sidebar;