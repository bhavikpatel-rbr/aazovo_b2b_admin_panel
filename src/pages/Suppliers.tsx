
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserCard } from "@/components/users/UserCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus } from "lucide-react";

// Sample supplier data
const SUPPLIERS = [
  {
    id: 1,
    name: "Textile Experts Ltd.",
    email: "contact@textileexperts.com",
    location: "India",
    verified: true,
  },
  {
    id: 2,
    name: "Beijing Manufacturing Co.",
    email: "info@beijingmanufacturing.cn",
    location: "China",
    verified: true,
  },
  {
    id: 3,
    name: "European Fabrics S.A.",
    email: "sales@europeanfabrics.eu",
    location: "Italy",
    verified: true,
  },
  {
    id: 4,
    name: "Cotton Valley Industries",
    email: "info@cottonvalley.com",
    location: "Egypt",
    verified: false,
  },
  {
    id: 5,
    name: "Tech Components Ltd.",
    email: "support@techcomponents.co.jp",
    location: "Japan",
    verified: true,
  },
  {
    id: 6,
    name: "Green Energy Solutions",
    email: "contact@greenenergy.de",
    location: "Germany",
    verified: false,
  }
];

const Suppliers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredSuppliers = SUPPLIERS.filter((supplier) => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === "verified") return matchesSearch && supplier.verified;
    if (filter === "unverified") return matchesSearch && !supplier.verified;
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Suppliers"
        description="Manage supplier accounts and verification status."
      >
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </PageHeader>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search suppliers..."
            className="pl-8 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px] text-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            <SelectItem value="verified">Verified Only</SelectItem>
            <SelectItem value="unverified">Unverified Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="grid" className="text-xs">Grid View</TabsTrigger>
          <TabsTrigger value="list" className="text-xs">List View</TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSuppliers.map((supplier) => (
              <UserCard
                key={supplier.id}
                name={supplier.name}
                email={supplier.email}
                type="supplier"
                location={supplier.location}
                verified={supplier.verified}
                onView={() => console.log("View supplier", supplier.id)}
              />
            ))}
          </div>
          
          {filteredSuppliers.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">No suppliers found matching your criteria.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="list">
          <div className="rounded-md border">
            <div className="grid grid-cols-5 items-center border-b px-4 py-3 text-xs font-medium">
              <div className="col-span-2">Name/Email</div>
              <div className="text-center">Location</div>
              <div className="text-center">Status</div>
              <div className="text-center">Actions</div>
            </div>
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="grid grid-cols-5 items-center px-4 py-3 border-b last:border-0"
              >
                <div className="col-span-2">
                  <div className="font-medium text-sm">{supplier.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {supplier.email}
                  </div>
                </div>
                <div className="text-center text-sm">{supplier.location}</div>
                <div className="text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      supplier.verified
                        ? "bg-green-500/10 text-green-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {supplier.verified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => console.log("View supplier", supplier.id)}
                    className="text-xs"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredSuppliers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No suppliers found matching your criteria.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Suppliers;
