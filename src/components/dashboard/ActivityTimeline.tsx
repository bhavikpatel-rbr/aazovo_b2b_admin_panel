
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Clock, FileText, UserCheck, X } from "lucide-react";

// Sample data
const activities = [
  {
    id: 1,
    type: "verification",
    status: "approved",
    user: "Sarah Johnson",
    time: "10:30 AM",
    date: "Today",
  },
  {
    id: 2,
    type: "listing",
    status: "created",
    user: "Ahmed Hassan",
    time: "9:15 AM",
    date: "Today",
  },
  {
    id: 3,
    type: "verification",
    status: "rejected",
    user: "Zhang Wei",
    time: "3:45 PM",
    date: "Yesterday",
  },
  {
    id: 4,
    type: "listing",
    status: "modified",
    user: "Carlos Mendez",
    time: "1:20 PM",
    date: "Yesterday",
  },
  {
    id: 5,
    type: "verification",
    status: "pending",
    user: "Maria Rodriguez",
    time: "10:00 AM",
    date: "Yesterday",
  },
];

interface ActivityTimelineProps {
  className?: string;
}

export function ActivityTimeline({ className }: ActivityTimelineProps) {
  const getIcon = (type: string, status: string) => {
    if (type === "verification") {
      if (status === "approved") return <Check className="h-4 w-4 text-green-500" />;
      if (status === "rejected") return <X className="h-4 w-4 text-red-500" />;
      return <UserCheck className="h-4 w-4 text-amber-500" />;
    }
    
    if (type === "listing") {
      return <FileText className="h-4 w-4 text-primary" />;
    }
    
    return <Clock className="h-4 w-4 text-gray-500" />;
  };
  
  const getStatusText = (type: string, status: string) => {
    if (type === "verification") {
      if (status === "approved") return "approved verification for";
      if (status === "rejected") return "rejected verification for";
      return "is reviewing verification for";
    }
    
    if (type === "listing") {
      if (status === "created") return "created a new listing";
      if (status === "modified") return "modified a listing";
      return "reviewed a listing";
    }
    
    return status;
  };

  return (
    <Card className={cn("h-full animate-fade-in", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center mt-0.5">
                {getIcon(activity.type, activity.status)}
              </div>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>{" "}
                  <span className="text-muted-foreground">
                    {getStatusText(activity.type, activity.status)}
                  </span>
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>{activity.date}</span>
                  <span className="mx-1">•</span>
                  <span>{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
