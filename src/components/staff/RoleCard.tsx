
import React from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { CustomRole } from "@/types/supabase-extensions";

interface RoleCardProps {
  role: CustomRole;
  onDelete: (roleId: string) => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ role, onDelete }) => {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full bg-success"></div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{role.name}</CardTitle>
        </div>
        {role.description && (
          <CardDescription className="text-sm">
            {role.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Permissions:</p>
          <div className="flex flex-wrap gap-1">
            {role.permissions.map(permission => (
              <Badge key={permission} variant="outline" className="text-xs">
                {permission}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 pt-2">
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive ml-auto"
          onClick={() => onDelete(role.id)}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Delete Role
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoleCard;
