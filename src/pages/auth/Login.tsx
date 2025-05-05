
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login: React.FC = () => {
  const [email, setEmail] = useState("admin@admin");
  const [password, setPassword] = useState("admin123456");
  const [shops, setShops] = useState<{ name: string }[]>([]);
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only check authentication after explicit login, not on mount
    if (isAuthenticated && !loading) {
      navigate("/cashier/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    // Fetch active shops for shop-specific login links
    const fetchShops = async () => {
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('name')
          .eq('is_active', true)
          .limit(5);
        
        if (error) throw error;
        setShops(data || []);
      } catch (error) {
        console.error("Error fetching shops:", error);
      }
    };

    fetchShops();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    try {
      const { error, profile } = await login(email, password);
      
      if (error) {
        toast.error(`Login failed: ${error.message}`);
        return;
      }
      
      if (profile) {
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
            break;
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(`Login error: ${error.message}`);
    }
  };

  const goToShopLogin = (shopName: string) => {
    navigate(`/shop/${shopName}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">MM Billing</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Default admin login: admin@admin / admin123456
            </div>

            {/* Shop-specific login links */}
            {shops.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Shop-specific login portals:</p>
                <div className="flex flex-wrap gap-2">
                  {shops.map((shop) => (
                    <Button 
                      key={shop.name}
                      variant="outline" 
                      size="sm"
                      onClick={() => goToShopLogin(shop.name)}
                    >
                      {shop.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
