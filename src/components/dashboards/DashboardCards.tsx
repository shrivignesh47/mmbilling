
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  className,
}) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            {trend && (
              <span className={cn("mr-1 flex items-center", 
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.isPositive ? (
                  <ArrowUpIcon className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-3 w-3 mr-1" />
                )}
                {Math.abs(trend.value)}%
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardCardsSkeleton: React.FC = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-1/3 bg-muted rounded animate-pulse"></div>
            <div className="h-5 w-5 rounded-full bg-muted animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-1/2 bg-muted rounded animate-pulse mb-2"></div>
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
