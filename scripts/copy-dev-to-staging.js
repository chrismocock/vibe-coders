const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Dev database (source)
const devUrl = process.env.DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const devServiceKey = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Staging database (destination)
const stagingUrl = process.env.STAGING_SUPABASE_URL;
const stagingServiceKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY;

if (!devUrl || !devServiceKey || !stagingUrl || !stagingServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required:');
  console.error('  DEV_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
  console.error('  DEV_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
  console.error('  STAGING_SUPABASE_URL');
  console.error('  STAGING_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Verify service role keys (they should start with 'eyJ' for JWT tokens)
if (!devServiceKey.startsWith('eyJ')) {
  console.warn('⚠️  WARNING: DEV_SUPABASE_SERVICE_ROLE_KEY does not look like a JWT token (should start with "eyJ")');
}
if (!stagingServiceKey.startsWith('eyJ')) {
  console.warn('⚠️  WARNING: STAGING_SUPABASE_SERVICE_ROLE_KEY does not look like a JWT token (should start with "eyJ")');
}

// Use service role key which bypasses RLS automatically
// The service role key should bypass RLS, but if it doesn't, the policies should allow it
const devSupabase = createClient(devUrl, devServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'apikey': devServiceKey,
      'Authorization': `Bearer ${devServiceKey}`
    }
  }
});

const stagingSupabase = createClient(stagingUrl, stagingServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'apikey': stagingServiceKey,
      'Authorization': `Bearer ${stagingServiceKey}`
    }
  }
});

// Define tables in dependency order (tables with foreign keys last)
const tables = [
  'projects',
  'ai_configs',
  'project_stages',
  'validation_reports',
  'design_blueprints',
  'build_blueprints',
  'launch_blueprints',
  'monetise_blueprints'
];

async function getStagingTableColumns(tableName) {
  // Try to get one row to see what columns exist
  // This will fail if table doesn't exist, but that's okay
  try {
    const { data, error } = await stagingSupabase
      .from(tableName)
      .select('*')
      .limit(0);
    
    if (error && error.code === 'PGRST116') {
      return null; // Table doesn't exist
    }
    
    // Get columns from the schema by trying to insert an empty object (will fail but show schema)
    // Actually, better approach: fetch schema info via RPC or use a test query
    // For now, we'll catch column errors and filter them out
    return 'unknown'; // We'll handle missing columns dynamically
  } catch (err) {
    return null;
  }
}

