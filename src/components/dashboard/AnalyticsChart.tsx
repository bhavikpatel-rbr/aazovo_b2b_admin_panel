
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Sample data
const chartData = [
  { name: "Jan", buyers: 65, suppliers: 45, partners: 32 },
  { name: "Feb", buyers: 78, suppliers: 52, partners: 38 },
  { name: "Mar", buyers: 96, suppliers: 63, partners: 42 },
  { name: "Apr", buyers: 105, suppliers: 70, partners: 50 },
  { name: "May", buyers: 122, suppliers: 85, partners: 58 },
  { name: "Jun", buyers: 148, suppliers: 103, partners: 72 },
];

interface AnalyticsChartProps {
  className?: string;
  title?: string;
}

export function AnalyticsChart({ className, title = "User Growth" }: AnalyticsChartProps) {
  return (
    <Card className={cn("animate-fade-in", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                fontSize={12} 
                tickLine={false}
                axisLine={{ stroke: "#64748B", opacity: 0.3 }}
              />
              <YAxis 
                fontSize={12} 
                tickLine={false} 
                axisLine={{ stroke: "#64748B", opacity: 0.3 }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgba(15, 23, 42, 0.8)", 
                  border: "none", 
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px"
                }} 
              />
              <Bar dataKey="buyers" fill="#3A7AF5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="suppliers" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="partners" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
