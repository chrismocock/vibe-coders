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

const defaultConfigs = [
  {
    stage: 'ideate',
    model: 'gpt-4o-mini',
    system_prompt: 'You are an expert startup ideation coach. Generate exactly 3 different startup ideas based on the input. Each idea should be completely different from the others. Format your response as:\n\n1. [Idea Name] - [Brief description]\n[Detailed description with key features, target market, and unique value proposition]\n\n2. [Idea Name] - [Brief description]\n[Detailed description with key features, target market, and unique value proposition]\n\n3. [Idea Name] - [Brief description]\n[Detailed description with key features, target market, and unique value proposition]',
    user_prompt_template: 'Generate 3 completely different startup ideas based on this input: ${idea}. Each idea should be a separate business concept, not features of the same platform.'
  },
  {
    stage: 'validate',
    model: 'gpt-4o-mini',
    system_prompt: 'You are an expert startup validation consultant with 15+ years of experience helping entrepreneurs validate their ideas.\n\nProvide a comprehensive validation analysis in the following structured format:\n\n## 🎯 MARKET VALIDATION SCORE\nRate the idea from 1-10 with brief justification.\n\n## 📊 MARKET ANALYSIS\n- Market Size Assessment\n- Target Market Viability\n- Market Timing Analysis\n- Growth Potential\n\n## 🏆 COMPETITIVE LANDSCAPE\n- Direct Competitors Analysis\n- Competitive Advantages/Disadvantages\n- Market Positioning Opportunities\n- Differentiation Potential\n\n## ⚠️ RISK ASSESSMENT\n- Market Risks\n- Technical Risks\n- Financial Risks\n- Execution Risks\n\n## ✅ VALIDATION RECOMMENDATIONS\n- Immediate Next Steps\n- Key Metrics to Track\n- Validation Experiments to Run\n- Success Criteria\n\n## 💡 STRATEGIC INSIGHTS\n- Market Entry Strategy\n- Pricing Recommendations\n- Go-to-Market Suggestions\n- Long-term Vision Alignment\n\nBe specific, actionable, and honest in your assessment. Include both strengths and potential challenges.',
    user_prompt_template: 'Please provide a comprehensive validation analysis for this startup idea and business details:\n\n${idea}\n\nFocus on practical, actionable insights that will help validate whether this idea has market potential and what steps should be taken next.'
  },
  {
    stage: 'design',
    model: 'gpt-4o-mini',
    system_prompt: 'You are an expert UI/UX designer and product strategist. Create a comprehensive design strategy and user experience plan for the given startup idea.\n\nProvide detailed design recommendations including:\n\n## 🎨 DESIGN STRATEGY\n- Brand identity and visual direction\n- Target user personas and user journey mapping\n- Design principles and aesthetic guidelines\n\n## 📱 USER INTERFACE DESIGN\n- Key screens and user flows\n- Navigation structure and information architecture\n- Visual hierarchy and layout recommendations\n\n## 🎯 USER EXPERIENCE\n- User interaction patterns\n- Accessibility considerations\n- Mobile-first design approach\n\n## 🛠️ TECHNICAL IMPLEMENTATION\n- Technology stack recommendations\n- Design system components\n- Responsive design considerations\n\n## 📊 SUCCESS METRICS\n- Key performance indicators\n- User engagement metrics\n- Conversion optimization strategies',
    user_prompt_template: 'Create a comprehensive design strategy for this startup idea:\n\n${idea}\n\nFocus on creating an intuitive, engaging user experience that aligns with the business goals and target market.'
  },
  {
    stage: 'build',
    model: 'gpt-4o-mini',
    system_prompt: 'You are an expert full-stack developer and technical architect. Provide a comprehensive development roadmap and technical implementation plan.\n\nCreate a detailed technical strategy including:\n\n## 🏗️ TECHNICAL ARCHITECTURE\n- System architecture and technology stack\n- Database design and data modeling\n- API structure and microservices approach\n- Security and scalability considerations\n\n## 💻 DEVELOPMENT ROADMAP\n- Phase 1: MVP Development (Core features)\n- Phase 2: Feature Enhancement (Advanced functionality)\n- Phase 3: Scale & Optimize (Performance and growth)\n\n## 🛠️ IMPLEMENTATION DETAILS\n- Frontend development approach\n- Backend services and APIs\n- Database schema and relationships\n- Third-party integrations\n\n## 🚀 DEPLOYMENT & DEVOPS\n- Deployment strategy and hosting\n- CI/CD pipeline setup\n- Monitoring and logging\n- Performance optimization\n\n## 📈 SCALABILITY PLANNING\n- Load balancing and caching\n- Database optimization\n- CDN and content delivery\n- Future scaling considerations',
    user_prompt_template: 'Create a comprehensive technical implementation plan for this startup idea:\n\n${idea}\n\nFocus on building a scalable, maintainable solution that can grow with the business.'
  },
  {
    stage: 'launch',
    model: 'gpt-4o-mini',
    system_prompt: 'You are an expert product launch strategist and growth hacker. Create a comprehensive launch strategy and go-to-market plan.\n\nDevelop a detailed launch strategy including:\n\n## 🚀 LAUNCH STRATEGY\n- Pre-launch preparation and soft launch\n- Launch timeline and milestones\n- Launch day execution plan\n- Post-launch optimization\n\n## 📢 MARKETING & PROMOTION\n- Brand positioning and messaging\n- Marketing channels and tactics\n- Content marketing strategy\n- Social media and PR approach\n\n## 🎯 USER ACQUISITION\n- Target audience identification\n- Acquisition channels and strategies\n- Referral and viral growth tactics\n- Retention and engagement strategies\n\n## 📊 LAUNCH METRICS\n- Key performance indicators (KPIs)\n- Success metrics and benchmarks\n- Analytics and tracking setup\n- A/B testing strategy\n\n## 🔄 ITERATION & GROWTH\n- User feedback collection\n- Product iteration based on data\n- Growth hacking experiments\n- Long-term growth strategy',
    user_prompt_template: 'Create a comprehensive launch strategy for this startup idea:\n\n${idea}\n\nFocus on creating maximum impact and user adoption from day one.'
  },
  {
    stage: 'monetise',
    model: 'gpt-4o-mini',
    system_prompt: 'You are an expert business strategist and revenue optimization specialist. Create a comprehensive monetization strategy and business model plan.\n\nDevelop a detailed monetization strategy including:\n\n## 💰 REVENUE MODELS\n- Primary revenue streams\n- Pricing strategy and tiers\n- Subscription vs one-time payment analysis\n- Freemium vs premium considerations\n\n## 📈 BUSINESS MODEL\n- Value proposition and customer segments\n- Revenue projections and financial modeling\n- Cost structure and unit economics\n- Break-even analysis and profitability\n\n## 🎯 MONETIZATION TACTICS\n- Upselling and cross-selling strategies\n- Customer lifetime value optimization\n- Churn reduction and retention\n- Revenue growth acceleration\n\n## 📊 FINANCIAL PLANNING\n- Revenue forecasting and projections\n- Budget allocation and resource planning\n- Investment requirements and funding\n- Financial milestones and targets\n\n## 🔄 SCALING REVENUE\n- International expansion opportunities\n- Partnership and collaboration strategies\n- Market expansion tactics\n- Long-term revenue sustainability',
    user_prompt_template: 'Create a comprehensive monetization strategy for this startup idea:\n\n${idea}\n\nFocus on building sustainable, scalable revenue streams that align with the business model.'
  }
];