async function copyTable(tableName, options = {}) {
  const { clearFirst = false, batchSize = 100 } = options;
  
  console.log(`\n📋 Copying ${tableName}...`);
  
  try {
    // Clear staging table if requested
    if (clearFirst) {
      console.log(`  🗑️  Clearing staging ${tableName}...`);
      const { error: deleteError } = await stagingSupabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (deleteError && deleteError.code !== 'PGRST116') {
        console.error(`  ⚠️  Could not clear table (might not exist): ${deleteError.message}`);
      }
    }
    
    // Fetch all data from dev
    console.log(`  📥 Fetching data from dev...`);
    let allData = [];
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error, count } = await devSupabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(offset, offset + batchSize - 1);
      
      if (error) {
        console.error(`  ❌ Error fetching from dev: ${error.message}`);
        return { success: false, error: error.message };
      }
      
      if (data && data.length > 0) {
        allData = allData.concat(data);
        offset += batchSize;
        hasMore = data.length === batchSize;
        console.log(`  📊 Fetched ${allData.length} rows...`);
      } else {
        hasMore = false;
      }
    }
    
    if (allData.length === 0) {
      console.log(`  ℹ️  No data to copy`);
      return { success: true, count: 0 };
    }
    
    // Filter out invalid rows before inserting
    if (tableName === 'projects') {
      const validData = allData.filter(row => row.user_id);
      const invalidCount = allData.length - validData.length;
      if (invalidCount > 0) {
        console.log(`  ⚠️  Warning: ${invalidCount} projects have null user_id. Skipping these rows.`);
      }
      allData = validData;
    }
    
    if (allData.length === 0) {
      console.log(`  ℹ️  No valid data to copy after filtering`);
      return { success: true, count: 0 };
    }
    
    // Insert into staging in batches
    console.log(`  📤 Inserting ${allData.length} rows into staging...`);
    let inserted = 0;
    let errors = [];
    let knownMissingColumns = new Set();
    
    for (let i = 0; i < allData.length; i += batchSize) {
      const batch = allData.slice(i, i + batchSize);
      
      // Remove any null/undefined values and filter out known missing columns
      // BUT keep null values for required fields (they might be needed for constraints)
      const cleanBatch = batch.map(row => {
        const clean = {};
        Object.keys(row).forEach(key => {
          // Skip columns we know don't exist in staging
          if (knownMissingColumns.has(key)) {
            return;
          }
          // Keep the value even if it's null (null is different from undefined)
          // Only skip if it's explicitly undefined
          if (row[key] !== undefined) {
            clean[key] = row[key];
          }
        });
        return clean;
      });
      
      const { data: insertedData, error: insertError } = await stagingSupabase
        .from(tableName)
        .upsert(cleanBatch, { onConflict: 'id' })
        .select();
      
      if (insertError) {
        // Check if error is about missing column
        const missingColumnMatch = insertError.message.match(/Could not find the '(\w+)' column/);
        if (missingColumnMatch) {
          const missingColumn = missingColumnMatch[1];
          knownMissingColumns.add(missingColumn);
          console.log(`  ⚠️  Column '${missingColumn}' doesn't exist in staging, skipping it...`);
          // Retry this batch without the missing column (recursive handling)
          let retryAttempts = 0;
          let currentBatch = batch;
          let currentMissingColumns = new Set(knownMissingColumns);
          
          while (retryAttempts < 10) { // Max 10 missing columns per batch
            const retryBatch = currentBatch.map(row => {
              const clean = {};
              Object.keys(row).forEach(key => {
                if (currentMissingColumns.has(key)) {
                  return;
                }
                if (row[key] !== null && row[key] !== undefined) {
                  clean[key] = row[key];
                }
              });
              return clean;
            });
            
            const { data: retryData, error: retryError } = await stagingSupabase
              .from(tableName)
              .upsert(retryBatch, { onConflict: 'id' })
              .select();
            
            if (retryError) {
              const nextMissingMatch = retryError.message.match(/Could not find the '(\w+)' column/);
              if (nextMissingMatch) {
                const nextMissing = nextMissingMatch[1];
                currentMissingColumns.add(nextMissing);
                knownMissingColumns.add(nextMissing);
                console.log(`  ⚠️  Column '${nextMissing}' doesn't exist in staging, skipping it...`);
                retryAttempts++;
                continue;
              } else {
                console.error(`  ❌ Error inserting batch (after filtering columns): ${retryError.message}`);
                errors.push(retryError.message);
                break;
              }
            } else {
              inserted += retryData?.length || batch.length;
              console.log(`  ✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allData.length / batchSize)} (${inserted}/${allData.length})`);
              break;
            }
          }
        } else if (insertError.message.includes('row-level security policy')) {
          // RLS error - try using REST API directly with service role
          console.log(`  ⚠️  RLS error detected. Service role should bypass RLS, but policies may be blocking.`);
          console.log(`  💡 Tip: Verify your STAGING_SUPABASE_SERVICE_ROLE_KEY is correct (should start with 'eyJ...')`);
          console.error(`  ❌ Error inserting batch: ${insertError.message}`);
          errors.push(insertError.message);
        } else {
          console.error(`  ❌ Error inserting batch: ${insertError.message}`);
          errors.push(insertError.message);
        }
      } else {
        inserted += insertedData?.length || batch.length;
        console.log(`  ✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allData.length / batchSize)} (${inserted}/${allData.length})`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    if (errors.length > 0) {
      console.error(`  ⚠️  Completed with ${errors.length} errors`);
      return { success: false, errors };
    }
    
    console.log(`  ✅ Successfully copied ${inserted} rows`);
    if (knownMissingColumns.size > 0) {
      console.log(`  ⚠️  Note: Skipped columns that don't exist in staging: ${Array.from(knownMissingColumns).join(', ')}`);
    }
    return { success: true, count: inserted };
    
  } catch (err) {
    console.error(`  ❌ Exception: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function copyAllData(options = {}) {
  const { clearFirst = false, tablesToCopy = tables } = options;
  
  console.log('🚀 Starting data copy from DEV to STAGING\n');
  console.log(`📊 Tables to copy: ${tablesToCopy.join(', ')}`);
  console.log(`🗑️  Clear staging first: ${clearFirst ? 'Yes' : 'No'}\n`);
  
  const results = {};
  
  for (const table of tablesToCopy) {
    const result = await copyTable(table, { clearFirst });
    results[table] = result;
  }
  
  console.log('\n📊 Summary:');
  console.log('─'.repeat(50));
  
  let totalCopied = 0;
  let successCount = 0;
  let failCount = 0;
  
  Object.entries(results).forEach(([table, result]) => {
    if (result.success) {
      console.log(`✅ ${table}: ${result.count || 0} rows`);
      totalCopied += result.count || 0;
      successCount++;
    } else {
      console.log(`❌ ${table}: Failed - ${result.error || result.errors?.join(', ')}`);
      failCount++;
    }
  });
  
  console.log('─'.repeat(50));
  console.log(`\n✅ Successfully copied: ${successCount} tables`);
  console.log(`❌ Failed: ${failCount} tables`);
  console.log(`📊 Total rows copied: ${totalCopied}`);
  
  return results;
}

// Run the copy
const args = process.argv.slice(2);
const clearFirst = args.includes('--clear');
const specificTables = args.filter(arg => !arg.startsWith('--'));

copyAllData({
  clearFirst,
  tablesToCopy: specificTables.length > 0 ? specificTables : tables
}).catch(console.error);

