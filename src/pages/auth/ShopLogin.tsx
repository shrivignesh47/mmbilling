
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ShopLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { shopSlug } = useParams<{ shopSlug: string }>();

  useEffect(() => {
    const fetchShopDetails = async () => {
      if (!shopSlug) {
        toast.error("Invalid shop URL");
        navigate("/login");
        return;
      }

      try {
        // Fetch shop details based on the URL slug
        const { data, error } = await supabase
          .from('shops')
          .select('id, name')
          .eq('name', shopSlug)
          .single();

        if (error || !data) {
          toast.error("Shop not found");
          navigate("/login");
          return;
        }

        setShopId(data.id);
        setShopName(data.name);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching shop:", error);
        toast.error("Error loading shop");
        navigate("/login");
      }
    };

    fetchShopDetails();
  }, [shopSlug, navigate]);

  useEffect(() => {
    // Check if user is already logged in
    if (isAuthenticated) {
      navigate("/cashier/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      const { user, profile, error } = await login(email, password);
      
      if (error) {
        toast.error(`Login failed: ${error.message}`);
        return;
      }
      
      if (!profile) {
        toast.error("User profile not found");
        return;
      }

      // Verify that the user belongs to this shop
      if (profile.shop_id !== shopId) {
        toast.error("You are not authorized to access this shop");
        return;
      }

      // Only allow managers and cashiers
      if (profile.role === "owner") {
        toast.error("Owners should use the main login page");
        return;
      }

      // Redirect based on role
      if (profile.role === "manager") {
        navigate("/manager/dashboard");
      } else if (profile.role === "cashier") {
        navigate("/cashier/dashboard");
      } else {
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(`Login error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading shop login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {shopName} Login
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access {shopName}
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
              Only managers and cashiers assigned to this shop can login here.
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <Button className="w-full" variant="outline" onClick={() => navigate("/login")}>
              Go to Main Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ShopLogin;
