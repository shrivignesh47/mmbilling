
import React from "react";
import { ShieldCheck } from "lucide-react";
import { CustomRole } from "@/types/supabase-extensions";
import RoleCard from "./RoleCard";

interface RolesListProps {
  roles: CustomRole[];
  isLoading: boolean;
  onDeleteRole: (roleId: string) => void;
}

const RolesList: React.FC<RolesListProps> = ({
  roles,
  isLoading,
  onDeleteRole
}) => {
  return (
    <>
      {isLoading ? (
        <div className="text-center py-8">
          <p>Loading roles...</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {roles.length > 0 ? (
            roles.map((role) => (
              <RoleCard 
                key={role.id} 
                role={role} 
                onDelete={onDeleteRole} 
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No custom roles</h3>
              <p className="text-sm text-muted-foreground">
                Create custom roles to assign specific permissions to your staff.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default RolesList;
