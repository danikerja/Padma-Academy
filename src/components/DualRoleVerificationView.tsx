import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  Monitor,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import {
  AttemptResult,
  Course,
  CourseProgress,
  CourseStage,
  LMSProgressStore,
  ProctoringSessionLog,
  StudentNote,
  TrackLevel,
  UserProfile,
  WorkspacePolicy,
} from '../types/lms';
import { LearningWorkspace } from './LearningWorkspace';
import { CameraScreenSnapshot } from './CameraScreenMonitor';
import {
  getAccountPackageSummary,
  getCourseProgressPercentage,
} from '../data/courses';
import {
  buildAccountProctoringSummary,
  formatStageLabel,
} from '../utils/proctoringSummary';

interface DualRoleVerificationViewProps {
  currentUser: UserProfile;
  courses: Course[];
  progressStore: LMSProgressStore;
  activeCourse: Course;
  activeProgress: CourseProgress;
  activeStage: CourseStage;
  placementLevel: TrackLevel | null;
  unlockAllPreview: boolean;
  workspacePolicy: WorkspacePolicy;
  proctoringLogs: ProctoringSessionLog[];
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
  onSyncProctoringSnapshot: (
    courseId: string,
    courseCode: string,
    stage: 'pretest' | 'video' | 'posttest',
    snapshot: CameraScreenSnapshot
  ) => void;
  onUpdateWorkspacePolicy: (policy: WorkspacePolicy) => Promise<void>;
  onDeleteProctoringLog: (logId: string) => Promise<void>;
  onSwitchToFullUserView: () => void;
  onSwitchToFullAdminView: () => void;
}

