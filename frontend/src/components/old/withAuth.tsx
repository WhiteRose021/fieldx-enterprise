"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const withAuth = (WrappedComponent: React.ComponentType) => {
  const AuthenticatedComponent = (props: any) => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkAuth = () => {
        try {
          // Use try-catch to handle potential errors
          console.log("[withAuth] Checking authentication...");

          // Check the auth token in cookies
          const authToken = typeof document !== 'undefined' 
            ? document.cookie
                .split("; ")
                .find((row) => row.startsWith("auth_token="))
                ?.split("=")[1]
            : null;

          if (!authToken) {
            console.warn("[withAuth] Missing auth credentials, redirecting to login...");
            router.push("/auth/signin");
            return;
          }

          console.log("[withAuth] User is authenticated, proceeding...");
          setIsAuthenticated(true);
        } catch (error) {
          console.error("[withAuth] Authentication check failed:", error);
          router.push("/auth/signin");
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    // Render loading state during authentication check
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      );
    }

    // If not authenticated, render nothing (redirect happens in useEffect)
    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return AuthenticatedComponent;
};

export default withAuth;