
import React from 'react';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProductsFilterProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  categoryFilter: string | null;
  setCategoryFilter: (category: string | null) => void;
  stockFilter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  setStockFilter: (filter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock') => void;
  isFilterDialogOpen: boolean;
  setIsFilterDialogOpen: (isOpen: boolean) => void;
  resetFilters: () => void;
  categories: string[];
}

const ProductsFilter: React.FC<ProductsFilterProps> = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  stockFilter,
  setStockFilter,
  isFilterDialogOpen,
  setIsFilterDialogOpen,
  resetFilters,
  categories
}) => {
  return (
    <div className="flex gap-4 items-center">
      <div className="relative flex-grow">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchTerm('')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <Button variant="outline" onClick={() => setIsFilterDialogOpen(true)}>
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filter
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Products</DialogTitle>
            <DialogDescription>
              Refine the product list using filters
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={categoryFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(null)}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={categoryFilter === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Stock Status</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={stockFilter === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStockFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={stockFilter === 'in-stock' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStockFilter('in-stock')}
                >
                  In Stock
                </Button>
                <Button
                  variant={stockFilter === 'low-stock' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStockFilter('low-stock')}
                >
                  Low Stock
                </Button>
                <Button
                  variant={stockFilter === 'out-of-stock' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStockFilter('out-of-stock')}
                >
                  Out of Stock
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
            <Button onClick={() => setIsFilterDialogOpen(false)}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsFilter;