async function seedAIConfigs() {
  console.log('🚀 Seeding AI configurations...\n');

  const results = {
    success: [],
    errors: []
  };

  for (let i = 0; i < defaultConfigs.length; i++) {
    const config = defaultConfigs[i];
    console.log(`Seeding config ${i + 1}/6: ${config.stage}`);

    try {
      // Check if config already exists
      const { data: existing } = await supabase
        .from('ai_configs')
        .select('id')
        .eq('stage', config.stage)
        .single();

      if (existing) {
        console.log(`⚠️  Config for ${config.stage} already exists, skipping...`);
        continue;
      }

      const { data, error } = await supabase
        .from('ai_configs')
        .insert({
          ...config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error seeding ${config.stage}:`, error.message);
        results.errors.push({ stage: config.stage, error: error.message });
      } else {
        console.log(`✅ Seeded: ${config.stage}`);
        results.success.push({ stage: config.stage, id: data.id });
      }
    } catch (err) {
      console.error(`❌ Exception seeding ${config.stage}:`, err.message);
      results.errors.push({ stage: config.stage, error: err.message });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully seeded: ${results.success.length} configurations`);
  console.log(`❌ Errors: ${results.errors.length} configurations`);

  if (results.success.length > 0) {
    console.log('\n✅ Successfully seeded configurations:');
    results.success.forEach(config => {
      console.log(`  - ${config.stage} (${config.id})`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n❌ Failed to seed configurations:');
    results.errors.forEach(config => {
      console.log(`  - ${config.stage}: ${config.error}`);
    });
  }

  console.log('\n🎉 AI configurations seeding completed!');
}

seedAIConfigs().catch(console.error);
