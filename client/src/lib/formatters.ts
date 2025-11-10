export function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const truncated = numbers.substring(0, 10);
  
  // Format with dashes
  if (truncated.length <= 3) {
    return truncated;
  } else if (truncated.length <= 6) {
    return `${truncated.slice(0, 3)}-${truncated.slice(3)}`;
  } else {
    return `${truncated.slice(0, 3)}-${truncated.slice(3, 6)}-${truncated.slice(6)}`;
  }
}

export function formatMoney(value: string): string {
  // Remove all non-numeric and non-decimal characters
  let numbers = value.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const parts = numbers.split('.');
  if (parts.length > 2) {
    numbers = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit decimal places to 2
  if (parts.length === 2) {
    numbers = parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  return numbers;
}

export function displayMoney(value: string | number): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '$0.00';
  return `$${numValue.toFixed(2)}`;
}

export function parsePhoneNumber(formatted: string): string {
  // Remove dashes for storage
  return formatted.replace(/-/g, '');
}

export function parseMoney(formatted: string): string {
  // Remove $ for storage
  return formatted.replace(/\$/g, '');
}
