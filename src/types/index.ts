export type RoundStatus = 'draft' | 'running' | 'paused' | 'ended' | 'published';

export type BugSeverity = 'critical' | 'major' | 'minor' | 'edge-case';

export type BugCategory = 
  | 'search'
  | 'cart'
  | 'pricing'
  | 'navigation'
  | 'form_validation'
  | 'ui_layout'
  | 'other';

export interface BugDefinition {
  id: string;
  bugKey: string;
  bugNumber: number; // 1 to 5
  title: string;
  category: BugCategory;
  targetComponent: string;
  targetElementSelector?: string;
  severity: BugSeverity;
  points: number; // Default 20
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  reproductionSteps: string[];
  matchingKeywords: string[];
  explanationPostRound: string;
}

export interface Submission {
  id: string;
  teamId: string;
  teamCode: string;
  teamName: string;
  roundId: string;
  bugKey?: string;
  bugNumber?: number;
  category: BugCategory;
  targetComponent: string;
  title: string;
  description: string;
  stepsToReproduce: string;
  status: 'accepted' | 'rejected' | 'pending';
  pointsAwarded: number;
  submittedAt: string;
  adminFeedback?: string;
  manuallyGraded?: boolean;
}

export interface Team {
  id: string;
  code: string;
  name: string;
  color: string; // Tailwind color or hex
  accentBg: string;
  avatarIcon: string;
  score: number;
  bugsIdentified: string[]; // List of bugKeys found (e.g. ['BUG-1', 'BUG-3'])
  incorrectSubmissionsCount: number;
  lastSubmissionTimestamp: number | null;
  completionTimeSeconds: number | null;
  isOnline: boolean;
  lastHeartbeat: number;
}

export interface CompetitionRound {
  id: string;
  title: string;
  instructions: string;
  status: RoundStatus;
  durationSeconds: number; // default e.g. 600 (10 min)
  startedAt: number | null; // epoch timestamp ms
  pausedAt: number | null;
  accumulatedPausedDurationMs: number;
  challengeId: string;
  challengeName: string;
  totalBugs: number; // 5
  showLeaderboardToTeams: boolean;
  soundEnabled: boolean;
  winnerTeamId?: string;
  resultsPublishedAt?: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamCode: string;
  teamName: string;
  color: string;
  bugsCount: number;
  score: number;
  timeTakenFormatted: string;
  timeTakenSeconds: number;
  incorrectCount: number;
  isWinner?: boolean;
}

export interface ShopProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  category: 'electronics' | 'audio' | 'wearables' | 'accessories';
  image: string;
  badge?: string;
  description: string;
  specs: string[];
  inStock: boolean;
  canAddToCart?: boolean; // Used to trigger Bug 2 intentionally
}

export interface CartItem {
  product: ShopProduct;
  quantity: number;
}

