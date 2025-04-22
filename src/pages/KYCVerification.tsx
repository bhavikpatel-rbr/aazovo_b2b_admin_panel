
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  RefreshCw, 
  Search, 
  XCircle 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Sample KYC data
const KYC_REQUESTS = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@example.com",
    type: "buyer",
    country: "United States",
    status: "pending",
    submittedAt: "2023-04-15T14:30:00Z",
    documents: ["passport.jpg", "address_proof.pdf"],
  },
  {
    id: 2,
    name: "Maria Rodriguez",
    email: "maria@supplier.co",
    type: "supplier",
    country: "Spain",
    status: "pending",
    submittedAt: "2023-04-16T09:15:00Z",
    documents: ["id_card.jpg", "utility_bill.pdf", "business_license.pdf"],
  },
  {
    id: 3,
    name: "Ahmed Hassan",
    email: "ahmed@tradeco.com",
    type: "buyer",
    country: "UAE",
    status: "pending",
    submittedAt: "2023-04-16T11:45:00Z",
    documents: ["passport.jpg", "residence_permit.pdf"],
  },
  {
    id: 4,
    name: "Zhang Wei",
    email: "zhang.wei@chinabuyer.com",
    type: "supplier",
    country: "China",
    status: "approved",
    submittedAt: "2023-04-14T08:30:00Z",
    documents: ["id_card.jpg", "business_license.pdf"],
  },
  {
    id: 5,
    name: "Raj Patel",
    email: "raj@indiatrading.com",
    type: "buyer",
    country: "India",
    status: "rejected",
    submittedAt: "2023-04-13T16:20:00Z",
    documents: ["passport.jpg", "utility_bill.pdf"],
    rejectionReason: "Documents unclear. Please resubmit with higher quality scans.",
  },
];

const KYCVerification = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<number | null>(1);
  
  const filteredRequests = KYC_REQUESTS.filter((request) => {
    return (
      request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.country.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  const pendingRequests = filteredRequests.filter(req => req.status === "pending");
  const approvedRequests = filteredRequests.filter(req => req.status === "approved");
  const rejectedRequests = filteredRequests.filter(req => req.status === "rejected");
  
  const selectedKYC = KYC_REQUESTS.find(req => req.id === selectedRequest);
  
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="KYC Verification"
        description="Review and approve identity verification requests."
      />
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search requests..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> 
                <span>Pending</span>
                <Badge variant="secondary" className="ml-1">
                  {pendingRequests.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> 
                <span>Approved</span>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" /> 
                <span>Rejected</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-4">
              <div className="space-y-2">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((request) => (
                    <KYCRequestCard
                      key={request.id}
                      request={request}
                      isSelected={selectedRequest === request.id}
                      onClick={() => setSelectedRequest(request.id)}
                    />
                  ))
                ) : (
                  <p className="text-center py-4 text-muted-foreground">
                    No pending requests found.
                  </p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="approved" className="mt-4">
              <div className="space-y-2">
                {approvedRequests.length > 0 ? (
                  approvedRequests.map((request) => (
                    <KYCRequestCard
                      key={request.id}
                      request={request}
                      isSelected={selectedRequest === request.id}
                      onClick={() => setSelectedRequest(request.id)}
                    />
                  ))
                ) : (
                  <p className="text-center py-4 text-muted-foreground">
                    No approved requests found.
                  </p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="rejected" className="mt-4">
              <div className="space-y-2">
                {rejectedRequests.length > 0 ? (
                  rejectedRequests.map((request) => (
                    <KYCRequestCard
                      key={request.id}
                      request={request}
                      isSelected={selectedRequest === request.id}
                      onClick={() => setSelectedRequest(request.id)}
                    />
                  ))
                ) : (
                  <p className="text-center py-4 text-muted-foreground">
                    No rejected requests found.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="md:col-span-2">
          {selectedKYC ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedKYC.name}</CardTitle>
                    <CardDescription>{selectedKYC.email}</CardDescription>
                  </div>
                  <Badge
                    className={
                      selectedKYC.status === "approved"
                        ? "bg-green-500"
                        : selectedKYC.status === "rejected"
                        ? "bg-red-500"
                        : "bg-amber-500"
                    }
                  >
                    {selectedKYC.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">User Type</p>
                    <p className="font-medium capitalize">{selectedKYC.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Country</p>
                    <p className="font-medium">{selectedKYC.country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium">
                      {new Date(selectedKYC.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Document Count</p>
                    <p className="font-medium">{selectedKYC.documents.length} files</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Uploaded Documents</h3>
                  <div className="grid gap-2">
                    {selectedKYC.documents.map((doc, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer"
                      >
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="flex-1 text-sm">{doc}</span>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedKYC.status === "rejected" && selectedKYC.rejectionReason && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <h3 className="font-medium text-destructive mb-1">Rejection Reason</h3>
                    <p className="text-sm">{selectedKYC.rejectionReason}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                {selectedKYC.status === "pending" ? (
                  <>
                    <Button variant="outline" className="w-full">Reject</Button>
                    <div className="w-4"></div>
                    <Button className="w-full">Approve</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" disabled={selectedKYC.status !== "rejected"}>
                      Request Resubmission
                    </Button>
                    <div className="w-4"></div>
                    <Button variant="outline" className="w-full flex items-center gap-1">
                      <RefreshCw className="h-4 w-4" />
                      Change Status
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center border rounded-lg p-8">
              <p className="text-muted-foreground">Select a request to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface KYCRequestCardProps {
  request: typeof KYC_REQUESTS[0];
  isSelected: boolean;
  onClick: () => void;
}

const KYCRequestCard = ({ request, isSelected, onClick }: KYCRequestCardProps) => {
  const statusIcon = {
    pending: <Clock className="h-5 w-5 text-amber-500" />,
    approved: <CheckCircle className="h-5 w-5 text-green-500" />,
    rejected: <XCircle className="h-5 w-5 text-red-500" />,
  }[request.status];

  const initials = request.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`p-3 rounded-md cursor-pointer transition-all duration-200 ${
        isSelected ? "bg-primary/10 border-primary/20" : "hover:bg-muted"
      } border`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{request.name}</p>
          <p className="text-xs text-muted-foreground">{request.country}</p>
        </div>
        {statusIcon}
      </div>
    </div>
  );
};

export default KYCVerification;
