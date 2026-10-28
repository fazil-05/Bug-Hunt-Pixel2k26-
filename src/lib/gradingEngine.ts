import { BugCategory, BugDefinition, Submission, Team } from '../types';
import { DEFAULT_BUGS } from '../data/initialData';

export interface GradeResult {
  accepted: boolean;
  bugKey?: string;
  bugNumber?: number;
  points: number;
  message: string;
  alreadySolved?: boolean;
}

/**
 * Grader that verifies participant submissions securely against challenge criteria.
 * Enforces:
 * 1. Category and component alignment
 * 2. Keyword relevance across description and reproduction steps
 * 3. Prevention of duplicate points for the same bug
 */
export function evaluateBugReport(
  team: Team,
  category: BugCategory,
  targetComponent: string,
  title: string,
  description: string,
  stepsToReproduce: string,
  elementSelector?: string
): GradeResult {
  const fullText = `${title} ${description} ${stepsToReproduce} ${targetComponent} ${elementSelector || ''}`.toLowerCase();

  for (const bug of DEFAULT_BUGS) {
    // 1. Check if category matches or is generic 'other' with high keyword density
    const categoryMatches = 
      category === bug.category || 
      (category === 'other' && fullText.includes(bug.category));

    if (!categoryMatches) continue;

    // 2. Component or element matching
    const componentMatches = 
      targetComponent.toLowerCase().includes(bug.category) ||
      (elementSelector && bug.targetElementSelector && (
        elementSelector.includes(bug.category) || 
        bug.targetElementSelector.includes(elementSelector) ||
        elementSelector.includes('add-to-cart') && bug.bugKey === 'BUG-2' ||
        elementSelector.includes('search') && bug.bugKey === 'BUG-1' ||
        elementSelector.includes('total') && bug.bugKey === 'BUG-3' ||
        elementSelector.includes('audio') && bug.bugKey === 'BUG-4' ||
        elementSelector.includes('email') && bug.bugKey === 'BUG-5'
      ));

    // 3. Keyword scoring
    let matchedKeywords = 0;
    for (const kw of bug.matchingKeywords) {
      if (fullText.includes(kw.toLowerCase())) {
        matchedKeywords++;
      }
    }

    // Require at least 2 relevant keywords and component/category relevance
    const isSufficientMatch = (categoryMatches && matchedKeywords >= 2) || (componentMatches && matchedKeywords >= 1) || matchedKeywords >= 3;

    if (isSufficientMatch) {
      // Check if team already solved this bug
      if (team.bugsIdentified.includes(bug.bugKey)) {
        return {
          accepted: false,
          bugKey: bug.bugKey,
          bugNumber: bug.bugNumber,
          points: 0,
          alreadySolved: true,
          message: `Team ${team.name} has already successfully claimed points for this bug.`
        };
      }

      return {
        accepted: true,
        bugKey: bug.bugKey,
        bugNumber: bug.bugNumber,
        points: bug.points,
        message: 'Bug identified successfully! +20 points.'
      };
    }
  }

  return {
    accepted: false,
    points: 0,
    message: 'Report submitted, but no matching bug was confirmed.'
  };
}

