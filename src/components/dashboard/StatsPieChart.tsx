
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

// Sample data
const data = [
  { name: "Verified", value: 65, color: "#3A7AF5" },
  { name: "Pending", value: 35, color: "#F59E0B" },
];

interface StatsPieChartProps {
  className?: string;
  title?: string;
  data?: Array<{ name: string; value: number; color: string }>;
}

export function StatsPieChart({ 
  className, 
  title = "Verification Status", 
  data: customData = data 
}: StatsPieChartProps) {
  return (
    <Card className={cn("h-full animate-fade-in", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={customData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {customData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ 
                  backgroundColor: "rgba(15, 23, 42, 0.8)", 
                  border: "none", 
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px"
                }}
                formatter={(value: number) => [`${value}%`, 'Percentage']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
