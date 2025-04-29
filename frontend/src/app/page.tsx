"use client";

import { useEffect, useState } from "react";
import AuthenticatedLayout from "@/components/layouts/AuthenticatedLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  Users,
  Briefcase,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  Mail,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    leads: { count: 0, trend: 0 },
    accounts: { count: 0, trend: 0 },
    opportunities: { count: 0, trend: 0 },
    revenue: { amount: 0, trend: 0 },
  });
  const [activities, setActivities] = useState<{ id: number; type: string; title: string; time: string; date: string; }[]>([]);

  useEffect(() => {
    // Simulate loading data from API
    const timer = setTimeout(() => {
      setStats({
        leads: { count: 128, trend: 12.5 },
        accounts: { count: 56, trend: 4.2 },
        opportunities: { count: 34, trend: -2.8 },
        revenue: { amount: 847250, trend: 8.3 },
      });
      
      setActivities([
        { id: 1, type: 'meeting', title: 'Client Presentation', time: '10:00 AM', date: 'Today' },
        { id: 2, type: 'call', title: 'Follow-up with Acme Corp', time: '2:30 PM', date: 'Today' },
        { id: 3, type: 'email', title: 'Proposal Review', time: '9:00 AM', date: 'Tomorrow' },
        { id: 4, type: 'meeting', title: 'Team Sync', time: '4:00 PM', date: 'Tomorrow' },
      ]);
      
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Welcome section */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your sales pipeline today.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Leads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-7 w-16 animate-pulse bg-gray-200 rounded" />
                ) : (
                  stats.leads.count
                )}
              </div>
              {!isLoading && (
                <div className="flex items-center text-xs text-muted-foreground">
                  {stats.leads.trend > 0 ? (
                    <>
                      <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                      <span className="text-green-500">
                        {stats.leads.trend}%
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                      <span className="text-red-500">
                        {Math.abs(stats.leads.trend)}%
                      </span>
                    </>
                  )}
                  <span className="ml-1">from last month</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accounts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Accounts</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-7 w-16 animate-pulse bg-gray-200 rounded" />
                ) : (
                  stats.accounts.count
                )}
              </div>
              {!isLoading && (
                <div className="flex items-center text-xs text-muted-foreground">
                  {stats.accounts.trend > 0 ? (
                    <>
                      <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                      <span className="text-green-500">
                        {stats.accounts.trend}%
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                      <span className="text-red-500">
                        {Math.abs(stats.accounts.trend)}%
                      </span>
                    </>
                  )}
                  <span className="ml-1">from last month</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opportunities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Opportunities
              </CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-7 w-16 animate-pulse bg-gray-200 rounded" />
                ) : (
                  stats.opportunities.count
                )}
              </div>
              {!isLoading && (
                <div className="flex items-center text-xs text-muted-foreground">
                  {stats.opportunities.trend > 0 ? (
                    <>
                      <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                      <span className="text-green-500">
                        {stats.opportunities.trend}%
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                      <span className="text-red-500">
                        {Math.abs(stats.opportunities.trend)}%
                      </span>
                    </>
                  )}
                  <span className="ml-1">from last month</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-7 w-24 animate-pulse bg-gray-200 rounded" />
                ) : (
                  `$${stats.revenue.amount.toLocaleString()}`
                )}
              </div>
              {!isLoading && (
                <div className="flex items-center text-xs text-muted-foreground">
                  {stats.revenue.trend > 0 ? (
                    <>
                      <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                      <span className="text-green-500">
                        {stats.revenue.trend}%
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                      <span className="text-red-500">
                        {Math.abs(stats.revenue.trend)}%
                      </span>
                    </>
                  )}
                  <span className="ml-1">from last month</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activities section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Upcoming Activities</CardTitle>
              <CardDescription>
                Your scheduled activities for the next 48 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="h-10 w-10 rounded-full animate-pulse bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 animate-pulse bg-gray-200 rounded" />
                        <div className="h-3 w-1/2 animate-pulse bg-gray-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className={`mt-0.5 rounded-full p-2 ${
                        activity.type === 'meeting' 
                          ? 'bg-blue-100 text-blue-600' 
                          : activity.type === 'call'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}>
                        {activity.type === 'meeting' ? (
                          <Calendar className="h-4 w-4" />
                        ) : activity.type === 'call' ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.time} · {activity.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add more dashboard widgets here */}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}