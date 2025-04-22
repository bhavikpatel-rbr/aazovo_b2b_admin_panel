
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

// Sample partner data
const PARTNERS = [
  {
    id: 1,
    name: "Logistics Pro Inc.",
    email: "partner@logisticspro.com",
    location: "United States",
    verified: true,
  },
  {
    id: 2,
    name: "Trade Finance Partners",
    email: "info@tradefinance.co.uk",
    location: "United Kingdom",
    verified: true,
  },
  {
    id: 3,
    name: "Global Certification Agency",
    email: "contact@certifyglobe.com",
    location: "Switzerland",
    verified: true,
  },
  {
    id: 4,
    name: "Shipping Solutions LLC",
    email: "support@shippingsol.com",
    location: "Netherlands",
    verified: false,
  },
  {
    id: 5,
    name: "Insurance Group International",
    email: "partners@insurancegroup.com",
    location: "France",
    verified: true,
  },
  {
    id: 6,
    name: "Export Documentation Services",
    email: "help@exportdocs.com",
    location: "Singapore",
    verified: false,
  }
];

const Partners = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredPartners = PARTNERS.filter((partner) => {
    const matchesSearch = 
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === "verified") return matchesSearch && partner.verified;
    if (filter === "unverified") return matchesSearch && !partner.verified;
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Partners"
        description="Manage partnership accounts and verification status."
      >
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          Add Partner
        </Button>
      </PageHeader>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search partners..."
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
            <SelectItem value="all">All Partners</SelectItem>
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
            {filteredPartners.map((partner) => (
              <UserCard
                key={partner.id}
                name={partner.name}
                email={partner.email}
                type="partner"
                location={partner.location}
                verified={partner.verified}
                onView={() => console.log("View partner", partner.id)}
              />
            ))}
          </div>
          
          {filteredPartners.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">No partners found matching your criteria.</p>
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
            {filteredPartners.map((partner) => (
              <div
                key={partner.id}
                className="grid grid-cols-5 items-center px-4 py-3 border-b last:border-0"
              >
                <div className="col-span-2">
                  <div className="font-medium text-sm">{partner.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {partner.email}
                  </div>
                </div>
                <div className="text-center text-sm">{partner.location}</div>
                <div className="text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      partner.verified
                        ? "bg-green-500/10 text-green-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {partner.verified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => console.log("View partner", partner.id)}
                    className="text-xs"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredPartners.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No partners found matching your criteria.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Partners;
