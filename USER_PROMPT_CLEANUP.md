# User Prompt Template Cleanup

## ✅ What Was Fixed

Cleaned up the user prompt templates to remove duplicate instructions, role definitions, and meta-information that belonged in system prompts.

## 🔴 Problems That Were Fixed

### Before (WRONG):

**User Prompt Templates contained:**

- ❌ Role definitions ("You are helping to ideate solutions...")
- ❌ Formatting instructions
- ❌ Meta-instructions ("At the bottom state what AI was used...")
- ❌ Duplicate content from system prompts

**Example of BAD user prompt:**

```
You are helping to ideate solutions to a specific problem.
Generate 3 completely different startup ideas that solve this problem: ${input}.
Consider any constraints: ${constraints}.
Format: name, brief, detailed description...

At the bottom of the idea state what AI was used to generate this
and the full prompt that was used
```

### After (CORRECT):

**User Prompt Templates now contain:**

- ✅ Only the user's actual request
- ✅ Simple, clean data passing
- ✅ No duplicate instructions

**Example of GOOD user prompt:**

```
I want to solve this problem: ${input}
```

Then constraints and market are added dynamically by the API.

## 📝 Changes Made

### 1. Updated Default Configs (`src/lib/aiConfig.ts`)

**Generic Template:**

```javascript
user_prompt_template: "Generate 3 completely different startup ideas based on this input: ${input}. Each idea should be a separate business concept, not features of the same platform.";
```

**Problem to Solve Template:**

```javascript
user_prompt_template_problem: "I want to solve this problem: ${input}";
```

**Idea to Explore Template:**

```javascript
user_prompt_template_idea: "I want to explore and develop this idea: ${input}";
```

### 2. Updated API Logic (`src/app/api/ai/ideate/route.ts`)

**Simplified the prompt building:**

- Uses clean templates from config
- Adds constraints and market dynamically
- Removes all the manual duplication
- Cleaner, more maintainable code

## 🎯 How It Works Now

### API Call Flow:

**1. System Prompt (Sets AI Role):**

```
System: "You are an expert startup ideation coach specializing in problem-solving.
Generate exactly 3 different startup ideas..."
```

**2. User Prompt (User's Request):**

```
User: "I want to solve this problem: abandoned shopping carts

Constraints/Requirements: Must be low-cost

Target Market: E-commerce"
```

**3. AI Response:**

```
1. CartSaver - Smart reminder system
[Details...]

2. CheckoutFlow - One-click checkout
[Details...]

3. CartRecovery - AI-powered recovery emails
[Details...]
```

## ✅ Benefits

1. **No Confusion**: AI receives clear, separate instructions
2. **No Duplication**: Role is defined once in system prompt
3. **Cleaner Templates**: Easy to understand and modify
4. **Better Results**: AI knows exactly what to do
5. **Maintainable**: Clear separation of concerns

## 🔄 What You Should Do

### In Admin Panel:

When you configure prompts in `/admin` → AI Configuration → Ideate:

**System Prompts:**

- Use these to define the AI's role, personality, and format
- Include all instructions and formatting rules
- Be detailed and specific

**User Prompt Templates:**

- Keep these simple and clean
- Just pass the user's data
- Use variables like `${input}`, `${market}`, `${constraints}`
- Don't repeat role definitions or instructions

### Example Good Configuration:

**System Prompt — Problem to Solve:**

```
You are an expert startup ideation coach specializing in problem-solving.
Generate exactly 3 different startup ideas that address the specific problem.
Focus on innovative solutions with clear value propositions.

Format each idea as:
1. [Idea Name] - [Brief description]
[Detailed description with key features, target market, and unique value proposition]

...
```

**User Prompt Template — Problem to Solve:**

```
I want to solve this problem: ${input}
```

That's it! The API will add constraints and market automatically.

## 📊 Template Variables Available

You can use these variables in your user prompt templates:

- `${input}` - The user's problem or idea
- `${market}` - Target market (if provided)
- `${constraints}` - Requirements/constraints (if provided)
- `${mode}` - The selected mode

The API automatically handles adding constraints and market to the prompt, so you only need `${input}` in most cases.

## 🚀 Result

**Clean separation:**

- System Prompt = WHO the AI is and HOW to respond
- User Prompt = WHAT the user wants

No more confusion, duplicate instructions, or meta-information cluttering the prompts!
