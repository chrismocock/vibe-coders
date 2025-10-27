# Separate System Prompts Implementation Summary

## What Was Implemented

Successfully added separate system prompts for "Problem to Solve" and "Idea to Explore" modes in the Ideate stage, allowing different AI personalities and response formats for each mode.

## Files Modified

### 1. Database Migration

**File**: `scripts/add-ideate-system-prompts.sql` (NEW)

- Added `system_prompt_idea` column to `ai_configs` table
- Added `system_prompt_problem` column to `ai_configs` table
- Includes default values for existing ideate records
- Added column comments for documentation

### 2. Type Definitions

**File**: `src/lib/aiConfig.ts`

- Updated `AIConfig` interface with new optional fields:
  - `system_prompt_idea?: string`
  - `system_prompt_problem?: string`
- Added default system prompts for both modes in `defaultAIConfigs.ideate`

### 3. Backend API Updates

**File**: `src/app/api/admin/ai-config/route.ts`

- Updated POST handler to accept `system_prompt_idea` and `system_prompt_problem`
- Modified database UPDATE operation to save new fields
- Modified database INSERT operation to include new fields

**File**: `src/app/api/ai/ideate/route.ts`

- Added retrieval of mode-specific system prompts from config
- Added logic to select appropriate system prompt based on mode:
  - "Idea to Explore" → uses `system_prompt_idea` (fallback to generic)
  - "Problem to Solve" → uses `system_prompt_problem` (fallback to generic)
- OpenAI API call now uses the selected mode-specific system prompt

**File**: `src/app/api/admin/auth/route.ts` (PREVIOUS CHANGE)

- Fixed to use environment variables for admin credentials

### 4. Frontend Admin UI

**File**: `src/components/admin/AIConfig.tsx`

- Updated `AIConfig` interface with new fields
- Modified `saveConfig` function to include new fields in API request
- Added UI sections for mode-specific system prompts (only visible for Ideate stage):
  - "System Prompt — Problem to Solve (Ideate)"
  - "System Prompt — Idea to Explore (Ideate)"
- Updated generic system prompt label to indicate it's a fallback
- Added helper text explaining fallback behavior

## How It Works

1. **Admin Configuration**:
   - Admin navigates to `/admin` → AI Configuration tab
   - Expands the Ideate stage
   - Sees three system prompt fields:
     - Generic/Fallback (always used as fallback)
     - Problem to Solve (used when mode is "Problem to Solve")
     - Idea to Explore (used when mode is "Idea to Explore")
   - Can customize each prompt independently

2. **Runtime Behavior**:
   - User selects a mode in the Ideate form ("Problem to Solve" or "Idea to Explore")
   - API retrieves all system prompts from database
   - Selects the appropriate mode-specific system prompt
   - Falls back to generic system prompt if mode-specific one is empty
   - Sends selected system prompt to OpenAI API

3. **Fallback Chain**:
   - Mode-specific system prompt (if exists and not empty)
   - → Generic system prompt from database (if exists)
   - → Default system prompt from code

## Next Steps

### Required: Database Migration

Run the SQL migration in your Supabase dashboard:

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents from `scripts/add-ideate-system-prompts.sql`
3. Execute the SQL
4. Verify columns were added successfully

### Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Restart development server
- [ ] Navigate to admin panel → AI Configuration
- [ ] Expand Ideate stage
- [ ] Verify new system prompt fields appear
- [ ] Set different system prompts for each mode
- [ ] Save configuration
- [ ] Test idea generation with "Problem to Solve" mode
- [ ] Test idea generation with "Idea to Explore" mode
- [ ] Verify different AI personalities in responses

## Default System Prompts

### Problem to Solve Mode

Focuses on problem-solving expertise, generating solutions that address specific problems with clear value propositions.

### Idea to Explore Mode

Acts as a startup strategist and SaaS naming consultant, helping develop raw ideas into compelling startup concepts with different market positioning options.

## Benefits

1. **Better Context**: AI can adopt different personalities based on user intent
2. **Improved Results**: Mode-specific prompts generate more relevant ideas
3. **Flexibility**: Admins can fine-tune AI behavior for each mode independently
4. **Backward Compatible**: Falls back to generic prompt if mode-specific ones aren't set
