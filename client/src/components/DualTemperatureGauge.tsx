import { PieChart, Pie, Cell } from "recharts";
import CountUp from "react-countup";
import { Card } from "@/components/ui/card";
import type { Job } from "@shared/schema";

interface DualTemperatureGaugeProps {
  jobs: Job[];
}

export default function DualTemperatureGauge({ jobs }: DualTemperatureGaugeProps) {
  // Count ceramic and powder jobs
  const ceramicJobs = jobs.filter(job => job.coatingType === "ceramic").length;
  const powderJobs = jobs.filter(job => job.coatingType === "powder").length;
  
  // Use 100 or the higher count as max for better gauge scaling
  const maxJobs = Math.max(100, ceramicJobs, powderJobs);

  const createGaugeData = (value: number) => [
    { name: "value", value },
    { name: "rest", value: maxJobs - value },
  ];

  const ceramicData = createGaugeData(ceramicJobs);
  const powderData = createGaugeData(powderJobs);

  // Using theme colors - chart-3 (orange) for ceramic (hot), chart-2 (teal/cyan) for powder (cool)
  const CERAMIC_COLOR = "hsl(var(--chart-3))";
  const POWDER_COLOR = "hsl(var(--chart-2))";
  const MUTED_COLOR = "hsl(var(--muted))";

  // Calculate needle rotation (240 degree sweep from 210° to -30°)
  // At 0 jobs: -120° (pointing left), at maxJobs: 120° (pointing right)
  const calculateNeedleRotation = (value: number) => {
    const percentage = value / maxJobs;
    return -120 + (percentage * 240);
  };

  const ceramicRotation = calculateNeedleRotation(ceramicJobs);
  const powderRotation = calculateNeedleRotation(powderJobs);

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-semibold mb-8 text-center tracking-wide">
        Performance Metrics
      </h2>

      <div className="flex gap-24 justify-center items-center flex-wrap">
        {/* Ceramic Gauge */}
        <div className="relative flex flex-col items-center" data-testid="gauge-ceramic">
          <div className="relative">
            <PieChart width={220} height={220}>
              <Pie
                data={ceramicData}
                startAngle={210}
                endAngle={-30}
                innerRadius={70}
                outerRadius={100}
                stroke="none"
                dataKey="value"
                cornerRadius={8}
                isAnimationActive={true}
              >
                {ceramicData.map((entry, i) => (
                  <Cell
                    key={`ceramic-${i}`}
                    fill={i === 0 ? CERAMIC_COLOR : MUTED_COLOR}
                    opacity={i === 0 ? 1 : 0.3}
                  />
                ))}
              </Pie>
            </PieChart>

            {/* Needle overlay */}
            <div
              className="absolute top-1/2 left-1/2 w-1.5 h-[85px] origin-bottom rounded-full transition-transform duration-1000"
              style={{
                backgroundColor: CERAMIC_COLOR,
                transform: `translate(-50%, -100%) rotate(${ceramicRotation}deg)`,
              }}
            />

            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-muted border-2 border-border rounded-full -translate-x-1/2 -translate-y-1/2 shadow-inner" />
          </div>

          <p className="mt-4 font-semibold text-lg uppercase tracking-wide" style={{ color: CERAMIC_COLOR }}>
            Ceramic
          </p>
          <CountUp
            className="text-3xl font-bold"
            end={ceramicJobs}
            duration={2}
            data-testid="text-ceramic-count"
          />
        </div>

        {/* Powder Gauge */}
        <div className="relative flex flex-col items-center" data-testid="gauge-powder">
          <div className="relative">
            <PieChart width={220} height={220}>
              <Pie
                data={powderData}
                startAngle={210}
                endAngle={-30}
                innerRadius={70}
                outerRadius={100}
                stroke="none"
                dataKey="value"
                cornerRadius={8}
                isAnimationActive={true}
              >
                {powderData.map((entry, i) => (
                  <Cell
                    key={`powder-${i}`}
                    fill={i === 0 ? POWDER_COLOR : MUTED_COLOR}
                    opacity={i === 0 ? 1 : 0.3}
                  />
                ))}
              </Pie>
            </PieChart>

            {/* Needle overlay */}
            <div
              className="absolute top-1/2 left-1/2 w-1.5 h-[85px] origin-bottom rounded-full transition-transform duration-1000"
              style={{
                backgroundColor: POWDER_COLOR,
                transform: `translate(-50%, -100%) rotate(${powderRotation}deg)`,
              }}
            />

            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-muted border-2 border-border rounded-full -translate-x-1/2 -translate-y-1/2 shadow-inner" />
          </div>

          <p className="mt-4 font-semibold text-lg uppercase tracking-wide" style={{ color: POWDER_COLOR }}>
            Powder
          </p>
          <CountUp
            className="text-3xl font-bold"
            end={powderJobs}
            duration={2}
            data-testid="text-powder-count"
          />
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground tracking-wider uppercase">
        Shop Output Monitor
      </div>
    </Card>
  );
}
