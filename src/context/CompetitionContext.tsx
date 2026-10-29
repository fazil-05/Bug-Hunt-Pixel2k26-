import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  CompetitionRound, 
  Team, 
  Submission, 
  BugCategory, 
  LeaderboardEntry,
  RoundStatus 
} from '../types';
import { DEFAULT_TEAMS, DEFAULT_BUGS } from '../data/initialData';
import { evaluateBugReport, GradeResult } from '../lib/gradingEngine';
import { arenaBus, extractPresenceData } from '../lib/supabase';
import { soundFX } from '../lib/sound';
import confetti from 'canvas-confetti';

interface ElementInfo {
  selector: string;
  component: string;
  tag: string;
  category?: BugCategory;
}

interface CompetitionContextType {
  round: CompetitionRound;
  teams: Team[];
  submissions: Submission[];
  remainingSeconds: number;
  formattedTime: string;
  leaderboard: LeaderboardEntry[];
  isInspectMode: boolean;
  selectedElement: ElementInfo | null;
  isReportModalOpen: boolean;
  activeReportMethod: 'click' | 'inspect';
  isSoundMuted: boolean;
  isAdminAuthenticated: boolean;
  
  // Controls
  startRound: (durationSeconds?: number) => void;
  pauseRound: () => void;
  resumeRound: () => void;
  endRound: () => void;
  resetRound: (newDurationSeconds?: number) => void;
  publishResults: () => void;
  toggleTeamLeaderboard: (show: boolean) => void;
  toggleSound: () => void;
  setInspectMode: (enabled: boolean) => void;
  setSelectedElement: (elem: ElementInfo | null) => void;
  openReportModal: (method: 'click' | 'inspect', prefill?: ElementInfo) => void;
  closeReportModal: () => void;
  submitBug: (
    teamCode: string, 
    data: { 
      category: BugCategory; 
      targetComponent: string; 
      title: string; 
      description: string; 
      stepsToReproduce: string; 
      selector?: string; 
    }
  ) => Promise<GradeResult>;
  adminOverrideSubmission: (submissionId: string, newStatus: 'accepted' | 'rejected', points: number) => void;
  setTeamScoreManual: (teamId: string, newScore: number, reason?: string) => void;
  adjustTeamPoints: (teamId: string, deltaPoints: number) => void;
  toggleTeamBugManual: (teamId: string, bugKey: string, solved: boolean) => void;
  exportCSV: () => void;
  registerHeartbeat: (teamCode: string) => void;
  loginAdmin: (code: string) => boolean;
  logoutAdmin: () => void;
  getTeamByCode: (code: string) => Team | undefined;
}

const STORAGE_KEYS = {
  ROUND: 'bug_hunt_arena_round_state',
  TEAMS: 'bug_hunt_arena_teams_state',
  SUBMISSIONS: 'bug_hunt_arena_submissions_state',
  ADMIN_AUTH: 'bug_hunt_arena_admin_auth'
};

const DEFAULT_ROUND: CompetitionRound = {
  id: 'round-1',
  title: 'Bug Hunt Pixel2k26: Championship Round',
  instructions: 'Identify all five hidden intentional bugs in the ShopEasy e-commerce website before the timer runs out. Each verified unique bug awards +20 points. No duplicate points are granted. Work quickly and accurately!',
  status: 'draft',
  durationSeconds: 600, // 10 minutes
  startedAt: null,
  pausedAt: null,
  accumulatedPausedDurationMs: 0,
  challengeId: 'shopeasy-v1',
  challengeName: 'ShopEasy e-Commerce Store',
  totalBugs: 5,
  showLeaderboardToTeams: true,
  soundEnabled: true,
};

const CompetitionContext = createContext<CompetitionContextType | null>(null);

