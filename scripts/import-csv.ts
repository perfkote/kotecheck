import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { db } from '../server/db';
import { customers, jobs } from '../shared/schema';
import { eq } from 'drizzle-orm';

interface CSVRecord {
  Customer: string;
  'Coating Type': string;
  Contact: string;
  Items: string;
  Price: string;
  Received: string;
  Status: string;
}

// Mapping CSV coating types to our schema
function mapCoatingType(csvType: string): 'powder' | 'ceramic' | 'both' {
  const type = csvType.toUpperCase().trim();
  
  // If contains multiple types, return 'both'
  if (type.includes(',')) {
    return 'both';
  }
  
  // Map various ceramic types
  if (type.includes('CERAMIC') || type.includes('MCX') || type.includes('BHK') || 
      type.includes('TXBK') || type.includes('MCSL') || type.includes('POLISH') ||
      type.includes('CHROME')) {
    return 'ceramic';
  }
  
  // Map powder coating
  if (type.includes('POWDER') || type.includes('SANDBLAST')) {
    return 'powder';
  }
  
  // Default to ceramic for coating jobs
  return 'ceramic';
}

// Mapping CSV status to our schema
function mapStatus(csvStatus: string): 'pending' | 'in-progress' | 'completed' | 'cancelled' {
  const status = csvStatus.toLowerCase().trim();
  
  if (status === 'paid' || status === 'coated') {
    return 'completed';
  }
  
  if (status === 'ready for pickup') {
    return 'completed';
  }
  
  if (status === 'received' || status === 'prepped' || status === 'material ordered/job on hold') {
    return 'in-progress';
  }
  
  if (status === 'canceled' || status === 'cancelled') {
    return 'cancelled';
  }
  
  return 'pending';
}

// Parse price from CSV format
function parsePrice(priceStr: string): number {
  if (!priceStr || priceStr.trim() === '') {
    return 0;
  }
  
  // Remove $, commas, and spaces
  const cleaned = priceStr.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

// Parse date from CSV format
function parseDate(dateStr: string): Date {
  if (!dateStr || dateStr.trim() === '') {
    return new Date();
  }
  
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Clean phone number
function cleanPhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  // Format as XXX-XXX-XXXX if 10 digits
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return cleaned;
}

async function importCSV() {
  console.log('Reading CSV file...');
  
  const csvContent = readFileSync('attached_assets/notioncsv_1762788283255.csv', 'utf-8');
  
  console.log('Parsing CSV...');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true, // Handle byte order mark
  }) as CSVRecord[];
  
  console.log(`Found ${records.length} records`);
  
  // Debug: show first record's keys
  if (records.length > 0) {
    console.log('Column names:', Object.keys(records[0]));
    console.log('First record:', records[0]);
  }
  
  // Get the highest tracking number
  const allJobs = await db.select().from(jobs);
  let maxNumber = 0;
  
  for (const job of allJobs) {
    const match = job.trackingId.match(/JOB-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  }
  
  let jobNumber = maxNumber;
  let imported = 0;
  let skipped = 0;
  
  for (const record of records) {
    // Skip empty rows or rows without customer name
    const customer = record.Customer?.trim() || '';
    
    if (!customer || customer === 'Customer Name' || customer === 'Customer') {
      skipped++;
      continue;
    }
    
    // Skip if no items and no price (likely invalid row)
    const hasItems = record.Items && record.Items.trim() !== '';
    const hasPrice = record.Price && record.Price.trim() !== '';
    
    if (!hasItems && !hasPrice) {
      skipped++;
      continue;
    }
    
    try {
      const customerName = record.Customer.trim();
      const phone = cleanPhone(record.Contact || '');
      const items = record.Items?.trim() || '';
      const price = parsePrice(record.Price);
      const receivedDate = parseDate(record.Received);
      const coatingType = record['Coating Type'] ? mapCoatingType(record['Coating Type']) : 'ceramic';
      const status = record.Status ? mapStatus(record.Status) : 'pending';
      
      // Find or create customer
      let customer = await db.query.customers.findFirst({
        where: eq(customers.name, customerName),
      });
      
      if (!customer) {
        const [newCustomer] = await db.insert(customers).values({
          name: customerName,
          phone: phone || null,
        }).returning();
        customer = newCustomer;
        console.log(`Created customer: ${customerName}`);
      }
      
      // Generate tracking ID
      jobNumber++;
      const trackingId = `JOB-${jobNumber.toString().padStart(4, '0')}`;
      
      // Create job
      await db.insert(jobs).values({
        trackingId,
        customerId: customer.id,
        phoneNumber: phone || customer.phone || '555-0000',
        receivedDate,
        coatingType,
        items: items || null,
        detailedNotes: null,
        price: price.toString(),
        status,
      });
      
      imported++;
      console.log(`Imported ${trackingId} for ${customerName} - ${items.substring(0, 50)}...`);
      
    } catch (error) {
      console.error(`Error importing record for ${record.Customer}:`, error);
      skipped++;
    }
  }
  
  console.log(`\nImport complete!`);
  console.log(`Imported: ${imported} jobs`);
  console.log(`Skipped: ${skipped} records`);
}

importCSV()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
