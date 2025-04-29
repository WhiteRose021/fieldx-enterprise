"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGaugeHigh,
  faCalendarAlt,
  faCog,
  faMountain,
  faChevronDown,
  faHammer,
  faClipboardCheck,
  faBuilding,
  faTractor,
  faFan,
  faWrench,
  faMoneyBill,
  faMap,
  faClipboard,
  faFolder,
  faMapLocationDot,
  faStore,
  faWarehouse
} from "@fortawesome/free-solid-svg-icons";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const menuGroups = [
  {
    name: "Μενοy",
    menuItems: [
      {
        icon: <FontAwesomeIcon icon={faGaugeHigh} style={{ color: "#ff6600" }} className="text-lg" />,
        label: "Dashboards",
        route: "/",
      },
      {
        icon: <FontAwesomeIcon icon={faCalendarAlt} style={{ color: "#3366ff" }} className="text-lg" />,
        label: "Ημερολόγιο",
        route: "/calendar",
      },
      {
        icon: <FontAwesomeIcon icon={faMapLocationDot} style={{ color: "#F51720" }} className="text-lg" />,
        label: "Live Tracking",
        route: "/LiveTracking",
      },
      {
        icon: <FontAwesomeIcon icon={faWarehouse} style={{ color: "3366ff" }} className="text-lg" />,
        label: "Διαχείριση Αποθήκης",
        route: "/Storage",
      },
      {
        icon: <FontAwesomeIcon icon={faMountain} style={{ color: "#ffcc00" }} className="text-lg" />,
        label: "FTTH - Β ΦΑΣΗ",
        children: [
          {
            icon: <FontAwesomeIcon icon={faMap} style={{ color: "#007bff" }} />,
            label: "Master",
            route: "/FTTHBPhase/Master",
          },
          { 
            icon: <FontAwesomeIcon icon={faClipboardCheck} style={{ color: "#ffc107" }} />,
            label: "Αυτοψίες",
            route: "/FTTHBPhase/Autopsies/",
          },
          // {
          //   icon: <FontAwesomeIcon icon={faClipboard} style={{ color: "#ffc107" }} />,
          //   label: "Ραντεβού Αυτοψίας",
          //   route: "/FTTHBPhase/Autopsies/Appointments",
          // },
          // {
          //   icon: <FontAwesomeIcon icon={faWrench} style={{ color: "#6f42c1" }} />,
          //   label: "Έντυπο Τεχικής Επιθεώρησης",
          //   route: "/FTTHBPhase/Inspections",
          // },
          // {
          //   icon: <FontAwesomeIcon icon={faTractor} style={{ color: "#ff5733" }} />,
          //   label: "Χωματουργικά",
          //   route: "/FTTHBPhase/SoilWork",
          // },
          // {
          //   icon: <FontAwesomeIcon icon={faClipboard} style={{ color: "#ff5733" }} />,
          //   label: "Ραντεβού Χωματουργικού",
          //   route: "/FTTHBPhase/SoilWork/Appointments",
          // },
          // {
          //   icon: <FontAwesomeIcon icon={faFan} style={{ color: "#17a2b8" }} />,
          //   label: "Εμφυσήσεις",
          //   route: "/FTTHBPhase/Inculcation",
          // },
          // {
          //   icon: <FontAwesomeIcon icon={faClipboard} style={{ color: "#17a2b8" }} />,
          //   label: "Ραντεβού Εμφυσήσεων",
          //   route: "/FTTHBPhase/Inculcation/Appointments",
          // },
          // {
          //   icon: <FontAwesomeIcon icon={faBuilding} style={{ color: "#28a745" }} />,
          //   label: "Κατασκευές",
          //   route: "/FTTHBPhase/Constructions",
          // },
          // {
          //   icon: <FontAwesomeIcon icon={faClipboard} style={{ color: "#28a745" }} />,
          //   label: "Ραντεβού Κατασκευών",
          //   route: "/FTTHBPhase/Constructions/Appointments",
          // },
          // {
          //   icon: <FontAwesomeIcon icon={faHammer} style={{ color: "#007bff" }} />,
          //   label: "Κολλήσεις",
          //   route: "/FTTHBPhase/Splicing",
          // },
          // {
          //   icon: <FontAwesomeIcon icon={faClipboard} style={{ color: "#007bff" }} />,
          //   label: "Ραντεβού Κολλήσεων",
          //   route: "/FTTHBPhase/Splicing/Appointments",
          // },
          // {
          //   icon: <FontAwesomeIcon icon={faMoneyBill} style={{ color: "#28a745" }} />,
          //   label: "Τιμολόγηση",
          //   route: "/FTTHBPhase/Billing",
          // },
        ],
      },
      {
        icon: <FontAwesomeIcon icon={faMountain} style={{ color: "#ffcc00" }} className="text-lg" />,
        label: "FTTH - Γ ΦΑΣΗ",
        children: [
          {
            icon: <FontAwesomeIcon icon={faBuilding} style={{ color: "#007bff" }} />,
            label: "Master Last Drop",
            route: "/FTTHCPhase/LastDrop",
          },
        ],
      },
      {
        icon: <FontAwesomeIcon icon={faCog} style={{ color: "#6c757d" }} className="text-lg" />,
        label: "Settings",
        route: "/settings",
      },
      {
        icon: <FontAwesomeIcon icon={faFolder} style={{ color: "#6c757d" }} className="text-lg" />,
        label: "Mail",
        route: "/mail",
      },
    ],
  },
];

