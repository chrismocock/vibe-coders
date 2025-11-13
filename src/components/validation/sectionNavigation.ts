import { ValidationSection } from '@/server/validation/types';

export interface SectionNavigation {
  nextSection: ValidationSection;
  nextLabel: string;
  description: string;
}

export const SECTION_NAVIGATION: Record<string, SectionNavigation> = {
  'problem': {
    nextSection: 'market',
    nextLabel: 'Market Demand',
    description: 'Understand if enough users experience this problem',
  },
  'market': {
    nextSection: 'competition',
    nextLabel: 'Competition Intelligence',
    description: 'Assess the competitive landscape and differentiation opportunities',
  },
  'competition': {
    nextSection: 'audience',
    nextLabel: 'Audience Fit',
    description: 'Evaluate audience fit, demographics, and product-market fit',
  },
  'audience': {
    nextSection: 'feasibility',
    nextLabel: 'Feasibility Analysis',
    description: 'Assess technical feasibility, resource requirements, and implementation complexity',
  },
  'feasibility': {
    nextSection: 'pricing',
    nextLabel: 'Pricing Potential',
    description: 'Evaluate pricing potential, willingness to pay, and revenue models',
  },
  'pricing': {
    nextSection: 'go-to-market',
    nextLabel: 'Go-To-Market Strategy',
    description: 'Analyze GTM strategy, channels, positioning, and customer acquisition',
  },
  // 'go-to-market' has no next step - user can proceed to Design stage
};

/**
 * Get navigation info for a section
 */
export function getNextStep(section: string): SectionNavigation | null {
  return SECTION_NAVIGATION[section] || null;
}

