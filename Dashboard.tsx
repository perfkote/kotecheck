// COMPACT DASHBOARD RECENT JOBS WITH AGE COLORS
// Add this helper function near the top of Dashboard component

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

const getJobAgeDays = (receivedDate: Date) => {
  return Math.ceil((Date.now() - new Date(receivedDate).getTime()) / (1000 * 60 * 60 * 24));
};

// ===== REPLACE MOBILE RECENT JOBS (lines ~302-333) =====
recentJobs.map((job) => {
  const ageDays = getJobAgeDays(job.receivedDate);
  const colors = getJobAgeColors(ageDays);
  
  return (
    <Card 
      key={job.id}
      className={`p-2.5 hover:bg-accent/50 cursor-pointer transition-colors border-l-2 ${colors.bg} ${colors.border}`}
      onClick={() => setViewingJob(job)}
      data-testid={`card-job-mobile-${job.id}`}
    >
      {/* Top row: Customer + Status */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className={`font-semibold text-sm ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
          {job.customerName}
        </h3>
        <StatusBadge status={job.status} type="job" />
      </div>
      
      {/* Bottom row: Price, Age, Date */}
      <div className="flex items-center justify-between gap-2">
        <div className="font-bold text-base">
          ${Number(job.price).toFixed(2)}
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-medium border ${colors.badge}`}>
            {ageDays}d
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(job.receivedDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Card>
  );
})

// ===== REPLACE DESKTOP RECENT JOBS TABLE ROWS (lines ~358-395) =====
// Find the tbody section and replace the tr mapping with:

recentJobs.map((job) => {
  const ageDays = getJobAgeDays(job.receivedDate);
  const colors = getJobAgeColors(ageDays);
  
  return (
    <tr 
      key={job.id}
      className={`hover:bg-accent/50 cursor-pointer transition-colors border-l-2 ${colors.bg} ${colors.border}`}
      onClick={() => setViewingJob(job)}
      data-testid={`row-job-${job.id}`}
    >
      <td className="px-4 py-2.5">
        <div className={`font-semibold text-sm ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
          {job.customerName}
        </div>
        <div className="text-xs text-muted-foreground">
          {job.phoneNumber}
        </div>
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge status={job.status} type="job" />
      </td>
      <td className="px-4 py-2.5">
        <Badge variant="outline" className="capitalize text-xs">
          {job.coatingType}
        </Badge>
      </td>
      <td className="px-4 py-2.5 text-sm">
        {new Date(job.receivedDate).toLocaleDateString()}
      </td>
      <td className="px-4 py-2.5">
        <Badge variant="outline" className={`text-xs px-2 py-0.5 font-medium border ${colors.badge}`}>
          {ageDays}d
        </Badge>
      </td>
      <td className="px-4 py-2.5 text-right font-bold">
        ${Number(job.price).toFixed(2)}
      </td>
    </tr>
  );
})
