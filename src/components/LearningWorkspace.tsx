import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Lock,
  Maximize2,
  PlayCircle,
  Unlock,
} from 'lucide-react';
import {
  AttemptResult,
  Course,
  CourseProgress,
  CourseStage,
  LevelFlowMode,
  LMSProgressStore,
  StudentNote,
  TrackLevel,
  WorkspacePolicy,
} from '../types/lms';
import {
  getBestPostScore,
  getNextSequentialCourseId,
  getWatchPercentage,
  isCourseUnlockedInTrack,
  isTrackUnlocked,
  LEARNING_TRACKS,
} from '../data/courses';
import { QuizEngine } from './QuizEngine';
import { VideoLearningStage } from './VideoLearningStage';
import { Certification } from './Certification';
import {
  CameraScreenMonitor,
  CameraScreenSnapshot,
} from './CameraScreenMonitor';

interface LearningWorkspaceProps {
  courses: Course[];
  progressStore: LMSProgressStore;
  activeCourse: Course;
  progress: CourseProgress;
  activeStage: CourseStage;
  placementLevel: TrackLevel | null;
  unlockAllPreview: boolean;
  isAdmin?: boolean;
  levelFlowMode: LevelFlowMode;
  enforceModuleOrder: boolean;
  trackSequence: TrackLevel[];
  userAssignedTrack: TrackLevel;
  onToggleUnlockPreview: () => void;
  onOpenPlacementModal: () => void;
  onSelectCourse: (courseId: string) => void;
  onSelectStage: (stage: CourseStage) => void;
  onSubmitPreTest: (result: AttemptResult) => void;
  onRecordWatchedSecond: (second: number, currentPos: number) => void;
  onPassCheckpoint: () => void;
  onAddNote: (note: StudentNote) => void;
  onDeleteNote: (noteId: string) => void;
  onSubmitPostTest: (result: AttemptResult) => void;
  defaultRecipientName?: string;
  workspacePolicy: WorkspacePolicy;
  defaultMonitorOpen?: boolean;
  compactPadding?: boolean;
  stealthMonitoring?: boolean;
  onSyncProctoringSnapshot?: (
    courseId: string,
    courseCode: string,
    stage: 'pretest' | 'video' | 'posttest',
    snapshot: CameraScreenSnapshot
  ) => void;
}

