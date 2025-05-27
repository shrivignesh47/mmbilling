import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import login1 from "./login.svg";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [shops, setShops] = useState<{ name: string }[]>([]);
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/cashier/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const { data, error } = await supabase
          .from("shops")
          .select("name")
          .eq("is_active", true)
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
          case "staff":
          default:
            navigate("/staff/dashboard");
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
    <div className="min-h-screen flex items-center justify-center bg-[#e0e7ff] px-4">
      <div className="flex flex-col sm:flex-row w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Left: Login Form */}
        <div className="w-full sm:w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-center mb-4">Login</h2>
          <p className="text-center text-muted-foreground mb-6 text-sm">
            Secure Admin Access — Sign in to manage your shop smartly.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Type Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div
                  className="absolute right-3 top-2.5 text-gray-500 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
              <div className="text-right mt-1 text-xs text-blue-500 hover:underline cursor-pointer">
                Forgot password?
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="remember" className="accent-black-500" />
              <Label htmlFor="remember" className="text-sm">
                Remember me
              </Label>
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>

          {/* Shop-specific login portals */}
          {shops.length > 0 && (
            <div className="pt-6 border-t mt-6">
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
        </div>

        {/* Right: Illustration & Info */}
        <div className="w-full sm:w-1/2 bg-[#f1f5ff] flex flex-col items-center justify-center p-10">
          <img
            src={login1}
            alt="Project Progress Illustration"
            className="w-52 h-52 sm:w-72 sm:h-72 object-contain"
          />
          <h2 className="text-xl font-semibold mt-6 text-center">
            Locked out? We've got your back
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-2 px-6">
            Billing chaos? Let us organize it with a custom system{" "}
            <a
              href="mailto:magnitudemedia25@gmail.com"
              className="text-blue-500 hover:underline inline-flex items-center gap-1"
            >
              <Mail className="w-4 h-4" />
              magnitudemedia25@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "@/contexts/auth";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { toast } from "sonner";
// import { supabase } from "@/integrations/supabase/client";

// const Login: React.FC = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [shops, setShops] = useState<{ name: string }[]>([]);
//   const { login, loading, isAuthenticated } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Only check authentication after explicit login, not on mount
//     if (isAuthenticated && !loading) {
//       navigate("/cashier/dashboard");
//     }
//   }, [isAuthenticated, loading, navigate]);

//   useEffect(() => {
//     // Fetch active shops for shop-specific login links
//     const fetchShops = async () => {
//       try {
//         const { data, error } = await supabase
//           .from('shops')
//           .select('name')
//           .eq('is_active', true)
//           .limit(5);
        
//         if (error) throw error;
//         setShops(data || []);
//       } catch (error) {
//         console.error("Error fetching shops:", error);
//       }
//     };

//     fetchShops();
//   }, []);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!email || !password) {
//       toast.error("Please enter both email and password");
//       return;
//     }
//     try {
//       const { error, profile } = await login(email, password);
      
//       if (error) {
//         toast.error(`Login failed: ${error.message}`);
//         return;
//       }
      
//       if (profile) {
//         switch (profile.role) {
//           case "owner":
//             navigate("/owner/dashboard");
//             break;
//           case "manager":
//             navigate("/manager/dashboard");
//             break;
//           case "cashier":
//             navigate("/cashier/dashboard");
//             break;
//           case "staff":
//             navigate("/staff/dashboard");
//             break;
//           default:
//             // For custom roles (UUID format), redirect to staff dashboard
//             navigate("/staff/dashboard");
//             break;
//         }
//       }
//     } catch (error: any) {
//       console.error("Login error:", error);
//       toast.error(`Login error: ${error.message}`);
//     }
//   };

//   const goToShopLogin = (shopName: string) => {
//     navigate(`/shop/${shopName}`);
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
//       <Card className="w-full max-w-md">
//         <CardHeader className="space-y-1">
//           <CardTitle className="text-2xl font-bold text-center">MM Billing</CardTitle>
//           <CardDescription className="text-center">
//             Enter your credentials to access your account
//           </CardDescription>
//         </CardHeader>
//         <form onSubmit={handleSubmit}>
//           <CardContent className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="text-sm text-muted-foreground">
        
//             </div>

//             {/* Shop-specific login links */}
//             {shops.length > 0 && (
//               <div className="pt-2 border-t">
//                 <p className="text-sm font-medium mb-2">Shop-specific login portals:</p>
//                 <div className="flex flex-wrap gap-2">
//                   {shops.map((shop) => (
//                     <Button 
//                       key={shop.name}
//                       variant="outline" 
//                       size="sm"
//                       onClick={() => goToShopLogin(shop.name)}
//                     >
//                       {shop.name}
//                     </Button>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </CardContent>
//           <CardFooter>
//             <Button className="w-full" type="submit" disabled={loading}>
//               {loading ? "Signing in..." : "Sign In"}
//             </Button>
//           </CardFooter>
//         </form>
//       </Card>
//     </div>
//   );
// };

// export default Login;



// import { useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Eye, EyeOff, Mail } from "lucide-react";
// import { toast } from "sonner";
// import login from "./login.svg";

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     // Replace with your actual login logic
//     setTimeout(() => {
//       setLoading(false);
//       toast.success("Logged in successfully");
//     }, 2000);
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#e0e7ff] px-4">
//       <div className="flex flex-col sm:flex-row w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden">
        
//         {/* Left: Login Form */}
//         <div className="w-full sm:w-1/2 p-10 flex flex-col justify-center">
//           <h2 className="text-3xl font-bold text-center mb-4">Login</h2>
//           <p className="text-center text-muted-foreground mb-6 text-sm">
//             Secure Admin Access — Sign in to manage your shop smartly.
//           </p>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="Type Your Email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>
//             <div>
//               <Label htmlFor="password">Password</Label>
//               <div className="relative">
//                 <Input
//                   id="password"
//                   type={showPassword ? "text" : "password"}
//                   placeholder="••••••••"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                 />
//                 <div
//                   className="absolute right-3 top-2.5 text-gray-500 cursor-pointer"
//                   onClick={() => setShowPassword(!showPassword)}
//                 >
//                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                 </div>
//               </div>
//               <div className="text-right mt-1 text-xs text-blue-500 hover:underline cursor-pointer">
//                 Forgot password?
//               </div>
//             </div>
//             <div className="flex items-center space-x-2">
//               <input type="checkbox" id="remember" className="accent-black-500" />
//               <Label htmlFor="remember" className="text-sm">Remember me</Label>
//             </div>
//             <Button className="w-full" type="submit" disabled={loading}>
//               {loading ? "Signing in..." : "Login"}
//             </Button>
//           </form>
//         </div>

//         {/* Right: Illustration & Info */}
//         <div className="w-full sm:w-1/2 bg-[#f1f5ff] flex flex-col items-center justify-center p-10">
//           <img
//             src={login}
//             alt="Project Progress Illustration"
//             className="w-52 h-52 sm:w-72 sm:h-72 object-contain"
//           />
//           <h2 className="text-xl font-semibold mt-6 text-center">
//             Locked out? We've got your back
//           </h2>
//           <p className="text-sm text-muted-foreground text-center mt-2 px-6">
//           Billing chaos? Let us organize it with a custom system <a
//     href="mailto:magnitudemedia25@gmail.com"
//     className="text-blue-500 hover:underline inline-flex items-center gap-1"
//   >
//     <Mail className="w-4 h-4" />
//     magnitudemedia25@gmail.com
//   </a>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }


