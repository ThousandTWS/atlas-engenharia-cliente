import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from "../services/authService";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(authService.isAuthenticated());

  React.useEffect(() => {
    let isMounted = true;

    const resolveAuth = async () => {
      const alreadyAuthenticated = authService.isAuthenticated();

      if (alreadyAuthenticated) {
        if (isMounted) {
          setIsAuthenticated(true);
          setIsCheckingAuth(false);
        }
        return;
      }

      const hydrated = await authService.hydrateSession();
      if (isMounted) {
        setIsAuthenticated(hydrated);
        setIsCheckingAuth(false);
      }
    };

    resolveAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  console.log("ProtectedRoute: Checking auth...", {
    isAuthenticated,
    path: location.pathname,
    hasToken: !!authService.getToken(),
    hasUser: !!authService.getCurrentUser(),
    isCheckingAuth,
  });

  if (isCheckingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login");
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  console.log("ProtectedRoute: Authenticated, rendering children");
  return <>{children}</>;
};
