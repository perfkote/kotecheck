import { StatsCard } from '../StatsCard';
import { Users } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="p-8 bg-background">
      <StatsCard 
        title="Total Customers" 
        value={42} 
        icon={Users}
        trend="+12% from last month"
      />
    </div>
  );
}
