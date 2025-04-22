
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ListingCard } from "@/components/listings/ListingCard";
import { UserCard, UserType } from "@/components/users/UserCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building, Package, Bell, UserCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome to your Trade Nexus admin dashboard."
      />
      
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Buyers"
          value="2,834"
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
        />
        <DashboardCard
          title="Total Suppliers"
          value="1,429"
          icon={<Building className="h-5 w-5" />}
          trend={{ value: 8, isPositive: true }}
        />
        <DashboardCard
          title="Active Offers"
          value="482"
          icon={<Package className="h-5 w-5" />}
          trend={{ value: 3, isPositive: false }}
        />
        <DashboardCard
          title="Active Demands"
          value="268"
          icon={<Bell className="h-5 w-5" />}
          trend={{ value: 17, isPositive: true }}
        />
      </div>
      
      <Separator className="my-6" />
      
      {/* Verification Queue */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Verification Queue</h2>
        <Tabs defaultValue="kyc" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="kyc">KYC Verification</TabsTrigger>
            <TabsTrigger value="company">Company Verification</TabsTrigger>
          </TabsList>
          <TabsContent value="kyc" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <UserCard 
                name="John Smith"
                email="john.smith@example.com"
                type="buyer"
                location="United States"
                verified={false}
              />
              <UserCard 
                name="Maria Rodriguez"
                email="maria@supplier.co"
                type="supplier"
                location="Spain"
                verified={false}
              />
              <UserCard 
                name="Ahmed Hassan"
                email="ahmed@tradeco.com"
                type="buyer"
                location="UAE"
                verified={false}
              />
            </div>
          </TabsContent>
          <TabsContent value="company" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <UserCard 
                name="Global Supply Co."
                email="admin@globalsupply.com"
                type="company"
                location="Germany"
                verified={false}
              />
              <UserCard 
                name="Eastern Imports Ltd."
                email="contact@easternimports.com"
                type="company"
                location="Taiwan"
                verified={false}
              />
              <UserCard 
                name="PetroChem Industries"
                email="info@petrochem.com"
                type="company"
                location="Saudi Arabia"
                verified={false}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Separator className="my-6" />
      
      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Listings</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ListingCard
            type="demand"
            title="Cotton Fabric, 10,000 yards"
            company="Fashion Apparel Inc."
            country="United States"
            category="Textiles"
            quantity="10,000 yards"
            date="Apr 18, 2023"
            status="pending"
          />
          <ListingCard
            type="offer"
            title="Solar Panels, 5kW, Grade A"
            company="GreenTech Solutions"
            country="Germany"
            category="Energy"
            quantity="200 units"
            date="Apr 17, 2023"
            status="approved"
          />
          <ListingCard
            type="demand"
            title="Organic Cocoa Beans"
            company="Sweet Treats LLC"
            country="Switzerland"
            category="Food & Beverage"
            quantity="5 tons"
            date="Apr 15, 2023"
            status="completed"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
