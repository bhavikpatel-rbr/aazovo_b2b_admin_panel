
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ListingCard } from "@/components/listings/ListingCard";
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
import { Filter, Plus, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sample demands
const DEMANDS = [
  {
    id: 1,
    title: "Cotton Fabric, 10,000 yards",
    company: "Fashion Apparel Inc.",
    country: "United States",
    category: "Textiles",
    quantity: "10,000 yards",
    date: "Apr 18, 2023",
    status: "pending",
  },
  {
    id: 2,
    title: "Organic Cocoa Beans",
    company: "Sweet Treats LLC",
    country: "Switzerland",
    category: "Food & Beverage",
    quantity: "5 tons",
    date: "Apr 15, 2023",
    status: "completed",
  },
  {
    id: 3,
    title: "Industrial Machinery Parts",
    company: "Global Manufacturing Co.",
    country: "Germany",
    category: "Machinery",
    quantity: "1,000 units",
    date: "Apr 14, 2023",
    status: "approved",
  },
  {
    id: 4,
    title: "Stainless Steel Sheets, Grade 304",
    company: "MetalWorks Industries",
    country: "United States",
    category: "Metals",
    quantity: "20 tons",
    date: "Apr 13, 2023",
    status: "approved",
  },
  {
    id: 5,
    title: "Automotive Spare Parts",
    company: "Auto Solutions Ltd.",
    country: "Japan",
    category: "Automotive",
    quantity: "Various",
    date: "Apr 10, 2023",
    status: "rejected",
  },
  {
    id: 6,
    title: "Natural Rubber",
    company: "Tire Manufacturing Inc.",
    country: "Malaysia",
    category: "Raw Materials",
    quantity: "50 tons",
    date: "Apr 9, 2023",
    status: "approved",
  },
];

type StatusFilterType = "all" | "pending" | "approved" | "rejected" | "completed";

const Demands = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");

  const filteredDemands = DEMANDS.filter((demand) => {
    const matchesSearch = 
      demand.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demand.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demand.country.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || demand.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || demand.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories for filter dropdown
  const categories = [...new Set(DEMANDS.map(demand => demand.category))];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Product Demands"
        description="Browse and manage demands posted by buyers."
      >
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          Add Demand
        </Button>
      </PageHeader>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search demands..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilterType)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className={`${categoryFilter === "all" ? "bg-muted" : ""}`}
                  onClick={() => setCategoryFilter("all")}
                >
                  All Categories
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    className={`${categoryFilter === category ? "bg-muted" : ""}`}
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDemands.map((demand) => (
              <ListingCard
                key={demand.id}
                type="demand"
                title={demand.title}
                company={demand.company}
                country={demand.country}
                category={demand.category}
                quantity={demand.quantity}
                date={demand.date}
                status={demand.status as any}
              />
            ))}
          </div>
          
          {filteredDemands.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No demands found matching your criteria.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="list">
          <div className="rounded-md border">
            <div className="grid grid-cols-6 items-center border-b px-4 py-3 font-medium">
              <div className="col-span-2">Title/Company</div>
              <div>Category</div>
              <div>Country</div>
              <div>Status</div>
              <div className="text-center">Actions</div>
            </div>
            {filteredDemands.map((demand) => (
              <div
                key={demand.id}
                className="grid grid-cols-6 items-center px-4 py-3 border-b last:border-0"
              >
                <div className="col-span-2">
                  <div className="font-medium">{demand.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {demand.company}
                  </div>
                </div>
                <div>{demand.category}</div>
                <div>{demand.country}</div>
                <div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      demand.status === "approved"
                        ? "bg-green-500/10 text-green-500"
                        : demand.status === "rejected"
                        ? "bg-red-500/10 text-red-500"
                        : demand.status === "completed"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {demand.status.charAt(0).toUpperCase() + demand.status.slice(1)}
                  </span>
                </div>
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => console.log("View demand", demand.id)}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredDemands.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No demands found matching your criteria.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Demands;
