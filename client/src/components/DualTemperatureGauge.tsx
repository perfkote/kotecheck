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
  
  // Max value is 50 above the highest metric
  const maxJobs = Math.max(ceramicJobs, powderJobs) + 50;

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
  const NEEDLE_COLOR = "hsl(var(--foreground))"; // Black needles

  // Calculate needle rotation (240 degree sweep from 210° to -30°)
  // At 0 jobs: -120° (pointing left), at maxJobs: 120° (pointing right)
  const calculateNeedleRotation = (value: number) => {
    const percentage = value / maxJobs;
    return -120 + (percentage * 240);
  };

  const ceramicRotation = calculateNeedleRotation(ceramicJobs);
  const powderRotation = calculateNeedleRotation(powderJobs);

  // Generate hash marks for the gauge (ticks along the arc)
  const generateHashMarks = () => {
    const marks = [];
    const totalMarks = 12; // 12 hash marks along the 240° sweep
    for (let i = 0; i <= totalMarks; i++) {
      const angle = -120 + (i / totalMarks) * 240; // From -120° to 120°
      marks.push(angle);
    }
    return marks;
  };

  const hashMarks = generateHashMarks();

  // Responsive gauge sizes: mobile (180x180), desktop (220x220)
  const gaugeConfig = {
    mobile: { width: 180, height: 180, innerRadius: 55, outerRadius: 80, cornerRadius: 6, needleLength: 70, hashDistance: 80 },
    desktop: { width: 220, height: 220, innerRadius: 70, outerRadius: 100, cornerRadius: 8, needleLength: 85, hashDistance: 100 },
  };

  const renderGauge = (data: any[], color: string, rotation: number, testId: string, isCeramic: boolean) => (
    <>
      {/* Mobile gauge */}
      <div className="sm:hidden relative">
        <PieChart width={gaugeConfig.mobile.width} height={gaugeConfig.mobile.height}>
          <Pie
            data={data}
            startAngle={210}
            endAngle={-30}
            innerRadius={gaugeConfig.mobile.innerRadius}
            outerRadius={gaugeConfig.mobile.outerRadius}
            stroke="none"
            dataKey="value"
            cornerRadius={gaugeConfig.mobile.cornerRadius}
            isAnimationActive={true}
          >
            {data.map((entry, i) => (
              <Cell
                key={`${testId}-mobile-${i}`}
                fill={i === 0 ? color : MUTED_COLOR}
                opacity={i === 0 ? 1 : 0.3}
              />
            ))}
          </Pie>
        </PieChart>

        {/* Mobile needle */}
        <div
          className="absolute top-1/2 left-1/2 w-1 h-[70px] origin-bottom rounded-full transition-transform duration-1000"
          style={{
            backgroundColor: NEEDLE_COLOR,
            transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
          }}
          data-rotation={rotation}
          data-testid={`${testId}-mobile`}
        />

        {/* Mobile center hub */}
        <div className="absolute top-1/2 left-1/2 w-5 h-5 bg-muted border-2 border-border rounded-full -translate-x-1/2 -translate-y-1/2 shadow-inner" />
      </div>

      {/* Desktop gauge */}
      <div className="hidden sm:block relative">
        <PieChart width={gaugeConfig.desktop.width} height={gaugeConfig.desktop.height}>
          <Pie
            data={data}
            startAngle={210}
            endAngle={-30}
            innerRadius={gaugeConfig.desktop.innerRadius}
            outerRadius={gaugeConfig.desktop.outerRadius}
            stroke="none"
            dataKey="value"
            cornerRadius={gaugeConfig.desktop.cornerRadius}
            isAnimationActive={true}
          >
            {data.map((entry, i) => (
              <Cell
                key={`${testId}-desktop-${i}`}
                fill={i === 0 ? color : MUTED_COLOR}
                opacity={i === 0 ? 1 : 0.3}
              />
            ))}
          </Pie>
        </PieChart>

        {/* Desktop hash marks */}
        {hashMarks.map((angle, idx) => (
          <div
            key={`${testId}-hash-${idx}`}
            className="absolute top-1/2 left-1/2 w-0.5 h-3 origin-bottom"
            style={{
              backgroundColor: NEEDLE_COLOR,
              opacity: 0.3,
              transform: `translate(-50%, -${gaugeConfig.desktop.hashDistance}px) rotate(${angle}deg)`,
            }}
          />
        ))}

        {/* Desktop needle */}
        <div
          className="absolute top-1/2 left-1/2 w-1.5 h-[85px] origin-bottom rounded-full transition-transform duration-1000"
          style={{
            backgroundColor: NEEDLE_COLOR,
            transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
          }}
          data-rotation={rotation}
          data-testid={testId}
        />

        {/* Desktop center hub */}
        <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-muted border-2 border-border rounded-full -translate-x-1/2 -translate-y-1/2 shadow-inner" />
      </div>
    </>
  );

  return (
    <Card className="p-4 sm:p-6 md:p-8">
      <div className="flex gap-6 sm:gap-12 md:gap-16 lg:gap-24 justify-center items-center flex-wrap">
        {/* Ceramic Gauge */}
        <div className="relative flex flex-col items-center" data-testid="gauge-ceramic">
          {renderGauge(ceramicData, CERAMIC_COLOR, ceramicRotation, "needle-ceramic", true)}

          <p className="mt-3 sm:mt-4 font-semibold text-base sm:text-lg uppercase tracking-wide" style={{ color: CERAMIC_COLOR }}>
            Ceramic
          </p>
          <span data-testid="text-ceramic-count">
            <CountUp
              className="text-2xl sm:text-3xl font-bold"
              end={ceramicJobs}
              duration={2}
            />
          </span>
        </div>

        {/* Powder Gauge */}
        <div className="relative flex flex-col items-center" data-testid="gauge-powder">
          {renderGauge(powderData, POWDER_COLOR, powderRotation, "needle-powder", false)}

          <p className="mt-3 sm:mt-4 font-semibold text-base sm:text-lg uppercase tracking-wide" style={{ color: POWDER_COLOR }}>
            Powder
          </p>
          <span data-testid="text-powder-count">
            <CountUp
              className="text-2xl sm:text-3xl font-bold"
              end={powderJobs}
              duration={2}
            />
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground tracking-wider uppercase">
        Shop Output Monitor
      </div>
    </Card>
  );
}