export const CompetitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [round, setRound] = useState<CompetitionRound>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROUND);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title && parsed.title.includes('Bug Hunt Arena')) {
          parsed.title = parsed.title.replace(/Bug Hunt Arena/g, 'Bug Hunt Pixel2k26');
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_ROUND;
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEAMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Auto-migrate if stored teams still use old alpha/beta/gamma/delta codes
        const hasOldTeams = Array.isArray(parsed) && parsed.some((t: Team) => t.code === 'alpha' || t.name === 'Team Alpha');
        if (!hasOldTeams && Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_TEAMS;
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  });

  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(soundFX.getIsMuted());
  const [isInspectMode, setIsInspectMode] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [activeReportMethod, setActiveReportMethod] = useState<'click' | 'inspect'>('click');

  const warnedAt60Ref = useRef<boolean>(false);
  const timesUpFiredRef = useRef<boolean>(false);

  // Keep fresh references for event callbacks
  const roundRef = useRef(round);
  roundRef.current = round;
  const teamsRef = useRef(teams);
  teamsRef.current = teams;
  const isAdminRef = useRef(isAdminAuthenticated);
  isAdminRef.current = isAdminAuthenticated;

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROUND, JSON.stringify(round));
    } catch {
      // ignore
    }
  }, [round]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    } catch {
      // ignore
    }
  }, [teams]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
    } catch {
      // ignore
    }
  }, [submissions]);

  // Real-time Bus listener for cross-device, cross-browser, and cross-tab events
  useEffect(() => {
    const unsubscribe = arenaBus.subscribe((event) => {
      if (event.type === 'ROUND_UPDATE') {
        setRound(event.payload as CompetitionRound);
      } else if (event.type === 'TEAMS_UPDATE') {
        setTeams(event.payload as Team[]);
      } else if (event.type === 'SUBMISSIONS_UPDATE') {
        setSubmissions(event.payload as Submission[]);
      } else if (event.type === 'NEW_SUBMISSION') {
        const sub = event.payload as Submission;
        setSubmissions(prev => [sub, ...prev.filter(s => s.id !== sub.id)]);
      } else if (event.type === 'PRESENCE_SYNC') {
        // Automatic Server Presence Sync: Supabase server cluster delivers state to student
        if (!isAdminRef.current) {
          const syncData = extractPresenceData(event.payload as Record<string, unknown[]>);
          if (syncData?.round) {
            setRound(prev => {
              if (
                prev.status !== syncData.round.status ||
                prev.startedAt !== syncData.round.startedAt ||
                prev.pausedAt !== syncData.round.pausedAt ||
                prev.accumulatedPausedDurationMs !== syncData.round.accumulatedPausedDurationMs
              ) {
                return syncData.round;
              }
              return prev;
            });
          }
          if (syncData?.teams && Array.isArray(syncData.teams) && syncData.teams.length > 0) {
            setTeams(syncData.teams);
          }
        }
      } else if (event.type === 'ROUND_PULSE' || event.type === 'STATE_RESPONSE') {
        // Participant / observer tabs sync state from Admin
        if (!isAdminRef.current) {
          const data = event.payload as { round?: CompetitionRound; teams?: Team[] };
          if (data?.round) {
            setRound(prev => {
              if (
                prev.status !== data.round!.status ||
                prev.startedAt !== data.round!.startedAt ||
                prev.pausedAt !== data.round!.pausedAt ||
                prev.accumulatedPausedDurationMs !== data.round!.accumulatedPausedDurationMs
              ) {
                return data.round!;
              }
              return prev;
            });
          }
          if (data?.teams && Array.isArray(data.teams) && data.teams.length > 0) {
            setTeams(data.teams);
          }
        }
      } else if (event.type === 'REQUEST_STATE') {
        // If current window is Organizer, answer immediately with live state
        if (isAdminRef.current) {
          arenaBus.emit('STATE_RESPONSE', {
            round: roundRef.current,
            teams: teamsRef.current
          });
          arenaBus.trackPresence({
            round: roundRef.current,
            teams: teamsRef.current,
            timestamp: Date.now()
          });
        }
      } else if (event.type === 'TEAM_HEARTBEAT') {
        // Organizer marks remote student team as active online
        if (isAdminRef.current) {
          const payload = event.payload as { teamCode?: string };
          if (payload?.teamCode) {
            setTeams(prev => prev.map(t => 
              t.code.toLowerCase() === payload.teamCode!.toLowerCase()
                ? { ...t, isOnline: true, lastHeartbeat: Date.now() }
                : t
            ));
          }
        }
      } else if (event.type === 'RESULTS_PUBLISHED') {
        const payload = event.payload as { round: CompetitionRound; teams: Team[] };
        setRound(payload.round);
        setTeams(payload.teams);
        soundFX.playWinnerFanfare();
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }
    });

    return unsubscribe;
  }, []);

  // Organizer Periodic Heartbeat Pulse & Server Presence tracking
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    // Track state on Supabase server cluster immediately
    arenaBus.trackPresence({
      round: roundRef.current,
      teams: teamsRef.current,
      timestamp: Date.now()
    });

    const pulseTimer = setInterval(() => {
      arenaBus.emit('ROUND_PULSE', {
        round: roundRef.current,
        teams: teamsRef.current
      });
      arenaBus.trackPresence({
        round: roundRef.current,
        teams: teamsRef.current,
        timestamp: Date.now()
      });
    }, 2000);

    return () => clearInterval(pulseTimer);
  }, [isAdminAuthenticated]);

  // Participant / Observer Active Sync: continually polls presence and emits REQUEST_STATE while waiting
  useEffect(() => {
    if (isAdminAuthenticated) return;

    const syncFromPresenceOrBus = () => {
      // 1. Check if Supabase Realtime Server Presence has active match
      const presenceData = extractPresenceData(arenaBus.getPresenceState());
      if (presenceData?.round && presenceData.round.status !== 'draft') {
        setRound(prev => {
          if (prev.status !== presenceData.round.status || prev.startedAt !== presenceData.round.startedAt) {
            return presenceData.round;
          }
          return prev;
        });
        if (presenceData.teams && Array.isArray(presenceData.teams)) {
          setTeams(presenceData.teams);
        }
      }
      // 2. Broadcast a state request
      arenaBus.emit('REQUEST_STATE', { timestamp: Date.now() });
    };

    // Immediate check on mount
    syncFromPresenceOrBus();

    // Check at 500ms, 1200ms
    const t1 = setTimeout(syncFromPresenceOrBus, 500);
    const t2 = setTimeout(syncFromPresenceOrBus, 1200);

    // Continuous poll every 1500ms while still in draft waiting state
    const interval = setInterval(() => {
      if (roundRef.current.status === 'draft') {
        syncFromPresenceOrBus();
      }
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(interval);
    };
  }, [isAdminAuthenticated]);

  // Synchronized countdown timer
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (round.status === 'draft') return round.durationSeconds;
    if (round.status === 'ended' || round.status === 'published') return 0;
    if (round.status === 'paused') {
      const elapsed = ((round.pausedAt || Date.now()) - (round.startedAt || Date.now()) - round.accumulatedPausedDurationMs);
      return Math.max(0, Math.floor(round.durationSeconds - elapsed / 1000));
    }
    const elapsed = (Date.now() - (round.startedAt || Date.now()) - round.accumulatedPausedDurationMs);
    return Math.max(0, Math.floor(round.durationSeconds - elapsed / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (round.status === 'running' && round.startedAt) {
        const elapsed = Date.now() - round.startedAt - round.accumulatedPausedDurationMs;
        const remaining = Math.max(0, Math.floor(round.durationSeconds - elapsed / 1000));
        setRemainingSeconds(remaining);

        if (remaining === 60 && !warnedAt60Ref.current) {
          warnedAt60Ref.current = true;
          soundFX.playWarning();
        }

        if (remaining <= 10 && remaining > 0) {
          soundFX.playCountdownAlert();
        }

        if (remaining === 0 && !timesUpFiredRef.current) {
          timesUpFiredRef.current = true;
          soundFX.playTimesUp();
          setRound(prev => {
            const updated: CompetitionRound = { ...prev, status: 'ended' };
            arenaBus.emit('ROUND_UPDATE', updated);
            return updated;
          });
        }
      } else if (round.status === 'paused' && round.startedAt && round.pausedAt) {
        const elapsed = round.pausedAt - round.startedAt - round.accumulatedPausedDurationMs;
        const remaining = Math.max(0, Math.floor(round.durationSeconds - elapsed / 1000));
        setRemainingSeconds(remaining);
      } else if (round.status === 'draft') {
        setRemainingSeconds(round.durationSeconds);
        warnedAt60Ref.current = false;
        timesUpFiredRef.current = false;
      } else if (round.status === 'ended' || round.status === 'published') {
        setRemainingSeconds(0);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [round]);

  const formattedTime = useMemo(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    const entries = teams.map(team => {
      let timeTakenSec = 0;
      if (round.startedAt && team.lastSubmissionTimestamp) {
        timeTakenSec = Math.max(1, Math.floor((team.lastSubmissionTimestamp - round.startedAt) / 1000));
      }
      const mins = Math.floor(timeTakenSec / 60);
      const secs = timeTakenSec % 60;
      const formatted = timeTakenSec > 0 ? `${mins}m ${secs}s` : '--';

      return {
        rank: 1,
        teamId: team.id,
        teamCode: team.code,
        teamName: team.name,
        color: team.color,
        bugsCount: team.bugsIdentified.length,
        score: team.score,
        timeTakenFormatted: formatted,
        timeTakenSeconds: timeTakenSec,
        incorrectCount: team.incorrectSubmissionsCount,
      };
    });

    entries.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.bugsCount !== a.bugsCount) {
        return b.bugsCount - a.bugsCount;
      }
      if (a.timeTakenSeconds > 0 && b.timeTakenSeconds > 0 && a.timeTakenSeconds !== b.timeTakenSeconds) {
        return a.timeTakenSeconds - b.timeTakenSeconds;
      }
      if (a.incorrectCount !== b.incorrectCount) {
        return a.incorrectCount - b.incorrectCount;
      }
      return a.teamName.localeCompare(b.teamName);
    });

    return entries.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      isWinner: idx === 0 && entry.score > 0
    }));
  }, [teams, round.startedAt]);

  const startRound = useCallback((durationSeconds?: number) => {
    const now = Date.now();
    warnedAt60Ref.current = false;
    timesUpFiredRef.current = false;

    setRound(prev => {
      const updated: CompetitionRound = {
        ...prev,
        status: 'running',
        durationSeconds: durationSeconds || prev.durationSeconds,
        startedAt: now,
        pausedAt: null,
        accumulatedPausedDurationMs: 0
      };
      arenaBus.emit('ROUND_UPDATE', updated);
      arenaBus.trackPresence({ round: updated, teams: teamsRef.current, timestamp: now });
      return updated;
    });
  }, []);

  const pauseRound = useCallback(() => {
    if (round.status !== 'running') return;
    const now = Date.now();
    setRound(prev => {
      const updated: CompetitionRound = {
        ...prev,
        status: 'paused',
        pausedAt: now
      };
      arenaBus.emit('ROUND_UPDATE', updated);
      arenaBus.trackPresence({ round: updated, teams: teamsRef.current, timestamp: now });
      return updated;
    });
  }, [round.status]);

  const resumeRound = useCallback(() => {
    if (round.status !== 'paused' || !round.pausedAt) return;
    const now = Date.now();
    const pausedSpan = now - round.pausedAt;

    setRound(prev => {
      const updated: CompetitionRound = {
        ...prev,
        status: 'running',
        pausedAt: null,
        accumulatedPausedDurationMs: prev.accumulatedPausedDurationMs + pausedSpan
      };
      arenaBus.emit('ROUND_UPDATE', updated);
      arenaBus.trackPresence({ round: updated, teams: teamsRef.current, timestamp: now });
      return updated;
    });
  }, [round.status, round.pausedAt]);

  const endRound = useCallback(() => {
    const now = Date.now();
    setRound(prev => {
      const updated: CompetitionRound = {
        ...prev,
        status: 'ended'
      };
      arenaBus.emit('ROUND_UPDATE', updated);
      arenaBus.trackPresence({ round: updated, teams: teamsRef.current, timestamp: now });
      return updated;
    });
    soundFX.playTimesUp();
  }, []);

  const resetRound = useCallback((newDurationSeconds?: number) => {
    warnedAt60Ref.current = false;
    timesUpFiredRef.current = false;
    const now = Date.now();

    const freshTeams = DEFAULT_TEAMS.map(t => ({
      ...t,
      score: 0,
      bugsIdentified: [],
      incorrectSubmissionsCount: 0,
      lastSubmissionTimestamp: null,
      completionTimeSeconds: null
    }));

    const freshRound: CompetitionRound = {
      ...DEFAULT_ROUND,
      durationSeconds: newDurationSeconds || 600,
      status: 'draft',
      startedAt: null,
      pausedAt: null,
      accumulatedPausedDurationMs: 0
    };

    setTeams(freshTeams);
    setRound(freshRound);
    setSubmissions([]);

    arenaBus.emit('ROUND_UPDATE', freshRound);
    arenaBus.emit('TEAMS_UPDATE', freshTeams);
    arenaBus.emit('SUBMISSIONS_UPDATE', []);
    arenaBus.trackPresence({ round: freshRound, teams: freshTeams, timestamp: now });
  }, []);

  const publishResults = useCallback(() => {
    const winner = leaderboard[0];
    const now = Date.now();

    const updatedRound: CompetitionRound = {
      ...round,
      status: 'published',
      winnerTeamId: winner ? winner.teamId : undefined,
      resultsPublishedAt: now
    };

    setRound(updatedRound);
    arenaBus.emit('RESULTS_PUBLISHED', { round: updatedRound, teams });
    soundFX.playWinnerFanfare();
    confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 } });
  }, [round, teams, leaderboard]);

  const toggleTeamLeaderboard = useCallback((show: boolean) => {
    setRound(prev => {
      const updated = { ...prev, showLeaderboardToTeams: show };
      arenaBus.emit('ROUND_UPDATE', updated);
      return updated;
    });
  }, []);

  const toggleSound = useCallback(() => {
    const muted = soundFX.toggleMute();
    setIsSoundMuted(muted);
  }, []);

  const openReportModal = useCallback((method: 'click' | 'inspect', prefill?: ElementInfo) => {
    setActiveReportMethod(method);
    if (prefill) {
      setSelectedElement(prefill);
    }
    setIsReportModalOpen(true);
  }, []);

  const closeReportModal = useCallback(() => {
    setIsReportModalOpen(false);
    setSelectedElement(null);
    setIsInspectMode(false);
  }, []);

  // Submit bug report handler
  const submitBug = useCallback(async (
    teamCode: string,
    data: {
      category: BugCategory;
      targetComponent: string;
      title: string;
      description: string;
      stepsToReproduce: string;
      selector?: string;
    }
  ): Promise<GradeResult> => {
    if (round.status !== 'running') {
      return {
        accepted: false,
        points: 0,
        message: round.status === 'paused' 
          ? 'Competition is paused by organizer. Submissions resume when unpaused.'
          : 'Competition is currently not accepting submissions.'
      };
    }

    const team = teams.find(t => t.code.toLowerCase() === teamCode.toLowerCase());
    if (!team) {
      return {
        accepted: false,
        points: 0,
        message: 'Invalid team code.'
      };
    }

    const result = evaluateBugReport(
      team,
      data.category,
      data.targetComponent,
      data.title,
      data.description,
      data.stepsToReproduce,
      data.selector
    );

    const now = Date.now();
    const submissionId = `sub-${now}-${Math.random().toString(36).substring(2, 7)}`;

    const newSubmission: Submission = {
      id: submissionId,
      teamId: team.id,
      teamCode: team.code,
      teamName: team.name,
      roundId: round.id,
      bugKey: result.bugKey,
      bugNumber: result.bugNumber,
      category: data.category,
      targetComponent: data.targetComponent,
      title: data.title,
      description: data.description,
      stepsToReproduce: data.stepsToReproduce,
      status: result.accepted ? 'accepted' : 'rejected',
      pointsAwarded: result.points,
      submittedAt: new Date(now).toISOString()
    };

    const updatedTeams = teams.map(t => {
      if (t.id === team.id) {
        if (result.accepted && result.bugKey) {
          const newBugs = [...t.bugsIdentified, result.bugKey];
          const newScore = t.score + result.points;
          const completedAll = newBugs.length === round.totalBugs;
          return {
            ...t,
            score: newScore,
            bugsIdentified: newBugs,
            lastSubmissionTimestamp: now,
            completionTimeSeconds: completedAll ? Math.floor((now - (round.startedAt || now)) / 1000) : t.completionTimeSeconds
          };
        } else if (!result.alreadySolved) {
          return {
            ...t,
            incorrectSubmissionsCount: t.incorrectSubmissionsCount + 1,
            lastSubmissionTimestamp: now
          };
        }
      }
      return t;
    });

    setTeams(updatedTeams);
    setSubmissions(prev => [newSubmission, ...prev]);

    arenaBus.emit('TEAMS_UPDATE', updatedTeams);
    arenaBus.emit('NEW_SUBMISSION', newSubmission);

    if (result.accepted) {
      soundFX.playSuccess();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    } else {
      soundFX.playIncorrect();
    }

    return result;
  }, [round, teams]);

  // Admin Override Submission (with custom points support)
  const adminOverrideSubmission = useCallback((
    submissionId: string, 
    newStatus: 'accepted' | 'rejected', 
    points: number
  ) => {
    let affectedTeamId = '';
    let bugKeyToAssign = '';

    setSubmissions(prev => prev.map(sub => {
      if (sub.id === submissionId) {
        affectedTeamId = sub.teamId;
        bugKeyToAssign = sub.bugKey || 'BUG-1';
        return {
          ...sub,
          status: newStatus,
          pointsAwarded: points,
          manuallyGraded: true
        };
      }
      return sub;
    }));

    if (affectedTeamId) {
      setTeams(prevTeams => {
        const next = prevTeams.map(t => {
          if (t.id === affectedTeamId) {
            let nextBugs = [...t.bugsIdentified];
            if (newStatus === 'accepted' && !nextBugs.includes(bugKeyToAssign)) {
              nextBugs.push(bugKeyToAssign);
            } else if (newStatus === 'rejected') {
              nextBugs = nextBugs.filter(b => b !== bugKeyToAssign);
            }
            // Add or remove points
            const newScore = Math.max(0, newStatus === 'accepted' ? t.score + points : Math.max(0, t.score - (points || 20)));
            return {
              ...t,
              score: newScore,
              bugsIdentified: nextBugs
            };
          }
          return t;
        });
        arenaBus.emit('TEAMS_UPDATE', next);
        return next;
      });
    }
  }, []);

  // Admin: Set exact team score manually
  const setTeamScoreManual = useCallback((teamId: string, newScore: number, reason?: string) => {
    setTeams(prevTeams => {
      const next = prevTeams.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            score: Math.max(0, newScore),
            lastSubmissionTimestamp: Date.now()
          };
        }
        return t;
      });
      arenaBus.emit('TEAMS_UPDATE', next);
      return next;
    });
  }, []);

  // Admin: Adjust team score by +/- delta
  const adjustTeamPoints = useCallback((teamId: string, deltaPoints: number) => {
    setTeams(prevTeams => {
      const next = prevTeams.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            score: Math.max(0, t.score + deltaPoints),
            lastSubmissionTimestamp: Date.now()
          };
        }
        return t;
      });
      arenaBus.emit('TEAMS_UPDATE', next);
      return next;
    });
  }, []);

  // Admin: Toggle a specific bug solved state for a team manually
  const toggleTeamBugManual = useCallback((teamId: string, bugKey: string, solved: boolean) => {
    setTeams(prevTeams => {
      const next = prevTeams.map(t => {
        if (t.id === teamId) {
          let updatedBugs = [...t.bugsIdentified];
          let updatedScore = t.score;

          if (solved && !updatedBugs.includes(bugKey)) {
            updatedBugs.push(bugKey);
            updatedScore += 20;
          } else if (!solved && updatedBugs.includes(bugKey)) {
            updatedBugs = updatedBugs.filter(b => b !== bugKey);
            updatedScore = Math.max(0, updatedScore - 20);
          }

          return {
            ...t,
            bugsIdentified: updatedBugs,
            score: updatedScore,
            lastSubmissionTimestamp: Date.now()
          };
        }
        return t;
      });
      arenaBus.emit('TEAMS_UPDATE', next);
      return next;
    });
  }, []);

  const exportCSV = useCallback(() => {
    const headers = ['Rank', 'Team Name', 'Team Code', 'Bugs Identified', 'Total Score', 'Incorrect Attempts', 'Time Taken'];
    const rows = leaderboard.map(entry => [
      entry.rank,
      `"${entry.teamName}"`,
      entry.teamCode,
      `${entry.bugsCount}/5`,
      entry.score,
      entry.incorrectCount,
      `"${entry.timeTakenFormatted}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bug_hunt_arena_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [leaderboard]);

  const registerHeartbeat = useCallback((teamCode: string) => {
    const now = Date.now();
    setTeams(prev => prev.map(t => {
      if (t.code.toLowerCase() === teamCode.toLowerCase()) {
        return { ...t, isOnline: true, lastHeartbeat: now };
      }
      return t;
    }));
    arenaBus.emit('TEAM_HEARTBEAT', { teamCode });
  }, []);

  const loginAdmin = useCallback((passcode: string): boolean => {
    if (passcode === 'admin123' || passcode === 'arena-master-2026') {
      setIsAdminAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      return true;
    }
    return false;
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  }, []);

  const getTeamByCode = useCallback((code: string) => {
    const c = code.toLowerCase().trim();
    return teams.find(t => 
      t.code.toLowerCase() === c ||
      (c === 'alpha' && t.code === 'aries') ||
      (c === 'beta' && t.code === 'invictus') ||
      (c === 'gamma' && t.code === 'atlas') ||
      ((c === 'delta' || c === 'pheonix') && t.code === 'phoenix')
    );
  }, [teams]);

  const value = {
    round,
    teams,
    submissions,
    remainingSeconds,
    formattedTime,
    leaderboard,
    isInspectMode,
    selectedElement,
    isReportModalOpen,
    activeReportMethod,
    isSoundMuted,
    isAdminAuthenticated,
    startRound,
    pauseRound,
    resumeRound,
    endRound,
    resetRound,
    publishResults,
    toggleTeamLeaderboard,
    toggleSound,
    setInspectMode: setIsInspectMode,
    setSelectedElement,
    openReportModal,
    closeReportModal,
    submitBug,
    adminOverrideSubmission,
    setTeamScoreManual,
    adjustTeamPoints,
    toggleTeamBugManual,
    exportCSV,
    registerHeartbeat,
    loginAdmin,
    logoutAdmin,
    getTeamByCode
  };

  return (
    <CompetitionContext.Provider value={value}>
      {children}
    </CompetitionContext.Provider>
  );
};

export const useCompetition = () => {
  const context = useContext(CompetitionContext);
  if (!context) {
    throw new Error('useCompetition must be used within a CompetitionProvider');
  }
  return context;
};
