// CRITICAL FIX FOR Dashboard.tsx
// Replace lines 159-169 with this:

const recentJobs = jobs
  .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime())
  .slice(0, 10)
  .map(job => {
    const customer = customers.find(c => c.id === job.customerId);
    const ageDays = Math.ceil((Date.now() - new Date(job.receivedDate).getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...job,
      customerName: customer?.name || "Unknown Customer",
      customerDeleted: job.customerId === null,
      ageDays, // ADD THIS!
    };
  });

// Without ageDays, the getJobAgeColors function can't access it!
