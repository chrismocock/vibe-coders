const { createClient } = require('@supabase/supabase-js');
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

const testUsers = [
  {
    email: 'john.doe@example.com',
    password: 'password123',
    first_name: 'John',
    last_name: 'Doe'
  },
  {
    email: 'jane.smith@example.com',
    password: 'password123',
    first_name: 'Jane',
    last_name: 'Smith'
  },
  {
    email: 'mike.johnson@example.com',
    password: 'password123',
    first_name: 'Mike',
    last_name: 'Johnson'
  },
  {
    email: 'sarah.wilson@example.com',
    password: 'password123',
    first_name: 'Sarah',
    last_name: 'Wilson'
  },
  {
    email: 'david.brown@example.com',
    password: 'password123',
    first_name: 'David',
    last_name: 'Brown'
  },
  {
    email: 'lisa.davis@example.com',
    password: 'password123',
    first_name: 'Lisa',
    last_name: 'Davis'
  },
  {
    email: 'chris.miller@example.com',
    password: 'password123',
    first_name: 'Chris',
    last_name: 'Miller'
  },
  {
    email: 'amanda.garcia@example.com',
    password: 'password123',
    first_name: 'Amanda',
    last_name: 'Garcia'
  },
  {
    email: 'robert.martinez@example.com',
    password: 'password123',
    first_name: 'Robert',
    last_name: 'Martinez'
  },
  {
    email: 'jennifer.anderson@example.com',
    password: 'password123',
    first_name: 'Jennifer',
    last_name: 'Anderson'
  }
];

async function createTestUsers() {
  console.log('🚀 Creating test users...\n');

  const results = {
    success: [],
    errors: []
  };

  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    console.log(`Creating user ${i + 1}/10: ${user.email}`);

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name
        },
        email_confirm: true // Auto-confirm email
      });

      if (error) {
        console.error(`❌ Error creating ${user.email}:`, error.message);
        results.errors.push({ email: user.email, error: error.message });
      } else {
        console.log(`✅ Created: ${user.email} (ID: ${data.user.id})`);
        results.success.push({ email: user.email, id: data.user.id });
      }
    } catch (err) {
      console.error(`❌ Exception creating ${user.email}:`, err.message);
      results.errors.push({ email: user.email, error: err.message });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully created: ${results.success.length} users`);
  console.log(`❌ Errors: ${results.errors.length} users`);

  if (results.success.length > 0) {
    console.log('\n✅ Successfully created users:');
    results.success.forEach(user => {
      console.log(`  - ${user.email} (${user.id})`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n❌ Failed to create users:');
    results.errors.forEach(user => {
      console.log(`  - ${user.email}: ${user.error}`);
    });
  }

  console.log('\n🎉 Test users creation completed!');
  console.log('You can now test the admin panel at http://localhost:3001/admin');
}

createTestUsers().catch(console.error);
