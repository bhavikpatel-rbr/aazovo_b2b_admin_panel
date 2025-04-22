
import { ReactNode } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  type: "offer" | "demand";
  title: string;
  company: string;
  country: string;
  category: string;
  quantity: string;
  date: string;
  status: "pending" | "approved" | "rejected" | "completed";
  image?: string;
  children?: ReactNode;
  className?: string;
}

export function ListingCard({
  type,
  title,
  company,
  country,
  category,
  quantity,
  date,
  status,
  image,
  children,
  className,
}: ListingCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="p-0">
        <div className="relative h-40 w-full bg-muted">
          {image ? (
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-muted">
              <span className="text-xl font-semibold text-primary-foreground/70">
                {title}
              </span>
            </div>
          )}
          <Badge
            className={cn(
              "absolute top-2 right-2",
              type === "offer" ? "bg-primary" : "bg-accent"
            )}
          >
            {type === "offer" ? "Offer" : "Demand"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold line-clamp-1">{title}</h3>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Company:</span>
            <span className="font-medium text-foreground">{company}</span>
          </div>
          <div className="flex justify-between">
            <span>Country:</span>
            <span className="font-medium text-foreground">{country}</span>
          </div>
          <div className="flex justify-between">
            <span>Category:</span>
            <span className="font-medium text-foreground">{category}</span>
          </div>
          <div className="flex justify-between">
            <span>Quantity:</span>
            <span className="font-medium text-foreground">{quantity}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span className="font-medium text-foreground">{date}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t p-4 bg-muted/30">
        <Badge
          variant={
            status === "approved"
              ? "default"
              : status === "rejected"
              ? "destructive"
              : status === "completed"
              ? "outline"
              : "secondary"
          }
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
        {children}
      </CardFooter>
    </Card>
  );
}
