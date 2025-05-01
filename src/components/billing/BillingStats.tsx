
import React from "react";

interface BillingStatsProps {
  dailySaleCount: number;
  dailyRevenue: number;
}

const BillingStats: React.FC<BillingStatsProps> = ({ dailySaleCount, dailyRevenue }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <div className="text-sm text-muted-foreground">Today's Sales</div>
        <div className="text-xl font-bold">{dailySaleCount} orders</div>
      </div>
      <div className="text-right ml-6">
        <div className="text-sm text-muted-foreground">Today's Revenue</div>
        <div className="text-xl font-bold text-green-600">${dailyRevenue.toFixed(2)}</div>
      </div>
    </div>
  );
};

export default BillingStats;
