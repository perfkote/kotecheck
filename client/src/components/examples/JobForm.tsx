import { JobForm } from '../JobForm';

export default function JobFormExample() {
  const mockCustomers = [
    { id: '1', name: 'Acme Corp' },
    { id: '2', name: 'Tech Solutions Inc' },
    { id: '3', name: 'Global Industries' },
  ];

  return (
    <div className="p-8 bg-background max-w-2xl">
      <JobForm
        onSubmit={(data) => console.log('Job submitted:', data)}
        onCancel={() => console.log('Cancelled')}
        customers={mockCustomers}
      />
    </div>
  );
}
