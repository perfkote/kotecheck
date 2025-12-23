// COMPLETE COMPACT JOB CARDS FOR JOBS.TSX
// Replace BOTH mobile (line ~230-267) AND desktop (line ~280-327) sections

// Helper function - add this near the top of the component (after state declarations)
const getJobAgeColors = (ageDays: number) => {
  if (ageDays <= 3) return {
    bg: 'bg-green-500/5',
    border: 'border-l-green-500/30',
    badge: 'bg-green-500/15 text-green-800 border-green-500/30'
  };
  if (ageDays <= 7) return {
    bg: 'bg-yellow-500/5',
    border: 'border-l-yellow-500/30',
    badge: 'bg-yellow-500/15 text-yellow-800 border-yellow-500/30'
  };
  if (ageDays <= 14) return {
    bg: 'bg-orange-500/5',
    border: 'border-l-orange-500/30',
    badge: 'bg-orange-500/15 text-orange-800 border-orange-500/30'
  };
  return {
    bg: 'bg-red-500/5',
    border: 'border-l-red-500/30',
    badge: 'bg-red-500/15 text-red-800 border-red-500/30'
  };
};

// ===== MOBILE VERSION (replace lines ~230-267) =====
<div className="border rounded-lg overflow-hidden divide-y">
  {filteredJobs.map((job) => {
    const colors = getJobAgeColors(job.ageDays);
    
    return (
      <div
        key={job.id}
        className={`p-2.5 hover:bg-accent/50 cursor-pointer transition-colors border-l-2 ${colors.bg} ${colors.border}`}
        data-testid={`list-job-${job.id}`}
        onClick={() => setEditingJob(job)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setEditingJob(job);
          }
        }}
      >
        {/* Top row: Customer name + Price */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className={`font-semibold text-sm ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
            {job.customerName}
          </div>
          <div className="font-bold text-base flex-shrink-0">
            ${Number(job.price).toFixed(2)}
          </div>
        </div>
        
        {/* Bottom row: Items + Status + Age */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground truncate flex-1">
            {job.items || 'No description'}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusBadge status={job.status} type="job" />
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-medium border ${colors.badge}`}>
              {job.ageDays}d
            </Badge>
          </div>
        </div>
      </div>
    );
  })}
</div>

// ===== DESKTOP VERSION (replace lines ~280-327) =====
<div className="divide-y">
  {filteredJobs.map((job) => {
    const colors = getJobAgeColors(job.ageDays);
    
    return (
      <div
        key={job.id}
        className={`p-2.5 hover:bg-accent/50 cursor-pointer transition-colors border-l-2 ${colors.bg} ${colors.border}`}
        data-testid={`row-job-${job.id}`}
        onClick={() => setEditingJob(job)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setEditingJob(job);
          }
        }}
      >
        <div className="flex items-center gap-4">
          {/* Customer + Items */}
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-sm mb-0.5 ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
              {job.customerName}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {job.items || 'No description'}
            </div>
          </div>
          
          {/* Phone */}
          <div className="text-xs text-muted-foreground flex-shrink-0 hidden lg:block">
            {job.phoneNumber}
          </div>
          
          {/* Status + Age */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={job.status} type="job" />
            <Badge variant="outline" className={`text-xs px-2 py-0.5 font-medium border ${colors.badge}`}>
              {job.ageDays}d
            </Badge>
          </div>
          
          {/* Price */}
          <div className="font-bold text-base flex-shrink-0">
            ${Number(job.price).toFixed(2)}
          </div>
        </div>
      </div>
    );
  })}
</div>
