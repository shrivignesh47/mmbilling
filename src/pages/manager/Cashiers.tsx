
import React, { useState, useEffect } from "react";
import { User, UserPlus, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CashierActivity from "@/components/dashboards/manager/CashierActivity";
import { useCashierActivity } from "@/hooks/useCashierActivity";
import { exportToExcel } from "@/components/utils/ExportUtils";

const Cashiers = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cashiers, setCashiers] = useState<any[]>([]);
  
  // Fetch cashier activity data - using the correct property names
  const { cashiers: cashierActivityData, loading: activityLoading } = 
    useCashierActivity(profile?.shop_id);
  
  useEffect(() => {
    if (profile?.shop_id) {
      fetchCashiers();
    } else {
      setLoading(false);
    }
  }, [profile?.shop_id]);
  
  const fetchCashiers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .eq('role', 'cashier');
      
      if (error) throw error;
      
      setCashiers(data || []);
    } catch (error) {
      console.error('Error fetching cashiers:', error);
      toast.error('Failed to load cashiers');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExportCashiers = () => {
    if (cashiers.length === 0) {
      toast.error('No cashier data to export');
      return;
    }
    
    const formattedData = cashiers.map(cashier => ({
      'Name': cashier.name || 'Unknown',
      'Email': cashier.email || 'N/A',
      'Created At': new Date(cashier.created_at).toLocaleString(),
      'Last Updated': new Date(cashier.updated_at).toLocaleString()
    }));
    
    exportToExcel(formattedData, 'cashier-list');
    toast.success('Cashier list exported to Excel');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cashiers</h2>
          <p className="text-muted-foreground">
            Manage your shop's cashiers and their activity
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportCashiers}>
            <FileText className="mr-2 h-4 w-4" />
            Export List
          </Button>

        </div>
      </div>
      
      {!profile?.shop_id && (
        <Alert>
          <AlertDescription>
            You haven't been assigned to a shop yet. Please contact the owner to assign you to a shop.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cashier List</CardTitle>
            <CardDescription>
              Cashiers assigned to your shop
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-3 border rounded animate-pulse">
                    <div className="w-1/2 h-5 bg-muted rounded mb-2"></div>
                    <div className="w-1/3 h-4 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : cashiers.length > 0 ? (
              <div className="space-y-4">
                {cashiers.map(cashier => (
                  <div key={cashier.id} className="p-3 border rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <User className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span className="font-medium">{cashier.name || 'Unnamed Cashier'}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cashier.email || 'No email provided'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added on: {new Date(cashier.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">No cashiers found</p>
                <p className="text-sm text-muted-foreground">
                  Ask the shop owner to assign cashiers to your shop
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <CashierActivity 
          cashiers={cashierActivityData} 
          isLoading={activityLoading} 
        />
      </div>
    </div>
  );
};

export default Cashiers;
