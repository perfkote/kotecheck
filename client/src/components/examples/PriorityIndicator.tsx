import { PriorityIndicator } from '../PriorityIndicator';

export default function PriorityIndicatorExample() {
  return (
    <div className="p-8 bg-background flex flex-col gap-4">
      <PriorityIndicator priority="urgent" />
      <PriorityIndicator priority="high" />
      <PriorityIndicator priority="medium" />
      <PriorityIndicator priority="low" />
    </div>
  );
}
