
import React, { useState } from "react";
import { 
  CreditCard, 
  DollarSign, 
  Inbox, 
  Minus, 
  Plus, 
  ReceiptText, 
  Save, 
  Search, 
  ShoppingCart, 
  Trash2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const demoProducts = [
  { id: "p1", name: "Wireless Headphones", price: 59.99 },
  { id: "p2", name: "Smart Watch", price: 129.99 },
  { id: "p3", name: "Bluetooth Speaker", price: 45.00 },
  { id: "p4", name: "Phone Case", price: 19.99 },
  { id: "p5", name: "USB-C Cable", price: 12.99 },
  { id: "p6", name: "Power Bank", price: 35.00 },
];

const Billing: React.FC = () => {
  const [cartItems, setCartItems] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<typeof demoProducts>([]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length > 0) {
      const results = demoProducts.filter(product => 
        product.name.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };
  
  const addToCart = (product: typeof demoProducts[0]) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
    
    setSearchTerm("");
    setSearchResults([]);
  };
  
  const updateQuantity = (id: string, change: number) => {
    setCartItems(cartItems.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(1, item.quantity + change) } 
        : item
    ));
  };
  
  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };
  
  const clearCart = () => {
    setCartItems([]);
  };
  
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">
          Create a new bill for a customer
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search and Cart Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Search for products to add to the bill
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for products..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                  {searchResults.map(product => (
                    <div 
                      key={product.id}
                      className="flex justify-between items-center p-2 hover:bg-secondary cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="rounded-md border">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center font-semibold text-sm">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Shopping Cart
                  </h3>
                  {cartItems.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearCart}>
                      <Trash2 className="mr-1 h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>
                
                {cartItems.length === 0 ? (
                  <div className="mt-8 mb-8 flex flex-col items-center justify-center text-center">
                    <Inbox className="h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Your cart is empty</h3>
                    <p className="text-sm text-muted-foreground">
                      Search for products to add them to the cart
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ${item.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-5 text-center text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bill Summary Section */}
        <Card>
          <CardHeader>
            <CardTitle>Bill Summary</CardTitle>
            <CardDescription>
              Order details and payment options
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Order Summary */}
            <div className="space-y-4">
              <h3 className="font-medium">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>$0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-base">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Customer Information</h3>
              <div className="grid gap-2">
                <Label htmlFor="customer-name">Name (Optional)</Label>
                <Input id="customer-name" placeholder="Customer name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer-phone">Phone (Optional)</Label>
                <Input id="customer-phone" placeholder="Phone number" />
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-4">
              <h3 className="font-medium">Payment</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button className="h-20 flex-col" variant="outline">
                  <DollarSign className="h-5 w-5 mb-1" />
                  Cash
                </Button>
                <Button className="h-20 flex-col" variant="outline">
                  <CreditCard className="h-5 w-5 mb-1" />
                  Card
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="flex items-center">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button className="flex items-center">
                <ReceiptText className="mr-2 h-4 w-4" />
                Checkout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Billing;
