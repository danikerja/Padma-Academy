export type AppTab = 'catalog' | 'workspace' | 'analytics' | 'admin' | 'architecture';

export type CourseStage = 'pretest' | 'video' | 'posttest' | 'summary';

export type CompetencyArea = 'Konsep Dasar' | 'Penerapan Kasus' | 'Optimasi & Evaluasi';

export type TrackLevel = 'OJT' | 'Junior' | 'Middle' | 'Senior';

export interface LearningTrack {
  id: TrackLevel;
  order: number;
  name: string;
  subtitle: string;
  targetAudience: string;
  minPassScore: number;
  estimatedDuration: string;
  keyCompetencies: string[];
  softskills?: string[];
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  competency: CompetencyArea;
  explanation: string;
  relatedChapterIndex: number;
}

export interface VideoChapter {
  id: string;
  title: string;
  startSec: number;
  endSec: number;
  competency: CompetencyArea;
  summary: string;
  keyTakeaways: string[];
  diagramType: 'pipeline' | 'chart' | 'hierarchy' | 'cycle';
  diagramNodes: string[];
  captions: { startSec: number; endSec: number; text: string }[];
}

export interface VideoCheckpoint {
  triggerSec: number;
  question: string;
  options: string[];
  correctIndex: number;
  feedback: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  category: string;
  trackLevel: TrackLevel;
  moduleOrderInTrack: number;
  instructorName: string;
  instructorRole: string;
  instructorAvatar: string;
  coverImage: string;
  syllabusDurationLabel: string;
  videoDurationSec: number;
  passingScore: number;
  minWatchPercent: number;
  description: string;
  videoUrl?: string;
  preTest: QuizQuestion[];
  chapters: VideoChapter[];
  checkpoint: VideoCheckpoint;
  postTest: QuizQuestion[];
}

export interface AttemptResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  answers: Record<string, number>;
  elapsedSeconds: number;
  completedAt: string;
  competencyBreakdown: Record<CompetencyArea, { correct: number; total: number }>;
}

export interface StudentNote {
  id: string;
  timestampSec: number;
  chapterTitle: string;
  content: string;
  createdAt: string;
}

export interface CourseProgress {
  courseId: string;
  preTestResult: AttemptResult | null;
  watchedSeconds: number[];
  lastPositionSec: number;
  checkpointPassed: boolean;
  postTestAttempts: AttemptResult[];
  notes: StudentNote[];
}

export type LMSProgressStore = Record<string, CourseProgress>;

export interface PlacementQuestion {
  id: string;
  levelLabel: TrackLevel;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface CohortLearner {
  id: string;
  name: string;
  division: string;
  currentTrack: TrackLevel;
  avgPreScore: number;
  avgVideoPct: number;
  bestPostScore: number | null;
  nGain: number | null;
  modulesPassed: number;
  modulesTotal: number;
  needsIntervention: boolean;
  interventionSent?: boolean;
  email?: string;
  role?: UserRole;
  isLiveAccount?: boolean;
  packageProgressPct?: number;
  packageModulesPassed?: number;
  packageModulesTotal?: number;
  accountStatus?: 'active' | 'pending' | 'sample';
}

export type UserRole = 'learner' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  emailDomain: string;
  displayName: string;
  division: string;
  role: UserRole;
  currentTrack: TrackLevel;
  placementLevel: TrackLevel | 'unset';
  avgPreScore: number;
  avgVideoPct: number;
  bestPostScore: number;
  modulesPassed: number;
  modulesTotal: number;
  interventionSent: boolean;
}

export type LevelFlowMode = 'admin_assigned' | 'linear_sequential' | 'open_catalog';

export type ParticipantRegistrationStatus = 'pending' | 'active';

export interface ParticipantRegistration {
  inviteId: string;
  email: string;
  displayName: string;
  division: string;
  assignedTrack: TrackLevel;
  status: ParticipantRegistrationStatus;
  registeredBy: string;
  activatedUid: string;
  createdAt?: string;
}

export type CameraResolution = '480p' | '720p' | '1080p';

export type IntegrityStatus = 'aman' | 'peringatan' | 'pelanggaran';

export interface ProctoringEvent {
  time: string;
  type: 'camera' | 'tab_switch' | 'window_blur' | 'screen_share' | 'fullscreen';
  detail: string;
}

export interface ProctoringSnapshotItem {
  time: string;
  source: 'camera' | 'screen';
  dataUrl: string;
}

export interface ProctoringSessionLog {
  logId: string;
  userId: string;
  userName: string;
  userEmail: string;
  division: string;
  courseId: string;
  courseCode: string;
  stage: 'pretest' | 'video' | 'posttest';
  cameraActive: boolean;
  cameraLabel: string;
  cameraMirror: boolean;
  screenShareActive: boolean;
  fullscreenActive: boolean;
  tabSwitchCount: number;
  windowBlurCount: number;
  focusScorePct: number;
  awaySeconds: number;
  integrityStatus: IntegrityStatus;
  events: ProctoringEvent[];
  snapshots: ProctoringSnapshotItem[];
  updatedAt?: string;
}

export interface WorkspacePolicy {
  companyName: string;
  enforceCorporateDomain: boolean;
  allowedDomains: string[];
  requireRegisteredInvite: boolean;
  levelFlowMode: LevelFlowMode;
  enforceModuleOrder: boolean;
  trackSequence: TrackLevel[];
  enableCameraMonitoring: boolean;
  requireCameraForTests: boolean;
  enableScreenTracking: boolean;
  enableTabSwitchSiren: boolean;
  requireFullscreenForPostTest: boolean;
  maxTabSwitchTolerance: number;
}

