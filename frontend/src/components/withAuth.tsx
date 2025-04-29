"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

/**
 * Higher-order component to protect routes that require authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WithAuthComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.replace("/auth/signin");
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return <LoadingScreen />;
    }

    // Only render the protected component if authenticated
    return isAuthenticated ? <Component {...props} /> : null;
  };
}

/**
 * Higher-order component for routes that are only accessible when NOT authenticated
 */
export function withoutAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WithoutAuthComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && isAuthenticated) {
        router.replace("/");
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return <LoadingScreen />;
    }

    // Only render the component if not authenticated
    return !isAuthenticated ? <Component {...props} /> : null;
  };
}

/**
 * Higher-order component to protect routes that require admin access
 */
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WithAdminAuthComponent(props: P) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.replace("/auth/signin");
        } else if (!user?.isAdmin) {
          // Redirect non-admin users to home page
          router.replace("/");
        }
      }
    }, [isAuthenticated, isLoading, router, user]);

    if (isLoading) {
      return <LoadingScreen />;
    }

    // Only render the protected component if authenticated and user is admin
    return isAuthenticated && user?.isAdmin ? <Component {...props} /> : null;
  };
}