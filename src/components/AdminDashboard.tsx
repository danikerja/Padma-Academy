import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Award,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  Film,
  Layers,
  Link2,
  Mail,
  Monitor,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import {
  CohortLearner,
  Course,
  LearningTrack,
  LevelFlowMode,
  LMSProgressStore,
  ParticipantRegistration,
  ProctoringSessionLog,
  TrackLevel,
  UserProfile,
  UserRole,
  WorkspacePolicy,
} from '../types/lms';
import {
  COMPANY_DEPARTMENTS,
  computeNGain,
  getAccountPackageSummary,
  getBestPostScore,
  getCourseProgressPercentage,
  getWatchPercentage,
  isCoursePassed,
} from '../data/courses';
import {
  AccountProctoringSummary,
  buildAccountProctoringSummary,
  formatStageLabel,
} from '../utils/proctoringSummary';

interface AdminDashboardProps {
  tracks: LearningTrack[];
  courses: Course[];
  progressStore: LMSProgressStore;
  placementLevel: TrackLevel | null;
  currentUser: UserProfile;
  registeredUsers: UserProfile[];
  userProgressMap?: Record<string, LMSProgressStore>;
  participantRegistrations: ParticipantRegistration[];
  cohortLearners: CohortLearner[];
  proctoringLogs: ProctoringSessionLog[];
  onDeleteProctoringLog?: (logId: string) => Promise<void>;
  onOpenDualVerificationView?: () => void;
  workspacePolicy: WorkspacePolicy;
  onUpdateWorkspacePolicy: (policy: WorkspacePolicy) => Promise<void>;
  onRegisterParticipant: (input: {
    email: string;
    displayName: string;
    division: string;
    assignedTrack: TrackLevel;
  }) => Promise<{ ok: boolean; error?: string }>;
  onBulkRegisterParticipants: (
    entries: Array<{
      email: string;
      displayName: string;
      division: string;
      assignedTrack: TrackLevel;
    }>
  ) => Promise<{ added: number; skipped: number }>;
  onUpdateRegistrationTrack: (
    inviteId: string,
    assignedTrack: TrackLevel
  ) => Promise<void>;
  onDeleteRegistration: (inviteId: string) => Promise<void>;
  onChangeUserRole: (uid: string, role: UserRole) => Promise<void>;
  onOverrideLearnerTrack: (learnerId: string, track: TrackLevel) => void;
  onSendIntervention: (learnerId: string) => void;
  onUpdateCourseThresholds: (
    courseId: string,
    passingScore: number,
    minWatchPercent: number
  ) => void;
  onMoveCourseOrder: (
    courseId: string,
    direction: 'up' | 'down'
  ) => void | Promise<void>;
  onAddNewCourse: (input: {
    code: string;
    title: string;
    category: string;
    trackLevel: TrackLevel;
    trackLevels?: TrackLevel[];
    instructorName: string;
    syllabusDurationLabel: string;
    passingScore: number;
    minWatchPercent: number;
    description: string;
    moduleOrderInTrack?: number;
    videoUrl?: string;
    videoDurationSec?: number;
  }) => Promise<Course[] | Course | void> | void;
  onDistributeCourseToTracks?: (
    courseId: string,
    targetTracks: TrackLevel[]
  ) => Promise<Course[] | void> | void;
  onChangeCourseTrack?: (courseId: string, nextTrack: TrackLevel) => Promise<void> | void;
  onDeleteCustomCourse?: (courseId: string) => Promise<void> | void;
  onOpenCourseInWorkspace: (courseId: string) => void;
}

type AdminSection =
  | 'learners'
  | 'registrations'
  | 'flow'
  | 'curriculum'
  | 'proctoring'
  | 'audit'
  | 'policy';
type LearnerStatusFilter = 'Semua' | 'Sertifikat' | 'Perlu Bimbingan' | 'Berjalan';
type RegistrationStatusFilter = 'Semua' | 'pending' | 'active';

