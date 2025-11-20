const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAIConfigs() {
  console.log('🚀 Setting up AI configurations...\n');

  try {
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'create-ai-configs-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Creating ai_configs table...');
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (tableError) {
      console.error('❌ Error creating table:', tableError);
      // Try alternative approach - direct SQL execution
      console.log('🔄 Trying alternative table creation...');
      
      const { error: altError } = await supabase
        .from('ai_configs')
        .select('id')
        .limit(1);
      
      if (altError && altError.code === 'PGRST116') {
        console.log('📋 Table does not exist, creating manually...');
        // The table doesn't exist, we need to create it through Supabase dashboard
        console.log('⚠️  Please create the ai_configs table manually in your Supabase dashboard with this SQL:');
        console.log('\n' + sqlContent + '\n');
        console.log('Then run: npm run seed-ai-configs');
        return;
      }
    } else {
      console.log('✅ Table created successfully');
    }

    // Now seed the data
    console.log('🌱 Seeding AI configurations...');
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    await execAsync('npm run seed-ai-configs');
    
  } catch (error) {
    console.error('❌ Setup error:', error);
    console.log('\n📋 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Run the SQL from scripts/create-ai-configs-table.sql');
    console.log('3. Run: npm run seed-ai-configs');
  }
}

setupAIConfigs().catch(console.error);
