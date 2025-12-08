import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  const { fieldName, fieldType, idea, existingData } = await req.json();
  
  // Extract build mode context if available
  const buildMode = existingData?.buildMode || '';
  const userBudget = existingData?.userBudget || '';
  const userTimeline = existingData?.userTimeline || '';
  // Extract monetise context if available
  const revenueGoal = existingData?.revenueGoal || '';
  const timeHorizon = existingData?.timeHorizon || '';
  
  try {
    const fieldPrompts = {
      targetMarket: {
        system: "You are an expert market researcher. Generate a detailed target market analysis.",
        user: `Based on this startup idea: "${idea}", provide a detailed target market analysis including:
- Demographics (age, gender, income, location)
- Psychographics (interests, behaviors, values)
- Pain points and challenges they face
- Market size estimates
- Customer segments

Be specific and actionable.`
      },
      problemStatement: {
        system: "You are an expert problem-solution analyst. Help define clear problem statements.",
        user: `Based on this startup idea: "${idea}", create a clear problem statement including:
- What specific problem does this solve?
- How severe is this problem?
- How often do people encounter it?
- What are the consequences of not solving it?
- Who is most affected by this problem?

Be specific and measurable.`
      },
      solutionDescription: {
        system: "You are an expert product strategist. Help articulate solution descriptions.",
        user: `Based on this startup idea: "${idea}", describe the solution including:
- How does it solve the identified problem?
- What makes it unique compared to alternatives?
- Key features and benefits
- How it works (high-level)
- Value proposition

Be clear and compelling.`
      },
      marketSize: {
        system: "You are an expert market sizing analyst. Help estimate market opportunities.",
        user: `Based on this startup idea: "${idea}", provide market size analysis including:
- Total Addressable Market (TAM)
- Serviceable Addressable Market (SAM)
- Serviceable Obtainable Market (SOM)
- Number of potential customers
- Market growth rate
- Revenue potential

Include specific numbers and sources where possible.`
      },
      competitors: {
        system: "You are an expert competitive analyst. Help identify and analyze competitors.",
        user: `Based on this startup idea: "${idea}", provide competitive analysis including:
- Direct competitors (3-5 main ones)
- Indirect competitors
- Competitor strengths and weaknesses
- Market positioning opportunities
- How to differentiate from competitors
- Competitive advantages

Be thorough and strategic.`
      },
      businessModel: {
        system: "You are an expert business model strategist. Help design revenue models.",
        user: `Based on this startup idea: "${idea}", design a business model including:
- Revenue streams (primary and secondary)
- Pricing strategies
- Cost structure
- Key partnerships needed
- Customer acquisition strategy
- Unit economics

Be practical and profitable.`
      },
      validationStrategy: {
        system: "You are an expert startup validation consultant with 15+ years of experience helping first-time entrepreneurs validate their ideas. You specialize in breaking down complex validation strategies into simple, actionable steps that anyone can follow.",
        user: `Based on this startup idea: "${idea}", provide a step-by-step validation strategy with 3-5 specific, beginner-friendly validation methods ranked by priority. For EACH method, include:

**Method Name** (e.g., "Customer Discovery Interviews", "Landing Page Test", "Competitor Analysis")
- **Why this matters**: Brief explanation of what you'll learn
- **How to do it**: Step-by-step instructions that a complete newbie can follow
- **Timeline**: How long this will take (e.g., "1-2 weeks")
- **Cost**: Estimated cost (e.g., "Free", "$50-$100", etc.)
- **Success criteria**: What results indicate you should move forward

Start with the FASTEST, CHEAPEST validation methods first. Focus on learning, not perfection. Be specific and actionable - remember you're guiding a first-time founder who needs clear direction, not abstract advice.`
      },
      keyFeatures: {
        system: "You are a senior product strategist with expertise in defining MVP features. Turn startup ideas into clear, actionable product feature sets.",
        user: `Based on this startup idea: "${idea}", create a comprehensive list of 6-10 key features grouped by epics/categories.

For each epic/category:
- **Epic Name**: Clear category name (e.g., "User Management", "Core Workflow", "Analytics")
- **Features**: 2-3 concrete features within this epic
- **Priority**: Mark as "MVP" (must-have for launch) or "Phase 2" (nice-to-have)

Keep scope realistic for a first release. Focus on features that deliver core value. Be specific about what each feature does.`
      },
      userPersonas: {
        system: "You are a UX researcher specializing in user persona creation. Create concise, actionable personas for new products.",
        user: `Based on this startup idea: "${idea}", create 2-3 distinct user personas.

For each persona, include:
- **Name & Role**: Fictional name and job title/role
- **Demographics**: Age range, location type, tech savviness
- **Goals**: What they want to achieve (3-4 bullet points)
- **Pain Points**: Current frustrations and challenges (3-4 bullet points)
- **Behaviors**: How they currently solve problems, preferred tools/channels
- **Success Metrics**: What would make them love this product

Keep each persona to 5-7 short bullet points. Make them feel real and relatable.`
      },
      designStyle: {
        system: "You are a brand and UI design consultant. Suggest visual direction and design tokens that match a startup's positioning.",
        user: `Based on this startup idea: "${idea}", suggest a complete design style direction:

**Recommended Style**: Name (e.g., "Modern/Minimalist", "Playful/Creative", "Professional/Corporate")

**Color Palette**:
- Primary color (with hex code)
- Secondary color (with hex code)
- Accent color (with hex code)
- Neutral colors (grays, with hex codes)

**Typography**:
- Heading font (Google Font name)
- Body font (Google Font name)
- Font pairing rationale (one sentence)

**UI Style**:
- Border radius (e.g., "8px rounded corners" or "sharp edges")
- Button style (e.g., "solid filled", "outlined", "soft shadows")
- Icon style (e.g., "outline icons", "solid icons", "duotone")
- Overall tone (e.g., "clean and spacious", "dense and efficient")

**Accessibility Notes**:
- Minimum contrast ratios
- Font size minimums
- Interactive element sizes

Be specific with hex codes and font names. Explain WHY this style fits the target audience.`
      },
      productType: {
        system: "You are a product architect. Help determine the best product type for a startup idea.",
        user: `Based on this startup idea: "${idea}", recommend the most appropriate product type:

Options: Web App, Mobile App, Desktop App, API/SaaS, E-commerce, Content Platform

Provide:
- **Recommended Type**: Your choice
- **Why**: 2-3 reasons this type fits best
- **Alternative**: Second-best option if any
- **Platform Considerations**: Any specific platform notes (iOS/Android, responsive web, etc.)

Be practical and consider the target market and use case.`
      },
      techStack: {
        system: "You are a senior technical architect and CTO advisor specializing in helping first-time founders choose the right technology stack.",
        user: `Based on this startup idea: "${idea}"

**Build Context**:
- Build Mode: ${buildMode || 'Not specified'}
- User Budget: ${userBudget || 'Not specified'}
- User Timeline: ${userTimeline || 'Not specified'}

Provide a comprehensive tech stack recommendation tailored to the build mode:

${buildMode === 'Vibe Coder (Build it yourself with AI)' ? `
**For AI-Assisted Development (Vibe Coder Mode)**:
Focus on AI-friendly tech stacks that work well with tools like Cursor AI, Emergent.sh, v0.dev, and Bolt.new. Prioritize frameworks with:
- Excellent documentation for AI code generation
- Component-based architecture (easy for AI to scaffold)
- Strong TypeScript support
- Popular frameworks with lots of AI training data
` : buildMode === 'Send to Developers (Create PRD)' ? `
**For External Development Team**:
Focus on proven, enterprise-ready tech stacks that external developers will be familiar with:
- Well-established frameworks with large talent pools
- Clear documentation for team handoff
- Mature ecosystems with comprehensive tooling
` : ''}

**Recommended Stack**:
- **Frontend**: Framework/library with rationale
- **Backend**: Framework/runtime with rationale
- **Database**: Primary database with rationale
- **Infrastructure**: Hosting/deployment with rationale
- **Additional Tools**: Auth, payment, analytics, etc.

**Budget Reality Check** (User Budget: ${userBudget || 'Not specified'}):
- Is this budget realistic for the recommended stack?
- Breakdown of expected costs
- Where to save vs splurge

**Timeline Reality Check** (User Timeline: ${userTimeline || 'Not specified'}):
- Is this timeline achievable?
- What can realistically be built in this time
- Suggestions if timeline is too aggressive or too conservative

**Why This Stack**:
- Alignment with build mode (AI-assisted vs external team)
- Development speed and time-to-market
- Scalability potential
- Cost-effectiveness given budget constraints

**Alternatives**: 1-2 alternative stack options with brief pros/cons

**Getting Started**:
${buildMode === 'Vibe Coder (Build it yourself with AI)' ? '- AI tool recommendations (Cursor, v0.dev, etc.)\n- Suggested AI prompts for scaffolding' : '- Developer onboarding resources\n- Starter templates for the team'}

Be specific, practical, and honest about budget/timeline feasibility.`
      },
      timeline: {
        system: "You are a technical project manager with expertise in MVP development and agile planning.",
        user: `Based on this startup idea: "${idea}"

**Build Context**:
- Build Mode: ${buildMode || 'Not specified'}
- User's Expected Timeline: ${userTimeline || 'Not specified'}
- User Budget: ${userBudget || 'Not specified'}

**REALITY CHECK FIRST**:
Compare the user's timeline (${userTimeline}) with what's actually realistic:
- Is ${userTimeline} achievable for this idea?
- If too aggressive: What's actually possible and what to cut?
- If too conservative: Where can they move faster?
- Budget impact: Does ${userBudget} support ${userTimeline}?

**Recommended Timeline**: Your realistic recommendation (may differ from user's ${userTimeline})

**Phase Breakdown** (adjust based on ${buildMode}):
${buildMode === 'Vibe Coder (Build it yourself with AI)' ? `
For AI-Assisted Development:
- **Phase 1: Setup & Learning** (X weeks) - Learning AI tools, project setup
- **Phase 2: AI-Assisted Core Build** (X weeks) - Using Cursor/v0.dev for main features
- **Phase 3: Integration & Refinement** (X weeks) - Connecting AI-generated components
- **Phase 4: Testing & Deployment** (X weeks) - QA and launch prep
` : buildMode === 'Send to Developers (Create PRD)' ? `
For External Development Team:
- **Phase 1: Requirements & Handoff** (X weeks) - PRD finalization, team onboarding
- **Phase 2: Development Sprint 1** (X weeks) - Core features
- **Phase 3: Development Sprint 2** (X weeks) - Additional features
- **Phase 4: QA & Launch** (X weeks) - Testing and deployment
` : `
- **Phase 1: Planning & Setup** (X weeks)
- **Phase 2: Core Development** (X weeks)
- **Phase 3: Testing & Polish** (X weeks)
- **Phase 4: Pre-Launch** (X weeks)
`}

**Key Milestones**: 4-6 major milestones with target dates

**Reality Check Summary**:
- User expects: ${userTimeline}
- AI recommends: [Your recommendation]
- Gap analysis: [If different, explain why]

**Risk Factors**: Potential delays and mitigation strategies

**Acceleration Opportunities**: Where to move faster

Be honest - if user's timeline is unrealistic, say so clearly and explain why.`
      },
      teamSize: {
        system: "You are a startup operations consultant specializing in team composition and hiring strategy.",
        user: `Based on this startup idea: "${idea}"

**Build Context**:
- Build Mode: ${buildMode || 'Not specified'}
- User Budget: ${userBudget || 'Not specified'}
- User Timeline: ${userTimeline || 'Not specified'}

Tailor team recommendations based on build mode:

${buildMode === 'Vibe Coder (Build it yourself with AI)' ? `
**For AI-Assisted Solo/Small Team Building**:
Optimize for minimal team size since AI tools handle much of the development:
- Focus on what AI can't do well (strategy, design decisions, business logic)
- Emphasize AI tool proficiency over traditional coding skills
- Prioritize product thinking and AI prompt engineering
` : buildMode === 'Send to Developers (Create PRD)' ? `
**For External Development Team**:
Plan for a complete development team that can execute the PRD:
- Include project manager/technical lead for coordination
- Full-stack developers or specialized frontend/backend roles
- QA engineer for testing
- DevOps for deployment
` : ''}

**Recommended Team Size**: Total number (adjusted for ${buildMode})

**Essential Roles** (Priority 1 - Must Have):
- List roles with responsibilities and skills
- Note if AI tools can supplement certain roles

**Important Roles** (Priority 2 - Should Have):
- Roles to add as you scale
- When to bring them on

**Nice-to-Have Roles** (Priority 3 - Can Outsource):
- Roles that can wait or be outsourced

${buildMode === 'Vibe Coder (Build it yourself with AI)' ? `
**Solo Founder with AI Tools**:
- What you can realistically build solo using Cursor/v0.dev/Bolt
- Which tasks still need human expertise
- AI tools that replace traditional roles
- When to bring on first hire
` : ''}

**Budget Reality Check** (User Budget: ${userBudget}):
- Can this team composition fit within ${userBudget}?
- Cost breakdown: salaries, contractors, tools
- Where to cut if budget is tight
- Alternative: equity-based compensation

**Timeline Impact** (User Timeline: ${userTimeline}):
- Can this team deliver in ${userTimeline}?
- Team size adjustments for faster/slower timeline

**Hiring Strategy**:
- Who to bring on first, second, third
- Full-time vs contract vs part-time
- Equity considerations

Be realistic about budget constraints and build mode limitations.`
      },
      budget: {
        system: "You are a startup financial advisor specializing in MVP budgeting and cost optimization.",
        user: `Based on this startup idea: "${idea}"

**Build Context**:
- Build Mode: ${buildMode || 'Not specified'}
- User's Budget: ${userBudget || 'Not specified'}
- User Timeline: ${userTimeline || 'Not specified'}

**CRITICAL: REALITY CHECK ON USER'S BUDGET**
User Budget: ${userBudget}
- Is ${userBudget} realistic for this idea?
- What can actually be built with ${userBudget}?
- If insufficient: What's the minimum viable budget?
- If excessive: Where is the user overestimating costs?

**AI's Recommended Budget**: Your realistic estimate (may differ from ${userBudget})

**Detailed Cost Breakdown** (adjusted for ${buildMode}):

${buildMode === 'Vibe Coder (Build it yourself with AI)' ? `
**For AI-Assisted Development**:
- AI Tool Subscriptions (Cursor Pro, GitHub Copilot, v0.dev, etc.)
- Infrastructure and hosting (lower due to solo/small team)
- Third-party services and APIs
- Design tools (if not using AI design tools)
- Learning resources for AI tools
Note: Lower personnel costs since you're building yourself with AI
` : buildMode === 'Send to Developers (Create PRD)' ? `
**For External Development**:
- Development team costs (higher - full team needed)
- Project management and coordination
- QA and testing
- Infrastructure and hosting
- Third-party services
- Buffer for scope changes (20-30% recommended)
` : `
**General Breakdown**:
- Development costs
- Design costs
- Infrastructure
- Third-party services
- Marketing/launch
`}

**Development Costs**: Personnel, contractors, or AI tools
**Design Costs**: UI/UX, brand, assets
**Third-Party Services**: Auth, payments, analytics, etc.
**One-Time Costs**: Domain, legal, setup
**Monthly Recurring**: Infrastructure, SaaS, support

**Gap Analysis**:
- User's budget: ${userBudget}
- Realistic budget: [Your estimate]
- Shortfall/Surplus: [Difference]
- Impact on timeline and scope

**Cost Optimization**:
- Free tier opportunities
- Open-source alternatives
- Where to cut if ${userBudget} is tight
- Essential vs nice-to-have spending

**Runway Calculation**:
- How long ${userBudget} will last
- When you'll need more funding
- Burn rate projections

Be brutally honest - if user's budget is unrealistic, explain exactly why and what needs to change.`
      },
      requirements: {
        system: "You are a senior software architect specializing in system design and technical requirements.",
        user: `Based on this startup idea: "${idea}"

**Build Context**:
- Build Mode: ${buildMode || 'Not specified'}
- User Budget: ${userBudget || 'Not specified'}
- User Timeline: ${userTimeline || 'Not specified'}

Format the requirements based on build mode:

${buildMode === 'Vibe Coder (Build it yourself with AI)' ? `
**For AI-Assisted Development**:
Structure this as an AI coding guide with:
- Step-by-step implementation plan for AI tools
- Specific prompts for Cursor AI / v0.dev / Bolt.new
- File structure optimized for AI generation
- Component breakdown for AI scaffolding
- Prompt templates for each major feature
- Common AI pitfalls and how to avoid them
- Testing strategy for AI-generated code
` : buildMode === 'Send to Developers (Create PRD)' ? `
**For External Development Team (PRD Format)**:
Structure this as a formal Product Requirements Document:
- Functional requirements with acceptance criteria
- Non-functional requirements (performance, security, etc.)
- Technical specifications for developer handoff
- API contracts and data models
- Testing requirements and QA criteria
- Definition of Done for each feature
- Developer handoff checklist
` : ''}

**Core Technical Requirements**:
- Must-have technical capabilities
- Performance requirements
- Security requirements
- Compliance needs

**System Architecture**:
- High-level architecture (${buildMode === 'Vibe Coder (Build it yourself with AI)' ? 'optimized for AI generation' : 'production-ready for dev team'})
- Frontend architecture
- Backend architecture
- Database design
- API design

${buildMode === 'Vibe Coder (Build it yourself with AI)' ? `
**AI Coding Workflow**:
- Phase 1 Prompts: Project setup and structure
- Phase 2 Prompts: Core feature scaffolding
- Phase 3 Prompts: Integration and testing
- Recommended AI tools for each phase
- File-by-file generation strategy
` : buildMode === 'Send to Developers (Create PRD)' ? `
**Functional Requirements**:
- Feature 1: Description, acceptance criteria, priority
- Feature 2: Description, acceptance criteria, priority
- Feature 3: Description, acceptance criteria, priority
- Edge cases and error handling
- User stories and use cases
` : ''}

**Key Integrations**:
- Third-party services (auth, payments, etc.)
- APIs to integrate
- Real-time features

**Infrastructure**:
- Hosting and deployment
- CDN and caching
- Monitoring and logging

**Development Requirements**:
- Version control
- CI/CD pipeline
- Testing strategy

**Budget & Timeline Constraints**:
- What can be built within ${userBudget}?
- What's achievable in ${userTimeline}?
- Trade-offs and priorities

${buildMode === 'Vibe Coder (Build it yourself with AI)' ? `
**Getting Started with AI Tools**:
1. Initial setup prompts
2. Project structure generation
3. Core feature development flow
4. Testing and deployment with AI assistance
` : buildMode === 'Send to Developers (Create PRD)' ? `
**Developer Handoff**:
1. PRD review and Q&A session
2. Technical architecture walkthrough
3. Access and credentials setup
4. Communication and reporting cadence
5. Milestone definitions and payment schedule
` : ''}

Be specific and tailored to the ${buildMode} selected.`
      },
      launchStrategy: {
        system: "You are a product launch strategist who recommends the optimal launch approach based on product type, budget, timeline, and founder experience level.",
        user: `Based on this startup idea: "${idea}"

**Launch Context**:
- Marketing Budget: ${existingData?.marketingBudget || 'Not specified'}
- Timeline: ${existingData?.launchTimeline || 'Not specified'}

Recommend the BEST launch strategy for this specific situation:

**Recommended Strategy**: [Pre-launch Hype / Soft Launch / Big Bang / Stealth Mode]

**Why This Strategy**:
- **Budget fit**: How this strategy works with ${existingData?.marketingBudget || 'their budget'}
- **Timeline fit**: Why this makes sense for ${existingData?.launchTimeline || 'their timeline'}
- **Product fit**: How this matches the product type and target audience
- **Founder fit**: Why this is good for first-time launchers

**What Each Strategy Means**:

**Pre-launch Hype**: Build audience 2-4 weeks before launch. Share journey publicly, tease features, collect waitlist, create anticipation. Best when you have time to build momentum.

**Soft Launch**: Quiet launch to small group first (beta testers, friends, early adopters). Iterate based on feedback. Then announce publicly after product is polished. Best for complex products needing validation.

**Big Bang**: Launch everywhere at once - Product Hunt + Reddit + Twitter + email list same day. Maximum visibility, high risk. Best with existing audience or strong product-market fit.

**Stealth Mode**: Launch without announcement. Grow through word-of-mouth, SEO, and organic discovery. Best for products that sell themselves or when avoiding competition scrutiny.

---

**Your Specific Approach** (Given ${existingData?.marketingBudget || 'your budget'} and ${existingData?.launchTimeline || 'your timeline'}):

**Phase 1: ${existingData?.launchTimeline === '1-2 weeks' ? 'Week 1 (Foundation)' : existingData?.launchTimeline === '2-4 weeks' ? 'Weeks 1-2 (Foundation)' : 'Month 1 (Foundation)'}**
- [ ] Specific action 1 with exact deliverable
- [ ] Specific action 2 with exact deliverable  
- [ ] Specific action 3 with exact deliverable
- 🎯 Goal: [What's achieved by end of phase 1]

**Phase 2: ${existingData?.launchTimeline === '1-2 weeks' ? 'Week 2 (Launch Prep)' : existingData?.launchTimeline === '2-4 weeks' ? 'Weeks 3-4 (Building Momentum)' : 'Month 2 (Building Momentum)'}**
- [ ] Specific action 1
- [ ] Specific action 2
- [ ] Specific action 3
- 🎯 Goal: [What's achieved by end of phase 2]

**Launch Execution**:
- [ ] Launch day action 1
- [ ] Launch day action 2
- [ ] Launch day action 3
- 🎯 Goal: [Launch day targets]

**Post-Launch (First 2 Weeks)**:
- [ ] Day 1-3: [Specific follow-up actions]
- [ ] Day 4-7: [Actions]
- [ ] Week 2: [Actions]
- 🎯 Goal: [Post-launch objectives]

---

**Budget Reality Check** (${existingData?.marketingBudget || 'Your budget'}):

${existingData?.marketingBudget === '$0 (Organic only)' 
  ? `With $0 budget, focus 100% on organic channels:
- Product Hunt (free)
- Reddit communities (free, but requires weeks of engagement first)
- Twitter/X building in public (free, requires daily posting)
- Your personal network (free, most underutilized)
- Time investment: 15-20 hours/week for 2-4 weeks

Realistic expectations:
- Launch day visitors: 50-200
- First week signups: 20-100
- Success metric: 10-20 engaged early users who provide feedback`
  : existingData?.marketingBudget && (existingData.marketingBudget.includes('$50') || existingData.marketingBudget.includes('$200'))
  ? `With ${existingData.marketingBudget}, you can:
- Do all organic tactics (Product Hunt, Reddit, Twitter)
- PLUS small paid boost on best-performing post ($50-100)
- PLUS micro-influencer outreach ($50-100)
- Time investment: 10-15 hours/week

Realistic expectations:
- Launch day visitors: 200-500
- First week signups: 50-200
- Success metric: Identify which channel drives best users`
  : `With ${existingData?.marketingBudget}, you can:
- All organic channels
- Paid ads on 1-2 platforms
- Influencer partnerships
- Premium launch placements
- Time investment: 10-15 hours/week

Realistic expectations:
- Launch day visitors: 500-2,000+
- First week signups: 100-500+
- Success metric: Sustainable acquisition channel`
}

---

**Why NOT the other strategies**:

${existingData?.launchTimeline === '1-2 weeks'
  ? '❌ Pre-launch Hype requires 3-4 weeks minimum - you don\'t have time\n❌ Soft Launch works but delays public announcement'
  : ''}
[Explain why the other 2-3 strategies aren't recommended for this specific situation]

---

**Success Metrics for This Strategy**:
1. [Metric 1 specific to this strategy]
2. [Metric 2 specific to this strategy]  
3. [Metric 3 specific to this strategy]

Be specific, actionable, and honest about what's achievable. Provide exact steps, not generic advice.`
      },
      primaryChannel: {
        system: "You are a product launch strategist specializing in identifying the best marketing channels for startups based on their product, audience, and budget.",
        user: `Based on this startup idea: "${idea}"

**Launch Context**:
- Launch Strategy: ${existingData?.launchStrategy || 'Not specified'}
- Marketing Budget: ${existingData?.marketingBudget || 'Not specified'}
- Timeline: ${existingData?.launchTimeline || 'Not specified'}

Recommend the SINGLE BEST primary launch channel for this product and budget:

**Recommended Channel**: [Name]

**Why This Channel**:
- Audience fit (why your target users are here)
- Budget fit (is it realistic for ${existingData?.marketingBudget || 'their budget'}?)
- Timeline fit (can you build presence in ${existingData?.launchTimeline || 'their timeline'}?)
- Success examples (similar products that won here)

**How to Prepare** (specific, actionable steps):
1. [Week before launch preparation step]
2. [Days before launch preparation step]
3. [Launch day tactics]
4. [Post-launch follow-up]

**Realistic Expectations**:
- Expected reach with ${existingData?.marketingBudget || 'this budget'}
- Typical conversion rates for this channel
- Timeline to see results

**Alternative Channels** (if primary doesn't work):
- Backup option 1: [Channel name & why]
- Backup option 2: [Channel name & why]

Be honest - if budget is $0, recommend only organic channels (Product Hunt, Reddit, Twitter, Hacker News). If budget is $5K+, can consider paid ads.`
      },
      launchTactics: {
        system: "You are a launch execution expert who creates week-by-week, day-by-day action plans for startup launches.",
        user: `Based on this startup idea: "${idea}"

**Launch Context**:
- Launch Strategy: ${existingData?.launchStrategy || 'Not specified'}
- Marketing Budget: ${existingData?.marketingBudget || 'Not specified'}
- Timeline: ${existingData?.launchTimeline || 'Not specified'}

Create a detailed, week-by-week pre-launch and launch action plan:

**Timeline: ${existingData?.launchTimeline || '[Timeline]'}**

**Pre-Launch Phase** (First 50-70% of timeline):

**Week 1-2: Foundation**
- [ ] Specific task 1 with exact deliverable
- [ ] Specific task 2 with exact deliverable
- [ ] Specific task 3 with exact deliverable
- 🎯 Goal: [What's achieved by end of week 2]

**Week 3-4: Building Momentum**
- [ ] Specific outreach tasks (with numbers: "Contact 50 potential users")
- [ ] Content creation (with examples: "Write 3 blog posts about [topics]")
- [ ] Community engagement (with places: "Post in r/[subreddit]")
- 🎯 Goal: [What's achieved by end of week 4]

**Launch Week**: 

**3 Days Before**:
- [ ] Final checklist item 1
- [ ] Final checklist item 2
- [ ] Schedule social posts

**Launch Day**:
- Hour-by-hour schedule if on Product Hunt or similar
- [ ] 12:01 AM: [Action]
- [ ] 8:00 AM: [Action]
- [ ] 12:00 PM: [Action]
- [ ] 5:00 PM: [Action]

**Post-Launch (First 7 Days)**:
- [ ] Day 1: [Specific follow-up actions]
- [ ] Day 2-3: [Actions]
- [ ] Day 4-7: [Actions]

**Budget Allocation** (Total: ${existingData?.marketingBudget || '$X'}):
${existingData?.marketingBudget === '$0 (Organic only)' 
  ? '- All organic tactics (no paid spend)\n- Time investment: X hours/week' 
  : '- Paid ads: $X\n- Tools/software: $X\n- Content creation: $X\n- Remaining for opportunistic spending: $X'
}

**Key Metrics to Track Daily**:
1. [Metric 1] - Target: X
2. [Metric 2] - Target: X
3. [Metric 3] - Target: X

Make every task specific and actionable. Include exact numbers, tools, and platforms.`
      },
      contentPlan: {
        system: "You are a content marketing strategist who creates specific content plans with example headlines and posting schedules.",
        user: `Based on this startup idea: "${idea}"

**Launch Context**:
- Launch Strategy: ${existingData?.launchStrategy || 'Not specified'}
- Marketing Budget: ${existingData?.marketingBudget || 'Not specified'}
- Timeline: ${existingData?.launchTimeline || 'Not specified'}

Create a comprehensive content plan with SPECIFIC examples:

**Content Pillars** (3-4 main themes):
1. **[Pillar Name]**: Why this matters to your audience
2. **[Pillar Name]**: Why this matters to your audience
3. **[Pillar Name]**: Why this matters to your audience

**Pre-Launch Content** (Timeline: ${existingData?.launchTimeline || '[Timeline]'}):

**Blog Posts** (2-3 posts):
1. **"[Exact Headline]"**
   - Topic: [What it covers]
   - Angle: [Unique perspective]
   - CTA: [What readers should do]
   - When to publish: [X weeks before launch]

**Social Media Posts**:

**Twitter/X** (15-20 tweets):
- Example Tweet 1: "[Exact tweet copy 280 chars]"
- Example Tweet 2: "[Exact tweet copy]"
- Example Tweet 3: "[Exact tweet copy]"
- Posting schedule: 2-3 tweets/day, optimal times

**LinkedIn** (5-7 posts):
- Post 1: "[First line hook + topic]"
- Post 2: "[First line hook + topic]"
- When: [Day of week + time]

**Reddit** (3-5 posts):
- Subreddit 1: r/[name] - Post angle: "[Specific approach]"
- Subreddit 2: r/[name] - Post angle: "[Specific approach]"
- Important: Engage authentically, don't just post links

**Video Content** (if budget allows):
- Video 1: "[Title] - [30-sec description]"
- Video 2: "[Title] - [30-sec description]"
- Platform: YouTube, TikTok, or LinkedIn?

**Launch Day Content**:
- Product Hunt launch post: "[Tagline + first paragraph]"
- Email to warm audience: "[Subject line + opening]"
- Social announcement: "[Celebration post template]"

**Post-Launch Content** (First 2 weeks):
- Success stories: How to collect and share
- Behind-the-scenes: Team, process, journey
- User testimonials: How to gather and format
- Lessons learned: Transparent post about launch experience

**Content Tools** (Budget: ${existingData?.marketingBudget || '$X'}):
${existingData?.marketingBudget === '$0 (Organic only)'
  ? '- Free tools: Canva (free tier), Buffer (free tier), Grammarly\n- Time investment: X hours/week for content creation'
  : '- Recommended: Canva Pro ($13/mo), Buffer ($15/mo), stock photos ($X)\n- Consider: Freelance writer for 1-2 posts ($X)'
}

**Content Calendar Template**:
[Provide a simple weekly schedule showing when to post what, on which platform]

Give EXACT examples, not placeholders. Make headlines and copy compelling and specific to the product.`
      },
      communityStrategy: {
        system: "You are a community building expert who helps startups identify and engage with their ideal communities authentically.",
        user: `Based on this startup idea: "${idea}"

**Launch Context**:
- Launch Strategy: ${existingData?.launchStrategy || 'Not specified'}
- Marketing Budget: ${existingData?.marketingBudget || 'Not specified'}
- Timeline: ${existingData?.launchTimeline || 'Not specified'}

Create a specific community building strategy:

**Where Your Users Hang Out**:

**Primary Communities** (3-5 specific places):
1. **[Platform/Community Name]** - [e.g., r/SaaS, Indie Hackers, specific Discord]
   - Size: [# members]
   - Why relevant: [Specific fit]
   - Entry strategy: [How to join and contribute without spamming]
   - Rules: [Key rules to follow]
   - Best practices: [What works here]

**Secondary Communities** (2-3 backup places):
1. **[Platform/Community Name]**
   - Why relevant
   - Entry strategy

**Engagement Playbook**:

**Week 1-2: Lurk & Learn**
- [ ] Join communities
- [ ] Read top posts from last month
- [ ] Understand community culture
- [ ] Identify most active members
- 🎯 Goal: Understand what value looks like here

**Week 3-4: Give First**
- [ ] Comment on 5-10 posts per day with genuine value
- [ ] Answer questions in your expertise area
- [ ] Share useful resources (not your product)
- [ ] Build profile/reputation
- 🎯 Goal: Become recognized helpful member

**Launch Week: Share Authentically**
- [ ] Soft mention in relevant discussions (not spammy)
- [ ] "Show your work" post with journey/behind-the-scenes
- [ ] Ask for feedback (people love being asked)
- [ ] Launch announcement (only if rules allow)
- 🎯 Goal: Get first users from community

**Post-Launch: Maintain Presence**
- [ ] Weekly engagement schedule
- [ ] Share wins and learnings
- [ ] Continue helping others
- [ ] Build relationships with other founders
- 🎯 Goal: Long-term community presence

**DOs and DON'Ts**:
✅ DO:
- Provide value first
- Be transparent about being a founder
- Ask for feedback, not just promote
- Engage with others' content
- Follow community rules strictly

❌ DON'T:
- Post and ghost
- Only engage when promoting
- Ignore community culture
- Spam across multiple subreddits
- Ask for upvotes/engagement

**Build Your Own Community**:

**Twitter/X Strategy**:
- Tweet cadence: [X tweets/day]
- Content mix: [X% educational, X% personal, X% product]
- Engagement targets: Reply to X people/day
- Hashtags to use: [#specific #hashtags]

**Email List Building**:
- Lead magnet: [Specific valuable resource to offer]
- Email frequency: [Weekly/bi-weekly]
- Content mix: [Educational vs promotional ratio]
- Goal: [X subscribers by launch]

**Discord/Slack Community** (if applicable):
- Should you build one? [Yes/No + reasoning]
- If yes: [Initial structure and channels]
- If no: [Join existing communities instead]

**Community Management Time**:
${existingData?.marketingBudget === '$0 (Organic only)'
  ? '- Expect 1-2 hours/day for authentic community engagement\n- This is your primary growth channel with no budget'
  : '- Budget 5-10 hours/week for community engagement\n- Consider community management tools: [Specific tools]'
}

**Success Metrics**:
- Week 1: [X meaningful conversations]
- Week 2: [X profile followers/karma increase]
- Launch week: [X community-driven signups]
- Month 1: [X active community members/advocates]

Be SPECIFIC with exact community names, subreddits, Discord servers, Slack groups that are active and relevant to this product.`
      },
      metricsTracking: {
        system: "You are an analytics consultant who helps startups set up simple, actionable metrics tracking focused on what actually matters for launch.",
        user: `Based on this startup idea: "${idea}"

**Launch Context**:
- Launch Strategy: ${existingData?.launchStrategy || 'Not specified'}
- Marketing Budget: ${existingData?.marketingBudget || 'Not specified'}
- Timeline: ${existingData?.launchTimeline || 'Not specified'}

Create a simple metrics tracking plan:

**5 Core Launch Metrics** (Track these daily):

1. **[Metric Name - e.g., "Landing Page Visitors"]**
   - What it measures: [Why this matters]
   - Target: [Realistic number for launch]
   - How to track: [Specific tool and setup]
   - Warning signs: [When to worry]

2. **[Metric Name - e.g., "Signup Conversion Rate"]**
   - What it measures
   - Target: [X%]
   - How to track
   - Warning signs

3. **[Metric Name - e.g., "Activation Rate"]**
   - What it measures
   - Target
   - How to track
   - Warning signs

4. **[Metric Name - e.g., "Engagement"]**
   - What it measures
   - Target
   - How to track
   - Warning signs

5. **[Metric Name - e.g., "Referral/Word of Mouth"]**
   - What it measures
   - Target
   - How to track
   - Warning signs

**Analytics Tools Setup**:

**Primary: Google Analytics 4** (Free)
- Events to track:
  - [ ] Page views
  - [ ] Button clicks: [Specific buttons]
  - [ ] Form submissions
  - [ ] [Product-specific actions]
- Setup time: 30 minutes
- Tutorial: [Link or quick guide]

${existingData?.marketingBudget !== '$0 (Organic only)' 
  ? `**Alternative: Plausible or PostHog** ($9-19/mo)
- Why consider: Privacy-friendly, simpler interface
- Setup time: 15 minutes
- Good for: Founders who want cleaner dashboards` 
  : `**Free Alternatives**:
- Plausible (free tier available)
- PostHog (free tier: 1M events/mo)
- Simpler than Google Analytics`
}

**Dashboard Setup**:

**Simple Daily Dashboard** (Track these every morning):

Create a simple table in Google Sheets or Notion:
- Column 1: Metric name
- Column 2: Today's value
- Column 3: Yesterday's value
- Column 4: Week average
- Column 5: Target

Track your 5 core metrics in this format daily.

**Tool**: Google Sheets (free) or Notion (free)

**Weekly Review Questions**:
1. Which metric is below target? Why?
2. Which metric is exceeding expectations?
3. What one thing can we change this week to improve?
4. Are we tracking the right things?

**Launch Day Specific Tracking**:

**Hourly Monitoring** (Launch day only):
- Hour 1: [X visitors, X signups]
- Hour 6: [X visitors, X signups]
- Hour 12: [X visitors, X signups]
- Hour 24: [Total numbers]

**Social Metrics**:
- Product Hunt: Upvotes, comments, position
- Twitter: Impressions, engagement rate
- Reddit: Upvotes, comments
- HackerNews: Points, comments

**Email Metrics** (if sending launch email):
- Open rate: Target: 25-35%
- Click rate: Target: 3-8%
- Conversion rate: Target: 1-3%

**What NOT to Track** (Don't waste time on):
- ❌ Vanity metrics (page views without context)
- ❌ Social media follower count (engagement matters more)
- ❌ Too many metrics (5 is enough for launch)
- ❌ Metrics you won't act on

**Budget for Tools**:
${existingData?.marketingBudget === '$0 (Organic only)'
  ? '- Use free tiers: Google Analytics, Google Sheets\n- Time investment: 15 min/day to check metrics'
  : `- Recommended budget: $20-50/mo for analytics tools
  - Google Analytics (free) + one paid tool ($X/mo)
  - Consider: Hotjar for heatmaps, Mixpanel for events`
}

**After Launch (First 30 Days)**:

**Weekly Cohort Analysis**:
- Week 1 signups: X% activated, X% retained
- Week 2 signups: X% activated, X% retained
- Track for first 4 weeks

**When to Pivot Metrics**:
- After 2 weeks: Review if tracking right things
- After 1 month: Add retention/revenue metrics
- After 3 months: Focus on growth and scaling

**Simple Template**:
[Provide exact Google Sheets template structure or link to free template]

Focus on actionable metrics that a beginner can set up in under 1 hour. Provide exact tool names and setup steps.`
      },
      // Monetise stage prompts
      targetCustomer: {
        system: "You are a monetization strategist who identifies the first paying customer segment and explains why they will buy now.",
        user: `Based on this startup idea: "${idea}"

**Monetise Context**:
- MRR Goal: ${revenueGoal || 'Not specified'}
- Time Horizon: ${timeHorizon || 'Not specified'}

Define the FIRST paying customer segment(s):

**Primary Segment**: [Name]
- Why they'll pay now
- Where to find them (specific communities, platforms)
- Buying triggers and objections

**Secondary Segment(s)**: [If relevant]

**Acquisition Plan (Week 1-4)**:
- Week 1: [Exact outreach and channels]
- Week 2: [Validation calls or demo sessions]
- Week 3: [Pilot/beta offer]
- Week 4: [Close first 5-10 paying customers]

Keep it concrete and beginner-friendly.`
      },
      businessModelPlan: {
        system: "You are a revenue model designer who recommends the optimal monetization model with rationale and trade-offs.",
        user: `Based on this startup idea: "${idea}"

**Monetise Context**:
- MRR Goal: ${revenueGoal || 'Not specified'}
- Time Horizon: ${timeHorizon || 'Not specified'}

Recommend the best business model:

**Recommended Model**: [SaaS subscription / Usage-based / Marketplace / Commission / Licensing / Hybrid]

**Why This Model**:
- Customer value alignment
- Simplicity to implement for a solo/lean team
- Speed to first dollars
- Scalability potential

**How to Implement** (step-by-step):
1. [Setup billing with Stripe/LemonSqueezy]
2. [Define billing units/tiers]
3. [Trial/guarantee policy]
4. [Key usage metrics to track]

**Trade-offs & Risks**:
- [What you give up]
- [Where this might fail and what to watch]

Be practical and specific.`
      },
      pricingTiers: {
        system: "You are a pricing strategist who creates simple, clear tiers with strong upgrade paths and guarantees.",
        user: `Based on this startup idea: "${idea}"

Design pricing and tiers (optimize for fast adoption and upgrades):

**Tier Structure (Example)**:
1. **Starter** — $[price]/mo
   - For: [who]
   - Includes: [3-5 bullet features]

2. **Pro** — $[price]/mo
   - For: [who]
   - Includes: [features]
   - Value: [why this is best value]

3. **Business** — $[price]/mo
   - For: [who]
   - Includes: [features]
   - Support: [SLA/priority]

**Add-ons/Usage**: [if applicable]

**Discounts & Trials**:
- Free trial length
- Annual discount suggestion
- Money-back guarantee (reduces risk, increases conversion)

**Upgrade Path**: When should a user move from Starter → Pro → Business

Provide specific price points and make them feel reasonable for a first-time founder audience.`
      },
      unitEconomics: {
        system: "You are a finance coach for indie founders. Create a simple, editable unit economics model with assumptions clearly marked.",
        user: `Based on this startup idea: "${idea}"

**Monetise Context**:
- MRR Goal: ${revenueGoal || 'Not specified'}
- Time Horizon: ${timeHorizon || 'Not specified'}

Build a simple model:

**Assumptions**:
- ARPU (average monthly revenue per user): $[value]
- Gross margin: [percent]%
- CAC (customer acquisition cost): $[value]
- Churn rate (monthly): [percent]%

**Key Outputs**:
- LTV (lifetime value): $[formula]
- CAC Payback Period: [months]
- Break-even users (cover monthly costs of $[estimate]): [users]

**Notes**:
- Where to reduce CAC
- How to increase ARPU (upsells, add-ons)
- How to reduce churn (success milestones, habit loops)

Keep numbers realistic and explain how to tweak them.`
      },
      growthLoops: {
        system: "You are a growth engineer. Propose 2-3 compounding growth loops and exact steps to implement them.",
        user: `Based on this startup idea: "${idea}"

Propose growth loops with step-by-step setup:

**Loop 1: Referral**
- Incentive: [what users get]
- Trigger: [when to ask]
- Mechanics: [how to implement with tools]
- Weekly cadence: [actions]

**Loop 2: Content → SEO → Signups**
- Topics: [specific topics]
- Posting schedule: [per week]
- Distribution: [platforms]
- Measurement: [metrics]

**Loop 3: Integrations/App Marketplace (if applicable)**
- Partner list: [names]
- Listing steps
- Co-marketing ideas

Make it specific and newbie-friendly.`
      },
      revenueRoadmap: {
        system: "You are a revenue coach for early-stage startups. Create a clear month-by-month roadmap to hit an MRR target.",
        user: `Based on this startup idea: "${idea}"

**Monetise Context**:
- MRR Goal: ${revenueGoal || 'Not specified'}
- Time Horizon: ${timeHorizon || 'Not specified'}

Create a month-by-month plan to reach the goal:

**Month 1**:
- [Acquisition target], [Activation target]
- Actions: [list]

**Month 2**:
- [Targets]
- Actions

**Month 3**:
- [Targets]
- Actions

Continue until ${timeHorizon}. For each month, include:
- Acquisition target (# new users)
- Conversion target (% to paid)
- MRR target
- Primary channel focus

End with a summary of risks, leading indicators, and what to do if behind plan.`
      }
    };

    const prompt = fieldPrompts[fieldName as keyof typeof fieldPrompts];
    if (!prompt) {
      return NextResponse.json({ error: 'Invalid field name' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: prompt.system
        },
        {
          role: "user",
          content: prompt.user
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      console.error(`OpenAI returned empty content for field ${fieldName}`);
      return NextResponse.json(
        { error: "No content returned from AI. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ result: content });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json({ error: 'Failed to generate field content' }, { status: 500 });
  }
}