const DIVISION_OPTIONS = COMPANY_DEPARTMENTS;

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  tracks,
  courses,
  progressStore,
  placementLevel,
  currentUser,
  registeredUsers,
  userProgressMap = {},
  participantRegistrations,
  cohortLearners,
  proctoringLogs,
  onDeleteProctoringLog,
  onOpenDualVerificationView,
  workspacePolicy,
  onUpdateWorkspacePolicy,
  onRegisterParticipant,
  onBulkRegisterParticipants,
  onUpdateRegistrationTrack,
  onDeleteRegistration,
  onChangeUserRole,
  onOverrideLearnerTrack,
  onSendIntervention,
  onUpdateCourseThresholds,
  onMoveCourseOrder,
  onAddNewCourse,
  onDistributeCourseToTracks,
  onChangeCourseTrack,
  onDeleteCustomCourse,
  onOpenCourseInWorkspace,
}) => {
  const [section, setSection] = useState<AdminSection>('learners');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState<'Semua' | TrackLevel>('Semua');
  const [statusFilter, setStatusFilter] = useState<LearnerStatusFilter>('Semua');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const [selectedModuleFilterId, setSelectedModuleFilterId] =
    useState<string>('all');

  // Participant Email Registration State
  const [regMode, setRegMode] = useState<'single' | 'bulk'>('single');
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regDivision, setRegDivision] = useState<string>(DIVISION_OPTIONS[0]);
  const [regTrack, setRegTrack] = useState<TrackLevel>('OJT');
  const [bulkText, setBulkText] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regFeedback, setRegFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [regSearch, setRegSearch] = useState('');
  const [regStatusFilter, setRegStatusFilter] =
    useState<RegistrationStatusFilter>('Semua');
  const [regTrackFilter, setRegTrackFilter] = useState<'Semua' | TrackLevel>(
    'Semua'
  );
  const [invitePolicySaving, setInvitePolicySaving] = useState(false);

  // Learning Flow Configuration State
  const [levelFlowMode, setLevelFlowMode] = useState<LevelFlowMode>(
    workspacePolicy.levelFlowMode
  );
  const [enforceModuleOrder, setEnforceModuleOrder] = useState<boolean>(
    workspacePolicy.enforceModuleOrder
  );
  const [trackSequence, setTrackSequence] = useState<TrackLevel[]>(
    workspacePolicy.trackSequence
  );
  const [flowSelectedTrack, setFlowSelectedTrack] = useState<TrackLevel>('OJT');
  const [flowSaving, setFlowSaving] = useState(false);
  const [flowSavedMessage, setFlowSavedMessage] = useState<string | null>(null);

  // Camera & Screen Tracking Policy Form State
  const [enableCameraMonitoring, setEnableCameraMonitoring] = useState<boolean>(
    workspacePolicy.enableCameraMonitoring
  );
  const [requireCameraForTests, setRequireCameraForTests] = useState<boolean>(
    workspacePolicy.requireCameraForTests
  );
  const [enableScreenTracking, setEnableScreenTracking] = useState<boolean>(
    workspacePolicy.enableScreenTracking
  );
  const [enableTabSwitchSiren, setEnableTabSwitchSiren] = useState<boolean>(
    workspacePolicy.enableTabSwitchSiren
  );
  const [requireFullscreenForPostTest, setRequireFullscreenForPostTest] =
    useState<boolean>(workspacePolicy.requireFullscreenForPostTest);
  const [maxTabSwitchTolerance, setMaxTabSwitchTolerance] = useState<number>(
    workspacePolicy.maxTabSwitchTolerance
  );
  const [proctoringSaving, setProctoringSaving] = useState(false);
  const [proctoringSavedMessage, setProctoringSavedMessage] = useState<
    string | null
  >(null);

  // Corporate Email Policy Form State
  const [companyName, setCompanyName] = useState(workspacePolicy.companyName);
  const [enforceDomain, setEnforceDomain] = useState(
    workspacePolicy.enforceCorporateDomain
  );
  const [requireInvite, setRequireInvite] = useState(
    workspacePolicy.requireRegisteredInvite
  );
  const [domainsInput, setDomainsInput] = useState(
    workspacePolicy.allowedDomains.join(', ')
  );
  const [policySaving, setPolicySaving] = useState(false);
  const [policySavedMessage, setPolicySavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setCompanyName(workspacePolicy.companyName);
    setEnforceDomain(workspacePolicy.enforceCorporateDomain);
    setRequireInvite(workspacePolicy.requireRegisteredInvite);
    setDomainsInput(workspacePolicy.allowedDomains.join(', '));
    setLevelFlowMode(workspacePolicy.levelFlowMode);
    setEnforceModuleOrder(workspacePolicy.enforceModuleOrder);
    setTrackSequence(workspacePolicy.trackSequence);
    setEnableCameraMonitoring(workspacePolicy.enableCameraMonitoring);
    setRequireCameraForTests(workspacePolicy.requireCameraForTests);
    setEnableScreenTracking(workspacePolicy.enableScreenTracking);
    setEnableTabSwitchSiren(workspacePolicy.enableTabSwitchSiren);
    setRequireFullscreenForPostTest(workspacePolicy.requireFullscreenForPostTest);
    setMaxTabSwitchTolerance(workspacePolicy.maxTabSwitchTolerance);
  }, [workspacePolicy]);

  // Add class/module form state (multi-paket + MP4 video)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Pengembangan Profesional');
  const [newTrack, setNewTrack] = useState<TrackLevel>('OJT');
  const [selectedTracks, setSelectedTracks] = useState<TrackLevel[]>(['OJT']);
  const [newInsertOrder, setNewInsertOrder] = useState<number | 'end'>('end');
  const [newInstructor, setNewInstructor] = useState('Nadia Permatasari');
  const [newDuration, setNewDuration] = useState('35 Menit');
  const [newPassingScore, setNewPassingScore] = useState(75);
  const [newMinWatch] = useState(80);
  const [newDescription, setNewDescription] = useState('');
  const [videoInputMode, setVideoInputMode] = useState<'upload' | 'url'>('upload');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoDurationSec, setNewVideoDurationSec] = useState<number | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadPct, setVideoUploadPct] = useState(0);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [addingCourse, setAddingCourse] = useState(false);
  const [addCourseError, setAddCourseError] = useState<string | null>(null);
  const [addCourseSuccess, setAddCourseSuccess] = useState<{
    courseId: string;
    code: string;
    title: string;
    trackLevels: TrackLevel[];
    order: number;
    hasMp4: boolean;
  } | null>(null);
  const [curriculumTrackFilter, setCurriculumTrackFilter] = useState<'Semua' | TrackLevel>('Semua');
  const [distributingCourse, setDistributingCourse] = useState<Course | null>(null);
  const [distributeTargetTracks, setDistributeTargetTracks] = useState<TrackLevel[]>([]);
  const [distributingLoading, setDistributingLoading] = useState(false);
  const [distributeMessage, setDistributeMessage] = useState<string | null>(null);

  // Compute live row for the active signed-in user so Admin sees real-time progress
  const activeSessionLearner: CohortLearner = useMemo(() => {
    const preScores = courses
      .map((c) => progressStore[c.id]?.preTestResult?.score)
      .filter((s): s is number => typeof s === 'number');
    const postScores = courses
      .map((c) => {
        const p = progressStore[c.id];
        return p ? getBestPostScore(p) : null;
      })
      .filter((s): s is number => typeof s === 'number');
    const avgPre =
      preScores.length > 0
        ? Math.round(preScores.reduce((a, b) => a + b, 0) / preScores.length)
        : 0;
    const bestPost = postScores.length > 0 ? Math.max(...postScores) : null;
    const avgWatch = Math.round(
      courses.reduce((acc, c) => {
        const p = progressStore[c.id];
        return acc + (p ? getWatchPercentage(p, c) : 0);
      }, 0) / Math.max(1, courses.length)
    );
    const passedCount = courses.filter((c) =>
      isCoursePassed(c, progressStore)
    ).length;
    const avgPost =
      postScores.length > 0
        ? Math.round(postScores.reduce((a, b) => a + b, 0) / postScores.length)
        : null;

    const activeTrack = placementLevel ?? currentUser.currentTrack;
    const pkgSummary = getAccountPackageSummary(
      activeTrack,
      progressStore,
      courses
    );

    return {
      id: currentUser.uid,
      name: `${currentUser.displayName} (Anda)`,
      division: currentUser.division,
      email: currentUser.email,
      role: currentUser.role,
      isLiveAccount: true,
      currentTrack: activeTrack,
      avgPreScore: avgPre,
      avgVideoPct: avgWatch,
      bestPostScore: bestPost,
      nGain:
        avgPost !== null && preScores.length > 0
          ? computeNGain(avgPre, avgPost)
          : null,
      modulesPassed: passedCount,
      modulesTotal: courses.length,
      needsIntervention: avgWatch < 40 && postScores.length === 0,
      interventionSent: currentUser.interventionSent,
      packageProgressPct: pkgSummary.progressPct,
      packageModulesPassed: pkgSummary.modulesPassed,
      packageModulesTotal: pkgSummary.modulesTotal,
      accountStatus: 'active',
    };
  }, [courses, progressStore, placementLevel, currentUser]);

  const firestoreOtherLearners: CohortLearner[] = useMemo(() => {
    return registeredUsers
      .filter((u) => u.uid !== currentUser.uid)
      .map((u) => {
        const userStore = userProgressMap[u.uid];
        const hasStore = userStore && Object.keys(userStore).length > 0;
        const pkgSummary = getAccountPackageSummary(
          u.currentTrack,
          userStore ?? {},
          courses
        );
        const trackTotal = Math.max(1, pkgSummary.modulesTotal);
        const fallbackPct =
          u.modulesPassed > 0
            ? Math.min(100, Math.round((u.modulesPassed / trackTotal) * 100))
            : Math.min(95, Math.round(u.avgVideoPct));

        return {
          id: u.uid,
          name: u.displayName,
          division: u.division,
          email: u.email,
          role: u.role,
          isLiveAccount: true,
          currentTrack: u.currentTrack,
          avgPreScore: u.avgPreScore,
          avgVideoPct: hasStore ? pkgSummary.avgVideoPct : u.avgVideoPct,
          bestPostScore: u.bestPostScore >= 0 ? u.bestPostScore : null,
          nGain:
            u.bestPostScore >= 0
              ? computeNGain(u.avgPreScore, u.bestPostScore)
              : null,
          modulesPassed: u.modulesPassed,
          modulesTotal: u.modulesTotal,
          needsIntervention: u.avgVideoPct < 40 && u.bestPostScore < 0,
          interventionSent: u.interventionSent,
          packageProgressPct: hasStore ? pkgSummary.progressPct : fallbackPct,
          packageModulesPassed: hasStore
            ? pkgSummary.modulesPassed
            : Math.min(pkgSummary.modulesTotal, u.modulesPassed),
          packageModulesTotal: pkgSummary.modulesTotal,
          accountStatus: 'active',
        };
      });
  }, [registeredUsers, userProgressMap, currentUser.uid, courses]);

  const pendingRegisteredLearners: CohortLearner[] = useMemo(() => {
    const activeEmails = new Set(
      [activeSessionLearner, ...firestoreOtherLearners]
        .map((l) => l.email?.toLowerCase())
        .filter(Boolean)
    );
    return participantRegistrations
      .filter(
        (reg) =>
          reg.status === 'pending' && !activeEmails.has(reg.email.toLowerCase())
      )
      .map((reg) => {
        const trackTotal = courses.filter(
          (c) => c.trackLevel === reg.assignedTrack
        ).length;
        return {
          id: `pending-${reg.inviteId}`,
          name: reg.displayName || reg.email.split('@')[0],
          division: reg.division,
          email: reg.email,
          role: 'learner' as UserRole,
          isLiveAccount: false,
          currentTrack: reg.assignedTrack,
          avgPreScore: 0,
          avgVideoPct: 0,
          bestPostScore: null,
          nGain: null,
          modulesPassed: 0,
          modulesTotal: trackTotal,
          needsIntervention: false,
          interventionSent: false,
          packageProgressPct: 0,
          packageModulesPassed: 0,
          packageModulesTotal: trackTotal,
          accountStatus: 'pending' as const,
        };
      });
  }, [
    participantRegistrations,
    activeSessionLearner,
    firestoreOtherLearners,
    courses,
  ]);

  const enrichedSampleLearners: CohortLearner[] = useMemo(() => {
    return cohortLearners.map((l) => {
      const trackCourses = courses.filter((c) => c.trackLevel === l.currentTrack);
      const trackTotal = Math.max(1, trackCourses.length);
      const pct =
        l.bestPostScore !== null && l.bestPostScore >= 75
          ? Math.min(
              100,
              Math.max(l.avgVideoPct, Math.round((l.modulesPassed / Math.max(1, l.modulesTotal)) * 100))
            )
          : Math.min(95, l.avgVideoPct);
      const estPassed = Math.min(
        trackTotal,
        Math.round((pct / 100) * trackTotal)
      );
      return {
        ...l,
        packageProgressPct: l.packageProgressPct ?? pct,
        packageModulesPassed: l.packageModulesPassed ?? estPassed,
        packageModulesTotal: l.packageModulesTotal ?? trackTotal,
        accountStatus: l.accountStatus ?? 'sample',
      };
    });
  }, [cohortLearners, courses]);

  const allLearners = useMemo(
    () => [
      activeSessionLearner,
      ...firestoreOtherLearners,
      ...pendingRegisteredLearners,
      ...enrichedSampleLearners,
    ],
    [
      activeSessionLearner,
      firestoreOtherLearners,
      pendingRegisteredLearners,
      enrichedSampleLearners,
    ]
  );

  const filteredLearners = useMemo(() => {
    return allLearners.filter((l) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        (l.email ?? '').toLowerCase().includes(q) ||
        l.division.toLowerCase().includes(q);
      const matchesTrack =
        trackFilter === 'Semua' || l.currentTrack === trackFilter;
      const hasCert = l.bestPostScore !== null && l.bestPostScore > 80;
      const matchesStatus =
        statusFilter === 'Semua' ||
        (statusFilter === 'Sertifikat' && hasCert) ||
        (statusFilter === 'Perlu Bimbingan' && l.needsIntervention) ||
        (statusFilter === 'Berjalan' && !hasCert && !l.needsIntervention);
      return matchesSearch && matchesTrack && matchesStatus;
    });
  }, [allLearners, searchQuery, trackFilter, statusFilter]);

  const proctoringByAccount = useMemo(() => {
    const map: Record<string, AccountProctoringSummary> = {};
    allLearners.forEach((l) => {
      map[l.id] = buildAccountProctoringSummary(
        l.id,
        l.email,
        proctoringLogs,
        workspacePolicy.maxTabSwitchTolerance,
        courses
      );
    });
    return map;
  }, [
    allLearners,
    proctoringLogs,
    workspacePolicy.maxTabSwitchTolerance,
    courses,
  ]);

  const selectedLearner = useMemo(
    () => allLearners.find((l) => l.id === selectedAccountId) ?? null,
    [allLearners, selectedAccountId]
  );

  // Cohort Executive KPIs
  const certCount = allLearners.filter(
    (l) => l.bestPostScore !== null && l.bestPostScore > 80
  ).length;
  const interventionCount = allLearners.filter((l) => l.needsIntervention).length;
  const learnersWithPost = allLearners.filter((l) => l.bestPostScore !== null);
  const avgGainDelta =
    learnersWithPost.length > 0
      ? Math.round(
          learnersWithPost.reduce(
            (sum, l) => sum + ((l.bestPostScore ?? 0) - l.avgPreScore),
            0
          ) / learnersWithPost.length
        )
      : 0;

  const handleExportCohortCSV = () => {
    const headers = [
      'Nama Peserta',
      'Email',
      'Departemen',
      'Paket Pelatihan',
      'Progres Paket (%)',
      'Modul Paket Lulus',
      'Rata-rata Pre-Test',
      'Video (%)',
      'Post-Test Terbaik',
      'N-Gain',
      'Membuka Tab Lain',
      'Total Pelanggaran',
      'Status Integritas',
      'Snapshot 10 dtk',
      'Status',
    ];
    const rows = filteredLearners.map((l) => {
      const proctor = proctoringByAccount[l.id];
      return [
        `"${l.name}"`,
        `"${l.email ?? ''}"`,
        `"${l.division}"`,
        `Paket ${l.currentTrack}`,
        `${l.packageProgressPct ?? 0}%`,
        `${l.packageModulesPassed ?? l.modulesPassed}/${l.packageModulesTotal ?? l.modulesTotal}`,
        l.avgPreScore,
        l.avgVideoPct,
        l.bestPostScore ?? '',
        l.nGain !== null ? l.nGain.toFixed(2) : '',
        `${proctor?.totalTabSwitches ?? 0}x`,
        proctor?.violationCount ?? 0,
        proctor?.overallIntegrity ?? 'aman',
        proctor?.snapshots.length ?? 0,
        l.accountStatus === 'pending'
          ? 'Terdaftar (Belum Login)'
          : l.bestPostScore !== null && l.bestPostScore > 80
            ? 'Sertifikat Terbit'
            : l.needsIntervention
              ? 'Perlu Bimbingan'
              : 'Sedang Belajar',
      ];
    });
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'laporan-summary-per-akun-lms.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const getSuggestedCodeForTrack = (track: TrackLevel) => {
    const prefix =
      track === 'OJT'
        ? 'OJT'
        : track === 'Junior'
          ? 'JR'
          : track === 'Middle'
            ? 'MD'
            : 'SR';
    const nextNum = 101 + courses.filter((c) => c.trackLevel === track).length;
    return `${prefix}-${nextNum}`;
  };

  const openAddClassForTrack = (track: TrackLevel) => {
    setSection('curriculum');
    setNewTrack(track);
    setSelectedTracks([track]);
    setNewInsertOrder('end');
    setAddCourseError(null);
    setAddCourseSuccess(null);
    setVideoUploadError(null);
    if (!newCode.trim() || /^(OJT|JR|MD|SR|ALL)-\d+$/i.test(newCode.trim())) {
      setNewCode(getSuggestedCodeForTrack(track));
    }
    setShowAddForm(true);
  };

  const formatDurationLabelFromSec = (sec: number) => {
    const rounded = Math.max(1, Math.round(sec));
    const mins = Math.floor(rounded / 60);
    const remSec = rounded % 60;
    if (mins === 0) return `${remSec} Detik`;
    if (remSec === 0) return `${mins} Menit`;
    return `${mins} Menit ${remSec} Detik`;
  };

  const handleToggleTargetTrack = (track: TrackLevel) => {
    setSelectedTracks((prev) => {
      const exists = prev.includes(track);
      const next = exists ? prev.filter((t) => t !== track) : [...prev, track];
      if (next.length > 0 && !next.includes(newTrack)) {
        setNewTrack(next[0]);
      }
      return next;
    });
  };

  const handleSelectAllTracks = () => {
    const allTracks = workspacePolicy.trackSequence;
    const allSelected = allTracks.every((t) => selectedTracks.includes(t));
    if (allSelected) {
      setSelectedTracks([newTrack]);
    } else {
      setSelectedTracks([...allTracks]);
      if (allTracks.length > 0) {
        setNewTrack(allTracks[0]);
      }
    }
  };

  const handleUploadMp4File = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    const isMp4 =
      lowerName.endsWith('.mp4') || file.type.toLowerCase() === 'video/mp4';
    if (!isMp4) {
      setVideoUploadError('Format file harus berupa video .mp4.');
      return;
    }
    if (file.size > 150 * 1024 * 1024) {
      setVideoUploadError('Ukuran file MP4 maksimal 150 MB.');
      return;
    }

    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      setVideoUploadError(
        'Sesi login Firebase tidak ditemukan. Silakan masuk ulang.'
      );
      return;
    }

    setVideoUploading(true);
    setVideoUploadPct(0);
    setVideoUploadError(null);

    const asciiFilename =
      file.name.replace(/[^\x20-\x7E]/g, '_').replace(/\.mp4$/i, '') + '.mp4';

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload-video');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', 'video/mp4');
      xhr.setRequestHeader('x-filename', asciiFilename);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable && evt.total > 0) {
          setVideoUploadPct(Math.round((evt.loaded / evt.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const parsed = JSON.parse(xhr.responseText || '{}') as {
            url?: string;
            fileName?: string;
            error?: string;
          };
          if (xhr.status >= 200 && xhr.status < 300 && parsed.url) {
            setNewVideoUrl(parsed.url);
            setVideoFileName(parsed.fileName ?? file.name);
            setVideoUploadPct(100);
            setVideoUploadError(null);
          } else {
            setVideoUploadError(
              parsed.error || 'Gagal mengunggah video MP4 ke server.'
            );
          }
        } catch {
          setVideoUploadError('Respons unggahan video tidak valid.');
        }
        setVideoUploading(false);
        resolve();
      };

      xhr.onerror = () => {
        setVideoUploadError(
          'Koneksi terputus saat mengunggah video MP4. Silakan coba lagi.'
        );
        setVideoUploading(false);
        resolve();
      };

      xhr.send(file);
    });
  };

  const handleOpenDistribute = (course: Course) => {
    const existingForSameContent = new Set(
      courses
        .filter(
          (c) =>
            c.code.toUpperCase() === course.code.toUpperCase() &&
            c.title.trim().toLowerCase() === course.title.trim().toLowerCase()
        )
        .map((c) => c.trackLevel)
    );
    const missingTracks = workspacePolicy.trackSequence.filter(
      (t) => !existingForSameContent.has(t)
    );
    setDistributingCourse(course);
    setDistributeTargetTracks(missingTracks);
    setDistributeMessage(null);
  };

  const handleConfirmDistribute = async () => {
    if (
      !distributingCourse ||
      !onDistributeCourseToTracks ||
      distributeTargetTracks.length === 0
    ) {
      return;
    }
    setDistributingLoading(true);
    try {
      const added = await onDistributeCourseToTracks(
        distributingCourse.id,
        distributeTargetTracks
      );
      const count = Array.isArray(added) ? added.length : 0;
      setDistributeMessage(
        count > 0
          ? `Kelas "${distributingCourse.title}" berhasil ditambahkan ke ${count} paket tujuan (${distributeTargetTracks.join(', ')}).`
          : 'Semua paket yang dipilih sudah memiliki kelas ini.'
      );
      setDistributingCourse(null);
      setDistributeTargetTracks([]);
    } finally {
      setDistributingLoading(false);
    }
  };

  const handleSubmitNewCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = newCode.trim();
    const trimmedTitle = newTitle.trim();
    const trimmedCategory = newCategory.trim() || 'Pengembangan Profesional';
    const trimmedInstructor = newInstructor.trim() || 'Tim Kurikulum Lentera';
    const trimmedDuration = newDuration.trim() || '30 Menit';
    const trimmedDesc = newDescription.trim();
    const trimmedVideoUrl = newVideoUrl.trim();

    if (selectedTracks.length === 0) {
      setAddCourseError('Pilih minimal 1 paket pelatihan tujuan.');
      return;
    }
    if (videoUploading) {
      setAddCourseError('Tunggu proses unggah video MP4 selesai terlebih dahulu.');
      return;
    }
    if (trimmedCode.length < 2 || trimmedCode.length > 32) {
      setAddCourseError('Kode kelas harus 2 hingga 32 karakter.');
      return;
    }
    if (trimmedTitle.length < 3 || trimmedTitle.length > 140) {
      setAddCourseError('Nama kelas / judul modul harus 3 hingga 140 karakter.');
      return;
    }
    if (trimmedCategory.length < 2 || trimmedInstructor.length < 2) {
      setAddCourseError('Kategori dan nama instruktur minimal 2 karakter.');
      return;
    }
    if (trimmedDesc.length > 500) {
      setAddCourseError('Ringkasan materi maksimal 500 karakter.');
      return;
    }
    if (trimmedVideoUrl) {
      const isValidVideoPrefix =
        trimmedVideoUrl.startsWith('/uploads/') ||
        trimmedVideoUrl.startsWith('https://') ||
        trimmedVideoUrl.startsWith('http://');
      if (!isValidVideoPrefix) {
        setAddCourseError(
          'URL video harus diawali http://, https://, atau hasil unggah MP4 (/uploads/...).'
        );
        return;
      }
      if (trimmedVideoUrl.length > 1500) {
        setAddCourseError('URL video maksimal 1500 karakter.');
        return;
      }
    }

    const orderedSelectedTracks = workspacePolicy.trackSequence.filter((t) =>
      selectedTracks.includes(t)
    );
    const primaryTrack = orderedSelectedTracks[0] ?? newTrack;
    const sameTrackCount = courses.filter(
      (c) => c.trackLevel === primaryTrack
    ).length;
    const targetOrder =
      orderedSelectedTracks.length === 1 && newInsertOrder !== 'end'
        ? newInsertOrder
        : sameTrackCount + 1;

    setAddingCourse(true);
    setAddCourseError(null);
    try {
      const createdResult = await onAddNewCourse({
        code: trimmedCode,
        title: trimmedTitle,
        category: trimmedCategory,
        trackLevel: primaryTrack,
        trackLevels: orderedSelectedTracks,
        instructorName: trimmedInstructor,
        syllabusDurationLabel: trimmedDuration,
        passingScore: newPassingScore,
        minWatchPercent: newMinWatch,
        description: trimmedDesc,
        moduleOrderInTrack:
          orderedSelectedTracks.length === 1 ? targetOrder : undefined,
        videoUrl: trimmedVideoUrl || undefined,
        videoDurationSec:
          trimmedVideoUrl && newVideoDurationSec ? newVideoDurationSec : undefined,
      });

      const createdArray = Array.isArray(createdResult)
        ? createdResult
        : createdResult
          ? [createdResult]
          : [];
      const firstCreated = createdArray[0];

      setAddCourseSuccess({
        courseId: firstCreated?.id ?? '',
        code: trimmedCode.toUpperCase(),
        title: trimmedTitle,
        trackLevels: orderedSelectedTracks,
        order: firstCreated?.moduleOrderInTrack ?? targetOrder,
        hasMp4: Boolean(trimmedVideoUrl),
      });
      setCurriculumTrackFilter(
        orderedSelectedTracks.length > 1 ? 'Semua' : primaryTrack
      );
      setNewCode('');
      setNewTitle('');
      setNewDescription('');
      setNewVideoUrl('');
      setNewVideoDurationSec(null);
      setVideoFileName(null);
      setVideoUploadPct(0);
      setVideoUploadError(null);
      setNewInsertOrder('end');
      setShowAddForm(false);
    } catch (err) {
      setAddCourseError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan kelas baru. Silakan coba lagi.'
      );
    } finally {
      setAddingCourse(false);
    }
  };

  // Curriculum Audit metrics derived from live courses + cohort patterns
  const auditRows = useMemo(() => {
    return courses.map((course, idx) => {
      const p = progressStore[course.id];
      const userPre = p?.preTestResult?.score ?? null;
      const userPost = p ? getBestPostScore(p) : null;
      const basePre = userPre ?? (idx % 2 === 0 ? 48 : 54);
      const basePost =
        userPost ?? (course.trackLevel === 'Senior' ? 84 : idx % 3 === 1 ? 68 : 88);
      const nGain = computeNGain(basePre, basePost);
      const watchDropOff =
        course.trackLevel === 'Senior'
          ? 18
          : idx % 3 === 1
            ? 34
            : 12;

      return {
        course,
        avgPre: basePre,
        avgPost: basePost,
        nGain,
        watchDropOff,
        status:
          nGain >= 0.7
            ? 'Efektif Tinggi'
            : nGain >= 0.35
              ? 'Cukup Baik'
              : 'Perlu Revisi Bab',
      };
    });
  }, [courses, progressStore]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header & Primary Admin Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-blue-700">
            Konsol Pengelola Kurikulum &amp; L&amp;D
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Dashboard Admin LMS
          </h1>
          <p className="text-sm text-slate-600">
            Pantau progres peserta lintas jenjang, atur ambang KKM &amp; syarat video, tambah modul baru, dan audit efektivitas materi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onOpenDualVerificationView && (
            <button
              type="button"
              onClick={onOpenDualVerificationView}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <Monitor className="w-4 h-4" aria-hidden="true" />
              <span>2 Tampilan: User &amp; Admin</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSection('registrations')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 text-blue-700" aria-hidden="true" />
            <span>Registrasi Email Peserta</span>
          </button>

          <button
            type="button"
            onClick={handleExportCohortCSV}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Ekspor CSV Kohort</span>
          </button>

          <button
            type="button"
            onClick={() => openAddClassForTrack(curriculumTrackFilter === 'Semua' ? 'OJT' : curriculumTrackFilter)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Tambah Kelas Baru</span>
          </button>
        </div>
      </div>

      {/* 4-Column Executive KPI Strip */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <div className="text-xs text-slate-500">Total Peserta Aktif</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {allLearners.length} Peserta
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Rata-Rata Kenaikan Skor</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-blue-700 tabular-nums">
            +{avgGainDelta} poin
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Sertifikat Terbit (&gt; 80%)</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">
            {certCount} / {allLearners.length}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Peserta Perlu Bimbingan</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-amber-700 tabular-nums">
            {interventionCount} Peserta
          </div>
        </div>
      </section>

      {/* Admin Sub-Navigation Segmented Control */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Menu Dashboard Admin"
          className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg overflow-x-auto"
        >
          {[
            { id: 'learners' as AdminSection, label: `Summary Per Akun (${allLearners.length})` },
            {
              id: 'registrations' as AdminSection,
              label: `Registrasi Peserta (${participantRegistrations.length})`,
            },
            { id: 'flow' as AdminSection, label: 'Atur Alur Belajar' },
            { id: 'curriculum' as AdminSection, label: `Kelola Kelas & Paket (${courses.length})` },
            {
              id: 'proctoring' as AdminSection,
              label: 'Pengaturan Kamera & Layar',
            },
            { id: 'audit' as AdminSection, label: 'Audit Efektivitas Materi' },
            { id: 'policy' as AdminSection, label: 'Kebijakan Email Kantor' },
          ].map((tab) => {
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSection(tab.id)}
                className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: SUMMARY PER AKUN (KLIK AKUN -> PROGRES % & PELANGGARAN KAMERA/LAYAR) */}
      {section === 'learners' &&
        (selectedLearner ? (() => {
          const pct = selectedLearner.packageProgressPct ?? 0;
          const pkgPassed = selectedLearner.packageModulesPassed ?? 0;
          const pkgTotal = Math.max(
            1,
            selectedLearner.packageModulesTotal ?? 1
          );
          const trackObj =
            tracks.find((t) => t.id === selectedLearner.currentTrack) ??
            tracks[0];
          const accountStore =
            selectedLearner.id === currentUser.uid
              ? progressStore
              : userProgressMap[selectedLearner.id];
          const trackCourses = courses
            .filter((c) => c.trackLevel === selectedLearner.currentTrack)
            .sort((a, b) => a.moduleOrderInTrack - b.moduleOrderInTrack);
          const proctor =
            proctoringByAccount[selectedLearner.id] ??
            buildAccountProctoringSummary(
              selectedLearner.id,
              selectedLearner.email,
              proctoringLogs,
              workspacePolicy.maxTabSwitchTolerance,
              courses
            );

          const activeModuleFilter =
            selectedModuleFilterId !== 'all' &&
            (proctor.moduleSummaries.some(
              (m) => m.courseId === selectedModuleFilterId
            ) ||
              trackCourses.some((tc) => tc.id === selectedModuleFilterId))
              ? selectedModuleFilterId
              : 'all';

          const filteredViolations =
            activeModuleFilter === 'all'
              ? proctor.violations
              : proctor.violations.filter(
                  (v) => v.courseId === activeModuleFilter
                );

          const filteredSnapshots =
            activeModuleFilter === 'all'
              ? proctor.snapshots
              : proctor.snapshots.filter(
                  (s) => s.courseId === activeModuleFilter
                );

          return (
            <div className="space-y-6">
              {/* Back bar & Selected Account Header */}
              <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(null);
                      setSelectedModuleFilterId('all');
                    }}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-700 hover:text-blue-800 self-start"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Kembali ke Daftar Summary Per Akun</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor="switch-selected-account"
                      className="text-xs text-slate-500"
                    >
                      Ganti Akun:
                    </label>
                    <select
                      id="switch-selected-account"
                      value={selectedLearner.id}
                      onChange={(e) => {
                        setSelectedAccountId(e.target.value);
                        setSelectedModuleFilterId('all');
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    >
                      {allLearners.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.currentTrack})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                        {selectedLearner.name}
                      </h2>
                      <span
                        className={`text-xs font-semibold ${
                          proctor.overallIntegrity === 'pelanggaran'
                            ? 'text-red-700'
                            : proctor.overallIntegrity === 'peringatan'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                        }`}
                      >
                        ·{' '}
                        {proctor.overallIntegrity === 'pelanggaran'
                          ? 'Terdeteksi Pelanggaran'
                          : proctor.overallIntegrity === 'peringatan'
                            ? 'Ada Peringatan Fokus'
                            : 'Integritas Aman'}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-mono">
                        {selectedLearner.email || 'Akun Kohort Referensi'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedLearner.division}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {selectedLearner.accountStatus === 'pending'
                          ? 'Belum Login'
                          : selectedLearner.isLiveAccount
                            ? 'Akun Aktif'
                            : 'Data Kohort'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {selectedLearner.accountStatus !== 'pending' && (
                      <>
                        <select
                          aria-label={`Ubah jenjang ${selectedLearner.name}`}
                          value={selectedLearner.currentTrack}
                          onChange={(e) =>
                            onOverrideLearnerTrack(
                              selectedLearner.id,
                              e.target.value as TrackLevel
                            )
                          }
                          className="px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          <option value="OJT">Paket OJT</option>
                          <option value="Junior">Paket Junior</option>
                          <option value="Middle">Paket Middle</option>
                          <option value="Senior">Paket Senior</option>
                        </select>
                        {selectedLearner.isLiveAccount &&
                          selectedLearner.id !== currentUser.uid && (
                            <select
                              aria-label={`Ubah peran ${selectedLearner.name}`}
                              value={selectedLearner.role ?? 'learner'}
                              onChange={(e) =>
                                void onChangeUserRole(
                                  selectedLearner.id,
                                  e.target.value as UserRole
                                )
                              }
                              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg"
                            >
                              <option value="learner">Peserta</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        {selectedLearner.interventionSent ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Pengingat Terkirim</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSendIntervention(selectedLearner.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Kirim Pengingat</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* Part 1: Training Package & % Progress */}
              <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-blue-700">
                      1. Training yang Diikuti &amp; Progres Berjalan
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      {trackObj.name}
                    </h3>
                    <p className="text-xs text-slate-600">{trackObj.subtitle}</p>
                  </div>

                  <div className="min-w-[240px] space-y-1.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-xs text-slate-600">
                        Total Progres Paket
                      </span>
                      <span
                        className={`font-mono text-2xl font-bold tabular-nums ${
                          pct === 100 ? 'text-emerald-700' : 'text-blue-700'
                        }`}
                      >
                        {pct}% berjalan
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          pct === 100 ? 'bg-emerald-600' : 'bg-blue-700'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500 tabular-nums">
                      <span>
                        {pkgPassed}/{pkgTotal} modul lulus
                      </span>
                      <span>
                        Pre {selectedLearner.avgPreScore} · Video{' '}
                        {selectedLearner.avgVideoPct}% · Post{' '}
                        {selectedLearner.bestPostScore ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {accountStore ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                          <th className="py-3 px-6">Modul di {trackObj.name}</th>
                          <th className="py-3 px-4 text-right">Pre-Test</th>
                          <th className="py-3 px-4 text-right">Video</th>
                          <th className="py-3 px-4">Checkpoint</th>
                          <th className="py-3 px-4 text-right">Post-Test</th>
                          <th className="py-3 px-4">Kecurangan / Pelanggaran</th>
                          <th className="py-3 px-6 text-right">Progres</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                        {trackCourses.map((tc) => {
                          const cp = accountStore[tc.id];
                          const modPct = getCourseProgressPercentage(tc, cp);
                          const watchPct = cp ? getWatchPercentage(cp, tc) : 0;
                          const bestPost = cp ? getBestPostScore(cp) : null;
                          const passed = isCoursePassed(tc, accountStore);
                          const modProctor = proctor.moduleSummaries.find(
                            (m) =>
                              m.courseId === tc.id ||
                              m.courseCode.toUpperCase() ===
                                tc.code.toUpperCase()
                          );
                          const isModuleFiltered =
                            activeModuleFilter === tc.id;

                          return (
                            <tr
                              key={tc.id}
                              onClick={() =>
                                setSelectedModuleFilterId(
                                  isModuleFiltered ? 'all' : tc.id
                                )
                              }
                              className={`cursor-pointer transition-colors ${
                                isModuleFiltered
                                  ? 'bg-blue-50/70'
                                  : 'hover:bg-slate-50/70'
                              }`}
                            >
                              <td className="py-3 px-6">
                                <div className="font-semibold text-slate-900">
                                  Modul {tc.moduleOrderInTrack} · {tc.title}
                                </div>
                                <div className="text-xs font-mono text-slate-500">
                                  {tc.code} · KKM {tc.passingScore}%
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                                {cp?.preTestResult ? cp.preTestResult.score : '—'}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                                {watchPct}%
                              </td>
                              <td className="py-3 px-4 text-xs">
                                {cp?.checkpointPassed ? (
                                  <span className="font-semibold text-emerald-700">
                                    Selesai
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Belum</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                                {bestPost !== null ? bestPost : '—'}
                              </td>
                              <td className="py-3 px-4 text-xs">
                                {!modProctor ? (
                                  <span className="text-slate-400">
                                    Belum ada sesi
                                  </span>
                                ) : modProctor.overallIntegrity ===
                                  'pelanggaran' ? (
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-red-700 inline-flex items-center gap-1">
                                      <ShieldAlert
                                        className="w-3.5 h-3.5 shrink-0"
                                        aria-hidden="true"
                                      />
                                      <span>
                                        {modProctor.violationCount} Pelanggaran
                                      </span>
                                    </span>
                                    <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                                      Tab {modProctor.totalTabSwitches}x · Fokus{' '}
                                      {modProctor.avgFocusScorePct}%
                                    </div>
                                  </div>
                                ) : modProctor.overallIntegrity ===
                                  'peringatan' ? (
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-amber-700 inline-flex items-center gap-1">
                                      <AlertTriangle
                                        className="w-3.5 h-3.5 shrink-0"
                                        aria-hidden="true"
                                      />
                                      <span>
                                        {modProctor.violationCount} Peringatan
                                      </span>
                                    </span>
                                    <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                                      Tab {modProctor.totalTabSwitches}x · Fokus{' '}
                                      {modProctor.avgFocusScorePct}%
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                                      <ShieldCheck
                                        className="w-3.5 h-3.5 shrink-0"
                                        aria-hidden="true"
                                      />
                                      <span>Aman</span>
                                    </span>
                                    <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                                      Fokus {modProctor.avgFocusScorePct}% ·{' '}
                                      {modProctor.snapshots.length} foto
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-6 text-right">
                                <span
                                  className={`font-mono font-bold tabular-nums ${
                                    passed
                                      ? 'text-emerald-700'
                                      : modPct > 0
                                        ? 'text-blue-700'
                                        : 'text-slate-400'
                                  }`}
                                >
                                  {modPct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-xs text-slate-500">
                    {selectedLearner.accountStatus === 'pending'
                      ? 'Peserta ini baru didaftarkan emailnya dan belum login ke portal. Progres modul akan otomatis tampil saat peserta mulai belajar.'
                      : 'Rincian modul per sesi tersedia untuk akun yang aktif login di sistem.'}
                  </div>
                )}
              </section>

              {/* Part 2: Camera, Screen Tracking & Violation Reports for this Account */}
              <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-blue-700">
                      2. Summary Kecurangan, Kamera &amp; Layar Per Modul
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      Deteksi Kecurangan Per Modul ({selectedLearner.name})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSection('proctoring')}
                    className="text-xs font-semibold text-blue-700 hover:underline self-start sm:self-auto"
                  >
                    Atur Kebijakan Kamera &amp; Layar
                  </button>
                </div>

                {/* 4-Column Account Proctoring Telemetry Strip */}
                <div className="p-5 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-5 border-b border-slate-200 bg-slate-50/70">
                  <div>
                    <div className="text-xs text-slate-500">Status Integritas</div>
                    <div
                      className={`mt-1 text-base font-bold flex items-center gap-1.5 ${
                        proctor.overallIntegrity === 'pelanggaran'
                          ? 'text-red-700'
                          : proctor.overallIntegrity === 'peringatan'
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                      }`}
                    >
                      {proctor.overallIntegrity === 'pelanggaran' ? (
                        <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                      ) : proctor.overallIntegrity === 'peringatan' ? (
                        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {proctor.overallIntegrity === 'pelanggaran'
                          ? 'Pelanggaran'
                          : proctor.overallIntegrity === 'peringatan'
                            ? 'Peringatan'
                            : 'Aman'}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 tabular-nums mt-0.5">
                      {proctor.violationCount} kejadian ·{' '}
                      {proctor.cheatingModules.length} modul terdampak
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Membuka Tab Lain</div>
                    <div
                      className={`mt-1 font-mono text-xl font-bold tabular-nums ${
                        proctor.totalTabSwitches >
                        workspacePolicy.maxTabSwitchTolerance
                          ? 'text-red-700'
                          : proctor.totalTabSwitches > 0
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                      }`}
                    >
                      {proctor.totalTabSwitches} kali
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 tabular-nums mt-0.5">
                      Batas toleransi: {workspacePolicy.maxTabSwitchTolerance}x
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Fokus &amp; Keluar Layar</div>
                    <div className="mt-1 font-mono text-xl font-bold text-slate-900 tabular-nums">
                      {proctor.avgFocusScorePct}%
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 tabular-nums mt-0.5">
                      Blur {proctor.totalWindowBlurs}x · Keluar{' '}
                      {proctor.totalAwaySeconds} dtk
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">
                      Kamera &amp; Snapshot (10 dtk)
                    </div>
                    <div
                      className={`mt-1 text-base font-bold ${
                        proctor.cameraActiveNow
                          ? 'text-emerald-700'
                          : 'text-slate-800'
                      }`}
                    >
                      {proctor.cameraActiveNow
                        ? 'Kamera Aktif'
                        : proctor.sessionLogs.length > 0
                          ? 'Kamera Nonaktif'
                          : 'Belum Ada Sesi'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 tabular-nums mt-0.5">
                      {proctor.snapshots.length} foto ·{' '}
                      {proctor.screenShareActiveNow
                        ? 'Berbagi Layar Aktif'
                        : 'Tanpa Berbagi Layar'}
                    </div>
                  </div>
                </div>

                {/* Per-Module Cheating Breakdown */}
                <div className="p-5 sm:p-6 border-b border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-display text-sm sm:text-base font-bold text-slate-900">
                        Ringkasan Kecurangan &amp; Pengawasan Per Modul
                      </h4>
                      <p className="text-xs text-slate-500">
                        Klik salah satu modul untuk memfilter log pelanggaran &amp; snapshot di bawah.
                      </p>
                    </div>
                    {proctor.moduleSummaries.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedModuleFilterId('all')}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                            activeModuleFilter === 'all'
                              ? 'bg-blue-700 border-blue-700 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Semua Modul ({proctor.moduleSummaries.length})
                        </button>
                        {proctor.moduleSummaries.map((mod) => {
                          const isSelectedMod =
                            activeModuleFilter === mod.courseId;
                          return (
                            <button
                              key={`filter-${mod.courseId}`}
                              type="button"
                              onClick={() =>
                                setSelectedModuleFilterId(
                                  isSelectedMod ? 'all' : mod.courseId
                                )
                              }
                              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border transition-colors ${
                                isSelectedMod
                                  ? 'bg-blue-700 border-blue-700 text-white'
                                  : mod.overallIntegrity === 'pelanggaran'
                                    ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                    : mod.overallIntegrity === 'peringatan'
                                      ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {mod.moduleOrder ? `M${mod.moduleOrder} · ` : ''}
                              {mod.courseCode}
                              {mod.violationCount > 0
                                ? ` (${mod.violationCount})`
                                : ''}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {proctor.moduleSummaries.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                      Belum ada aktivitas pengawasan atau kecurangan yang tercatat pada modul mana pun untuk akun ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {proctor.moduleSummaries.map((mod) => {
                        const isSelectedMod =
                          activeModuleFilter === mod.courseId;
                        return (
                          <div
                            key={`mod-card-${mod.courseId}`}
                            onClick={() =>
                              setSelectedModuleFilterId(
                                isSelectedMod ? 'all' : mod.courseId
                              )
                            }
                            className={`p-4 rounded-xl border cursor-pointer transition-colors space-y-2.5 ${
                              isSelectedMod
                                ? 'border-blue-700 ring-1 ring-blue-700 bg-blue-50/30'
                                : mod.overallIntegrity === 'pelanggaran'
                                  ? 'border-red-200 bg-red-50/30 hover:border-red-300'
                                  : mod.overallIntegrity === 'peringatan'
                                    ? 'border-amber-200 bg-amber-50/30 hover:border-amber-300'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-xs font-mono font-semibold text-blue-700">
                                  {mod.trackLevel
                                    ? `Paket ${mod.trackLevel} · `
                                    : ''}
                                  {mod.moduleOrder
                                    ? `Modul ${mod.moduleOrder} · `
                                    : ''}
                                  {mod.courseCode}
                                </div>
                                <div className="text-sm font-bold text-slate-900 truncate">
                                  {mod.courseTitle}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Tahap terekam: {mod.stagesLabel}
                                </div>
                              </div>
                              <span
                                className={`text-xs font-semibold shrink-0 inline-flex items-center gap-1 ${
                                  mod.overallIntegrity === 'pelanggaran'
                                    ? 'text-red-700'
                                    : mod.overallIntegrity === 'peringatan'
                                      ? 'text-amber-700'
                                      : 'text-emerald-700'
                                }`}
                              >
                                {mod.overallIntegrity === 'pelanggaran' ? (
                                  <ShieldAlert
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                  />
                                ) : mod.overallIntegrity === 'peringatan' ? (
                                  <AlertTriangle
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <ShieldCheck
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                  />
                                )}
                                <span>
                                  {mod.overallIntegrity === 'pelanggaran'
                                    ? 'Ada Kecurangan'
                                    : mod.overallIntegrity === 'peringatan'
                                      ? 'Peringatan'
                                      : 'Aman'}
                                </span>
                              </span>
                            </div>

                            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 text-[11px] font-mono tabular-nums">
                              <div>
                                <div className="text-slate-500">Pindah Tab</div>
                                <div
                                  className={`font-bold ${
                                    mod.totalTabSwitches > 0
                                      ? 'text-red-700'
                                      : 'text-slate-800'
                                  }`}
                                >
                                  {mod.totalTabSwitches}x
                                </div>
                              </div>
                              <div>
                                <div className="text-slate-500">Blur / Keluar</div>
                                <div className="font-semibold text-slate-800">
                                  {mod.totalWindowBlurs}x / {mod.totalAwaySeconds}s
                                </div>
                              </div>
                              <div>
                                <div className="text-slate-500">Fokus</div>
                                <div className="font-semibold text-slate-800">
                                  {mod.avgFocusScorePct}%
                                </div>
                              </div>
                              <div>
                                <div className="text-slate-500">Snapshot</div>
                                <div className="font-semibold text-slate-800">
                                  {mod.snapshots.length} foto
                                </div>
                              </div>
                            </div>

                            {mod.violations.length > 0 && (
                              <ul className="pt-2 border-t border-slate-200/80 space-y-1 text-[11px]">
                                {mod.violations.slice(0, 3).map((v) => (
                                  <li
                                    key={`mod-v-${v.id}`}
                                    className="flex items-center justify-between gap-2 text-slate-700"
                                  >
                                    <span className="truncate">
                                      <strong className="text-slate-900">
                                        [{v.stageLabel}]
                                      </strong>{' '}
                                      {v.detail}
                                    </span>
                                    <span className="font-mono text-slate-400 shrink-0 tabular-nums">
                                      {v.time}
                                    </span>
                                  </li>
                                ))}
                                {mod.violations.length > 3 && (
                                  <li className="text-[11px] font-semibold text-blue-700">
                                    +{mod.violations.length - 3} kejadian lainnya di modul ini
                                  </li>
                                )}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Detailed Violation List + 10s Snapshots (Filtered by Module) */}
                <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Violations Log */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display text-sm sm:text-base font-bold text-slate-900">
                        Detail Tindakan Kecurangan &amp; Peringatan (
                        {filteredViolations.length})
                      </h4>
                      {activeModuleFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setSelectedModuleFilterId('all')}
                          className="text-xs font-semibold text-blue-700 hover:underline"
                        >
                          Tampilkan Semua Modul
                        </button>
                      )}
                    </div>

                    {filteredViolations.length === 0 ? (
                      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2.5">
                        <ShieldCheck
                          className="w-4 h-4 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>
                          {proctor.sessionLogs.length === 0
                            ? 'Belum ada sesi kamera atau tracking layar yang terekam untuk akun ini.'
                            : activeModuleFilter !== 'all'
                              ? 'Tidak ada kecurangan atau pelanggaran tercatat pada modul yang dipilih.'
                              : 'Tidak ada pelanggaran perpindahan tab, keluar aplikasi, atau pemutusan kamera yang tercatat pada akun ini.'}
                        </span>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
                        {filteredViolations.map((v) => (
                          <li
                            key={v.id}
                            className="p-3.5 text-xs space-y-1 bg-white"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`font-semibold inline-flex items-center gap-1 ${
                                  v.severity === 'pelanggaran'
                                    ? 'text-red-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {v.severity === 'pelanggaran' ? (
                                  <ShieldAlert
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <AlertTriangle
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                  />
                                )}
                                <span>
                                  {v.moduleOrder
                                    ? `Modul ${v.moduleOrder} · ${v.courseCode}`
                                    : v.courseCode}
                                </span>
                              </span>
                              <span className="font-mono text-slate-500 tabular-nums">
                                {v.stageLabel} · {v.time}
                              </span>
                            </div>
                            <p className="text-slate-800 font-medium">
                              {v.detail}
                            </p>
                            <div className="text-[11px] text-slate-500 truncate">
                              {v.courseTitle}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Right: 10s Snapshots Gallery */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display text-sm sm:text-base font-bold text-slate-900">
                        Snapshot Kamera &amp; Layar Per 10 Detik (
                        {filteredSnapshots.length})
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500">
                        {proctor.latestCameraLabel}
                      </span>
                    </div>

                    {filteredSnapshots.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                        Belum ada snapshot kamera atau layar yang tersimpan untuk pilihan modul ini.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                        {filteredSnapshots.map((snap, idx) => (
                          <div
                            key={`${snap.courseCode}-${snap.time}-${idx}`}
                            className="border border-slate-200 rounded-lg overflow-hidden bg-slate-900"
                          >
                            <img
                              src={snap.dataUrl}
                              alt={`Snapshot ${selectedLearner.name} ${snap.time}`}
                              className="w-full aspect-video object-cover"
                            />
                            <div className="px-2 py-1.5 bg-white text-[10px] font-mono text-slate-700 space-y-0.5 tabular-nums">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900">
                                  {snap.time}
                                </span>
                                <span className="text-slate-500">
                                  {snap.source === 'camera' ? 'Kamera' : 'Layar'}
                                </span>
                              </div>
                              <div className="text-slate-600 truncate font-semibold">
                                {snap.moduleOrder
                                  ? `M${snap.moduleOrder} · ${snap.courseCode}`
                                  : snap.courseCode}{' '}
                                · {snap.stageLabel}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Per-Module Proctoring Session History for this Account */}
                {proctor.sessionLogs.length > 0 && (
                  <div className="border-t border-slate-200">
                    <div className="px-5 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
                      Riwayat Sesi Pengawasan Per Modul ({proctor.sessionLogs.length}{' '}
                      sesi)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                            <th className="py-2.5 px-6">Modul &amp; Tahap</th>
                            <th className="py-2.5 px-4">Kamera / Layar</th>
                            <th className="py-2.5 px-4">Membuka Tab Lain</th>
                            <th className="py-2.5 px-4 text-right">Fokus</th>
                            <th className="py-2.5 px-4">Status</th>
                            <th className="py-2.5 px-6 text-right">Hapus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                          {proctor.sessionLogs.map((log) => (
                            <tr key={log.logId} className="hover:bg-slate-50/70">
                              <td className="py-3 px-6 font-mono font-semibold text-slate-900">
                                {log.courseCode} · {formatStageLabel(log.stage)}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {log.cameraActive ? 'Kamera Aktif' : 'Kamera Mati'} ·{' '}
                                {log.screenShareActive
                                  ? 'Berbagi Layar'
                                  : 'Layar Lokal'}{' '}
                                · {log.snapshots?.length ?? 0} foto
                              </td>
                              <td className="py-3 px-4 font-mono tabular-nums text-slate-800">
                                {log.tabSwitchCount}x (Blur {log.windowBlurCount}x ·{' '}
                                {log.awaySeconds} dtk)
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                                {log.focusScorePct}%
                              </td>
                              <td className="py-3 px-4 font-semibold">
                                <span
                                  className={
                                    log.integrityStatus === 'pelanggaran'
                                      ? 'text-red-700'
                                      : log.integrityStatus === 'peringatan'
                                        ? 'text-amber-700'
                                        : 'text-emerald-700'
                                  }
                                >
                                  {log.integrityStatus === 'pelanggaran'
                                    ? 'Pelanggaran'
                                    : log.integrityStatus === 'peringatan'
                                      ? 'Peringatan'
                                      : 'Aman'}
                                </span>
                              </td>
                              <td className="py-3 px-6 text-right">
                                {onDeleteProctoringLog && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void onDeleteProctoringLog(log.logId)
                                    }
                                    aria-label={`Hapus sesi ${log.courseCode}`}
                                    className="p-1 text-slate-400 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            </div>
          );
        })() : (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {workspacePolicy.levelFlowMode === 'admin_assigned' && (
            <div className="px-6 py-3 bg-blue-50/60 border-b border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                Mode alur aktif: <strong className="text-slate-900">Ditentukan Admin per Peserta</strong>. Gunakan kolom <strong className="text-slate-900">Penempatan Jenjang</strong> di bawah atau klik akun peserta untuk melihat % progres &amp; pelanggaran kamera/layar.
              </span>
              <button
                type="button"
                onClick={() => setSection('flow')}
                className="text-blue-700 font-semibold hover:underline self-start sm:self-auto whitespace-nowrap"
              >
                Ubah Mekanisme Alur
              </button>
            </div>
          )}
          <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Cari peserta atau departemen"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama peserta, email, atau departemen..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Saring berdasarkan jenjang"
                value={trackFilter}
                onChange={(e) =>
                  setTrackFilter(e.target.value as 'Semua' | TrackLevel)
                }
                className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="Semua">Semua Jenjang</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    Paket {t.id}
                  </option>
                ))}
              </select>

              <select
                aria-label="Saring berdasarkan status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as LearnerStatusFilter)
                }
                className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="Semua">Semua Status</option>
                <option value="Sertifikat">Sertifikat Terbit (&gt; 80%)</option>
                <option value="Perlu Bimbingan">Perlu Bimbingan</option>
                <option value="Berjalan">Sedang Belajar</option>
              </select>
            </div>
          </div>

          {filteredLearners.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                Tidak ada peserta yang cocok dengan filter saat ini.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setTrackFilter('Semua');
                  setStatusFilter('Semua');
                }}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Reset Filter Pencarian
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Per-Account Summary Cards: Pencet Akun -> % Training & Pelanggaran Kamera/Layar */}
              <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                      Summary Per Akun User
                    </h2>
                    <p className="text-xs text-slate-600">
                      Klik salah satu akun peserta untuk melihat % progres training yang diikuti sekaligus rincian pelanggaran kamera &amp; layar saat training.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    Menampilkan {filteredLearners.length} akun
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredLearners.map((learner) => {
                    const pct = learner.packageProgressPct ?? 0;
                    const pkgPassed = learner.packageModulesPassed ?? 0;
                    const pkgTotal = Math.max(
                      1,
                      learner.packageModulesTotal ?? 1
                    );
                    const trackObj =
                      tracks.find((t) => t.id === learner.currentTrack) ??
                      tracks[0];
                    const proctor =
                      proctoringByAccount[learner.id] ??
                      buildAccountProctoringSummary(
                        learner.id,
                        learner.email,
                        proctoringLogs,
                        workspacePolicy.maxTabSwitchTolerance,
                        courses
                      );

                    return (
                      <button
                        key={`card-${learner.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedAccountId(learner.id);
                          setSelectedModuleFilterId('all');
                        }}
                        className="text-left bg-white border border-slate-200 hover:border-blue-600 hover:shadow-xs rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all group"
                      >
                        <div className="space-y-2.5 w-full">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-700 truncate">
                                {learner.name}
                              </h3>
                              <p className="text-xs font-mono text-slate-500 truncate">
                                {learner.email || 'Akun Kohort Referensi'}
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5 truncate">
                                {learner.division}
                              </p>
                            </div>
                            <span
                              className={`text-[11px] font-semibold shrink-0 ${
                                learner.accountStatus === 'pending'
                                  ? 'text-amber-700'
                                  : pct === 100
                                    ? 'text-emerald-700'
                                    : 'text-blue-700'
                              }`}
                            >
                              {learner.accountStatus === 'pending'
                                ? 'Belum Login'
                                : pct === 100
                                  ? 'Paket Selesai'
                                  : learner.isLiveAccount
                                    ? 'Akun Aktif'
                                    : 'Kohort'}
                            </span>
                          </div>

                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-slate-500">
                                Ikut Pelatihan:
                              </span>
                              <span className="font-semibold text-slate-900 text-right">
                                {trackObj.name}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-baseline justify-between text-xs">
                                <span className="text-slate-600">
                                  Progres Berjalan
                                </span>
                                <span
                                  className={`font-mono text-base font-bold tabular-nums ${
                                    pct === 100
                                      ? 'text-emerald-700'
                                      : 'text-blue-700'
                                  }`}
                                >
                                  {pct}% berjalan
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    pct === 100
                                      ? 'bg-emerald-600'
                                      : 'bg-blue-700'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 tabular-nums">
                                <span>
                                  {pkgPassed}/{pkgTotal} modul lulus
                                </span>
                                <span>
                                  {learner.bestPostScore !== null
                                    ? `Post-Test ${learner.bestPostScore}`
                                    : `Video ${learner.avgVideoPct}%`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Per-Module Cheating & Camera Indicator */}
                          <div className="px-3 py-2 border border-slate-200 rounded-lg space-y-1 text-xs bg-white">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-semibold">
                                {proctor.overallIntegrity === 'pelanggaran' ? (
                                  <>
                                    <ShieldAlert
                                      className="w-3.5 h-3.5 text-red-700 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span className="text-red-700">
                                      {proctor.violationCount} Pelanggaran
                                    </span>
                                  </>
                                ) : proctor.overallIntegrity ===
                                  'peringatan' ? (
                                  <>
                                    <AlertTriangle
                                      className="w-3.5 h-3.5 text-amber-700 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span className="text-amber-700">
                                      {proctor.violationCount} Peringatan
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck
                                      className="w-3.5 h-3.5 text-emerald-700 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span className="text-emerald-700">
                                      Kamera/Layar Aman
                                    </span>
                                  </>
                                )}
                              </div>
                              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                                Tab {proctor.totalTabSwitches}x ·{' '}
                                {proctor.snapshots.length} foto
                              </span>
                            </div>
                            {proctor.cheatingModules.length > 0 && (
                              <div className="text-[11px] font-mono text-red-700 truncate tabular-nums">
                                Modul:{' '}
                                {proctor.cheatingModules
                                  .map(
                                    (m) =>
                                      `${m.moduleOrder ? `M${m.moduleOrder} ` : ''}${m.courseCode} (${m.violationCount || m.totalTabSwitches})`
                                  )
                                  .join(', ')}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 w-full flex items-center justify-between text-xs font-semibold text-blue-700">
                          <span>Lihat Summary Per Modul &amp; Pelanggaran</span>
                          <ChevronRight
                            className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                            aria-hidden="true"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-6">Akun User &amp; Departemen</th>
                      <th className="py-3 px-4">Pelatihan Paket &amp; % Berjalan</th>
                      <th className="py-3 px-4">Kecurangan Per Modul</th>
                      <th className="py-3 px-4">Penempatan Jenjang</th>
                      <th className="py-3 px-4 text-right">Pre / Post</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-6 text-right">Detail &amp; Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filteredLearners.map((learner) => {
                      const hasCert =
                        learner.bestPostScore !== null &&
                        learner.bestPostScore > 80;
                      const pct = learner.packageProgressPct ?? 0;
                      const pkgPassed = learner.packageModulesPassed ?? 0;
                      const pkgTotal = Math.max(
                        1,
                        learner.packageModulesTotal ?? 1
                      );
                      const proctor =
                        proctoringByAccount[learner.id] ??
                        buildAccountProctoringSummary(
                          learner.id,
                          learner.email,
                          proctoringLogs,
                          workspacePolicy.maxTabSwitchTolerance,
                          courses
                        );
                      return (
                        <tr
                          key={learner.id}
                          onClick={() => {
                            setSelectedAccountId(learner.id);
                            setSelectedModuleFilterId('all');
                          }}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-6">
                            <div className="font-semibold text-slate-900">
                              {learner.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {learner.email ? (
                                <>
                                  <span className="font-mono">{learner.email}</span> ·{' '}
                                </>
                              ) : null}
                              {learner.division}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 min-w-[180px]">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-semibold text-slate-900">
                                Paket {learner.currentTrack}
                              </span>
                              <span className="font-mono font-bold text-blue-700 tabular-nums">
                                {pct}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                              <div
                                className={`h-full ${
                                  pct === 100
                                    ? 'bg-emerald-600'
                                    : 'bg-blue-700'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 tabular-nums mt-1">
                              {pkgPassed}/{pkgTotal} modul lulus
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div
                              className={`text-xs font-semibold ${
                                proctor.overallIntegrity === 'pelanggaran'
                                  ? 'text-red-700'
                                  : proctor.overallIntegrity === 'peringatan'
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                              }`}
                            >
                              {proctor.overallIntegrity === 'pelanggaran'
                                ? `${proctor.violationCount} Pelanggaran`
                                : proctor.overallIntegrity === 'peringatan'
                                  ? `${proctor.violationCount} Peringatan`
                                  : 'Aman'}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 tabular-nums mt-0.5">
                              {proctor.cheatingModules.length > 0
                                ? proctor.cheatingModules
                                    .map(
                                      (m) =>
                                        `${m.moduleOrder ? `M${m.moduleOrder} ` : ''}${m.courseCode} (${m.violationCount || m.totalTabSwitches})`
                                    )
                                    .join(', ')
                                : `Tab ${proctor.totalTabSwitches}x · ${proctor.snapshots.length} foto`}
                            </div>
                          </td>
                          <td
                            className="py-3.5 px-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {learner.accountStatus === 'pending' ? (
                              <span className="text-xs font-mono text-slate-500">
                                Paket {learner.currentTrack} (Undangan)
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <select
                                  aria-label={`Ubah jenjang ${learner.name}`}
                                  value={learner.currentTrack}
                                  onChange={(e) =>
                                    onOverrideLearnerTrack(
                                      learner.id,
                                      e.target.value as TrackLevel
                                    )
                                  }
                                  className="px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                  <option value="OJT">OJT</option>
                                  <option value="Junior">Junior</option>
                                  <option value="Middle">Middle</option>
                                  <option value="Senior">Senior</option>
                                </select>
                                {learner.isLiveAccount &&
                                  learner.id !== currentUser.uid && (
                                    <select
                                      aria-label={`Ubah peran ${learner.name}`}
                                      value={learner.role ?? 'learner'}
                                      onChange={(e) =>
                                        void onChangeUserRole(
                                          learner.id,
                                          e.target.value as UserRole
                                        )
                                      }
                                      className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md"
                                    >
                                      <option value="learner">Peserta</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                  )}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-slate-700">
                            {learner.avgPreScore} /{' '}
                            <strong className="text-slate-900">
                              {learner.bestPostScore ?? '—'}
                            </strong>
                          </td>
                          <td className="py-3.5 px-4">
                            {learner.accountStatus === 'pending' ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
                                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Belum Login</span>
                              </span>
                            ) : hasCert ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
                                <Award className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Sertifikat</span>
                              </span>
                            ) : learner.needsIntervention ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
                                <AlertTriangle
                                  className="w-3.5 h-3.5"
                                  aria-hidden="true"
                                />
                                <span>Bimbingan</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 whitespace-nowrap">
                                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Berjalan</span>
                              </span>
                            )}
                          </td>
                          <td
                            className="py-3.5 px-6 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedAccountId(learner.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap"
                              >
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Detail Akun</span>
                              </button>
                              {learner.accountStatus !== 'pending' &&
                                !learner.interventionSent && (
                                  <button
                                    type="button"
                                    onClick={() => onSendIntervention(learner.id)}
                                    aria-label={`Kirim pengingat ke ${learner.name}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
                                  >
                                    <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
        ))}

      {/* SECTION 1B: PARTICIPANT EMAIL REGISTRATION */}
      {section === 'registrations' && (() => {
        const filteredRegistrations = participantRegistrations.filter((item) => {
          const q = regSearch.trim().toLowerCase();
          const matchesSearch =
            !q ||
            item.email.toLowerCase().includes(q) ||
            item.displayName.toLowerCase().includes(q) ||
            item.division.toLowerCase().includes(q);
          const matchesStatus =
            regStatusFilter === 'Semua' || item.status === regStatusFilter;
          const matchesTrack =
            regTrackFilter === 'Semua' || item.assignedTrack === regTrackFilter;
          return matchesSearch && matchesStatus && matchesTrack;
        });

        const activeCount = participantRegistrations.filter(
          (p) => p.status === 'active'
        ).length;
        const pendingCount = participantRegistrations.filter(
          (p) => p.status === 'pending'
        ).length;

        const handleSingleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setRegFeedback(null);
          if (!regEmail.trim()) {
            setRegFeedback({
              type: 'error',
              message: 'Masukkan alamat email peserta training.',
            });
            return;
          }
          setRegSubmitting(true);
          const result = await onRegisterParticipant({
            email: regEmail,
            displayName: regName,
            division: regDivision,
            assignedTrack: regTrack,
          });
          setRegSubmitting(false);

          if (result.ok) {
            setRegFeedback({
              type: 'success',
              message: `Email ${regEmail.trim().toLowerCase()} berhasil didaftarkan ke Paket ${regTrack}.`,
            });
            setRegEmail('');
            setRegName('');
          } else {
            setRegFeedback({
              type: 'error',
              message: result.error ?? 'Gagal mendaftarkan email peserta.',
            });
          }
        };

        const handleBulkSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setRegFeedback(null);
          const lines = bulkText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

          if (lines.length === 0) {
            setRegFeedback({
              type: 'error',
              message: 'Tempel minimal 1 alamat email peserta pada kolom daftar.',
            });
            return;
          }

          const entries = lines.map((line) => {
            const parts = line.split(/[,\t;]/).map((p) => p.trim());
            const emailPart = parts[0] ?? '';
            const namePart = parts[1] ?? '';
            const divisionPart = parts[2] ?? regDivision;
            return {
              email: emailPart,
              displayName: namePart,
              division: divisionPart || regDivision,
              assignedTrack: regTrack,
            };
          });

          setRegSubmitting(true);
          const res = await onBulkRegisterParticipants(entries);
          setRegSubmitting(false);

          if (res.added > 0) {
            setRegFeedback({
              type: 'success',
              message: `${res.added} email peserta berhasil didaftarkan ke Paket ${regTrack}${res.skipped > 0 ? ` (${res.skipped} dilewati karena duplikat atau format tidak valid)` : ''}.`,
            });
            setBulkText('');
          } else {
            setRegFeedback({
              type: 'error',
              message:
                'Tidak ada email baru yang berhasil didaftarkan. Periksa format email atau duplikasi.',
            });
          }
        };

        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Registration Forms + Invite Gate Toggle */}
            <div className="lg:col-span-5 space-y-6">
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-blue-700" aria-hidden="true" />
                      <h2 className="font-display text-lg font-bold text-slate-900">
                        Registrasi Email Peserta Training
                      </h2>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Daftarkan email peserta beserta departemen dan level awalnya. Saat peserta login dengan Google, akunnya otomatis terhubung ke jenjang yang ditetapkan.
                    </p>
                  </div>
                </div>

                {/* Single vs Bulk Segmented Toggle */}
                <div
                  role="tablist"
                  aria-label="Mode registrasi peserta"
                  className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-lg gap-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={regMode === 'single'}
                    onClick={() => {
                      setRegMode('single');
                      setRegFeedback(null);
                    }}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-colors ${
                      regMode === 'single'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Satu Peserta
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={regMode === 'bulk'}
                    onClick={() => {
                      setRegMode('bulk');
                      setRegFeedback(null);
                    }}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-colors ${
                      regMode === 'bulk'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Impor Banyak Email
                  </button>
                </div>

                {regMode === 'single' ? (
                  <form onSubmit={(e) => void handleSingleSubmit(e)} className="space-y-4">
                    <div className="space-y-1">
                      <label
                        htmlFor="reg-email-input"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Email Peserta Training
                      </label>
                      <input
                        id="reg-email-input"
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="nama.peserta@perusahaan.co.id"
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="reg-name-input"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Nama Lengkap Peserta (Opsional)
                      </label>
                      <input
                        id="reg-name-input"
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label
                          htmlFor="reg-division-select"
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Departemen
                        </label>
                        <select
                          id="reg-division-select"
                          value={regDivision}
                          onChange={(e) => setRegDivision(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          {DIVISION_OPTIONS.map((div) => (
                            <option key={div} value={div}>
                              {div}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="reg-track-select"
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Level Training Awal
                        </label>
                        <select
                          id="reg-track-select"
                          value={regTrack}
                          onChange={(e) => setRegTrack(e.target.value as TrackLevel)}
                          className="w-full px-3 py-2 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          {tracks.map((t) => (
                            <option key={t.id} value={t.id}>
                              Paket {t.id}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {regFeedback && (
                      <div
                        role="status"
                        className={`p-3 rounded-lg border text-xs font-medium flex items-start gap-2 ${
                          regFeedback.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        {regFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                        )}
                        <span>{regFeedback.message}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={regSubmitting}
                      className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" aria-hidden="true" />
                      <span>
                        {regSubmitting
                          ? 'Mendaftarkan Email...'
                          : 'Daftarkan Email Peserta'}
                      </span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={(e) => void handleBulkSubmit(e)} className="space-y-4">
                    <div className="space-y-1">
                      <label
                        htmlFor="reg-bulk-textarea"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Daftar Email (1 peserta per baris)
                      </label>
                      <textarea
                        id="reg-bulk-textarea"
                        rows={5}
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder={
                          'peserta1@perusahaan.co.id, Budi Santoso, Finance And Tax\npeserta2@perusahaan.co.id, Siti Rahma, Camera Vision And Inspection\npeserta3@perusahaan.co.id'
                        }
                        className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Format per baris: <span className="font-mono">email</span> atau{' '}
                        <span className="font-mono">email, nama, departemen</span>. Baris tanpa kolom departemen akan memakai departemen default di bawah.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label
                          htmlFor="reg-bulk-division"
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Departemen Default
                        </label>
                        <select
                          id="reg-bulk-division"
                          value={regDivision}
                          onChange={(e) => setRegDivision(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                        >
                          {DIVISION_OPTIONS.map((div) => (
                            <option key={div} value={div}>
                              {div}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="reg-bulk-track"
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Level Training Awal
                        </label>
                        <select
                          id="reg-bulk-track"
                          value={regTrack}
                          onChange={(e) => setRegTrack(e.target.value as TrackLevel)}
                          className="w-full px-3 py-2 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                        >
                          {tracks.map((t) => (
                            <option key={t.id} value={t.id}>
                              Paket {t.id}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {regFeedback && (
                      <div
                        role="status"
                        className={`p-3 rounded-lg border text-xs font-medium flex items-start gap-2 ${
                          regFeedback.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        {regFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                        )}
                        <span>{regFeedback.message}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={regSubmitting}
                      className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" aria-hidden="true" />
                      <span>
                        {regSubmitting
                          ? 'Memproses Impor Email...'
                          : 'Daftarkan Semua Email'}
                      </span>
                    </button>
                  </form>
                )}
              </section>

              {/* Access Enforcement Card */}
              <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    id="reg-require-invite-toggle"
                    type="checkbox"
                    disabled={invitePolicySaving}
                    checked={workspacePolicy.requireRegisteredInvite}
                    onChange={async (e) => {
                      const nextVal = e.target.checked;
                      setInvitePolicySaving(true);
                      await onUpdateWorkspacePolicy({
                        ...workspacePolicy,
                        requireRegisteredInvite: nextVal,
                      });
                      setInvitePolicySaving(false);
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                  />
                  <label
                    htmlFor="reg-require-invite-toggle"
                    className="text-xs sm:text-sm text-slate-700 leading-relaxed cursor-pointer"
                  >
                    <span className="font-semibold text-slate-900 block">
                      Batasi Login Hanya untuk Email Terdaftar Admin
                    </span>
                    Jika diaktifkan, peserta yang emailnya belum didaftarkan pada daftar di samping akan ditolak saat mencoba masuk di halaman login.
                  </label>
                </div>
              </section>
            </div>

            {/* Right: Registered Participant Emails Table */}
            <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-slate-200 space-y-4">
                <div className="grid grid-cols-3 gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="text-xs text-slate-500">Total Email Terdaftar</div>
                    <div className="font-mono text-xl font-semibold text-slate-900 tabular-nums mt-0.5">
                      {participantRegistrations.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Sudah Login (Aktif)</div>
                    <div className="font-mono text-xl font-semibold text-emerald-700 tabular-nums mt-0.5">
                      {activeCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Menunggu Login</div>
                    <div className="font-mono text-xl font-semibold text-amber-700 tabular-nums mt-0.5">
                      {pendingCount}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      aria-label="Cari email atau nama peserta terdaftar"
                      value={regSearch}
                      onChange={(e) => setRegSearch(e.target.value)}
                      placeholder="Cari email, nama, atau departemen..."
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      aria-label="Filter level registrasi"
                      value={regTrackFilter}
                      onChange={(e) =>
                        setRegTrackFilter(e.target.value as 'Semua' | TrackLevel)
                      }
                      className="px-2.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    >
                      <option value="Semua">Semua Level</option>
                      {tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          Paket {t.id}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="Filter status aktivasi"
                      value={regStatusFilter}
                      onChange={(e) =>
                        setRegStatusFilter(
                          e.target.value as RegistrationStatusFilter
                        )
                      }
                      className="px-2.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    >
                      <option value="Semua">Semua Status</option>
                      <option value="pending">Menunggu Login</option>
                      <option value="active">Aktif Login</option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredRegistrations.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <Mail className="w-6 h-6 text-slate-400 mx-auto" aria-hidden="true" />
                  <p className="text-sm font-semibold text-slate-800">
                    {participantRegistrations.length === 0
                      ? 'Belum ada email peserta yang didaftarkan.'
                      : 'Tidak ada email terdaftar yang sesuai filter.'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Gunakan formulir di samping untuk mendaftarkan email peserta training satu per satu atau secara massal.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-5">Email &amp; Peserta</th>
                        <th className="py-3 px-4">Level Awal</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-5 text-right">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {filteredRegistrations.map((reg) => (
                        <tr
                          key={reg.inviteId}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3.5 px-5">
                            <div className="font-mono text-xs sm:text-sm font-semibold text-slate-900">
                              {reg.email}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {reg.displayName} · {reg.division}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              aria-label={`Ubah level ${reg.email}`}
                              value={reg.assignedTrack}
                              onChange={(e) =>
                                void onUpdateRegistrationTrack(
                                  reg.inviteId,
                                  e.target.value as TrackLevel
                                )
                              }
                              className="px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                            >
                              {tracks.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.id}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            {reg.status === 'active' ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
                                <CheckCircle2
                                  className="w-3.5 h-3.5"
                                  aria-hidden="true"
                                />
                                <span>Aktif Login</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
                                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Menunggu Login</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => void onDeleteRegistration(reg.inviteId)}
                              aria-label={`Hapus registrasi ${reg.email}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Hapus</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        );
      })()}

      {/* SECTION 2: LEARNING FLOW & SEQUENCE CONTROL */}
      {section === 'flow' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-700" aria-hidden="true" />
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Mekanisme Alur Level &amp; Prasyarat
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  Tentukan apakah seluruh kelas langsung terbuka atau dikunci berjenjang antar level dan modul.
                </p>
              </div>
              {(levelFlowMode !== 'open_catalog' || enforceModuleOrder) && (
                <button
                  type="button"
                  disabled={flowSaving}
                  onClick={async () => {
                    setLevelFlowMode('open_catalog');
                    setEnforceModuleOrder(false);
                    setFlowSaving(true);
                    setFlowSavedMessage(null);
                    await onUpdateWorkspacePolicy({
                      ...workspacePolicy,
                      levelFlowMode: 'open_catalog',
                      enforceModuleOrder: false,
                      trackSequence,
                    });
                    setFlowSaving(false);
                    setFlowSavedMessage('Semua kelas & paket kini terbuka untuk peserta.');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Buka Semua Kelas
                </button>
              )}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setFlowSaving(true);
                setFlowSavedMessage(null);
                await onUpdateWorkspacePolicy({
                  ...workspacePolicy,
                  levelFlowMode,
                  enforceModuleOrder,
                  trackSequence,
                });
                setFlowSaving(false);
                setFlowSavedMessage('Pengaturan alur belajar berhasil disimpan.');
              }}
              className="space-y-6"
            >
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-slate-700">
                  Penentuan Akses Level Peserta
                </legend>
                {[
                  {
                    id: 'open_catalog' as LevelFlowMode,
                    title: 'Terbuka Semua Kelas & Paket (Default)',
                    desc: 'Semua kelas di Paket OJT, Junior, Middle, dan Senior langsung terbuka untuk peserta tanpa penguncian level.',
                  },
                  {
                    id: 'linear_sequential' as LevelFlowMode,
                    title: 'Berjenjang Berurutan Otomatis (Terkunci Per Level)',
                    desc: 'Peserta wajib menyelesaikan seluruh modul pada paket awal (mulai Paket OJT) hingga lulus KKM sebelum paket level berikutnya (Junior, Middle, Senior) terbuka.',
                  },
                  {
                    id: 'admin_assigned' as LevelFlowMode,
                    title: 'Ditentukan Admin per Peserta',
                    desc: 'Admin menetapkan target level peserta, dan level lanjutan tetap mensyaratkan kelulusan paket level sebelumnya.',
                  },
                ].map((opt) => {
                  const selected = levelFlowMode === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`block p-4 rounded-lg border cursor-pointer transition-colors ${
                        selected
                          ? 'bg-blue-50/50 border-blue-700'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="levelFlowMode"
                          checked={selected}
                          onChange={() => {
                            setLevelFlowMode(opt.id);
                            if (opt.id === 'open_catalog') {
                              setEnforceModuleOrder(false);
                            }
                          }}
                          className="mt-1 h-4 w-4 text-blue-700 focus:ring-blue-600"
                        />
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-slate-900">
                            {opt.title}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </fieldset>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                <input
                  id="flow-enforce-module-order"
                  type="checkbox"
                  checked={enforceModuleOrder}
                  onChange={(e) => setEnforceModuleOrder(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                />
                <label
                  htmlFor="flow-enforce-module-order"
                  className="text-xs sm:text-sm text-slate-700 leading-relaxed cursor-pointer"
                >
                  <span className="font-semibold text-slate-900 block">
                    Kunci Urutan Modul Berurutan dalam 1 Level
                  </span>
                  Jika aktif, peserta di dalam 1 level wajib lulus KKM modul sebelumnya sebelum membuka modul berikutnya. Nonaktifkan agar semua modul dalam satu paket terbuka.
                </label>
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-slate-700">
                  Urutan Jenjang Paket Belajar
                </div>
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
                  {trackSequence.map((lvl, idx) => {
                    const trackMeta = tracks.find((t) => t.id === lvl);
                    return (
                      <div
                        key={lvl}
                        className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono font-semibold text-blue-700 tabular-nums">
                            0{idx + 1}
                          </span>
                          <span className="font-semibold text-slate-900 truncate">
                            {trackMeta?.name ?? `Paket ${lvl}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              setTrackSequence((prev) => {
                                if (idx === 0) return prev;
                                const next = [...prev];
                                [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                return next;
                              });
                            }}
                            aria-label={`Naikkan urutan ${lvl}`}
                            className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-35"
                          >
                            <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === trackSequence.length - 1}
                            onClick={() => {
                              setTrackSequence((prev) => {
                                if (idx === prev.length - 1) return prev;
                                const next = [...prev];
                                [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                                return next;
                              });
                            }}
                            aria-label={`Turunkan urutan ${lvl}`}
                            className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-35"
                          >
                            <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {flowSavedMessage && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>{flowSavedMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={flowSaving}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 rounded-lg transition-colors"
              >
                {flowSaving ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Alur'}
              </button>
            </form>
          </section>

          {/* Module Ordering Inside a Single Level */}
          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Urutan Modul di Dalam 1 Level
                </h2>
                <p className="text-xs text-slate-600">
                  Atur urutan pelatihan (misal 6 pelatihan wajib di Paket OJT) dengan tombol naik/turun.
                </p>
              </div>
              <select
                aria-label="Pilih jenjang modul untuk diurutkan"
                value={flowSelectedTrack}
                onChange={(e) => setFlowSelectedTrack(e.target.value as TrackLevel)}
                className="px-3 py-2 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {trackSequence.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Paket {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
              {courses
                .filter((c) => c.trackLevel === flowSelectedTrack)
                .sort((a, b) => a.moduleOrderInTrack - b.moduleOrderInTrack)
                .map((course, idx, arr) => (
                  <div
                    key={course.id}
                    className="p-4 bg-white hover:bg-slate-50/70 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-blue-700 tabular-nums">
                          Modul {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-700">{course.code}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">KKM {course.passingScore}%</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 leading-snug">
                        {course.title}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => void onMoveCourseOrder(course.id, 'up')}
                        aria-label={`Naikkan ${course.title}`}
                        className="p-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-35"
                      >
                        <ArrowUp className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === arr.length - 1}
                        onClick={() => void onMoveCourseOrder(course.id, 'down')}
                        aria-label={`Turunkan ${course.title}`}
                        className="p-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-35"
                      >
                        <ArrowDown className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenCourseInWorkspace(course.id)}
                        className="ml-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded transition-colors whitespace-nowrap"
                      >
                        Buka
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>
      )}

      {/* SECTION 3: CLASS CREATION, PACKAGE ASSIGNMENT & KKM MANAGEMENT */}
      {section === 'curriculum' && (() => {
        const orderedTracks = [...tracks].sort((a, b) => {
          const idxA = workspacePolicy.trackSequence.indexOf(a.id);
          const idxB = workspacePolicy.trackSequence.indexOf(b.id);
          return (idxA >= 0 ? idxA : a.order) - (idxB >= 0 ? idxB : b.order);
        });
        const coursesInTargetTrack = courses
          .filter((c) => c.trackLevel === newTrack)
          .sort((a, b) => a.moduleOrderInTrack - b.moduleOrderInTrack);
        const filteredCurriculumCourses = [...courses]
          .filter((c) => curriculumTrackFilter === 'Semua' || c.trackLevel === curriculumTrackFilter)
          .sort((a, b) => {
            const tA = workspacePolicy.trackSequence.indexOf(a.trackLevel);
            const tB = workspacePolicy.trackSequence.indexOf(b.trackLevel);
            if (tA !== tB) return tA - tB;
            return a.moduleOrderInTrack - b.moduleOrderInTrack;
          });

        return (
          <div className="space-y-6">
            {/* Package Overview Cards with Direct "+ Tambah Kelas" Actions */}
            <section aria-label="Ringkasan Paket Pelatihan" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {orderedTracks.map((track) => {
                const trackCourses = courses.filter((c) => c.trackLevel === track.id);
                const isFiltered = curriculumTrackFilter === track.id;
                return (
                  <div
                    key={track.id}
                    className={`bg-white rounded-xl border p-4 flex flex-col justify-between gap-4 transition-colors ${
                      isFiltered ? 'border-blue-600 ring-1 ring-blue-600' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-blue-700">
                          Paket {track.id}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
                          {trackCourses.length} Kelas
                        </span>
                      </div>
                      <h3 className="font-display text-sm font-bold text-slate-900">
                        {track.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {track.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          setCurriculumTrackFilter(isFiltered ? 'Semua' : track.id)
                        }
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        {isFiltered ? 'Tampilkan Semua' : 'Lihat Daftar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openAddClassForTrack(track.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Tambah Kelas</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>

            {addCourseSuccess && (
              <div
                role="status"
                className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Kelas baru <strong>{addCourseSuccess.code} — {addCourseSuccess.title}</strong>
                    {addCourseSuccess.hasMp4 ? ' (dengan video pembelajaran MP4)' : ''} berhasil ditambahkan ke{' '}
                    <strong>
                      {addCourseSuccess.trackLevels.length > 1
                        ? `${addCourseSuccess.trackLevels.length} Paket (${addCourseSuccess.trackLevels.join(', ')})`
                        : `Paket ${addCourseSuccess.trackLevels[0]} (Urutan Modul ke-${addCourseSuccess.order})`}
                    </strong>{' '}
                    dan langsung muncul di halaman peserta.
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {addCourseSuccess.courseId && (
                    <button
                      type="button"
                      onClick={() => onOpenCourseInWorkspace(addCourseSuccess.courseId)}
                      className="text-xs font-semibold text-emerald-800 hover:underline whitespace-nowrap"
                    >
                      Buka Kelas di Workspace
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAddCourseSuccess(null)}
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-950"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}

            {distributeMessage && (
              <div
                role="status"
                className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm text-blue-900"
              >
                <span>{distributeMessage}</span>
                <button
                  type="button"
                  onClick={() => setDistributeMessage(null)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-950"
                >
                  Tutup
                </button>
              </div>
            )}

            {showAddForm && (
              <form
                onSubmit={(e) => void handleSubmitNewCourse(e)}
                className="bg-white border border-blue-200 rounded-xl p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900">
                      Tambah Kelas &amp; Modul Baru (Multi-Paket + Video MP4)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih satu atau beberapa paket pelatihan tujuan sekaligus agar semua peserta terkait mendapat modul ini, lalu unggah atau tautkan video pembelajaran MP4.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setAddCourseError(null);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    Tutup
                  </button>
                </div>

                {/* Multi-Package Selection & Order Strip */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="block text-xs font-semibold text-slate-800">
                        Masukkan ke Paket Pelatihan (Bisa Multi-Paket) *
                      </span>
                      <span className="text-xs text-slate-500">
                        Terpilih: <strong className="text-slate-800">{selectedTracks.length}</strong> dari {orderedTracks.length} paket
                        {selectedTracks.length > 0 ? ` (${selectedTracks.join(', ')})` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSelectAllTracks}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors self-start sm:self-auto"
                    >
                      <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {orderedTracks.every((t) => selectedTracks.includes(t.id))
                          ? 'Batalkan Semua Paket'
                          : 'Pilih Semua Paket (Semua Level Dapat)'}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {orderedTracks.map((track) => {
                      const checked = selectedTracks.includes(track.id);
                      const countInTrack = courses.filter(
                        (c) => c.trackLevel === track.id
                      ).length;
                      return (
                        <label
                          key={track.id}
                          className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? 'bg-blue-50/80 border-blue-600'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleTargetTrack(track.id)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900">
                              Paket {track.id}
                            </div>
                            <div className="text-xs text-slate-500 tabular-nums">
                              {countInTrack} kelas saat ini
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {selectedTracks.length <= 1 && (
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <label
                        htmlFor="new-course-order"
                        className="text-xs font-semibold text-slate-700"
                      >
                        Posisi Urutan di Paket {selectedTracks[0] ?? newTrack}
                      </label>
                      <select
                        id="new-course-order"
                        value={newInsertOrder === 'end' ? 'end' : String(newInsertOrder)}
                        onChange={(e) =>
                          setNewInsertOrder(
                            e.target.value === 'end' ? 'end' : Number(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="end">
                          Akhir Paket (Modul ke-{coursesInTargetTrack.length + 1})
                        </option>
                        {coursesInTargetTrack.map((c, idx) => (
                          <option key={c.id} value={idx + 1}>
                            Sisipkan sebagai Modul ke-{idx + 1} (sebelum {c.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* MP4 Video Input Section */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-blue-700" aria-hidden="true" />
                      <div>
                        <span className="block text-xs font-semibold text-slate-800">
                          Video Pembelajaran (Format MP4)
                        </span>
                        <span className="text-xs text-slate-500">
                          Unggah file video .mp4 langsung (maks. 150 MB) atau tempel tautan URL MP4.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setVideoInputMode('upload');
                          setVideoUploadError(null);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                          videoInputMode === 'upload'
                            ? 'bg-blue-700 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Upload MP4</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVideoInputMode('url');
                          setVideoUploadError(null);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                          videoInputMode === 'url'
                            ? 'bg-blue-700 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Tautan URL MP4</span>
                      </button>
                    </div>
                  </div>

                  {videoInputMode === 'upload' ? (
                    <div className="space-y-3">
                      <label className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-dashed border-slate-300 hover:border-blue-500 rounded-lg cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                            <Upload className="w-4 h-4" aria-hidden="true" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900">
                              {videoFileName
                                ? `File terunggah: ${videoFileName}`
                                : 'Pilih file video pembelajaran (.mp4)'}
                            </div>
                            <div className="text-xs text-slate-500">
                              Kontainer MP4 (H.264/AAC), ukuran maksimal 150 MB
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg whitespace-nowrap self-start sm:self-auto">
                          {videoUploading ? `Mengunggah ${videoUploadPct}%...` : 'Pilih File .mp4'}
                        </span>
                        <input
                          type="file"
                          accept="video/mp4,.mp4"
                          disabled={videoUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleUploadMp4File(file);
                          }}
                          className="sr-only"
                        />
                      </label>

                      {videoUploading && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-600 font-mono tabular-nums">
                            <span>Mengunggah video MP4...</span>
                            <span>{videoUploadPct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-700 transition-all duration-150"
                              style={{ width: `${videoUploadPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label
                        htmlFor="new-course-video-url"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        URL Video MP4 Langsung
                      </label>
                      <input
                        id="new-course-video-url"
                        type="url"
                        maxLength={1500}
                        value={newVideoUrl}
                        onChange={(e) => {
                          setNewVideoUrl(e.target.value);
                          setVideoFileName(null);
                          setNewVideoDurationSec(null);
                        }}
                        placeholder="https://cdn.perusahaan.co.id/materi/video-modul.mp4"
                        className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  )}

                  {videoUploadError && (
                    <div
                      role="alert"
                      className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700"
                    >
                      {videoUploadError}
                    </div>
                  )}

                  {newVideoUrl.trim() && (
                    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-800">
                          Pratinjau Video MP4
                          {newVideoDurationSec !== null && (
                            <span className="ml-2 font-mono text-emerald-700 tabular-nums">
                              · Durasi terdeteksi: {formatDurationLabelFromSec(newVideoDurationSec)}
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewVideoUrl('');
                            setNewVideoDurationSec(null);
                            setVideoFileName(null);
                            setVideoUploadPct(0);
                          }}
                          className="text-xs font-semibold text-red-700 hover:underline"
                        >
                          Hapus Video
                        </button>
                      </div>
                      <video
                        src={newVideoUrl.trim()}
                        controls
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          const dur = e.currentTarget.duration;
                          if (Number.isFinite(dur) && dur >= 10) {
                            const rounded = Math.round(dur);
                            setNewVideoDurationSec(rounded);
                            setNewDuration(formatDurationLabelFromSec(rounded));
                          }
                        }}
                        className="w-full max-h-60 rounded-md bg-slate-950"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="new-course-code"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Kode Kelas / Modul *
                    </label>
                    <input
                      id="new-course-code"
                      type="text"
                      required
                      minLength={2}
                      maxLength={32}
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder={`Contoh: ${getSuggestedCodeForTrack(newTrack)}`}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label
                      htmlFor="new-course-title"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Nama Kelas / Judul Modul *
                    </label>
                    <input
                      id="new-course-title"
                      type="text"
                      required
                      minLength={3}
                      maxLength={140}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Contoh: Kalibrasi Sensor Vision & Inspeksi Kualitas"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="new-course-kkm"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      KKM Kelulusan (%)
                    </label>
                    <input
                      id="new-course-kkm"
                      type="number"
                      min={50}
                      max={95}
                      step={5}
                      value={newPassingScore}
                      onChange={(e) => setNewPassingScore(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="new-course-cat"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Kategori Kompetensi
                    </label>
                    <input
                      id="new-course-cat"
                      type="text"
                      minLength={2}
                      maxLength={80}
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="new-course-instructor"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Nama Instruktur
                    </label>
                    <input
                      id="new-course-instructor"
                      type="text"
                      minLength={2}
                      maxLength={100}
                      value={newInstructor}
                      onChange={(e) => setNewInstructor(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="new-course-duration"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Estimasi Durasi
                    </label>
                    <input
                      id="new-course-duration"
                      type="text"
                      minLength={2}
                      maxLength={40}
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      placeholder="35 Menit"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="new-course-desc"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Ringkasan Materi
                    </label>
                    <input
                      id="new-course-desc"
                      type="text"
                      maxLength={500}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Capaian utama kelas ini..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {addCourseError && (
                  <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700"
                  >
                    {addCourseError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setAddCourseError(null);
                    }}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={addingCourse || videoUploading || selectedTracks.length === 0}
                    className="inline-flex items-center gap-2 py-2.5 px-5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {addingCourse
                        ? 'Menyimpan Kelas...'
                        : selectedTracks.length > 1
                          ? `Simpan ke ${selectedTracks.length} Paket`
                          : `Simpan ke Paket ${selectedTracks[0] ?? newTrack}`}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {distributingCourse && onDistributeCourseToTracks && (
              <div className="bg-white border border-blue-200 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Sebar &ldquo;{distributingCourse.title}&rdquo; ke Multi-Paket
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih paket tambahan agar kelas beserta video &amp; ujiannya ikut tersedia untuk semua level yang dicentang.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDistributingCourse(null)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    Tutup
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {orderedTracks.map((t) => {
                    const alreadyExists = courses.some(
                      (c) =>
                        c.trackLevel === t.id &&
                        c.code.toUpperCase() === distributingCourse.code.toUpperCase() &&
                        c.title.trim().toLowerCase() ===
                          distributingCourse.title.trim().toLowerCase()
                    );
                    const checked = alreadyExists || distributeTargetTracks.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
                          alreadyExists
                            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                            : checked
                              ? 'bg-blue-50 border-blue-600 text-slate-900 cursor-pointer'
                              : 'bg-white border-slate-200 text-slate-700 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={alreadyExists}
                          checked={checked}
                          onChange={() =>
                            setDistributeTargetTracks((prev) =>
                              prev.includes(t.id)
                                ? prev.filter((item) => item !== t.id)
                                : [...prev, t.id]
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-700"
                        />
                        <span className="font-semibold">
                          Paket {t.id} {alreadyExists ? '(Sudah ada)' : ''}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDistributingCourse(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={distributingLoading || distributeTargetTracks.length === 0}
                    onClick={() => void handleConfirmDistribute()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 rounded-lg"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {distributingLoading
                        ? 'Menyebarkan...'
                        : `Salin ke ${distributeTargetTracks.length} Paket`}
                    </span>
                  </button>
                </div>
              </div>
            )}

            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal
                    className="w-4 h-4 text-blue-700"
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Daftar Kelas, Penempatan Paket &amp; KKM
                    </h2>
                    <p className="text-xs text-slate-500">
                      Pindahkan modul antar paket, atur KKM kelulusan, atau tambahkan kelas baru ke paket yang diinginkan.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
                    {(['Semua', ...workspacePolicy.trackSequence] as Array<'Semua' | TrackLevel>).map(
                      (lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setCurriculumTrackFilter(lvl)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                            curriculumTrackFilter === lvl
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {lvl === 'Semua' ? 'Semua Paket' : `Paket ${lvl}`}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openAddClassForTrack(
                        curriculumTrackFilter === 'Semua' ? 'OJT' : curriculumTrackFilter
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Tambah Kelas Baru</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-6">Kelas / Modul</th>
                      <th className="py-3 px-4">Paket Tujuan</th>
                      <th className="py-3 px-4">Instruktur</th>
                      <th className="py-3 px-4">KKM Kelulusan (%)</th>
                      <th className="py-3 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filteredCurriculumCourses.map((course) => {
                      const isCustomCourse = course.id.startsWith('custom-');
                      return (
                        <tr key={course.id} className="hover:bg-slate-50/80">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-2 font-semibold text-slate-900">
                              <span>{course.title}</span>
                              {course.videoUrl && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700">
                                  <Film className="w-3 h-3" aria-hidden="true" />
                                  <span>Video MP4</span>
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                              Modul {course.moduleOrderInTrack} · {course.code} · {course.category} · {course.preTest.length} Pre /{' '}
                              {course.chapters.length} Bab Video /{' '}
                              {course.postTest.length} Post
                              {isCustomCourse ? ' · Kelas Tambahan' : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {onChangeCourseTrack ? (
                              <select
                                aria-label={`Paket untuk ${course.title}`}
                                value={course.trackLevel}
                                onChange={(e) =>
                                  void onChangeCourseTrack(
                                    course.id,
                                    e.target.value as TrackLevel
                                  )
                                }
                                className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50/70 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                              >
                                {orderedTracks.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    Paket {t.id}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-xs font-semibold text-blue-700">
                                Paket {course.trackLevel}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                            {course.instructorName}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              aria-label={`KKM ${course.title}`}
                              value={course.passingScore}
                              onChange={(e) =>
                                onUpdateCourseThresholds(
                                  course.id,
                                  Number(e.target.value),
                                  course.minWatchPercent
                                )
                              }
                              className="px-2.5 py-1.5 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-md tabular-nums"
                            >
                              {[65, 70, 75, 80, 85, 90].map((val) => (
                                <option key={val} value={val}>
                                  {val}%
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <div className="inline-flex items-center justify-end gap-3">
                              {onDistributeCourseToTracks && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDistribute(course)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-700 whitespace-nowrap"
                                >
                                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Sebar Multi-Paket</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onOpenCourseInWorkspace(course.id)}
                                className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
                              >
                                Buka Kelas
                              </button>
                              {isCustomCourse && onDeleteCustomCourse && (
                                <button
                                  type="button"
                                  onClick={() => void onDeleteCustomCourse(course.id)}
                                  aria-label={`Hapus kelas ${course.title}`}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline whitespace-nowrap"
                                >
                                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Hapus</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );
      })()}

      {/* SECTION 3: CURRICULUM EFFECTIVENESS AUDIT */}
      {section === 'audit' && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 space-y-0.5">
            <h2 className="font-display text-base font-bold text-slate-900">
              Audit Efektivitas Kurikulum (Pre-Test vs Post-Test &amp; Drop-Off Video)
            </h2>
            <p className="text-xs text-slate-500">
              Modul dengan N-Gain di bawah 0.35 atau angka putus tonton tinggi ditandai agar tim kurikulum merevisi video atau contoh kasus.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-6">Modul &amp; Jenjang</th>
                  <th className="py-3 px-4 text-right">Rata-Rata Pre</th>
                  <th className="py-3 px-4 text-right">Rata-Rata Post</th>
                  <th className="py-3 px-4 text-right">N-Gain</th>
                  <th className="py-3 px-4 text-right">Putus Tonton</th>
                  <th className="py-3 px-6">Kesimpulan Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {auditRows.map((row) => (
                  <tr key={row.course.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-900">
                        {row.course.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        <span className="font-mono">{row.course.code}</span> · Paket{' '}
                        {row.course.trackLevel}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {row.avgPre}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {row.avgPost}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-blue-700 font-semibold">
                      {row.nGain.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {row.watchDropOff}%
                    </td>
                    <td className="py-3.5 px-6">
                      {row.status === 'Efektif Tinggi' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{row.status}</span>
                        </span>
                      ) : row.status === 'Cukup Baik' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{row.status}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{row.status}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 3B: CAMERA & SCREEN TRACKING SETTINGS + LIVE MONITOR */}
      {section === 'proctoring' && (() => {
        const activeCameraCount = proctoringLogs.filter(
          (l) => l.cameraActive
        ).length;
        const flaggedCount = proctoringLogs.filter(
          (l) => l.integrityStatus !== 'aman'
        ).length;
        const avgFocus =
          proctoringLogs.length > 0
            ? Math.round(
                proctoringLogs.reduce((s, l) => s + l.focusScorePct, 0) /
                  proctoringLogs.length
              )
            : 100;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Camera & Screen Tracking Configuration */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setProctoringSaving(true);
                setProctoringSavedMessage(null);
                await onUpdateWorkspacePolicy({
                  ...workspacePolicy,
                  enableCameraMonitoring,
                  requireCameraForTests,
                  enableScreenTracking,
                  enableTabSwitchSiren,
                  requireFullscreenForPostTest,
                  maxTabSwitchTolerance: Math.max(
                    1,
                    Math.min(50, Math.round(maxTabSwitchTolerance))
                  ),
                });
                setProctoringSaving(false);
                setProctoringSavedMessage(
                  'Pengaturan kamera dan tracking layar berhasil disimpan.'
                );
              }}
              className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
            >
              <div className="space-y-1 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-700" aria-hidden="true" />
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Pengaturan Kamera &amp; Tracking Layar
                  </h2>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tentukan kebijakan pengawasan kamera peserta serta pelacakan fokus layar/tab saat mengikuti modul dan ujian.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableCameraMonitoring}
                    onChange={(e) => {
                      setEnableCameraMonitoring(e.target.checked);
                      if (!e.target.checked) setRequireCameraForTests(false);
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                  />
                  <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <span className="font-semibold text-slate-900 block">
                      Aktifkan Pengaturan &amp; Monitor Kamera
                    </span>
                    Menampilkan kontrol pemilihan perangkat kamera, resolusi, mirror, dan uji framing wajah di Ruang Belajar.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!enableCameraMonitoring}
                    checked={requireCameraForTests}
                    onChange={(e) => setRequireCameraForTests(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 disabled:opacity-50"
                  />
                  <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <span className="font-semibold text-slate-900 block">
                      Wajibkan Kamera Aktif Sebelum Pre-Test &amp; Post-Test
                    </span>
                    Peserta harus menyalakan kamera sebelum soal Pre-Test atau Post-Test dibuka (kecuali Mode Pratinjau Bebas).
                  </span>
                </label>

                <div className="pt-3 border-t border-slate-100 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableScreenTracking}
                      onChange={(e) => {
                        setEnableScreenTracking(e.target.checked);
                        if (!e.target.checked) {
                          setRequireFullscreenForPostTest(false);
                          setEnableTabSwitchSiren(false);
                        }
                      }}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-900 block">
                        Aktifkan Tracking Fokus &amp; Perpindahan Layar
                      </span>
                      Mencatat otomatis perpindahan tab, kehilangan fokus jendela, durasi keluar layar, serta opsi berbagi layar peserta.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!enableScreenTracking}
                      checked={enableTabSwitchSiren}
                      onChange={(e) =>
                        setEnableTabSwitchSiren(e.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 disabled:opacity-50"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-900 block">
                        Bunyikan Suara Sirine Saat Memindahkan Tab
                      </span>
                      Memicu alarm suara sirine peringatan seketika jika peserta meninggalkan tab LMS saat belajar maupun ujian.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!enableScreenTracking}
                      checked={requireFullscreenForPostTest}
                      onChange={(e) =>
                        setRequireFullscreenForPostTest(e.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 disabled:opacity-50"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-900 block">
                        Wajibkan Mode Layar Penuh Saat Post-Test
                      </span>
                      Menampilkan pengingat langsung agar peserta mengaktifkan tampilan layar penuh ketika mengerjakan Post-Test.
                    </span>
                  </label>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="proctor-tab-tolerance"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Batas Toleransi Pindah Tab Sebelum Ditandai Pelanggaran
                    </label>
                    <input
                      id="proctor-tab-tolerance"
                      type="number"
                      min={1}
                      max={50}
                      value={maxTabSwitchTolerance}
                      onChange={(e) =>
                        setMaxTabSwitchTolerance(Number(e.target.value))
                      }
                      className="w-32 px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {proctoringSavedMessage && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{proctoringSavedMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={proctoringSaving}
                className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 rounded-lg transition-colors"
              >
                {proctoringSaving
                  ? 'Menyimpan Pengaturan...'
                  : 'Simpan Pengaturan Kamera & Layar'}
              </button>
            </form>

            {/* Right: Per-Account Proctoring Shortcut Panel (Reports Live Inside Summary Per Akun) */}
            <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-blue-700" aria-hidden="true" />
                    <h3 className="font-display text-base font-bold text-slate-900">
                      Pelaporan Kamera &amp; Layar Masuk ke Summary Per Akun
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(null);
                      setSection('learners');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors self-start sm:self-auto whitespace-nowrap"
                  >
                    <span>Buka Summary Per Akun</span>
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Seluruh laporan aktivitas kamera, snapshot otomatis per 10 detik, perpindahan tab, dan daftar pelanggaran telah digabungkan langsung ke tiap akun pada tab <strong>Summary Per Akun</strong>. Klik salah satu akun di bawah untuk membuka detailnya.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                  <div>
                    <div className="text-xs text-slate-500">Sesi Kamera Aktif</div>
                    <div className="font-mono text-xl font-semibold text-emerald-700 tabular-nums mt-0.5">
                      {activeCameraCount} / {proctoringLogs.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Total Membuka Tab Lain</div>
                    <div className="font-mono text-xl font-semibold text-red-700 tabular-nums mt-0.5">
                      {proctoringLogs.reduce((s, l) => s + l.tabSwitchCount, 0)}x
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Snapshot (Per 10 dtk)</div>
                    <div className="font-mono text-xl font-semibold text-blue-700 tabular-nums mt-0.5">
                      {proctoringLogs.reduce(
                        (s, l) => s + (l.snapshots?.length ?? 0),
                        0
                      )}{' '}
                      foto
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Rata-Rata Fokus</div>
                    <div className="font-mono text-xl font-semibold text-slate-900 tabular-nums mt-0.5">
                      {avgFocus}% ({flaggedCount} tinjau)
                    </div>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {allLearners
                  .filter(
                    (l) =>
                      (proctoringByAccount[l.id]?.sessionLogs.length ?? 0) > 0
                  )
                  .map((l) => {
                    const proctor = proctoringByAccount[l.id];
                    return (
                      <button
                        key={`proctor-jump-${l.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedAccountId(l.id);
                          setSection('learners');
                        }}
                        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-semibold text-sm text-slate-900 truncate">
                            {l.name}{' '}
                            <span className="font-normal text-xs text-slate-500">
                              · Paket {l.currentTrack} ({l.packageProgressPct ?? 0}%)
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-600 tabular-nums">
                            Membuka tab lain: {proctor.totalTabSwitches}x · Pelanggaran:{' '}
                            {proctor.violationCount} · Snapshot:{' '}
                            {proctor.snapshots.length} foto
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`text-xs font-semibold ${
                              proctor.overallIntegrity === 'pelanggaran'
                                ? 'text-red-700'
                                : proctor.overallIntegrity === 'peringatan'
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                            }`}
                          >
                            {proctor.overallIntegrity === 'pelanggaran'
                              ? 'Pelanggaran'
                              : proctor.overallIntegrity === 'peringatan'
                                ? 'Peringatan'
                                : 'Aman'}
                          </span>
                          <ChevronRight
                            className="w-4 h-4 text-slate-400"
                            aria-hidden="true"
                          />
                        </div>
                      </button>
                    );
                  })}

                {allLearners.every(
                  (l) =>
                    (proctoringByAccount[l.id]?.sessionLogs.length ?? 0) === 0
                ) && (
                  <div className="p-8 text-center space-y-2">
                    <Monitor
                      className="w-6 h-6 text-slate-400 mx-auto"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-semibold text-slate-800">
                      Belum ada sesi pengawasan kamera &amp; layar yang tercatat.
                    </p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Saat peserta mengaktifkan kamera atau berpindah tab di Ruang Belajar, laporannya akan langsung muncul di dalam <strong>Summary Per Akun</strong>.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        );
      })()}

      {/* SECTION 4: CORPORATE EMAIL DOMAIN POLICY */}
      {section === 'policy' && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1 pb-4 border-b border-slate-200">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Kebijakan Login Email Kantor (SSO Domain)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Atur nama perusahaan dan daftar domain email kantor yang diizinkan masuk ke portal LMS ini. Akun Admin utama tetap dapat masuk untuk menjaga akses konsol.
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setPolicySaving(true);
              setPolicySavedMessage(null);
              const parsedDomains = domainsInput
                .split(',')
                .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
                .filter(Boolean);
              await onUpdateWorkspacePolicy({
                ...workspacePolicy,
                companyName: companyName.trim() || 'Lentera Akademi',
                enforceCorporateDomain: enforceDomain,
                requireRegisteredInvite: requireInvite,
                allowedDomains: parsedDomains,
              });
              setPolicySaving(false);
              setPolicySavedMessage('Kebijakan email kantor berhasil disimpan.');
            }}
            className="space-y-5 max-w-2xl"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="policy-company-name"
                className="block text-xs font-semibold text-slate-700"
              >
                Nama Perusahaan / Organisasi
              </label>
              <input
                id="policy-company-name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                id="policy-enforce-domain"
                type="checkbox"
                checked={enforceDomain}
                onChange={(e) => setEnforceDomain(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <label
                htmlFor="policy-enforce-domain"
                className="text-xs sm:text-sm text-slate-700 leading-relaxed"
              >
                <span className="font-semibold text-slate-900 block">
                  Wajibkan Domain Email Kantor
                </span>
                Jika diaktifkan, hanya peserta dengan email berdomain di bawah ini (selain Admin utama) yang dapat masuk melalui halaman login.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="policy-require-invite"
                type="checkbox"
                checked={requireInvite}
                onChange={(e) => setRequireInvite(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <label
                htmlFor="policy-require-invite"
                className="text-xs sm:text-sm text-slate-700 leading-relaxed"
              >
                <span className="font-semibold text-slate-900 block">
                  Wajibkan Email Terdaftar oleh Admin (Undangan Peserta)
                </span>
                Jika diaktifkan, hanya email yang telah didaftarkan Admin pada tab Registrasi Peserta yang diizinkan masuk untuk mengikuti training.
              </label>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="policy-allowed-domains"
                className="block text-xs font-semibold text-slate-700"
              >
                Daftar Domain Kantor Diizinkan (pisahkan dengan koma)
              </label>
              <input
                id="policy-allowed-domains"
                type="text"
                value={domainsInput}
                onChange={(e) => setDomainsInput(e.target.value)}
                placeholder="contoh: perusahaan.co.id, lentera.id"
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {policySavedMessage && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>{policySavedMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={policySaving}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 rounded-lg transition-colors"
            >
              {policySaving ? 'Menyimpan Kebijakan...' : 'Simpan Kebijakan Email Kantor'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
