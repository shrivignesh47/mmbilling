
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserIcon, Clock, DollarSign, FileText } from 'lucide-react';
import { exportToExcel } from '@/components/utils/ExportUtils';

interface CashierActivity {
  id: string;
  name: string;
  email: string;
  last_login: string | null;
  last_logout: string | null;
  daily_sales: number;
  daily_transactions: number;
}

interface CashierActivityProps {
  cashiers: CashierActivity[];
  isLoading: boolean;
}

const CashierActivity: React.FC<CashierActivityProps> = ({ cashiers, isLoading }) => {
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return 'N/A';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString();
    } catch (e) {
      return 'Invalid time';
    }
  };
  
  const handleExport = () => {
    const data = cashiers.map(cashier => ({
      'Name': cashier.name || 'Unknown',
      'Email': cashier.email || 'N/A',
      'Last Login': cashier.last_login ? new Date(cashier.last_login).toLocaleString() : 'N/A',
      'Last Logout': cashier.last_logout ? new Date(cashier.last_logout).toLocaleString() : 'N/A',
      'Daily Sales Amount': cashier.daily_sales || 0,
      'Daily Transactions': cashier.daily_transactions || 0
    }));
    
    exportToExcel(data, 'cashier-activity-report');
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cashier Activity</CardTitle>
          <CardDescription>Today's cashier performance</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <FileText className="mr-2 h-4 w-4" />
          Export
        </Button>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 border rounded animate-pulse">
                <div className="w-1/3 h-5 bg-muted rounded"></div>
                <div className="w-1/4 h-5 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : cashiers.length > 0 ? (
          <div className="space-y-4">
            {cashiers.map(cashier => (
              <div key={cashier.id} className="p-3 border rounded hover:bg-accent/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span className="font-medium">{cashier.name || 'Unknown'}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{cashier.email}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>Login: {formatTime(cashier.last_login)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>Logout: {formatTime(cashier.last_logout)}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>Sales: ${cashier.daily_sales || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>Transactions: {cashier.daily_transactions || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <UserIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No cashier activity data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CashierActivity;
