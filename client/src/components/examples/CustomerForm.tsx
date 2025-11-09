import { CustomerForm } from '../CustomerForm';

export default function CustomerFormExample() {
  return (
    <div className="p-8 bg-background max-w-2xl">
      <CustomerForm
        onSubmit={(data) => console.log('Customer submitted:', data)}
        onCancel={() => console.log('Cancelled')}
      />
    </div>
  );
}
