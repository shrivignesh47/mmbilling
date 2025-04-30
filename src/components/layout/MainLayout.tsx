
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  sidebarContent: React.ReactNode;
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  sidebarContent, 
  sidebarCollapsed = false,
  toggleSidebar = () => {}
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, logout } = useAuth();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top header bar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center px-4 md:px-6">
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMobileMenu}
            className="md:hidden mr-2"
            aria-label="Toggle mobile menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden md:flex"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
          
          {/* App Title */}
          <span className="font-bold text-lg md:text-xl ml-2">MM Billing</span>
          
          <div className="ml-auto flex items-center gap-2">
            {/* User info */}
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-sm font-medium">{profile?.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{profile?.role}</span>
            </div>
            
            {/* Logout button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside 
          className={cn(
            "hidden md:block border-r bg-background transition-all duration-300 overflow-y-auto h-[calc(100vh-4rem)]",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className={cn("py-4", sidebarCollapsed && "px-2")}>
            {sidebarContent}
          </div>
        </aside>

        {/* Mobile sidebar (as overlay) */}
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden" />
            <div className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs bg-background shadow-lg md:hidden">
              <div className="flex h-16 items-center border-b px-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleMobileMenu}
                  aria-label="Close mobile menu"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="font-bold text-lg ml-2">MM Billing</span>
              </div>
              <div className="py-4 px-4 overflow-y-auto h-[calc(100vh-4rem)]">
                {sidebarContent}
              </div>
            </div>
            {/* Click outside to close */}
            <div 
              className="fixed inset-0 z-40 md:hidden" 
              onClick={toggleMobileMenu}
            />
          </>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
