
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export type UserType = "buyer" | "supplier" | "partner" | "company";

interface UserCardProps {
  name: string;
  email: string;
  type: UserType;
  location: string;
  verified: boolean;
  image?: string;
  className?: string;
  onView?: () => void;
}

export function UserCard({
  name,
  email,
  type,
  location,
  verified,
  image,
  className,
  onView,
}: UserCardProps) {
  const typeColors = {
    buyer: "bg-blue-500",
    supplier: "bg-green-500",
    partner: "bg-amber-500",
    company: "bg-purple-500",
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className={cn("overflow-hidden animate-fade-in", className)}>
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 border border-border">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center">
              <h3 className="font-medium leading-none mr-2">{name}</h3>
              {verified && (
                <Badge variant="outline" className="ml-1 text-xs bg-green-500/10 text-green-500 border-green-500/20">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{email}</p>
            <div className="flex space-x-2 pt-1">
              <Badge
                variant="secondary"
                className={cn("text-[10px]", typeColors[type])}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {location}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="text-xs text-muted-foreground mt-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-medium text-foreground">
                {verified ? "Verified" : "Pending"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Last Login:</span>
              <span className="font-medium text-foreground">5 days ago</span>
            </div>
            <div className="flex justify-between">
              <span>Joined:</span>
              <span className="font-medium text-foreground">Feb 2023</span>
            </div>
            <div className="flex justify-between">
              <span>Region:</span>
              <span className="font-medium text-foreground">{location}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t p-3 bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs gap-1"
          onClick={onView}
        >
          <Eye className="h-3.5 w-3.5" />
          View Profile
        </Button>
      </CardFooter>
    </Card>
  );
}
