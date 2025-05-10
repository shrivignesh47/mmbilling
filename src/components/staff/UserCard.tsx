
import React from "react";
import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { UserProfile } from "@/types/staff";
import { CustomRole } from "@/types/supabase-extensions";

interface UserCardProps {
  user: UserProfile;
  roles: CustomRole[];
  onEdit: (user: UserProfile) => void;
  onDelete: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, roles, onEdit, onDelete }) => {
  return (
    <Card key={user.id} className="overflow-hidden">
      <div className={`h-1 w-full ${
        user.role === 'cashier' ? "bg-primary" : "bg-success"
      }`}></div>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{user.name || "Unnamed User"}</CardTitle>
          </div>
          <Badge>
            {user.role === 'cashier' ? 'Cashier' : roles.find(r => r.id === user.role)?.name || user.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {user.custom_permissions && user.custom_permissions.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1">Custom Permissions:</p>
            <div className="flex flex-wrap gap-1">
              {user.custom_permissions.map(permission => (
                <Badge key={permission} variant="outline" className="text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/50 pt-3">
        <div className="flex justify-between w-full">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(user)}
          >
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => onDelete(user.id)}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default UserCard;
