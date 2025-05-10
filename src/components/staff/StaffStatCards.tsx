
import React from "react";
import { Users, UserCheck, ShieldCheck } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

interface StaffStatCardsProps {
  totalStaff: number;
  cashierCount: number;
  customRolesCount: number;
}

const StaffStatCards: React.FC<StaffStatCardsProps> = ({ 
  totalStaff, 
  cashierCount, 
  customRolesCount 
}) => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      <StatCard
        title="Total Staff"
        value={totalStaff.toString()}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        description="All staff members"
      />
      <StatCard
        title="Cashiers"
        value={cashierCount.toString()}
        icon={<UserCheck className="h-4 w-4 text-muted-foreground" />}
        description="Staff with cashier role"
      />
      <StatCard
        title="Custom Roles"
        value={customRolesCount.toString()}
        icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />}
        description="Available custom roles"
      />
    </div>
  );
};

export default StaffStatCards;