export const LearningWorkspace: React.FC<LearningWorkspaceProps> = ({
  courses,
  progressStore,
  activeCourse,
  progress,
  activeStage,
  placementLevel,
  unlockAllPreview,
  isAdmin = false,
  levelFlowMode,
  enforceModuleOrder,
  trackSequence,
  userAssignedTrack,
  onToggleUnlockPreview,
  onSelectCourse,
  onSelectStage,
  onSubmitPreTest,
  onRecordWatchedSecond,
  onPassCheckpoint,
  onAddNote,
  onDeleteNote,
  onSubmitPostTest,
  defaultRecipientName,
  workspacePolicy,
  defaultMonitorOpen = false,
  compactPadding = false,
  stealthMonitoring = true,
  onSyncProctoringSnapshot,
}) => {
  const effectiveUnlockPreview = Boolean(isAdmin) && unlockAllPreview;
  const [jumpToChapterIdx, setJumpToChapterIdx] = useState<number | null>(null);
  const [isMonitorPanelOpen, setIsMonitorPanelOpen] = useState<boolean>(defaultMonitorOpen);
  const [requestCameraSignal, setRequestCameraSignal] = useState<number>(0);
  const [monitorSnapshot, setMonitorSnapshot] = useState<CameraScreenSnapshot>({
    cameraActive: false,
    cameraLabel: 'Kamera Belum Aktif',
    cameraMirror: true,
    cameraResolution: '720p',
    screenShareActive: false,
    fullscreenActive: false,
    tabSwitchCount: 0,
    windowBlurCount: 0,
    focusScorePct: 100,
    awaySeconds: 0,
    integrityStatus: 'aman',
    sirenActive: false,
    sirenTriggerCount: 0,
    snapshots: [],
    events: [],
  });

  const handleMonitorSnapshotChange = React.useCallback(
    (snap: CameraScreenSnapshot) => {
      setMonitorSnapshot(snap);
      if (
        onSyncProctoringSnapshot &&
        (activeStage === 'pretest' || activeStage === 'posttest')
      ) {
        onSyncProctoringSnapshot(
          activeCourse.id,
          activeCourse.code,
          activeStage,
          snap
        );
      }
    },
    [onSyncProctoringSnapshot, activeCourse.id, activeCourse.code, activeStage]
  );

  const trackAccess = isTrackUnlocked(
    activeCourse.trackLevel,
    progressStore,
    placementLevel,
    effectiveUnlockPreview,
    courses,
    levelFlowMode,
    userAssignedTrack,
    trackSequence
  );

  const courseOrderAccess = isCourseUnlockedInTrack(
    activeCourse,
    progressStore,
    courses,
    enforceModuleOrder,
    effectiveUnlockPreview
  );

  const nextSequentialCourseId = getNextSequentialCourseId(
    courses,
    progressStore,
    trackSequence
  );
  const nextSequentialCourse =
    courses.find((c) => c.id === nextSequentialCourseId) ?? null;

  const orderedTracks = [...LEARNING_TRACKS].sort((a, b) => {
    const idxA = trackSequence.indexOf(a.id);
    const idxB = trackSequence.indexOf(b.id);
    return (idxA >= 0 ? idxA : a.order) - (idxB >= 0 ? idxB : b.order);
  });

  const preDone = progress.preTestResult !== null;
  const watchPct = getWatchPercentage(progress, activeCourse);
  const videoDone = watchPct >= activeCourse.minWatchPercent;
  const latestPost =
    progress.postTestAttempts.length > 0
      ? progress.postTestAttempts[progress.postTestAttempts.length - 1]
      : null;
  const bestPostScore = getBestPostScore(progress);
  const postPassed =
    bestPostScore !== null && bestPostScore >= activeCourse.passingScore;
  const certificateEligible = postPassed && bestPostScore !== null && bestPostScore > 80;

  const canAccessVideo = effectiveUnlockPreview || preDone;
  const canAccessPostTest = effectiveUnlockPreview || preDone;
  const canAccessSummary = certificateEligible;

  const steps: {
    id: CourseStage;
    index: string;
    label: string;
    sublabel: string;
    unlocked: boolean;
    completed: boolean;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'pretest',
      index: '01',
      label: 'Pre-Test Diagnostik',
      sublabel: preDone
        ? `Skor Awal: ${progress.preTestResult?.score}/100`
        : 'Wajib sebelum video',
      unlocked: trackAccess.unlocked,
      completed: preDone,
      icon: ClipboardCheck,
    },
    {
      id: 'video',
      index: '02',
      label: 'Video Learning',
      sublabel: watchPct > 0 ? `${watchPct}% ditonton` : 'Materi video bebas ditonton',
      unlocked: trackAccess.unlocked && canAccessVideo,
      completed: videoDone,
      icon: PlayCircle,
    },
    {
      id: 'posttest',
      index: '03',
      label: 'Post-Test Evaluasi',
      sublabel:
        bestPostScore !== null
          ? `Skor Terbaik: ${bestPostScore}/100`
          : `Syarat KKM ${activeCourse.passingScore}%`,
      unlocked: trackAccess.unlocked && canAccessPostTest,
      completed: postPassed,
      icon: ClipboardCheck,
    },
    {
      id: 'summary',
      index: '04',
      label: 'Sertifikat Kelulusan',
      sublabel: certificateEligible ? 'Terbuka (> 80%)' : 'Syarat Skor > 80%',
      unlocked: trackAccess.unlocked && canAccessSummary,
      completed: certificateEligible,
      icon: Award,
    },
  ];

  const handleGoToVideo = (chapterIdx?: number) => {
    setJumpToChapterIdx(typeof chapterIdx === 'number' ? chapterIdx : null);
    onSelectStage('video');
  };

  return (
    <div
      className={
        compactPadding
          ? 'p-4 sm:p-5 space-y-5'
          : 'max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'
      }
    >
      {/* Workspace Toolbar: Course Selector & Instructor Preview Mode */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
            <span className="font-mono font-semibold text-blue-700">
              Paket {activeCourse.trackLevel}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-semibold text-slate-700">
              {activeCourse.code}
            </span>
            <span aria-hidden="true">·</span>
            <span>Modul {activeCourse.moduleOrderInTrack}</span>
            <span aria-hidden="true">·</span>
            <span>Instruktur: {activeCourse.instructorName}</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
            {activeCourse.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <label htmlFor="course-switcher" className="sr-only">
              Pilih Kursus
            </label>
            <select
              id="course-switcher"
              value={activeCourse.id}
              onChange={(e) => {
                setJumpToChapterIdx(null);
                onSelectCourse(e.target.value);
              }}
              className="px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 max-w-[320px]"
            >
              {orderedTracks.map((track) => {
                const trackOptAccess = isTrackUnlocked(
                  track.id,
                  progressStore,
                  placementLevel,
                  effectiveUnlockPreview,
                  courses,
                  levelFlowMode,
                  userAssignedTrack,
                  trackSequence
                );
                return (
                  <optgroup
                    key={track.id}
                    label={
                      !trackOptAccess.unlocked
                        ? `${track.name} (Terkunci)`
                        : track.name
                    }
                  >
                    {courses
                      .filter((c) => c.trackLevel === track.id)
                      .sort((a, b) => a.moduleOrderInTrack - b.moduleOrderInTrack)
                      .map((c) => {
                        const cOrderAccess = isCourseUnlockedInTrack(
                          c,
                          progressStore,
                          courses,
                          enforceModuleOrder,
                          effectiveUnlockPreview
                        );
                        const isOptionLocked =
                          !effectiveUnlockPreview &&
                          (!trackOptAccess.unlocked || !cOrderAccess.unlocked);
                        return (
                          <option
                            key={c.id}
                            value={c.id}
                            disabled={isOptionLocked}
                          >
                            {c.code} — {c.title}
                            {isOptionLocked ? ' (Terkunci)' : ''}
                          </option>
                        );
                      })}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={onToggleUnlockPreview}
              aria-pressed={unlockAllPreview}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                unlockAllPreview
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {unlockAllPreview ? (
                <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>
                {unlockAllPreview
                  ? 'Mode Pratinjau Bebas: Aktif'
                  : 'Mode Pratinjau Bebas (Admin)'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Track Prerequisite Gate */}
      {!trackAccess.unlocked ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-blue-700">
              Urutan Paket Pelatihan Berjenjang
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              Paket {activeCourse.trackLevel} Masih Terkunci
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {trackAccess.reason}. Setiap peserta wajib menuntaskan seluruh modul pada paket sebelumnya secara berurutan (mulai dari Paket OJT hingga selesai 100%) sebelum mengerjakan paket berikutnya.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {nextSequentialCourse && nextSequentialCourse.id !== activeCourse.id && (
              <button
                type="button"
                onClick={() => onSelectCourse(nextSequentialCourse.id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
              >
                <span>
                  Kerjakan {nextSequentialCourse.trackLevel} ({nextSequentialCourse.code}) Sekarang
                </span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={onToggleUnlockPreview}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span>Aktifkan Mode Pratinjau Bebas</span>
              </button>
            )}
          </div>
        </div>
      ) : !courseOrderAccess.unlocked && courseOrderAccess.prerequisiteCourse ? (
        <LockedGatePanel
          title={`Modul ${activeCourse.code} Belum Terbuka`}
          description={`Kebijakan alur Admin mewajibkan penyelesaian modul secara berurutan di dalam Paket ${activeCourse.trackLevel}. Selesaikan dan lulus KKM pada modul ${courseOrderAccess.prerequisiteCourse.code} (${courseOrderAccess.prerequisiteCourse.title}) terlebih dahulu sebelum memulai modul ini.`}
          actionLabel={`Kerjakan ${courseOrderAccess.prerequisiteCourse.code} Sekarang`}
          onAction={() => onSelectCourse(courseOrderAccess.prerequisiteCourse!.id)}
        />
      ) : (
        <>
          {/* 4-Stage Sequential Gating Stepper */}
          <nav
            aria-label="Tahapan Pembelajaran"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            {steps.map((step) => {
              const isCurrent = activeStage === step.id;
              const Icon = step.icon;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onSelectStage(step.id)}
                  className={`text-left p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                    isCurrent
                      ? 'bg-white border-blue-700 ring-1 ring-blue-700'
                      : step.unlocked
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono font-semibold text-blue-700 tabular-nums">
                        {step.index}.
                      </span>
                      <span className="font-semibold text-slate-900 truncate">
                        {step.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate tabular-nums">
                      {step.sublabel}
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    {step.completed ? (
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-700"
                        aria-label="Selesai"
                      />
                    ) : !step.unlocked ? (
                      <Lock className="w-4 h-4 text-slate-400" aria-label="Terkunci" />
                    ) : (
                      <Icon
                        className={`w-4 h-4 ${
                          isCurrent ? 'text-blue-700' : 'text-slate-400'
                        }`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Integrated Camera Settings & Screen Focus Tracking Strip (Silent on User Page) */}
          <CameraScreenMonitor
            policy={workspacePolicy}
            activeCourse={activeCourse}
            activeStage={activeStage}
            isPanelOpen={isMonitorPanelOpen}
            onTogglePanel={() => setIsMonitorPanelOpen((v) => !v)}
            onSnapshotChange={handleMonitorSnapshotChange}
            requestStartCameraSignal={requestCameraSignal}
            stealthMode={stealthMonitoring}
          />

          {/* Stage Content Viewport */}
          {activeStage === 'pretest' &&
            (!stealthMonitoring &&
            workspacePolicy.enableCameraMonitoring &&
            workspacePolicy.requireCameraForTests &&
            !effectiveUnlockPreview &&
            !preDone &&
            !monitorSnapshot.cameraActive ? (
              <CameraRequiredGate
                stageLabel="Pre-Test Diagnostik"
                onActivateCamera={() => {
                  setRequestCameraSignal((n) => n + 1);
                  setIsMonitorPanelOpen(true);
                }}
                onOpenSettings={() => setIsMonitorPanelOpen(true)}
              />
            ) : (
              <QuizEngine
                mode="pretest"
                course={activeCourse}
                existingResult={progress.preTestResult}
                preTestBaseline={null}
                onSubmitAttempt={onSubmitPreTest}
                onProceedToVideo={handleGoToVideo}
              />
            ))}

          {activeStage === 'video' &&
            (canAccessVideo ? (
              <VideoLearningStage
                course={activeCourse}
                progress={progress}
                preTestResult={progress.preTestResult}
                initialChapterIndex={jumpToChapterIdx}
                unlockAllPreview={effectiveUnlockPreview}
                onRecordWatchedSecond={onRecordWatchedSecond}
                onPassCheckpoint={onPassCheckpoint}
                onAddNote={onAddNote}
                onDeleteNote={onDeleteNote}
                onProceedToPostTest={() => onSelectStage('posttest')}
              />
            ) : (
              <LockedGatePanel
                title="Video Learning Belum Terbuka"
                description="Dalam alur LMS berbasis Pre-Test, peserta wajib menyelesaikan Pre-Test diagnostik terlebih dahulu agar sistem merekam kemampuan awal sebelum menonton materi."
                actionLabel="Kerjakan Pre-Test Sekarang"
                onAction={() => onSelectStage('pretest')}
              />
            ))}

          {activeStage === 'posttest' &&
            (canAccessPostTest ? (
              !stealthMonitoring &&
              workspacePolicy.enableCameraMonitoring &&
              workspacePolicy.requireCameraForTests &&
              !effectiveUnlockPreview &&
              !postPassed &&
              !monitorSnapshot.cameraActive ? (
                <CameraRequiredGate
                  stageLabel="Post-Test Evaluasi"
                  onActivateCamera={() => {
                    setRequestCameraSignal((n) => n + 1);
                    setIsMonitorPanelOpen(true);
                  }}
                  onOpenSettings={() => setIsMonitorPanelOpen(true)}
                />
              ) : (
                <div className="space-y-6">
                  {!stealthMonitoring &&
                    workspacePolicy.enableScreenTracking &&
                    workspacePolicy.requireFullscreenForPostTest &&
                    !effectiveUnlockPreview &&
                    !monitorSnapshot.fullscreenActive && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <span className="text-amber-900 font-medium">
                          Kebijakan evaluasi mewajibkan mode <strong>Layar Penuh</strong> selama mengerjakan Post-Test untuk menjaga integritas layar.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            void document.documentElement
                              .requestFullscreen()
                              .catch(() => undefined);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
                        >
                          <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Aktifkan Layar Penuh</span>
                        </button>
                      </div>
                    )}
                  <QuizEngine
                    mode="posttest"
                    course={activeCourse}
                    existingResult={latestPost}
                    preTestBaseline={progress.preTestResult}
                    onSubmitAttempt={onSubmitPostTest}
                    onProceedToVideo={handleGoToVideo}
                    onOpenCertificate={() => onSelectStage('summary')}
                  />
                  {postPassed &&
                    nextSequentialCourse &&
                    nextSequentialCourse.id !== activeCourse.id && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-emerald-700">
                            {nextSequentialCourse.trackLevel !==
                            activeCourse.trackLevel
                              ? `Selamat! Seluruh Modul Paket ${activeCourse.trackLevel} Selesai`
                              : `Modul ${activeCourse.code} Lulus KKM`}
                          </div>
                          <div className="text-sm font-bold text-slate-900">
                            {nextSequentialCourse.trackLevel !==
                            activeCourse.trackLevel
                              ? `Paket ${nextSequentialCourse.trackLevel} kini telah terbuka: ${nextSequentialCourse.code} — ${nextSequentialCourse.title}`
                              : `Modul berikutnya kini terbuka: ${nextSequentialCourse.code} — ${nextSequentialCourse.title}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setJumpToChapterIdx(null);
                            onSelectCourse(nextSequentialCourse.id);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          <span>Lanjut ke {nextSequentialCourse.code}</span>
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                {certificateEligible && (
                  <Certification
                    course={activeCourse}
                    preTestResult={progress.preTestResult}
                    bestPostScore={bestPostScore}
                    watchPct={watchPct}
                    completedAt={latestPost?.completedAt}
                    defaultRecipientName={defaultRecipientName}
                  />
                )}
                </div>
              )
            ) : (
              <LockedGatePanel
                title="Post-Test Evaluasi Masih Terkunci"
                description="Selesaikan Pre-Test diagnostik terlebih dahulu sebelum mengakses Post-Test Evaluasi."
                actionLabel="Mulai Pre-Test"
                onAction={() => onSelectStage('pretest')}
              />
            ))}

          {activeStage === 'summary' &&
            (certificateEligible ? (
              <div className="space-y-6">
                <Certification
                  course={activeCourse}
                  preTestResult={progress.preTestResult}
                  bestPostScore={bestPostScore}
                  watchPct={watchPct}
                  completedAt={latestPost?.completedAt}
                  defaultRecipientName={defaultRecipientName}
                />
                {postPassed &&
                  nextSequentialCourse &&
                  nextSequentialCourse.id !== activeCourse.id && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-emerald-700">
                          {nextSequentialCourse.trackLevel !==
                          activeCourse.trackLevel
                            ? `Paket ${activeCourse.trackLevel} Selesai 100%`
                            : `Modul ${activeCourse.code} Selesai`}
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          Lanjutkan ke {nextSequentialCourse.trackLevel} ·{' '}
                          {nextSequentialCourse.code} — {nextSequentialCourse.title}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setJumpToChapterIdx(null);
                          onSelectCourse(nextSequentialCourse.id);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>Lanjut ke {nextSequentialCourse.code}</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
              </div>
            ) : (
              <LockedGatePanel
                title="Sertifikat Belum Terbuka"
                description={
                  bestPostScore !== null && bestPostScore >= activeCourse.passingScore
                    ? `Skor Post-Test terbaik Anda saat ini adalah ${bestPostScore}/100. Sertifikat penyelesaian hanya terbit jika Anda lulus Post-Test dengan skor di atas 80% (> 80%).`
                    : `Selesaikan dan lulus Post-Test dengan skor di atas 80% (> 80%) untuk membuka dan mengunduh sertifikat penyelesaian.`
                }
                actionLabel="Buka Tahap Post-Test"
                onAction={() => onSelectStage('posttest')}
              />
            ))}
        </>
      )}
    </div>
  );
};

interface LockedGatePanelProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

const LockedGatePanel: React.FC<LockedGatePanelProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
      <Lock className="w-5 h-5" aria-hidden="true" />
    </div>
    <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>
    <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    <div className="pt-2">
      <button
        type="button"
        onClick={onAction}
        className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  </div>
);

interface CameraRequiredGateProps {
  stageLabel: string;
  onActivateCamera: () => void;
  onOpenSettings: () => void;
}

const CameraRequiredGate: React.FC<CameraRequiredGateProps> = ({
  stageLabel,
  onActivateCamera,
  onOpenSettings,
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5">
    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
      <Camera className="w-5 h-5" aria-hidden="true" />
    </div>
    <div className="space-y-2">
      <p className="text-xs font-semibold text-blue-700">
        Verifikasi Pengawasan Kamera
      </p>
      <h2 className="font-display text-xl font-bold text-slate-900">
        Aktifkan Kamera Sebelum Memulai {stageLabel}
      </h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Kebijakan Admin mewajibkan kamera aktif selama pengerjaan {stageLabel}. Tekan tombol di bawah untuk mengizinkan akses kamera serta memeriksa pencahayaan dan posisi wajah Anda.
      </p>
    </div>
    <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
      <button
        type="button"
        onClick={onActivateCamera}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
      >
        <Camera className="w-4 h-4" aria-hidden="true" />
        <span>Aktifkan Kamera Sekarang</span>
      </button>
      <button
        type="button"
        onClick={onOpenSettings}
        className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
      >
        Buka Pengaturan Perangkat
      </button>
    </div>
  </div>
);
