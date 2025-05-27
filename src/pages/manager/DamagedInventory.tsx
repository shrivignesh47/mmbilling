import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, PackageMinus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DamagedInventoryItem {
  product_id: string;
  quantity: number;
  created_at: string;
  reason: string | null;
  description: string | null;
}

interface Product {
  id: string;
  name: string;
}

export default function DamagedInventory() {
  const [damagedItems, setDamagedItems] = useState<DamagedInventoryItem[]>([]);
  const [productMap, setProductMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDamagedInventory = async () => {
      try {
        const { data, error } = await supabase.from('damaged_inventory').select('*');

        if (error) throw error;
        setDamagedItems(data || []);

        if (data?.length) {
          const uniqueProductIds = [...new Set(data.map((item) => item.product_id))];
          fetchProductNames(uniqueProductIds);
        }
      } catch (err) {
        console.error('Failed to fetch damaged inventory:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchProductNames = async (productIds: string[]) => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);

        if (error) throw error;

        const productNamesMap = (data || []).reduce(
          (acc: Record<string, string>, product: Product) => {
            acc[product.id] = product.name;
            return acc;
          },
          {}
        );

        setProductMap(productNamesMap);
      } catch (err) {
        console.error('Failed to fetch product names:', err);
      }
    };

    fetchDamagedInventory();
  }, []);

  // Filter and paginate results
  const filteredItems = damagedItems.filter((item) => {
    const productName = productMap[item.product_id] || 'Unknown';
    const reason = item.reason || '';
    const description = item.description || '';
    const searchTermLower = searchTerm.toLowerCase();

    return (
      productName.toLowerCase().includes(searchTermLower) ||
      reason.toLowerCase().includes(searchTermLower) ||
      description.toLowerCase().includes(searchTermLower)
    );
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Damaged Inventory</CardTitle>
          <CardDescription>Loading damaged inventory records...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!damagedItems.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Damaged Inventory</CardTitle>
          <CardDescription>No damaged inventory records found.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <PackageMinus className="h-12 w-12 mb-3 opacity-50" />
            <p>No damaged items have been recorded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Damaged Inventory</CardTitle>
            <CardDescription>
              Records of all damaged items ({filteredItems.length} total)
            </CardDescription>
          </div>

          <div className="relative w-full max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product or reason..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Product Name</TableHead>
                <TableHead className="w-[15%] text-right">Quantity</TableHead>
                <TableHead className="w-[20%]">Date</TableHead>
                <TableHead className="w-[25%]">Reason</TableHead>
                <TableHead className="w-[10%]">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => (
                <TableRow key={`${item.product_id}-${item.created_at}`}>
                  <TableCell className="font-medium">
                    {productMap[item.product_id] || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-mono">
                      {item.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="capitalize bg-destructive/10 text-destructive"
                    >
                      {(item.reason || 'unknown').replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-1">{item.description || '-'}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing{' '}
              {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} entries
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}