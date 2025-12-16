# SQL Migration Scripts Analysis

## Overview
This document analyzes which SQL migration scripts are still required vs. which can be skipped for production deployment.

## Script 20: `setup-staging-database.sql` - Comprehensive Setup Script

**Purpose**: Creates all base tables for a fresh database setup.

**What it includes:**
- ✅ `projects` table
- ✅ `ai_configs` table (base structure only)
- ✅ `project_stages` table
- ✅ `validation_reports` table (with `section_results` and `completed_actions` columns)
- ✅ `validated_ideas` table
- ✅ `design_blueprints` table
- ✅ `build_blueprints` table
- ✅ `launch_blueprints` table
- ✅ `monetise_blueprints` table

**What it does NOT include:**
- ❌ Additional columns for `ai_configs` (scripts 02-05, 07-08, 14, 16)
- ❌ Validation v2 fields (script 18)
- ❌ `stage_settings` table (script 17)
- ❌ `idea_improvements` table (script 21)

## Scripts That Are SUPERSEDED by Script 20

These scripts create tables that are already included in script 20. **You can skip these if using script 20:**

1. **Script 01**: `01-create-ai-configs-table.sql` 
   - ❌ **SUPERSEDED** - Table creation is in script 20 (but script 20 doesn't include all columns)

2. **Script 06**: `06-create-validation-reports-table.sql`
   - ❌ **SUPERSEDED** - Table creation is in script 20 (includes `section_results` and `completed_actions`)

3. **Script 09**: `09-add-section-results-column.sql`
   - ❌ **SUPERSEDED** - Column is added in script 20

4. **Script 10**: `10-add-completed-actions-column.sql`
   - ❌ **SUPERSEDED** - Column is added in script 20

5. **Script 11**: `11-create-design-blueprints-table.sql`
   - ❌ **SUPERSEDED** - Table creation is in script 20

6. **Script 12**: `12-create-build-blueprints-table.sql`
   - ❌ **SUPERSEDED** - Table creation is in script 20

7. **Script 13**: `13-create-launch-blueprints-table.sql`
   - ❌ **SUPERSEDED** - Table creation is in script 20

8. **Script 15**: `15-create-monetise-blueprints-table.sql`
   - ❌ **SUPERSEDED** - Table creation is in script 20

9. **Script 19**: `19-create-validated-ideas-table.sql`
   - ❌ **SUPERSEDED** - Table creation is in script 20

## Scripts That Are STILL REQUIRED

These scripts add functionality NOT included in script 20. **You MUST run these:**

1. **Script 02**: `02-add-ideate-prompt-columns.sql` ✅ **REQUIRED**
   - Adds `user_prompt_template_idea` and `user_prompt_template_problem` to `ai_configs`

2. **Script 03**: `03-add-ideate-system-prompts.sql` ✅ **REQUIRED**
   - Adds `system_prompt_idea` and `system_prompt_problem` to `ai_configs`
   - Note: Script 20 adds these columns but doesn't populate them

3. **Script 04**: `04-add-surprise-mode.sql` ✅ **REQUIRED**
   - Adds `system_prompt_surprise` to `ai_configs`

4. **Script 05**: `05-add-build-mode-prompts.sql` ✅ **REQUIRED**
   - Adds `system_prompt_vibe_coder` and `system_prompt_send_to_devs` to `ai_configs`

5. **Script 07**: `07-add-ideate-review-prompt.sql` ✅ **REQUIRED**
   - Adds `system_prompt_review` to `ai_configs`

6. **Script 08**: `08-add-ideate-review-user-prompt.sql` ✅ **REQUIRED**
   - Adds `user_prompt_template_review` to `ai_configs`

7. **Script 14**: `14-add-launch-prompt-columns.sql` ✅ **REQUIRED**
   - Adds 8 launch-specific system prompt columns to `ai_configs`

8. **Script 16**: `16-add-monetise-prompt-columns.sql` ✅ **REQUIRED**
   - Adds 7 monetise-specific system prompt columns to `ai_configs`

9. **Script 17**: `17-create-stage-settings-table.sql` ✅ **REQUIRED**
   - Creates `stage_settings` table (not in script 20)

10. **Script 18**: `18-add-validation-v2-fields.sql` ✅ **REQUIRED**
    - Adds validation v2 fields to `validation_reports` (not in script 20)

11. **Script 21**: `21-create-idea-improvements-table.sql` ✅ **REQUIRED**
    - Creates `idea_improvements` table (not in script 20)

## Recommended Production Deployment Strategy

### Option 1: Fresh Database (Recommended)
If setting up a **new production database**:

1. Run `20-setup-staging-database.sql` first (creates all base tables)
2. Then run these scripts in order:
   - `02-add-ideate-prompt-columns.sql`
   - `03-add-ideate-system-prompts.sql`
   - `04-add-surprise-mode.sql`
   - `05-add-build-mode-prompts.sql`
   - `07-add-ideate-review-prompt.sql`
   - `08-add-ideate-review-user-prompt.sql`
   - `14-add-launch-prompt-columns.sql`
   - `16-add-monetise-prompt-columns.sql`
   - `17-create-stage-settings-table.sql`
   - `18-add-validation-v2-fields.sql`
   - `21-create-idea-improvements-table.sql`

**Total: 1 setup script + 11 incremental scripts = 12 scripts**

### Option 2: Existing Database
If you have an **existing database** that may have some migrations already applied:

1. Run `validate-migrations.sql` to check what's missing
2. Run only the missing scripts in order (01-21, skipping any already applied)

## Scripts You Can DELETE (if using script 20)

These scripts are redundant if you're using script 20 for initial setup:

- ❌ `01-create-ai-configs-table.sql`
- ❌ `06-create-validation-reports-table.sql`
- ❌ `09-add-section-results-column.sql`
- ❌ `10-add-completed-actions-column.sql`
- ❌ `11-create-design-blueprints-table.sql`
- ❌ `12-create-build-blueprints-table.sql`
- ❌ `13-create-launch-blueprints-table.sql`
- ❌ `15-create-monetise-blueprints-table.sql`
- ❌ `19-create-validated-ideas-table.sql`

**Note**: Keep these files in your repository for historical reference, but you don't need to run them in production if using script 20.

## Summary

- **Scripts to run for fresh production**: 12 scripts (1 setup + 11 incremental)
- **Scripts that can be skipped**: 9 scripts (superseded by script 20)
- **Total scripts in repository**: 21 scripts + validation script