export const DualRoleVerificationView: React.FC<DualRoleVerificationViewProps> = ({
  currentUser,
  courses,
  progressStore,
  activeCourse,
  activeProgress,
  activeStage,
  placementLevel,
  unlockAllPreview,
  workspacePolicy,
  proctoringLogs,
  onToggleUnlockPreview,
  onOpenPlacementModal,
  onSelectCourse,
  onSelectStage,
  onSubmitPreTest,
  onRecordWatchedSecond,
  onPassCheckpoint,
  onAddNote,
  onDeleteNote,
  onSubmitPostTest,
  onSyncProctoringSnapshot,
  onUpdateWorkspacePolicy,
  onDeleteProctoringLog,
  onSwitchToFullUserView,
  onSwitchToFullAdminView,
}) => {
  const [liveSnapshot, setLiveSnapshot] = useState<CameraScreenSnapshot>({
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

  const [enableCameraMonitoring, setEnableCameraMonitoring] = useState(
    workspacePolicy.enableCameraMonitoring
  );
  const [requireCameraForTests, setRequireCameraForTests] = useState(
    workspacePolicy.requireCameraForTests
  );
  const [enableScreenTracking, setEnableScreenTracking] = useState(
    workspacePolicy.enableScreenTracking
  );
  const [enableTabSwitchSiren, setEnableTabSwitchSiren] = useState(
    workspacePolicy.enableTabSwitchSiren
  );
  const [requireFullscreenForPostTest, setRequireFullscreenForPostTest] =
    useState(workspacePolicy.requireFullscreenForPostTest);
  const [maxTabSwitchTolerance, setMaxTabSwitchTolerance] = useState(
    workspacePolicy.maxTabSwitchTolerance
  );
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policySavedNotice, setPolicySavedNotice] = useState<string | null>(
    null
  );
  const [isAccountDetailOpen, setIsAccountDetailOpen] = useState<boolean>(true);

  useEffect(() => {
    setEnableCameraMonitoring(workspacePolicy.enableCameraMonitoring);
    setRequireCameraForTests(workspacePolicy.requireCameraForTests);
    setEnableScreenTracking(workspacePolicy.enableScreenTracking);
    setEnableTabSwitchSiren(workspacePolicy.enableTabSwitchSiren);
    setRequireFullscreenForPostTest(
      workspacePolicy.requireFullscreenForPostTest
    );
    setMaxTabSwitchTolerance(workspacePolicy.maxTabSwitchTolerance);
  }, [workspacePolicy]);

  const handleApplyPolicy = async (next: Partial<WorkspacePolicy>) => {
    setSavingPolicy(true);
    setPolicySavedNotice(null);
    const merged: WorkspacePolicy = {
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
      ...next,
    };
    await onUpdateWorkspacePolicy(merged);
    setSavingPolicy(false);
    setPolicySavedNotice('Kebijakan diterapkan ke tampilan User & tersimpan.');
  };

  const currentLogIdPrefix = `${currentUser.uid}_${activeCourse.id}_`;
  const hasSyncedRecord = proctoringLogs.some((l) =>
    l.logId.startsWith(currentLogIdPrefix)
  );
  const assignedTrack = placementLevel ?? currentUser.currentTrack;
  const userAccountSummary = getAccountPackageSummary(
    assignedTrack,
    progressStore,
    courses
  );
  const trackCourses = courses
    .filter((c) => c.trackLevel === assignedTrack)
    .sort((a, b) => a.moduleOrderInTrack - b.moduleOrderInTrack);
  const persistedProctorSummary = buildAccountProctoringSummary(
    currentUser.uid,
    currentUser.email,
    proctoringLogs,
    workspacePolicy.maxTabSwitchTolerance,
    courses
  );
  const activeSessionViolations = liveSnapshot.events.filter((ev) => {
    const lower = ev.detail.toLowerCase();
    if (ev.type === 'tab_switch') return !lower.includes('uji suara sirine');
    if (ev.type === 'window_blur') return true;
    if (
      ev.type === 'camera' &&
      (lower.includes('dimatikan') || lower.includes('terputus'))
    ) {
      return true;
    }
    if (ev.type === 'screen_share' && lower.includes('dihentikan')) return true;
    if (ev.type === 'fullscreen' && lower.includes('keluar')) return true;
    return false;
  });

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Verification Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-blue-700">
              Mode Uji Sinkronisasi Langsung (User &amp; Admin)
            </p>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              2 Tampilan Simultan: Halaman User &amp; Halaman Admin
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
              Aktifkan kamera, coba pindah tab browser / klik jendela lain, atau aktifkan berbagi layar di panel <strong>Halaman User (Kiri)</strong> lalu amati kebijakan &amp; log pengawasan yang langsung masuk di panel <strong>Halaman Admin (Kanan)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onSwitchToFullUserView}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Buka Halaman User Penuh</span>
            </button>
            <button
              type="button"
              onClick={onSwitchToFullAdminView}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Buka Halaman Admin Penuh</span>
            </button>
          </div>
        </div>

        {/* 4-Item Live Feature Check Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">1. Fitur Kamera User</div>
            <div
              className={`text-sm font-semibold flex items-center gap-1.5 ${
                liveSnapshot.cameraActive ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {liveSnapshot.cameraActive
                  ? `Berjalan (${liveSnapshot.cameraResolution})`
                  : 'Menunggu Diaktifkan'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-500">2. Result Membuka Tab Lain</div>
            <div className="text-sm font-semibold text-slate-900 font-mono tabular-nums flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
              <span>
                Dibuka {liveSnapshot.tabSwitchCount}x · Fokus {liveSnapshot.focusScorePct}%
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-500">3. Sirine &amp; Layar Penuh</div>
            <div
              className={`text-sm font-semibold flex items-center gap-1.5 ${
                liveSnapshot.sirenActive ? 'text-red-700' : 'text-slate-800'
              }`}
            >
              {liveSnapshot.sirenActive ? (
                <>
                  <BellRing className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Sirine Berbunyi! ({liveSnapshot.sirenTriggerCount}x)</span>
                </>
              ) : liveSnapshot.screenShareActive ? (
                <span>Berbagi Layar Aktif</span>
              ) : liveSnapshot.fullscreenActive ? (
                <span>Layar Penuh Aktif</span>
              ) : (
                <span>Sirine Siaga ({liveSnapshot.sirenTriggerCount}x)</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-500">4. Sinkronisasi Database</div>
            <div
              className={`text-sm font-semibold flex items-center gap-1.5 ${
                hasSyncedRecord ? 'text-emerald-700' : 'text-slate-600'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {hasSyncedRecord
                  ? `Tersimpan (${proctoringLogs.length} log)`
                  : 'Menunggu Event Sesi'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Split Viewports: Left = User Page, Right = Admin Page */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: HALAMAN USER (PESERTA) */}
        <section
          aria-label="Panel Tampilan Halaman User"
          className="xl:col-span-7 bg-[#F8FAFC] border border-slate-300 rounded-xl overflow-hidden"
        >
          <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-700" aria-hidden="true" />
              <span className="font-display text-sm font-bold text-slate-900">
                Tampilan 1 — Halaman User (Peserta Training)
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {currentUser.displayName} · {currentUser.division}
            </span>
          </div>

          <LearningWorkspace
            courses={courses}
            progressStore={progressStore}
            activeCourse={activeCourse}
            progress={activeProgress}
            activeStage={activeStage}
            placementLevel={placementLevel}
            unlockAllPreview={unlockAllPreview}
            isAdmin={currentUser.role === 'admin'}
            levelFlowMode={workspacePolicy.levelFlowMode}
            enforceModuleOrder={workspacePolicy.enforceModuleOrder}
            trackSequence={workspacePolicy.trackSequence}
            userAssignedTrack={placementLevel ?? currentUser.currentTrack}
            onToggleUnlockPreview={onToggleUnlockPreview}
            onOpenPlacementModal={onOpenPlacementModal}
            onSelectCourse={onSelectCourse}
            onSelectStage={onSelectStage}
            onSubmitPreTest={onSubmitPreTest}
            onRecordWatchedSecond={onRecordWatchedSecond}
            onPassCheckpoint={onPassCheckpoint}
            onAddNote={onAddNote}
            onDeleteNote={onDeleteNote}
            onSubmitPostTest={onSubmitPostTest}
            defaultRecipientName={currentUser.displayName}
            workspacePolicy={workspacePolicy}
            defaultMonitorOpen={true}
            compactPadding={true}
            stealthMonitoring={false}
            onSyncProctoringSnapshot={(cId, cCode, stg, snap) => {
              setLiveSnapshot(snap);
              onSyncProctoringSnapshot(cId, cCode, stg, snap);
            }}
          />
        </section>

        {/* RIGHT PANEL: HALAMAN ADMIN (PENGAWAS & KEBIJAKAN) */}
        <section
          aria-label="Panel Tampilan Halaman Admin"
          className="xl:col-span-5 bg-white border border-slate-300 rounded-xl overflow-hidden space-y-0"
        >
          <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" aria-hidden="true" />
              <span className="font-display text-sm font-bold">
                Tampilan 2 — Halaman Admin (Pengaturan &amp; Monitor)
              </span>
            </div>
            <span className="text-xs text-slate-300 font-mono">
              Real-Time Firestore Sync
            </span>
          </div>

          <div className="p-5 space-y-6">
            {/* Admin Quick Policy Controls */}
            <div className="space-y-4 pb-5 border-b border-slate-200">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold text-slate-900">
                  Kontrol Kebijakan Kamera &amp; Layar
                </h2>
                {savingPolicy && (
                  <span className="text-xs text-blue-700 font-medium">
                    Menyimpan...
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableCameraMonitoring}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setEnableCameraMonitoring(val);
                      const nextReq = val ? requireCameraForTests : false;
                      if (!val) setRequireCameraForTests(false);
                      void handleApplyPolicy({
                        enableCameraMonitoring: val,
                        requireCameraForTests: nextReq,
                      });
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                  />
                  <span className="text-slate-700">
                    <strong className="text-slate-900 block">
                      Aktifkan Monitor Kamera di Ruang Belajar
                    </strong>
                    Menampilkan kontrol &amp; pratinjau webcam peserta di sebelah kiri.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!enableCameraMonitoring}
                    checked={requireCameraForTests}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setRequireCameraForTests(val);
                      void handleApplyPolicy({ requireCameraForTests: val });
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 disabled:opacity-50"
                  />
                  <span className="text-slate-700">
                    <strong className="text-slate-900 block">
                      Wajibkan Kamera Aktif Saat Pre-Test &amp; Post-Test
                    </strong>
                    Uji langsung dengan memilih tahap Pre-Test / Post-Test di panel kiri.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableScreenTracking}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setEnableScreenTracking(val);
                      const nextFull = val ? requireFullscreenForPostTest : false;
                      const nextSiren = val ? enableTabSwitchSiren : false;
                      if (!val) {
                        setRequireFullscreenForPostTest(false);
                        setEnableTabSwitchSiren(false);
                      }
                      void handleApplyPolicy({
                        enableScreenTracking: val,
                        enableTabSwitchSiren: nextSiren,
                        requireFullscreenForPostTest: nextFull,
                      });
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                  />
                  <span className="text-slate-700">
                    <strong className="text-slate-900 block">
                      Aktifkan Tracking Fokus &amp; Pindah Tab
                    </strong>
                    Mencatat pindah tab, blur jendela, serta fitur Berbagi Layar.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!enableScreenTracking}
                    checked={enableTabSwitchSiren}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setEnableTabSwitchSiren(val);
                      void handleApplyPolicy({
                        enableTabSwitchSiren: val,
                      });
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 disabled:opacity-50"
                  />
                  <span className="text-slate-700">
                    <strong className="text-slate-900 block">
                      Bunyikan Suara Sirine Saat Pindah Tab
                    </strong>
                    Sirine peringatan langsung berbunyi jika peserta keluar dari tab LMS.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!enableScreenTracking}
                    checked={requireFullscreenForPostTest}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setRequireFullscreenForPostTest(val);
                      void handleApplyPolicy({
                        requireFullscreenForPostTest: val,
                      });
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 disabled:opacity-50"
                  />
                  <span className="text-slate-700">
                    <strong className="text-slate-900 block">
                      Wajibkan Layar Penuh Saat Post-Test
                    </strong>
                    Menampilkan pengingat layar penuh di tahap Post-Test panel kiri.
                  </span>
                </label>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <label
                    htmlFor="dual-tab-tolerance"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Toleransi Pindah Tab Maksimal
                  </label>
                  <select
                    id="dual-tab-tolerance"
                    value={maxTabSwitchTolerance}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMaxTabSwitchTolerance(val);
                      void handleApplyPolicy({ maxTabSwitchTolerance: val });
                    }}
                    className="px-3 py-1.5 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {[1, 2, 3, 5, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} kali
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {policySavedNotice && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{policySavedNotice}</span>
                </div>
              )}
            </div>

            {/* Per-Account Summary (Click Account -> Training % + Camera/Screen Violations) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Summary Per Akun User
                </h3>
                <span className="text-[11px] text-slate-500">
                  Klik akun untuk buka/tutup detail
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsAccountDetailOpen((v) => !v)}
                aria-expanded={isAccountDetailOpen}
                className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl space-y-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">
                      {currentUser.displayName}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">
                      {currentUser.email} · {currentUser.division}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 shrink-0">
                    <span>{isAccountDetailOpen ? 'Tutup' : 'Buka Detail'}</span>
                    {isAccountDetailOpen ? (
                      <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">
                      {userAccountSummary.trackName}
                    </span>
                    <span className="font-mono font-bold text-blue-700 tabular-nums">
                      {userAccountSummary.progressPct}% berjalan
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        userAccountSummary.progressPct === 100
                          ? 'bg-emerald-600'
                          : 'bg-blue-700'
                      }`}
                      style={{ width: `${userAccountSummary.progressPct}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-600 tabular-nums">
                    <span>
                      {userAccountSummary.modulesPassed}/
                      {userAccountSummary.modulesTotal} modul lulus
                    </span>
                    <span
                      className={
                        liveSnapshot.tabSwitchCount >
                        workspacePolicy.maxTabSwitchTolerance
                          ? 'text-red-700 font-semibold'
                          : activeSessionViolations.length > 0 ||
                              persistedProctorSummary.violationCount > 0
                            ? 'text-amber-700 font-semibold'
                            : 'text-emerald-700 font-semibold'
                      }
                    >
                      Tab: {liveSnapshot.tabSwitchCount}x · Pelanggaran:{' '}
                      {Math.max(
                        activeSessionViolations.length,
                        persistedProctorSummary.violationCount
                      )}{' '}
                      · {liveSnapshot.snapshots.length} foto
                    </span>
                  </div>
                </div>
              </button>

              {isAccountDetailOpen && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-5 bg-white">
                  {/* 1. Per-Module Progress & Cheating Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">
                        1. Summary &amp; Kecurangan Per Modul ({userAccountSummary.trackName})
                      </span>
                      <span className="font-mono font-bold text-blue-700 tabular-nums">
                        {userAccountSummary.progressPct}%
                      </span>
                    </div>
                    <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-52 overflow-y-auto">
                      {trackCourses.map((tc) => {
                        const modPct = getCourseProgressPercentage(
                          tc,
                          progressStore[tc.id]
                        );
                        const storedMod =
                          persistedProctorSummary.moduleSummaries.find(
                            (m) =>
                              m.courseId === tc.id ||
                              m.courseCode.toUpperCase() ===
                                tc.code.toUpperCase()
                          );
                        const isLiveModule = tc.id === activeCourse.id;
                        const modTabs = isLiveModule
                          ? Math.max(
                              liveSnapshot.tabSwitchCount,
                              storedMod?.totalTabSwitches ?? 0
                            )
                          : (storedMod?.totalTabSwitches ?? 0);
                        const modViolations = isLiveModule
                          ? Math.max(
                              activeSessionViolations.length,
                              storedMod?.violationCount ?? 0
                            )
                          : (storedMod?.violationCount ?? 0);

                        return (
                          <li
                            key={tc.id}
                            className="px-3 py-2 text-xs flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-slate-800 font-medium">
                                <span className="font-mono text-blue-700 font-semibold">
                                  Modul {tc.moduleOrderInTrack} · {tc.code}
                                </span>{' '}
                                {tc.title}
                              </div>
                              <div
                                className={`text-[11px] font-mono tabular-nums ${
                                  modViolations > 0 || modTabs > 0
                                    ? 'text-red-700 font-semibold'
                                    : storedMod || isLiveModule
                                      ? 'text-emerald-700'
                                      : 'text-slate-400'
                                }`}
                              >
                                {modViolations > 0 || modTabs > 0
                                  ? `Kecurangan: Tab ${modTabs}x · ${modViolations} pelanggaran`
                                  : storedMod || isLiveModule
                                    ? 'Aman · 0 pelanggaran'
                                    : 'Belum ada sesi'}
                              </div>
                            </div>
                            <span
                              className={`font-mono font-semibold tabular-nums shrink-0 ${
                                modPct === 100
                                  ? 'text-emerald-700'
                                  : modPct > 0
                                    ? 'text-blue-700'
                                    : 'text-slate-400'
                              }`}
                            >
                              {modPct}%
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* 2. Camera, Screen Tracking & Violation Report inside Account Summary */}
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">
                        2. Pelaporan Kamera, Layar &amp; Pelanggaran Akun
                      </span>
                      <span className="font-mono text-slate-500">
                        Modul {activeCourse.moduleOrderInTrack} ·{' '}
                        {activeCourse.code} · {formatStageLabel(activeStage)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div>
                        <div className="text-slate-500">Kamera &amp; Snapshot</div>
                        <div
                          className={`font-semibold mt-0.5 ${
                            liveSnapshot.cameraActive
                              ? 'text-emerald-700'
                              : 'text-slate-700'
                          }`}
                        >
                          {liveSnapshot.cameraActive ? 'Aktif' : 'Nonaktif'} ·{' '}
                          <span className="font-mono tabular-nums">
                            {liveSnapshot.snapshots.length} foto
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {liveSnapshot.cameraLabel}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Membuka Tab Lain</div>
                        <div
                          className={`font-mono font-semibold tabular-nums mt-0.5 ${
                            liveSnapshot.tabSwitchCount >
                            workspacePolicy.maxTabSwitchTolerance
                              ? 'text-red-700'
                              : liveSnapshot.tabSwitchCount > 0
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                          }`}
                        >
                          {liveSnapshot.tabSwitchCount} kali (Batas{' '}
                          {workspacePolicy.maxTabSwitchTolerance}x)
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          Fokus: {liveSnapshot.focusScorePct}% · Blur:{' '}
                          {liveSnapshot.windowBlurCount}x · Sirine:{' '}
                          <span
                            className={
                              liveSnapshot.sirenActive
                                ? 'text-red-700 font-semibold'
                                : ''
                            }
                          >
                            {liveSnapshot.sirenActive
                              ? 'Berbunyi!'
                              : `${liveSnapshot.sirenTriggerCount}x`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Violations List Tagged by Module Number & Code */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-700">
                        Pelanggaran Per Modul (Sesi Aktif + Riwayat Akun)
                      </div>
                      {activeSessionViolations.length === 0 &&
                      persistedProctorSummary.violations.length === 0 ? (
                        <p className="text-xs text-emerald-800 p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                          Belum ada pelanggaran tercatat. Coba pindah tab di panel kiri untuk menguji laporan pelanggaran masuk per modul ke summary akun ini.
                        </p>
                      ) : (
                        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                          {activeSessionViolations.map((ev, i) => (
                            <li
                              key={`live-v-${ev.time}-${i}`}
                              className="px-3 py-2 text-xs flex items-center justify-between gap-2"
                            >
                              <span className="text-red-700 font-medium truncate">
                                <span className="font-mono font-semibold">
                                  [Modul {activeCourse.moduleOrderInTrack} ·{' '}
                                  {activeCourse.code}]
                                </span>{' '}
                                {ev.detail}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                                {ev.time}
                              </span>
                            </li>
                          ))}
                          {persistedProctorSummary.violations
                            .slice(0, 6)
                            .map((v) => (
                              <li
                                key={`hist-v-${v.id}`}
                                className="px-3 py-2 text-xs flex items-center justify-between gap-2 bg-slate-50/50"
                              >
                                <span className="text-slate-700 truncate">
                                  <span className="font-mono text-slate-600 font-semibold">
                                    [
                                    {v.moduleOrder
                                      ? `Modul ${v.moduleOrder} · `
                                      : ''}
                                    {v.courseCode}]
                                  </span>{' '}
                                  {v.detail}
                                </span>
                                <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                                  {v.time}
                                </span>
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>

                    {/* 10-Second Auto Snapshots Gallery */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          Snapshot Kamera &amp; Layar Per 10 Detik (
                          {liveSnapshot.snapshots.length})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Otomatis masuk ke summary akun
                        </span>
                      </div>
                      {liveSnapshot.snapshots.length === 0 ? (
                        <p className="text-xs text-slate-500 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          Aktifkan kamera atau berbagi layar di panel kiri. Snapshot per 10 detik otomatis masuk ke sini.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {liveSnapshot.snapshots.slice(0, 6).map((snap, idx) => (
                            <div
                              key={`${snap.time}-${idx}`}
                              className="border border-slate-200 rounded-md overflow-hidden bg-slate-900"
                            >
                              <img
                                src={snap.dataUrl}
                                alt={`Snapshot ${snap.time}`}
                                className="w-full aspect-video object-cover"
                              />
                              <div className="px-2 py-1 bg-white text-[10px] font-mono text-slate-700 flex items-center justify-between tabular-nums">
                                <span>{snap.time}</span>
                                <span className="text-slate-500">
                                  {snap.source === 'camera' ? 'Kamera' : 'Layar'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Account's Stored Proctoring Sessions in Firestore */}
                    {persistedProctorSummary.sessionLogs.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="text-xs font-semibold text-slate-700">
                          Riwayat Sesi Tersimpan Akun Ini (
                          {persistedProctorSummary.sessionLogs.length})
                        </div>
                        <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg max-h-44 overflow-y-auto">
                          {persistedProctorSummary.sessionLogs.map((log) => (
                            <div
                              key={log.logId}
                              className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="font-mono font-semibold text-slate-800 truncate">
                                  {log.courseCode} · {formatStageLabel(log.stage)}
                                </div>
                                <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                                  Tab {log.tabSwitchCount}x · Fokus{' '}
                                  {log.focusScorePct}% ·{' '}
                                  {log.snapshots?.length ?? 0} foto
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {log.integrityStatus === 'aman' ? (
                                  <ShieldCheck
                                    className="w-3.5 h-3.5 text-emerald-700"
                                    aria-hidden="true"
                                  />
                                ) : log.integrityStatus === 'peringatan' ? (
                                  <AlertTriangle
                                    className="w-3.5 h-3.5 text-amber-700"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <ShieldAlert
                                    className="w-3.5 h-3.5 text-red-700"
                                    aria-hidden="true"
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    void onDeleteProctoringLog(log.logId)
                                  }
                                  aria-label={`Hapus log ${log.logId}`}
                                  className="text-slate-400 hover:text-red-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
