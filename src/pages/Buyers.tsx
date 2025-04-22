
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
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { BuyerForm, BuyerData } from "@/components/buyers/BuyerForm";
import { DeleteBuyerDialog } from "@/components/buyers/DeleteBuyerDialog";
import { toast } from "sonner";

// Sample buyer data
const INITIAL_BUYERS = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@example.com",
    location: "United States",
    verified: true,
  },
  {
    id: 2,
    name: "Zhang Wei",
    email: "zhang.wei@chinabuyer.com",
    location: "China",
    verified: true,
  },
  {
    id: 3,
    name: "Maria Rodriguez",
    email: "maria@textilebuyer.co",
    location: "Spain",
    verified: true,
  },
  {
    id: 4,
    name: "Raj Patel",
    email: "raj@indiatrading.com",
    location: "India",
    verified: false,
  },
  {
    id: 5,
    name: "Ahmed Hassan",
    email: "ahmed@tradeco.com",
    location: "UAE",
    verified: true,
  },
  {
    id: 6,
    name: "Sarah Johnson",
    email: "sarah@fashionimports.com",
    location: "UK",
    verified: false,
  },
  {
    id: 7,
    name: "Yuki Tanaka",
    email: "yuki@japanbuyer.co.jp",
    location: "Japan",
    verified: true,
  },
  {
    id: 8,
    name: "Carlos Mendez",
    email: "carlos@latinimports.com",
    location: "Brazil",
    verified: true,
  },
  {
    id: 9,
    name: "Olga Petrov",
    email: "olga@russiatrader.ru",
    location: "Russia",
    verified: false,
  },
];

const Buyers = () => {
  const [buyers, setBuyers] = useState(INITIAL_BUYERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<BuyerData | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState<BuyerData | null>(null);

  const filteredBuyers = buyers.filter((buyer) => {
    const matchesSearch = 
      buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyer.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === "verified") return matchesSearch && buyer.verified;
    if (filter === "unverified") return matchesSearch && !buyer.verified;
    
    return matchesSearch;
  });

  const handleAddBuyer = (data: BuyerData) => {
    const newBuyer = {
      ...data,
      id: Math.max(0, ...buyers.map(b => b.id || 0)) + 1
    };
    
    setBuyers(prev => [...prev, newBuyer]);
    toast.success("Buyer added successfully");
  };

  const handleEditBuyer = (data: BuyerData) => {
    setBuyers(prev => 
      prev.map(buyer => 
        buyer.id === data.id ? { ...data } : buyer
      )
    );
    setEditingBuyer(undefined);
    toast.success("Buyer updated successfully");
  };

  const handleDeleteBuyer = () => {
    if (!buyerToDelete) return;
    
    setBuyers(prev => prev.filter(buyer => buyer.id !== buyerToDelete.id));
    setBuyerToDelete(null);
    toast.success("Buyer deleted successfully");
  };

  const openEditForm = (buyer: BuyerData) => {
    setEditingBuyer(buyer);
    setFormOpen(true);
  };

  const openDeleteDialog = (buyer: BuyerData) => {
    setBuyerToDelete(buyer);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Buyers"
        description="Manage buyer accounts and verification status."
      >
        <Button className="gap-1" onClick={() => {
          setEditingBuyer(undefined);
          setFormOpen(true);
        }}>
          <Plus className="h-4 w-4" />
          Add Buyer
        </Button>
      </PageHeader>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search buyers..."
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
            <SelectItem value="all">All Buyers</SelectItem>
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
            {filteredBuyers.map((buyer) => (
              <UserCard
                key={buyer.id}
                name={buyer.name}
                email={buyer.email}
                type="buyer"
                location={buyer.location}
                verified={buyer.verified}
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditForm(buyer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(buyer)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                }
              />
            ))}
          </div>
          
          {filteredBuyers.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">No buyers found matching your criteria.</p>
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
            {filteredBuyers.map((buyer) => (
              <div
                key={buyer.id}
                className="grid grid-cols-5 items-center px-4 py-3 border-b last:border-0"
              >
                <div className="col-span-2">
                  <div className="font-medium text-sm">{buyer.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {buyer.email}
                  </div>
                </div>
                <div className="text-center text-sm">{buyer.location}</div>
                <div className="text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      buyer.verified
                        ? "bg-green-500/10 text-green-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {buyer.verified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="flex justify-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(buyer)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(buyer)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredBuyers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No buyers found matching your criteria.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Buyer Form */}
      <BuyerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={editingBuyer ? handleEditBuyer : handleAddBuyer}
        initialData={editingBuyer}
        title={editingBuyer ? "Edit Buyer" : "Add New Buyer"}
      />

      {/* Delete Confirmation Dialog */}
      {buyerToDelete && (
        <DeleteBuyerDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteBuyer}
          buyerName={buyerToDelete.name}
        />
      )}
    </div>
  );
};

export default Buyers;
