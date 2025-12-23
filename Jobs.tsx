// CRITICAL FIX FOR Jobs.tsx
// Replace lines 144-151 with this:

const jobsWithCustomerNames = jobs.map(job => {
  const customer = customers.find(c => c.id === job.customerId);
  const ageDays = Math.ceil((Date.now() - new Date(job.receivedDate).getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    ...job,
    customerName: customer?.name || "Unknown Customer",
    customerDeleted: job.customerId === null,
    ageDays, // ADD THIS!
  };
});

// Without ageDays in the job object, the color functions can't work!