const SidebarLinkGroup = ({
  children,
  activeCondition,
}: {
  children: (handleClick: () => void, open: boolean) => React.ReactNode;
  activeCondition: boolean;
}) => {
  const [open, setOpen] = useState(activeCondition);

  const handleClick = () => {
    setOpen(!open);
  };

  return <>{children(handleClick, open)}</>;
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const [pageName, setPageName] = useLocalStorage("selectedMenu", "dashboard");
  const [openGroups, setOpenGroups] = useLocalStorage<Record<string, boolean>>(
    "sidebar-open-groups",
    {}
  );

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isActive = (route: string) => pathname === route;

  const getSubMenuHeight = (children: any[]) => {
    const itemHeight = 40; // height of each item in pixels
    const padding = 16; // total vertical padding
    return children.length * itemHeight + padding + 'px';
  };

  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      <aside
        className={`fixed left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-gray-800 text-white duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between px-15 py-5">
          <Link href="/">
            <Image
              src="/images/logo/fieldx.png"
              width={150}
              height={150}
              alt="Logo"
              priority
              className="transition-transform duration-200 hover:scale-105"
            />
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            className="block lg:hidden text-gray-400 transition-transform duration-200 hover:scale-110"
          >
            <FontAwesomeIcon icon={faChevronDown} />
          </button>
        </div>

        {/* Menu Section */}
        <div className="flex flex-col overflow-y-auto custom-scrollbar">
          <nav className="mt-5 px-4">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-6">
                <h3 className="mb-4 ml-2 text-sm font-bold text-gray-400 uppercase">
                  {group.name}
                </h3>
                <ul className="flex flex-col gap-2">
                  {group.menuItems.map((menuItem, menuIndex) => (
                    <li key={menuIndex}>
                      <SidebarLinkGroup activeCondition={pathname.includes(menuItem.route)}>
                        {(handleClick, open) => (
                          <>
                            {menuItem.children ? (
                              <button
                                onClick={() => toggleGroup(menuItem.label)}
                                className={`group flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-all duration-200 ease-in-out
                                  hover:bg-gray-700 hover:shadow-lg ${
                                  openGroups[menuItem.label] ? "bg-gray-700" : ""
                                }`}
                              >
                                <span className="flex items-center gap-3 transition-transform duration-200 group-hover:translate-x-1">
                                  {menuItem.icon}
                                  <span>{menuItem.label}</span>
                                </span>
                                <FontAwesomeIcon
                                  icon={faChevronDown}
                                  className={`ml-auto transform transition-all duration-300 ease-in-out ${
                                    openGroups[menuItem.label] ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            ) : (
                              <Link
                                href={menuItem.route}
                                className={`group flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ease-in-out
                                  hover:bg-gray-700 hover:shadow-lg ${
                                  isActive(menuItem.route) ? "bg-gray-700" : ""
                                }`}
                                onClick={() => setPageName(menuItem.label.toLowerCase())}
                              >
                                <span className="flex items-center gap-3 transition-transform duration-200 group-hover:translate-x-1">
                                  {menuItem.icon}
                                  <span>{menuItem.label}</span>
                                </span>
                              </Link>
                            )}

                            {menuItem.children && (
                              <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out`}
                                style={{
                                  maxHeight: openGroups[menuItem.label] 
                                    ? getSubMenuHeight(menuItem.children) 
                                    : '0',
                                  opacity: openGroups[menuItem.label] ? 1 : 0,
                                  transform: openGroups[menuItem.label] 
                                    ? 'translateY(0)' 
                                    : 'translateY(-10px)'
                                }}
                              >
                                <ul className="mt-2 ml-4 flex flex-col gap-2">
                                  {menuItem.children.map((child, childIndex) => (
                                    <li 
                                      key={childIndex}
                                      className="transform transition-all duration-200"
                                      style={{
                                        transitionDelay: `${childIndex * 50}ms`,
                                        opacity: openGroups[menuItem.label] ? 1 : 0,
                                        transform: openGroups[menuItem.label] 
                                          ? 'translateX(0)' 
                                          : 'translateX(-10px)'
                                      }}
                                    >
                                      <Link
                                        href={child.route}
                                        className={`group flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ease-in-out
                                          hover:bg-gray-700 hover:shadow-lg ${
                                          isActive(child.route) ? "bg-gray-700" : ""
                                        }`}
                                        onClick={() => setPageName(child.label.toLowerCase())}
                                      >
                                        <span className="flex items-center gap-3 transition-transform duration-200 group-hover:translate-x-1">
                                          {child.icon}
                                          <span>{child.label}</span>
                                        </span>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </SidebarLinkGroup>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <style jsx global>{`
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
      `}</style>
    </ClickOutside>
  );
};

export default Sidebar;
