
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import NotificationIndicator from "@/components/notifications/NotificationIndicator";

interface MainLayoutProps {
  sidebarContent: React.ReactNode;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  shopName?: string; // Make this optional
}

const MainLayout: React.FC<MainLayoutProps> = ({
  sidebarContent,
  sidebarCollapsed,
  toggleSidebar,
  shopName,
}) => {
  const { profile, logout } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:flex flex-col border-r bg-background",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="h-16 border-b flex items-center px-4">
          <h1 className="text-lg font-semibold truncate">
            {sidebarCollapsed ? "POS" : shopName || "POS System"}
          </h1>
        </div>
        {sidebarContent}
      </div>

      {/* Mobile sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="h-16 border-b flex items-center px-4">
            <h1 className="text-lg font-semibold">{shopName || "POS System"}</h1>
          </div>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b flex items-center justify-between px-4">
          <div className="flex items-center">
            <SheetTrigger
              onClick={() => setIsMobileSidebarOpen(true)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "lg:hidden"
              )}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </SheetTrigger>
            <button
              onClick={toggleSidebar}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "hidden lg:flex"
              )}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <NotificationIndicator />
            <div className="flex items-center">
              <div className="mr-2 text-sm text-right hidden md:block">
                <div className="font-medium">{profile?.name || "User"}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {profile?.role || "Guest"}
                </div>
              </div>
              <User className="h-8 w-8 rounded-full bg-muted p-1" />
            </div>
            <button
              onClick={() => logout()}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
