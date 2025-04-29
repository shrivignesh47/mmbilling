
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const { profile, user } = useAuth();
  const [shopDetails, setShopDetails] = useState({
    name: "",
    address: ""
  });
  const [profileDetails, setProfileDetails] = useState({
    name: "",
    email: ""
  });
  const [loading, setLoading] = useState(false);
  const [shopLoading, setShopLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileDetails({
        name: profile.name || "",
        email: user?.email || ""
      });

      if (profile.shop_id) {
        fetchShopDetails(profile.shop_id);
      }
    }
  }, [profile, user]);

  const fetchShopDetails = async (shopId: string) => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (error) throw error;

      if (data) {
        setShopDetails({
          name: data.name || "",
          address: data.address || ""
        });
      }
    } catch (error) {
      console.error('Error fetching shop details:', error);
      toast.error('Failed to load shop information');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: profileDetails.name })
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleShopUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.shop_id) return;

    setShopLoading(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({ 
          address: shopDetails.address 
        })
        .eq('id', profile.shop_id);

      if (error) throw error;
      
      toast.success('Shop details updated successfully');
    } catch (error) {
      console.error('Error updating shop:', error);
      toast.error('Failed to update shop details');
    } finally {
      setShopLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and shop settings
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <form onSubmit={handleProfileUpdate}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={profileDetails.name} 
                  onChange={(e) => setProfileDetails({...profileDetails, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={profileDetails.email} 
                  disabled
                />
                <p className="text-xs text-muted-foreground">Contact support to change your email address</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {profile?.shop_id && (
          <Card>
            <CardHeader>
              <CardTitle>Shop Settings</CardTitle>
              <CardDescription>Manage your shop's details</CardDescription>
            </CardHeader>
            <form onSubmit={handleShopUpdate}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input 
                    id="shopName" 
                    value={shopDetails.name}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">Shop name can only be changed by the owner</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopAddress">Shop Address</Label>
                  <Input 
                    id="shopAddress" 
                    value={shopDetails.address} 
                    onChange={(e) => setShopDetails({...shopDetails, address: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={shopLoading}>
                  {shopLoading ? 'Saving...' : 'Update Shop Details'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Settings;
