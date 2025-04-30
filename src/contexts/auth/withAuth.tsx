
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { UserRole } from "./types";

export const withAuth = (Component: React.ComponentType, requiredRole?: UserRole | UserRole[]) => {
  return (props: any) => {
    const { user, profile, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          navigate("/login");
          return;
        }

        if (requiredRole && profile) {
          const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
          
          if (!roles.includes(profile.role)) {
            switch (profile.role) {
              case "owner":
                navigate("/owner/dashboard");
                break;
              case "manager":
                navigate("/manager/dashboard");
                break;
              case "cashier":
                navigate("/cashier/dashboard");
                break;
              default:
                navigate("/login");
            }
          }
        }
      }
    }, [loading, isAuthenticated, profile, navigate]);

    if (loading) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requiredRole && profile) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(profile.role)) {
        return null;
      }
    }

    return <Component {...props} />;
  };
};
