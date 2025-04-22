
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

export interface BuyerData {
  id?: number;
  name: string;
  email: string;
  location: string;
  verified: boolean;
}

interface BuyerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BuyerData) => void;
  initialData?: BuyerData;
  title?: string;
}

export function BuyerForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  initialData, 
  title = "Add New Buyer" 
}: BuyerFormProps) {
  const [formData, setFormData] = useState<BuyerData>(
    initialData || {
      name: "",
      email: "",
      location: "",
      verified: false,
    }
  );

  const handleChange = (field: keyof BuyerData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.name || !formData.email || !formData.location) {
      toast.error("Please fill all required fields");
      return;
    }

    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter full name"
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="email@example.com"
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Country"
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Verification Status</Label>
            <Select
              value={formData.verified ? "verified" : "unverified"}
              onValueChange={(value) => 
                handleChange("verified", value === "verified")
              }
            >
              <SelectTrigger id="status" className="text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">Save Buyer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
