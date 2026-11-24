import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Lock,
  PlayCircle,
  TrendingUp,
} from 'lucide-react';
import {
  Course,
  LearningTrack,
  LevelFlowMode,
  LMSProgressStore,
  TrackLevel,
  UserProfile,
} from '../types/lms';
import {
  computeNGain,
  getAccountPackageSummary,
  getBestPostScore,
  getNextSequentialCourseId,
  getTrackProgressSummary,
  getWatchPercentage,
  isCoursePassed,
  isCourseUnlockedInTrack,
  isTrackUnlocked,
} from '../data/courses';
import { LearningJourneyMap } from './LearningJourneyMap';

interface CourseCatalogProps {
  tracks: LearningTrack[];
  courses: Course[];
  progressStore: LMSProgressStore;
  activeCourseId: string;
  placementLevel: TrackLevel | null;
  unlockAllPreview: boolean;
  levelFlowMode: LevelFlowMode;
  enforceModuleOrder: boolean;
  trackSequence: TrackLevel[];
  userAssignedTrack: TrackLevel;
  userProfile?: UserProfile;
  onOpenCourse: (courseId: string) => void;
  onOpenPlacementModal: () => void;
  onOpenArchitecture: () => void;
  onResetDemo: () => void;
}

export const CourseCatalog: React.FC<CourseCatalogProps> = ({
  tracks,
  courses,
  progressStore,
  activeCourseId,
  placementLevel,
  unlockAllPreview,
  levelFlowMode,
  enforceModuleOrder,
  trackSequence,
  userAssignedTrack,
  userProfile,
  onOpenCourse,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<TrackLevel>(
    () => userAssignedTrack || 'OJT'
  );
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const orderedTracks = [...tracks].sort((a, b) => {
    const idxA = trackSequence.indexOf(a.id);
    const idxB = trackSequence.indexOf(b.id);
    return (idxA >= 0 ? idxA : a.order) - (idxB >= 0 ? idxB : b.order);
  });

  const selectedTrack =
    orderedTracks.find((t) => t.id === selectedTrackId) ?? orderedTracks[0];
  const selectedTrackSeqNumber =
    (trackSequence.indexOf(selectedTrack.id) >= 0
      ? trackSequence.indexOf(selectedTrack.id) + 1
      : selectedTrack.order);
  const trackCourses = courses
    .filter((c) => c.trackLevel === selectedTrack.id)
    .sort((a, b) => a.moduleOrderInTrack - b.moduleOrderInTrack);

  const effectiveUnlockPreview =
    userProfile?.role === 'admin' && unlockAllPreview;

  const selectedTrackAccess = isTrackUnlocked(
    selectedTrack.id,
    progressStore,
    placementLevel,
    effectiveUnlockPreview,
    courses,
    levelFlowMode,
    userAssignedTrack,
    trackSequence
  );

  const nextSequentialCourseId = getNextSequentialCourseId(
    courses,
    progressStore,
    trackSequence
  );
  const nextSequentialCourse =
    courses.find((c) => c.id === nextSequentialCourseId) ?? courses[0];
  const activeCourseCandidate = courses.find((c) => c.id === activeCourseId);
  const heroTargetCourseId = (() => {
    if (!activeCourseCandidate) return nextSequentialCourseId;
    const tAcc = isTrackUnlocked(
      activeCourseCandidate.trackLevel,
      progressStore,
      placementLevel,
      effectiveUnlockPreview,
      courses,
      levelFlowMode,
      userAssignedTrack,
      trackSequence
    );
    const mAcc = isCourseUnlockedInTrack(
      activeCourseCandidate,
      progressStore,
      courses,
      enforceModuleOrder,
      effectiveUnlockPreview
    );
    if (
      tAcc.unlocked &&
      mAcc.unlocked &&
      !isCoursePassed(activeCourseCandidate, progressStore)
    ) {
      return activeCourseCandidate.id;
    }
    return nextSequentialCourseId;
  })();

  const completedCoursesCount = courses.filter((course) => {
    const p = progressStore[course.id];
    const best = p ? getBestPostScore(p) : null;
    return best !== null && best >= course.passingScore;
  }).length;

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

  const avgPost =
    postScores.length > 0
      ? Math.round(postScores.reduce((a, b) => a + b, 0) / postScores.length)
      : 0;

  const completedTracksCount = tracks.filter(
    (t) => getTrackProgressSummary(t.id, progressStore, courses).completed
  ).length;

  const getCourseStatus = (
    course: Course,
    trackUnlocked: boolean,
    moduleUnlocked: boolean,
    prerequisiteCode?: string
  ) => {
    if (!trackUnlocked) {
      return {
        label: 'Terkunci · Selesaikan Paket Sebelumnya',
        cta: 'Terkunci · Selesaikan Paket Sebelumnya',
        toneClass: 'text-slate-500',
        icon: Lock,
        stepPct: 0,
      };
    }

    if (!moduleUnlocked) {
      return {
        label: prerequisiteCode
          ? `Terkunci · Luluskan ${prerequisiteCode} dulu`
          : 'Terkunci · Selesaikan Modul Sebelumnya',
        cta: prerequisiteCode
          ? `Terkunci · Kerjakan ${prerequisiteCode} Dulu`
          : 'Terkunci · Kerjakan Modul Sebelumnya',
        toneClass: 'text-slate-500',
        icon: Lock,
        stepPct: 0,
      };
    }

    const p = progressStore[course.id];
    if (!p || !p.preTestResult) {
      return {
        label: 'Tahap 1: Siap Pre-Test',
        cta: 'Mulai Pre-Test',
        toneClass: 'text-slate-700',
        icon: ClipboardCheck,
        stepPct: 0,
      };
    }
    const watchPct = getWatchPercentage(p, course);
    const bestPost = getBestPostScore(p);

    if (bestPost !== null && bestPost >= course.passingScore) {
      return {
        label: `Selesai · Lulus (${bestPost}/100)`,
        cta: 'Lihat Ringkasan',
        toneClass: 'text-emerald-700',
        icon: CheckCircle2,
        stepPct: 100,
      };
    }

    if (bestPost !== null && bestPost < course.passingScore) {
      return {
        label: `Perlu Penguatan · Post-Test ${bestPost}/100`,
        cta: 'Ulangi Post-Test',
        toneClass: 'text-amber-700',
        icon: Clock,
        stepPct: 80,
      };
    }

    if (watchPct >= course.minWatchPercent) {
      return {
        label: 'Tahap 3: Post-Test Terbuka',
        cta: 'Kerjakan Post-Test',
        toneClass: 'text-blue-700',
        icon: ClipboardCheck,
        stepPct: 70,
      };
    }

    return {
      label: `Tahap 2: Video Learning (${watchPct}%)`,
      cta: 'Lanjut Video',
      toneClass: 'text-blue-700',
      icon: PlayCircle,
      stepPct: Math.max(25, Math.round(25 + watchPct * 0.45)),
    };
  };

  const activeAccountSummary = getAccountPackageSummary(
    userAssignedTrack,
    progressStore,
    courses
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      {/* Per-Account Training Package & Progress Summary */}
      {userProfile && (
        <section
          aria-label="Summary Pelatihan Akun Anda"
          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-blue-700">
                Summary Akun Peserta
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                  {userProfile.displayName}
                </h2>
                <span className="text-xs font-mono text-slate-500">
                  ({userProfile.email})
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                Departemen:{' '}
                <strong className="text-slate-800">{userProfile.division}</strong> ·
                Mengikuti pelatihan:{' '}
                <strong className="text-blue-700">
                  {activeAccountSummary.trackName}
                </strong>
              </p>
            </div>

            <div className="lg:w-80 space-y-2 shrink-0">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Progres Paket Berjalan
                </span>
                <span className="font-mono text-lg font-bold text-blue-700 tabular-nums">
                  {activeAccountSummary.progressPct}% berjalan
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    activeAccountSummary.progressPct === 100
                      ? 'bg-emerald-600'
                      : 'bg-blue-700'
                  }`}
                  style={{ width: `${activeAccountSummary.progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 tabular-nums">
                <span>
                  {activeAccountSummary.modulesPassed}/
                  {activeAccountSummary.modulesTotal} modul lulus
                </span>
                <span>Video rata-rata {activeAccountSummary.avgVideoPct}%</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hero Banner */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-medium text-blue-700 tracking-wide">
                Learning Path Berjenjang · Pre-Test, Video Learning &amp; Post-Test
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance leading-[1.15]">
                Paket Modul Terstruktur untuk OJT, Junior, Middle hingga Senior
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                Alur level belajar ditentukan oleh Admin L&amp;D perusahaan. Di dalam setiap
                level—mulai dari OJT hingga Senior—peserta menempuh rangkaian modul terstruktur
                berisi Pre-Test, Video Learning, dan Post-Test sesuai urutan yang ditetapkan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onOpenCourse(heroTargetCourseId)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <span>
                  Lanjutkan Modul Aktif
                  {nextSequentialCourse ? ` (${nextSequentialCourse.code})` : ''}
                </span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Admin-Configured Learning Path Rules Summary */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div className="text-xs font-semibold text-slate-700">
              Kebijakan Alur Belajar Aktif (Diatur Admin)
            </div>
            <div className="space-y-3">
              <div className="pb-3 border-b border-slate-200 space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  1. Penentuan Level:{' '}
                  {levelFlowMode === 'admin_assigned'
                    ? `Ditentukan Admin (Saat ini: ${userAssignedTrack})`
                    : levelFlowMode === 'linear_sequential'
                      ? `Berjenjang Berurutan (${trackSequence.join(' → ')})`
                      : 'Terbuka Semua Level'}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {levelFlowMode === 'admin_assigned'
                    ? `Admin menetapkan jenjang aktif peserta secara langsung di konsol. Akun Anda saat ini ditempatkan di Paket ${userAssignedTrack}.`
                    : levelFlowMode === 'linear_sequential'
                      ? 'Peserta wajib lulus seluruh modul pada paket saat ini sebelum paket level berikutnya terbuka otomatis.'
                      : 'Seluruh paket level dapat diakses terbuka sesuai penugasan pelatihan tim.'}
                </p>
              </div>
              <div className="pb-3 border-b border-slate-200 space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  2. Urutan Modul dalam 1 Level:{' '}
                  {enforceModuleOrder ? 'Wajib Berurutan' : 'Fleksibel'}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {enforceModuleOrder
                    ? 'Modul di dalam satu level (seperti OJT-101 s.d. OJT-106) harus diselesaikan berurutan sesuai urutan Admin.'
                    : 'Peserta bebas memilih urutan modul mana pun yang ingin dipelajari di dalam level yang sudah terbuka.'}
                </p>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  3. Siklus &amp; Standar KKM Tiap Level
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-mono tabular-nums">
                  OJT: 70% · Junior: 75% · Middle: 80% · Senior: 85%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column KPI Summary Strip */}
        <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-slate-500">Paket Jenjang Tuntas</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {completedTracksCount} / {tracks.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Modul Lulus KKM</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {completedCoursesCount} / {courses.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Rata-Rata Pre-Test</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {preScores.length > 0 ? `${avgPre} / 100` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Rata-Rata Post-Test</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">
              {postScores.length > 0 ? `${avgPost} / 100` : '—'}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive D3.js Learning Journey Map */}
      <LearningJourneyMap
        tracks={tracks}
        courses={courses}
        progressStore={progressStore}
        activeCourseId={heroTargetCourseId}
        placementLevel={placementLevel}
        unlockAllPreview={effectiveUnlockPreview}
        levelFlowMode={levelFlowMode}
        enforceModuleOrder={enforceModuleOrder}
        trackSequence={trackSequence}
        userAssignedTrack={userAssignedTrack}
        onOpenCourse={onOpenCourse}
      />

      {/* Interactive 4-Tier Learning Path Map */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Peta Paket Learning Path
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Pilih jenjang paket di bawah ini untuk melihat kompetensi target dan modul di dalamnya.
            </p>
          </div>
          {levelFlowMode === 'admin_assigned' ? (
            <div className="text-xs font-medium text-blue-700">
              Penugasan Admin Aktif: Paket {userAssignedTrack}
            </div>
          ) : (
            placementLevel && (
              <div className="text-xs font-medium text-blue-700">
                Penempatan Aktif: Jalur Fast-Track hingga Paket {placementLevel}
              </div>
            )
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {orderedTracks.map((track, seqIdx) => {
            const summary = getTrackProgressSummary(track.id, progressStore, courses);
            const access = isTrackUnlocked(
              track.id,
              progressStore,
              placementLevel,
              effectiveUnlockPreview,
              courses,
              levelFlowMode,
              userAssignedTrack,
              trackSequence
            );
            const isSelected = selectedTrackId === track.id;

            return (
              <button
                key={track.id}
                type="button"
                onClick={() => setSelectedTrackId(track.id)}
                className={`text-left p-5 rounded-xl border transition-colors flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-white border-blue-700 ring-1 ring-blue-700'
                    : access.unlocked
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-semibold text-blue-700 tabular-nums">
                      LEVEL 0{seqIdx + 1}
                    </span>
                    {summary.completed ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Lulus</span>
                      </span>
                    ) : access.unlocked ? (
                      <span className="inline-flex items-center gap-1 font-medium text-blue-700">
                        <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {access.viaPlacement
                            ? levelFlowMode === 'admin_assigned'
                              ? 'Ditugaskan Admin'
                              : 'Via Penempatan'
                            : 'Terbuka'}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                        <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Terkunci</span>
                      </span>
                    )}
                  </div>

                  <div className="font-display text-lg font-bold text-slate-900">
                    {track.name}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {track.subtitle}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
                    <span>KKM {track.minPassScore}%</span>
                    <span>
                      {summary.passed}/{summary.total} Modul
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        summary.completed ? 'bg-emerald-600' : 'bg-blue-700'
                      }`}
                      style={{ width: `${summary.pct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Track Bundle Detail & Modules */}
      <section className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div className="space-y-1">
              <div className="text-xs text-slate-500 flex items-center flex-wrap gap-2">
                <span className="font-mono font-semibold text-blue-700">
                  PAKET 0{selectedTrackSeqNumber}
                </span>
                <span aria-hidden="true">·</span>
                <span>{selectedTrack.estimatedDuration}</span>
                <span aria-hidden="true">·</span>
                <span>Standar KKM {selectedTrack.minPassScore}%</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-900">
                {selectedTrack.name} — {selectedTrack.subtitle}
              </h3>
              <p className="text-sm text-slate-600">
                Sasaran: {selectedTrack.targetAudience}
              </p>
            </div>

            {!selectedTrackAccess.unlocked && nextSequentialCourse && (
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedTrackId(nextSequentialCourse.trackLevel)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  <span>
                    Buka Paket Aktif ({nextSequentialCourse.trackLevel})
                  </span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {selectedTrack.keyCompetencies.map((comp, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5"
              >
                <span className="font-mono font-semibold text-blue-700 tabular-nums">
                  0{idx + 1}.
                </span>
                <span className="text-slate-700 leading-relaxed">{comp}</span>
              </div>
            ))}
          </div>

          {selectedTrack.softskills && selectedTrack.softskills.length > 0 && (
            <div className="pt-5 border-t border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-display text-sm font-bold text-slate-900">
                  Softskill Untuk {selectedTrack.id} Level
                </h4>
                <span className="text-xs text-slate-500">
                  Tercakup dalam Modul JR-103 (Pre-Test, Video 5 Bab &amp; Post-Test)
                </span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {selectedTrack.softskills.map((skill, idx) => (
                  <li
                    key={idx}
                    className="py-2.5 px-3 bg-slate-50 rounded-lg flex items-start gap-2"
                  >
                    <span className="font-mono font-semibold text-blue-700 tabular-nums shrink-0">
                      0{idx + 1}.
                    </span>
                    <span className="text-slate-800 font-medium leading-snug">
                      {skill}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!selectedTrackAccess.unlocked && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
              <span>{selectedTrackAccess.reason}</span>
            </div>
          )}
        </div>

        {/* Courses inside selected track */}
        <div
          className={
            trackCourses.length > 0 && trackCourses.length % 3 === 0
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'grid grid-cols-1 md:grid-cols-2 gap-6'
          }
        >
          {trackCourses.map((course) => {
            const p = progressStore[course.id];
            const moduleAccess = isCourseUnlockedInTrack(
              course,
              progressStore,
              courses,
              enforceModuleOrder,
              effectiveUnlockPreview
            );
            const isModuleButtonLocked =
              !selectedTrackAccess.unlocked || !moduleAccess.unlocked;
            const status = getCourseStatus(
              course,
              selectedTrackAccess.unlocked,
              moduleAccess.unlocked,
              moduleAccess.prerequisiteCourse?.code
            );
            const StatusIcon = status.icon;
            const preScore = p?.preTestResult?.score ?? null;
            const postScore = p ? getBestPostScore(p) : null;
            const watchPct = p ? getWatchPercentage(p, course) : 0;
            const delta =
              preScore !== null && postScore !== null ? postScore - preScore : null;
            const nGain =
              preScore !== null && postScore !== null
                ? computeNGain(preScore, postScore)
                : null;

            return (
              <article
                key={course.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-colors hover:border-slate-300"
              >
                <div>
                  <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                    {!imgErrors[course.id] ? (
                      <img
                        src={course.coverImage}
                        alt={`Ilustrasi kursus ${course.title}`}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setImgErrors((prev) => ({ ...prev, [course.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center p-4 text-center">
                        <BookOpen className="w-8 h-8 text-slate-400 mb-2" aria-hidden="true" />
                        <span className="text-xs font-medium text-slate-600">
                          {course.title}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-blue-700">
                        Modul {course.moduleOrderInTrack}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-700">{course.code}</span>
                      <span aria-hidden="true">·</span>
                      <span>{course.syllabusDurationLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>KKM {course.passingScore}%</span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-display text-lg font-bold text-slate-900 leading-snug">
                        {course.title}
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="text-slate-500">Pre-Test</div>
                        <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                          {preScore !== null ? `${preScore}/100` : 'Belum'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Video</div>
                        <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                          {watchPct}%
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Post-Test</div>
                        <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                          {postScore !== null
                            ? `${postScore}/100`
                            : isModuleButtonLocked
                              ? 'Terkunci'
                              : 'Belum'}
                        </div>
                      </div>
                    </div>

                    {delta !== null && nGain !== null && (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium pt-1">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="tabular-nums">
                          Peningkatan {delta >= 0 ? `+${delta}` : delta} poin · N-Gain {nGain.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-6 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`inline-flex items-center gap-1.5 font-medium ${status.toneClass}`}>
                      <StatusIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{status.label}</span>
                    </span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      {status.stepPct}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        status.stepPct === 100 ? 'bg-emerald-600' : 'bg-blue-700'
                      }`}
                      style={{ width: `${status.stepPct}%` }}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isModuleButtonLocked}
                    onClick={() => onOpenCourse(course.id)}
                    className={`w-full py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 whitespace-nowrap ${
                      isModuleButtonLocked
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'text-slate-900 bg-slate-100 hover:bg-blue-700 hover:text-white'
                    }`}
                  >
                    {isModuleButtonLocked ? (
                      <>
                        <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{status.cta}</span>
                      </>
                    ) : (
                      <>
                        <span>{status.cta}</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
