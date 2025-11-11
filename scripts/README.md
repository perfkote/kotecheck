# Database Migration Scripts

These scripts help you migrate data from your development database to production.

## How to Use

### Step 1: Export Development Data

Run this command to export all your development data:

```bash
npx tsx scripts/export-data.ts
```

This will create a file called `database-export.json` with all your data.

### Step 2: Import to Production

**Important:** You need to configure your production database URL first.

1. Go to the Replit database pane
2. Click on "Production Database"
3. Copy the production DATABASE_URL

Then run the import with the production URL:

```bash
DATABASE_URL="your-production-url-here" npx tsx scripts/import-data.ts
```

## What Gets Migrated

The scripts migrate all data from these tables:
- Customers
- Jobs  
- Services
- Estimates
- Estimate Services
- Notes

## Troubleshooting

**"Duplicate key error"**
- This means the data already exists in production
- The import script is safe to run multiple times on an empty database

**"File not found"**
- Make sure you ran the export step first
- Check that `database-export.json` exists in your project root

**"toISOString is not a function" error**
- This has been fixed - the script now automatically converts date strings to Date objects
- Make sure you're using the latest version of the import script

## Safety Notes

- The export script only reads data (safe to run anytime)
- The import script only adds data (doesn't delete anything)
- Always test on development first before running on production
