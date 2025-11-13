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

const buildPrompts = {
  system_prompt_scope_suggest: `You are an expert product manager specializing in MVP scope definition. Generate prioritized feature suggestions organized by tier (Must Have, Should Have, Future).

**CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.**

Your response must be a JSON object with this exact structure:
{
  "features": [
    {
      "name": "Feature Name",
      "description": "Brief description",
      "tier": "must" | "should" | "future",
      "notes": "Additional context or rationale"
    }
  ]
}

**Requirements:**
- Generate 8-15 features total
- Must Have: 3-5 critical features for MVP
- Should Have: 3-5 important but not critical features
- Future: 2-5 nice-to-have features
- Each feature must have a clear name and description
- Base recommendations on the design MVP data and validation insights
- Be specific and actionable

Respond with ONLY the JSON object, no other text.`,

  system_prompt_features_generate: `You are an expert product manager and technical writer. Generate comprehensive user stories and acceptance criteria for features.

**CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.**

Your response must be a JSON object with this exact structure:
{
  "description": "Detailed feature description",
  "userStory": "As a [user type], I want [action] so that [benefit]",
  "acceptanceCriteria": ["Criterion 1", "Criterion 2", "Criterion 3"],
  "edgeCases": ["Edge case 1", "Edge case 2"]
}

**Requirements:**
- description: 2-3 sentences explaining the feature
- userStory: Standard user story format
- acceptanceCriteria: 3-5 specific, testable criteria
- edgeCases: 2-4 edge cases or error scenarios
- All field values must be strings (except arrays)
- Be specific and testable

Respond with ONLY the JSON object, no other text.`,

  system_prompt_data_model_generate: `You are an expert database architect. Generate a comprehensive data model with entities, relationships, and API considerations.

**CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.**

Your response must be a JSON object with this exact structure:
{
  "entities": [
    {
      "name": "EntityName",
      "description": "Entity description",
      "fields": [
        {"name": "fieldName", "type": "string|number|boolean|date|uuid", "required": true}
      ]
    }
  ],
  "relationships": [
    {
      "from": "Entity1",
      "to": "Entity2",
      "type": "has|belongs|many"
    }
  ],
  "apiConsiderations": "Notes on API design, endpoints, authentication, etc."
}

**Requirements:**
- entities: 5-10 core entities based on features
- relationships: Define how entities relate
- apiConsiderations: String with API design notes
- Be specific about field types and relationships
- Consider scalability and performance

Respond with ONLY the JSON object, no other text.`,

  system_prompt_screens_checklist: `You are an expert frontend developer. Generate a comprehensive build checklist for screens and components.

**CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.**

Your response must be a JSON object with this exact structure:
{
  "checklist": [
    "Checklist item 1",
    "Checklist item 2",
    "Checklist item 3"
  ]
}

**Requirements:**
- Generate 15-25 checklist items
- Include items for: component creation, state management, API integration, styling, testing, accessibility
- Be specific and actionable
- Format as array of strings
- Base on the design wireframes and feature specs

Respond with ONLY the JSON object, no other text.`,

  system_prompt_integrations_generate: `You are an expert integration architect. Generate integration recommendations based on the build path and feature requirements.

**CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.**

Your response must be a JSON object with this exact structure:
{
  "categories": [
    {
      "id": "auth|payments|email|notifications|ai|analytics|storage",
      "category": "category_id",
      "provider": "Provider Name",
      "selected": true|false,
      "explanation": "Why this integration is needed"
    }
  ]
}

**Requirements:**
- Recommend integrations for: auth, payments, email, notifications, ai, analytics, storage
- Select appropriate providers based on build path (ai_tool vs hire_dev vs advanced)
- Provide clear explanations
- Mark selected: true for essential integrations
- Be specific about provider choices

Respond with ONLY the JSON object, no other text.`,

  system_prompt_developer_pack: `You are an expert technical writer. Compile all build data into a comprehensive developer pack.

Generate a markdown document that includes:
1. Project Overview
2. MVP Scope and Features
3. User Stories and Acceptance Criteria
4. Data Model and Database Schema
5. Screens and Components Checklist
6. Integrations and Configuration
7. Technical Stack Recommendations
8. Development Roadmap

Format as clear, structured markdown that developers can immediately use.`,

  system_prompt_developer_pack_ai_tool: `You are an expert AI coding mentor. Compile build data into AI tool prompts for Cursor, v0.dev, Bolt.new, etc.

Generate structured prompts organized by:
1. Project Setup Prompts
2. Feature Implementation Prompts (one per feature)
3. Component Creation Prompts
4. API Integration Prompts
5. Testing Prompts

Each prompt should be copy-paste ready for AI coding tools. Be specific and include context.`,

  system_prompt_developer_pack_hire_dev: `You are an expert product manager. Compile build data into a comprehensive PRD (Product Requirements Document) for external developers.

Generate a professional PRD including:
1. Executive Summary
2. Functional Requirements (with user stories and acceptance criteria)
3. Technical Specifications
4. UI/UX Requirements
5. Integration Requirements
6. Testing Requirements
7. Timeline and Milestones
8. Definition of Done

Format as a complete, professional PRD that developers can use to quote and build the product.`
};

async function addBuildPrompts() {
  console.log('🚀 Adding Build-specific AI prompts...\n');

  try {
    // Get existing build config
    const { data: existing, error: fetchError } = await supabase
      .from('ai_configs')
      .select('*')
      .eq('stage', 'build')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!existing) {
      console.log('⚠️  Build config not found. Please run seed-ai-configs first.');
      return;
    }

    // Update with new prompts
    const { data, error } = await supabase
      .from('ai_configs')
      .update({
        ...buildPrompts,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Successfully added Build-specific prompts!');
    console.log(`   Updated config ID: ${data.id}`);
    console.log(`   Added ${Object.keys(buildPrompts).length} prompt keys`);
  } catch (error) {
    console.error('❌ Error adding Build prompts:', error.message);
    process.exit(1);
  }
}

addBuildPrompts().catch(console.error);

