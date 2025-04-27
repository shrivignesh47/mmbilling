
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login: React.FC = () => {
  const [email, setEmail] = useState("admin@admin");
  const [password, setPassword] = useState("admin123456"); // Changed to meet minimum 6 character requirement
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      // If already authenticated, redirect to appropriate dashboard
      const checkProfile = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();
          
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
          }
        }
      };
      
      checkProfile();
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const createInitialOwner = async () => {
      try {
        console.log("Attempting to create initial owner");
        // Check if admin user exists
        const { data: adminUser, error: signInError } = await supabase.auth.signInWithPassword({
          email: "admin@admin",
          password: "admin123456"  // Changed to meet minimum 6 character requirement
        });

        if (signInError || !adminUser.user) {
          console.log("Admin user doesn't exist, creating...");
          // Create admin user if doesn't exist
          const { error: signUpError } = await supabase.auth.signUp({
            email: "admin@admin",
            password: "admin123456",  // Changed to meet minimum 6 character requirement
            options: {
              data: {
                name: "Admin",
              }
            }
          });

          if (signUpError) throw signUpError;
          toast.success("Initial admin account created. Please sign in.");
        } else {
          console.log("Admin user already exists");
        }
      } catch (error) {
        console.error("Error creating initial owner:", error);
        toast.error("Failed to check or create admin account");
      }
    };

    createInitialOwner();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    await login(email, password);
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
