
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// User roles
export type UserRole = "owner" | "manager" | "cashier";

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  shopId?: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Mock users for demo
const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "owner@mmbilling.com",
    role: "owner"
  },
  {
    id: "2",
    name: "Shop Manager",
    email: "manager@mmbilling.com",
    role: "manager",
    shopId: "shop1"
  },
  {
    id: "3",
    name: "Cashier User",
    email: "cashier@mmbilling.com",
    role: "cashier",
    shopId: "shop1"
  }
];

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("mm-billing-user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Mock login function - in a real app, this would call an API
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(r => setTimeout(r, 1000));
      
      const foundUser = mockUsers.find(u => u.email === email);
      if (foundUser && password === "password") { // Simple mock password check
        setUser(foundUser);
        localStorage.setItem("mm-billing-user", JSON.stringify(foundUser));
        
        // Redirect based on role
        switch (foundUser.role) {
          case "owner":
            navigate("/owner/dashboard");
            break;
          case "manager":
            navigate("/manager/dashboard");
            break;
          case "cashier":
            navigate("/cashier/dashboard");
            break;
        }
        
        toast.success("Login successful");
      } else {
        toast.error("Invalid email or password");
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("mm-billing-user");
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Higher-order component to protect routes
export const withAuth = (Component: React.ComponentType, requiredRole?: UserRole | UserRole[]) => {
  return (props: any) => {
    const { user, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        navigate("/login");
        return;
      }

      if (!loading && isAuthenticated && requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        
        if (user && !roles.includes(user.role)) {
          // Redirect based on user's role if they don't have access
          switch (user.role) {
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
    }, [loading, isAuthenticated, user, navigate]);

    if (loading) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (user && !roles.includes(user.role)) {
        return null;
      }
    }

    return <Component {...props} />;
  };
};
