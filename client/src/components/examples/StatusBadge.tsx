import { StatusBadge } from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="p-8 bg-background flex gap-4 flex-wrap">
      <StatusBadge status="pending" type="job" />
      <StatusBadge status="in-progress" type="job" />
      <StatusBadge status="completed" type="job" />
      <StatusBadge status="cancelled" type="job" />
      <StatusBadge status="draft" type="estimate" />
      <StatusBadge status="sent" type="estimate" />
      <StatusBadge status="approved" type="estimate" />
    </div>
  );
}
