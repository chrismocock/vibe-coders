const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testProjects = [
  { title: 'EcoTracker App', description: 'Track your carbon footprint', userId: 'dbd4cacd-2792-456a-870f-9c06a5083be6' },
  { title: 'FitLife Coach', description: 'Personal fitness coaching platform', userId: '2f437756-3d42-4a36-a46d-fbfa23ad8163' },
  { title: 'RecipeMaster', description: 'AI-powered recipe generator', userId: '1e9722a8-42c9-466b-b99a-ec4647f80750' },
  { title: 'StudyBuddy', description: 'Collaborative learning platform', userId: '1435d36a-565a-412f-9267-c4dcca0cb529' },
  { title: 'PetCare Pro', description: 'Pet health and care management', userId: '60381fba-0729-4688-b084-c07bf70e5184' },
  { title: 'BudgetTracker', description: 'Personal finance management app', userId: '7e4d8189-e6ee-4254-aa6a-947f171ce8e9' },
  { title: 'TaskFlow', description: 'Team productivity and task management', userId: '6ef3576f-5fa9-424f-b2f9-922eb4f79041' },
  { title: 'HealthMonitor', description: 'Personal health tracking dashboard', userId: '8dcc4c1a-fad8-4abb-b8f9-45f9a69b6392' },
  { title: 'EventPlanner', description: 'Event planning and management tool', userId: '134f72f2-5d88-4787-bdbf-cdbad9ede067' },
  { title: 'CodeMentor', description: 'Programming learning and mentorship', userId: '12f6d82b-1bba-4b85-9216-48c0d98dca58' }
];

async function createTestProjects() {
  console.log('🚀 Creating test projects...\n');

  const results = {
    success: [],
    errors: []
  };

  for (let i = 0; i < testProjects.length; i++) {
    const project = testProjects[i];
    console.log(`Creating project ${i + 1}/10: ${project.title}`);

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: project.title,
          description: project.description,
          user_id: project.userId,
          progress: Math.floor(Math.random() * 100) // Random progress 0-100
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating ${project.title}:`, error.message);
        results.errors.push({ title: project.title, error: error.message });
      } else {
        console.log(`✅ Created: ${project.title} (ID: ${data.id})`);
        results.success.push({ title: project.title, id: data.id });
      }
    } catch (err) {
      console.error(`❌ Exception creating ${project.title}:`, err.message);
      results.errors.push({ title: project.title, error: err.message });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully created: ${results.success.length} projects`);
  console.log(`❌ Errors: ${results.errors.length} projects`);

  if (results.success.length > 0) {
    console.log('\n✅ Successfully created projects:');
    results.success.forEach(project => {
      console.log(`  - ${project.title} (${project.id})`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n❌ Failed to create projects:');
    results.errors.forEach(project => {
      console.log(`  - ${project.title}: ${project.error}`);
    });
  }

  console.log('\n🎉 Test projects creation completed!');
}

createTestProjects().catch(console.error);
