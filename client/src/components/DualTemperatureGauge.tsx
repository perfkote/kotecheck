import { PieChart, Pie, Cell } from "recharts";
import { Card } from "@/components/ui/card";
import type { Job } from "@shared/schema";

interface DualTemperatureGaugeProps {
  jobs: Job[];
}

export default function DualTemperatureGauge({ jobs }: DualTemperatureGaugeProps) {
  // Count ceramic and powder jobs
  const ceramicJobs = jobs.filter(job => job.coatingType === "ceramic").length;
  const powderJobs = jobs.filter(job => job.coatingType === "powder").length;
  const maxJobs = Math.max(ceramicJobs, powderJobs, 1); // Ensure at least 1 to avoid division by zero

  const ceramicData = [
    { name: "Ceramic", value: ceramicJobs },
    { name: "Remaining", value: maxJobs - ceramicJobs },
  ];
  
  const powderData = [
    { name: "Powder", value: powderJobs },
    { name: "Remaining", value: maxJobs - powderJobs },
  ];

  // Using theme colors - chart-1 (orange) for ceramic, chart-2 (teal/cyan) for powder
  const ceramicColors = ["hsl(var(--chart-1))", "hsl(var(--muted))"];
  const powderColors = ["hsl(var(--chart-2))", "hsl(var(--muted))"];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-medium mb-6 text-center">Ceramic vs Powder Jobs</h2>
      <div className="flex gap-12 justify-center items-center flex-wrap">
        {/* Ceramic Gauge */}
        <div className="text-center" data-testid="gauge-ceramic">
          <PieChart width={200} height={120}>
            <Pie
              data={ceramicData}
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {ceramicData.map((entry, index) => (
                <Cell key={`ceramic-${index}`} fill={ceramicColors[index % ceramicColors.length]} />
              ))}
            </Pie>
          </PieChart>
          <p className="font-semibold mt-2" style={{ color: "hsl(var(--chart-1))" }}>Ceramic Jobs</p>
          <p className="text-3xl font-bold" data-testid="text-ceramic-count">{ceramicJobs}</p>
        </div>

        {/* Powder Gauge */}
        <div className="text-center" data-testid="gauge-powder">
          <PieChart width={200} height={120}>
            <Pie
              data={powderData}
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {powderData.map((entry, index) => (
                <Cell key={`powder-${index}`} fill={powderColors[index % powderColors.length]} />
              ))}
            </Pie>
          </PieChart>
          <p className="font-semibold mt-2" style={{ color: "hsl(var(--chart-2))" }}>Powder Jobs</p>
          <p className="text-3xl font-bold" data-testid="text-powder-count">{powderJobs}</p>
        </div>
      </div>
    </Card>
  );
}
