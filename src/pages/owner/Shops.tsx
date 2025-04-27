
import React, { useState } from "react";
import { 
  Building, 
  Building2, 
  Edit, 
  MoreHorizontal, 
  Package2, 
  Plus, 
  Search, 
  ShoppingBag, 
  Trash2, 
  User 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboards/DashboardCards";

interface Shop {
  id: string;
  name: string;
  location: string;
  manager: string;
  products: number;
  inventory: number;
  status: "active" | "inactive" | "pending";
}

const demoShops: Shop[] = [
  { 
    id: "shop1", 
    name: "Main Street Shop", 
    location: "123 Main St, City", 
    manager: "John Doe", 
    products: 245, 
    inventory: 1250, 
    status: "active" 
  },
  { 
    id: "shop2", 
    name: "Downtown Branch", 
    location: "456 Center Ave, Downtown", 
    manager: "Jane Smith", 
    products: 180, 
    inventory: 950, 
    status: "active" 
  },
  { 
    id: "shop3", 
    name: "Westside Location", 
    location: "789 West Blvd, Westside", 
    manager: "Robert Johnson", 
    products: 210, 
    inventory: 1100, 
    status: "active" 
  },
  { 
    id: "shop4", 
    name: "North Plaza", 
    location: "321 North Rd, North District", 
    manager: "Emily Davis", 
    products: 160, 
    inventory: 830, 
    status: "active" 
  },
  { 
    id: "shop5", 
    name: "South Bay Branch", 
    location: "654 Bay Ave, South Bay", 
    manager: "Michael Wilson", 
    products: 195, 
    inventory: 980, 
    status: "pending" 
  },
  { 
    id: "shop6", 
    name: "East End Store", 
    location: "987 East St, East End", 
    manager: "Unassigned", 
    products: 0, 
    inventory: 0, 
    status: "inactive" 
  },
];

const Shops: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter shops based on search term
  const filteredShops = searchTerm 
    ? demoShops.filter(shop => 
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.manager.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : demoShops;

  // Shop statistics
  const activeShops = demoShops.filter(shop => shop.status === "active").length;
  const totalProducts = demoShops.reduce((sum, shop) => sum + shop.products, 0);
  const totalInventory = demoShops.reduce((sum, shop) => sum + shop.inventory, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Shops</h2>
        <p className="text-muted-foreground">
          Manage your shops and locations
        </p>
      </div>

      {/* Shops Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Shops"
          value={demoShops.length.toString()}
          icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
          description={`${activeShops} active`}
        />
        <StatCard
          title="Total Products"
          value={totalProducts.toString()}
          icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
          description="Across all shops"
        />
        <StatCard
          title="Total Inventory"
          value={totalInventory.toString()}
          icon={<Package2 className="h-4 w-4 text-muted-foreground" />}
          description="Items in stock"
        />
      </div>

      {/* Shop Management Section */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Manage Shops</CardTitle>
            <CardDescription>
              Create, edit and manage your shop locations
            </CardDescription>
          </div>
          <Button onClick={() => {}}>
            <Plus className="mr-2 h-4 w-4" />
            Add Shop
          </Button>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="mb-6 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shops..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Shops Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredShops.map((shop) => (
              <Card key={shop.id} className="overflow-hidden">
                <div className={`h-1 w-full ${
                  shop.status === "active" ? "bg-success" :
                  shop.status === "pending" ? "bg-amber-500" :
                  "bg-destructive"
                }`}></div>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{shop.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Building className="mr-1 h-3 w-3" />
                        {shop.location}
                      </CardDescription>
                    </div>
                    <Badge variant={
                      shop.status === "active" ? "default" :
                      shop.status === "pending" ? "outline" :
                      "secondary"
                    }>
                      {shop.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <div className="flex items-center">
                      <User className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span>Manager:</span>
                    </div>
                    <span className="font-medium">{shop.manager}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <div className="flex items-center">
                      <ShoppingBag className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span>Products:</span>
                    </div>
                    <span className="font-medium">{shop.products}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <Package2 className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span>Inventory:</span>
                    </div>
                    <span className="font-medium">{shop.inventory}</span>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/50 pt-3">
                  <div className="flex justify-between w-full">
                    <Button size="sm" variant="ghost">
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <div className="flex gap-1">
                      {shop.status !== "active" && (
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
            
            {filteredShops.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No shops found</h3>
                <p className="text-sm text-muted-foreground">
                  No shops match your search criteria. Try adjusting your search.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Shops;
