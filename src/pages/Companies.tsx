
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

// Sample company data
const COMPANIES = [
  {
    id: 1,
    name: "Global Trade Solutions",
    email: "info@globaltrade.com",
    location: "United States",
    verified: true,
  },
  {
    id: 2,
    name: "Eastern Imports Ltd.",
    email: "contact@easternimports.com",
    location: "Taiwan",
    verified: true,
  },
  {
    id: 3,
    name: "European Distribution Group",
    email: "info@eurodistribution.eu",
    location: "Germany",
    verified: false,
  },
  {
    id: 4,
    name: "Pacific Rim Holdings",
    email: "admin@pacificrim.co",
    location: "Singapore",
    verified: true,
  },
  {
    id: 5,
    name: "PetroChem Industries",
    email: "info@petrochem.com",
    location: "Saudi Arabia",
    verified: false,
  },
  {
    id: 6,
    name: "North American Trade Co.",
    email: "contact@natradeco.com",
    location: "Canada",
    verified: true,
  }
];

const Companies = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredCompanies = COMPANIES.filter((company) => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === "verified") return matchesSearch && company.verified;
    if (filter === "unverified") return matchesSearch && !company.verified;
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Companies"
        description="Manage company accounts and verification status."
      >
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </PageHeader>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search companies..."
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
            <SelectItem value="all">All Companies</SelectItem>
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
            {filteredCompanies.map((company) => (
              <UserCard
                key={company.id}
                name={company.name}
                email={company.email}
                type="company"
                location={company.location}
                verified={company.verified}
                onView={() => console.log("View company", company.id)}
              />
            ))}
          </div>
          
          {filteredCompanies.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">No companies found matching your criteria.</p>
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
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="grid grid-cols-5 items-center px-4 py-3 border-b last:border-0"
              >
                <div className="col-span-2">
                  <div className="font-medium text-sm">{company.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {company.email}
                  </div>
                </div>
                <div className="text-center text-sm">{company.location}</div>
                <div className="text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      company.verified
                        ? "bg-green-500/10 text-green-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {company.verified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => console.log("View company", company.id)}
                    className="text-xs"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredCompanies.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No companies found matching your criteria.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Companies;
