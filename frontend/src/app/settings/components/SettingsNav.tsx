"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Settings, Database, Users, Shield, Workflow, 
  Cable, Server, ChevronRight 
} from "lucide-react";

export default function SettingsNav() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  const navItems = [
    {
      title: "General",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />
    },
    {
      title: "Entities",
      href: "/settings/entities",
      icon: <Database className="h-5 w-5" />
      // No children/submenu items
    },
    {
      title: "Users",
      href: "/settings/users",
      icon: <Users className="h-5 w-5" />
    },
    {
      title: "Roles & Permissions",
      href: "/settings/roles",
      icon: <Shield className="h-5 w-5" />
    },
    {
      title: "Workflows",
      href: "/settings/workflows",
      icon: <Workflow className="h-5 w-5" />
    },
    {
      title: "Integrations",
      href: "/settings/integrations",
      icon: <Cable className="h-5 w-5" />
    },
    {
      title: "System",
      href: "/settings/system",
      icon: <Server className="h-5 w-5" />
    }
  ];

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-medium mb-4 px-2 text-gray-900">Settings</h2>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <div key={item.href}>
            <Link 
              href={item.href}
              className={`flex items-center px-2 py-2 text-sm font-medium rounded-lg ${
                isActive(item.href) 
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.title}
            </Link>
          </div>
        ))}
      </nav>
    </div>
  );
}