
import React from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserProfile } from "@/types/staff";
import { CustomRole } from "@/types/supabase-extensions";
import UserCard from "./UserCard";

interface UsersListProps {
  users: UserProfile[];
  roles: CustomRole[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEditUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
}

const UsersList: React.FC<UsersListProps> = ({
  users,
  roles,
  isLoading,
  searchTerm,
  onSearchChange,
  onEditUser,
  onDeleteUser
}) => {
  const filteredUsers = searchTerm 
    ? users.filter(user => 
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : users;

  return (
    <>
      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search staff members..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">
          <p>Loading staff...</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <UserCard 
              key={user.id}
              user={user}
              roles={roles}
              onEdit={onEditUser}
              onDelete={onDeleteUser}
            />
          ))}
          
          {filteredUsers.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No staff found</h3>
              <p className="text-sm text-muted-foreground">
                {users.length === 0 
                  ? "No staff have been added yet. Start by adding your first staff member." 
                  : "No staff match your search criteria. Try adjusting your search."}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default UsersList;
