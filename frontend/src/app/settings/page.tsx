"use client";

import React from "react";
import SettingsHeader from "./components/SettingsHeader";
import SettingsCard from "./components/SettingsCard";
import { 
  Database, Users, Shield, Workflow, 
  Cable, Server, Settings
} from "lucide-react";

export default function SettingsPage() {
  // Settings sections
  const sections = [
    {
      title: "Entities",
      description: "Manage entities, fields, layouts, and relationships",
      icon: <Database className="h-6 w-6" />,
      href: "/settings/entities"
    },
    {
      title: "Users",
      description: "Manage users, access controls, and authentication settings",
      icon: <Users className="h-6 w-6" />,
      href: "/settings/users"
    },
    {
      title: "Roles & Permissions",
      description: "Configure roles, permissions, and access controls",
      icon: <Shield className="h-6 w-6" />,
      href: "/settings/roles"
    },
    {
      title: "Workflows",
      description: "Set up automated workflows and business processes",
      icon: <Workflow className="h-6 w-6" />,
      href: "/settings/workflows"
    },
    {
      title: "Integrations",
      description: "Configure integrations with external systems and APIs",
      icon: <Cable className="h-6 w-6" />,
      href: "/settings/integrations"
    },
    {
      title: "System",
      description: "Configure system-wide settings, backups, and maintenance",
      icon: <Server className="h-6 w-6" />,
      href: "/settings/system"
    },
    {
      title: "General Settings",
      description: "Configure application-wide settings and preferences",
      icon: <Settings className="h-6 w-6" />,
      href: "/settings/general"
    }
  ];

  return (
    <>
      <SettingsHeader
        title="Settings"
        description="Configure and customize your FieldX application"
      />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <SettingsCard
              key={section.title}
              title={section.title}
              description={section.description}
              icon={section.icon}
              href={section.href}
            />
          ))}
        </div>
      </div>
    </>
  );
}