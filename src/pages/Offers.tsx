
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

// Sample offers
const OFFERS = [
  {
    id: 1,
    title: "Solar Panels, 5kW, Grade A",
    company: "GreenTech Solutions",
    country: "Germany",
    category: "Energy",
    quantity: "200 units",
    date: "Apr 17, 2023",
    status: "approved",
  },
  {
    id: 2,
    title: "Organic Cotton Fabric",
    company: "Sustainable Textiles Co.",
    country: "India",
    category: "Textiles",
    quantity: "5,000 yards",
    date: "Apr 16, 2023",
    status: "pending",
  },
  {
    id: 3,
    title: "Coffee Beans, Arabica Premium",
    company: "Mountain Coffee Exports",
    country: "Colombia",
    category: "Food & Beverage",
    quantity: "2 tons",
    date: "Apr 15, 2023",
    status: "approved",
  },
  {
    id: 4,
    title: "Lithium Batteries, 18650",
    company: "PowerCell Manufacturing",
    country: "South Korea",
    category: "Electronics",
    quantity: "10,000 units",
    date: "Apr 14, 2023",
    status: "rejected",
  },
  {
    id: 5,
    title: "Olive Oil, Extra Virgin",
    company: "Mediterranean Exports",
    country: "Spain",
    category: "Food & Beverage",
    quantity: "5,000 liters",
    date: "Apr 13, 2023",
    status: "completed",
  },
  {
    id: 6,
    title: "Microchips, 7nm Process",
    company: "Advanced Semiconductor",
    country: "Taiwan",
    category: "Electronics",
    quantity: "50,000 units",
    date: "Apr 12, 2023",
    status: "approved",
  },
];

type StatusFilterType = "all" | "pending" | "approved" | "rejected" | "completed";

const Offers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");

  const filteredOffers = OFFERS.filter((offer) => {
    const matchesSearch = 
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.country.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || offer.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || offer.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories for filter dropdown
  const categories = [...new Set(OFFERS.map(offer => offer.category))];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Product Offers"
        description="Browse and manage offers posted by suppliers."
      >
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          Add Offer
        </Button>
      </PageHeader>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search offers..."
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
            {filteredOffers.map((offer) => (
              <ListingCard
                key={offer.id}
                type="offer"
                title={offer.title}
                company={offer.company}
                country={offer.country}
                category={offer.category}
                quantity={offer.quantity}
                date={offer.date}
                status={offer.status as any}
              />
            ))}
          </div>
          
          {filteredOffers.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No offers found matching your criteria.</p>
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
            {filteredOffers.map((offer) => (
              <div
                key={offer.id}
                className="grid grid-cols-6 items-center px-4 py-3 border-b last:border-0"
              >
                <div className="col-span-2">
                  <div className="font-medium">{offer.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {offer.company}
                  </div>
                </div>
                <div>{offer.category}</div>
                <div>{offer.country}</div>
                <div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      offer.status === "approved"
                        ? "bg-green-500/10 text-green-500"
                        : offer.status === "rejected"
                        ? "bg-red-500/10 text-red-500"
                        : offer.status === "completed"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                  </span>
                </div>
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => console.log("View offer", offer.id)}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredOffers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No offers found matching your criteria.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Offers;
