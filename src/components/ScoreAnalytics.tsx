import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2, Clock, Download, Lock } from 'lucide-react';
import {
  Course,
  LearningTrack,
  LMSProgressStore,
  TrackLevel,
  UserProfile,
} from '../types/lms';
import {
  computeNGain,
  getAccountPackageSummary,
  getBestPostScore,
  getTrackProgressSummary,
  getWatchPercentage,
} from '../data/courses';

interface ScoreAnalyticsProps {
  tracks: LearningTrack[];
  courses: Course[];
  progressStore: LMSProgressStore;
  userProfile?: UserProfile;
  userAssignedTrack?: TrackLevel;
  onOpenCourse: (courseId: string) => void;
}

export const ScoreAnalytics: React.FC<ScoreAnalyticsProps> = ({
  tracks,
  courses,
  progressStore,
  userProfile,
  userAssignedTrack = 'OJT',
  onOpenCourse,
}) => {
  const [trackFilter, setTrackFilter] = useState<'Semua' | TrackLevel>('Semua');

  const visibleCourses =
    trackFilter === 'Semua'
      ? courses
      : courses.filter((c) => c.trackLevel === trackFilter);

  const rows = visibleCourses.map((course) => {
    const p = progressStore[course.id];
    const preScore = p?.preTestResult?.score ?? null;
    const watchPct = p ? getWatchPercentage(p, course) : 0;
    const postScore = p ? getBestPostScore(p) : null;
    const delta =
      preScore !== null && postScore !== null ? postScore - preScore : null;
    const nGain =
      preScore !== null && postScore !== null
        ? computeNGain(preScore, postScore)
        : null;
    const isPassed = postScore !== null && postScore >= course.passingScore;

    return {
      course,
      preScore,
      watchPct,
      postScore,
      delta,
      nGain,
      isPassed,
      notesCount: p?.notes.length ?? 0,
    };
  });

  const handleDownloadCSV = () => {
    const headers = [
      'Jenjang',
      'Kode',
      'Judul Kursus',
      'Pre-Test',
      'Progress Video (%)',
      'Post-Test Terbaik',
      'Selisih (+Delta)',
      'N-Gain',
      'Status',
    ];
    const csvRows = rows.map((r) => [
      r.course.trackLevel,
      r.course.code,
      `"${r.course.title}"`,
      r.preScore ?? '',
      r.watchPct,
      r.postScore ?? '',
      r.delta ?? '',
      r.nGain !== null ? r.nGain.toFixed(2) : '',
      r.isPassed ? 'Lulus' : r.preScore !== null ? 'Berjalan' : 'Belum Dimulai',
    ]);
    const csvContent =
      [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'laporan-analitik-lms-jenjang.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const chartWidth = Math.max(680, rows.length * 145 + 90);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Analitik Skor &amp; Progres Jenjang
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Evaluasi efektivitas pembelajaran di setiap paket karier (OJT, Junior, Middle, Senior).
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadCSV}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          <span>Unduh Laporan CSV</span>
        </button>
      </div>

      {/* Per-Account Summary Header */}
      {userProfile && (() => {
        const accountSummary = getAccountPackageSummary(
          userAssignedTrack,
          progressStore,
          courses
        );
        return (
          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-blue-700">
                Summary Akun Peserta
              </div>
              <div className="text-base sm:text-lg font-display font-bold text-slate-900">
                {userProfile.displayName}{' '}
                <span className="text-xs font-mono font-normal text-slate-500">
                  ({userProfile.email})
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                Pelatihan diikuti:{' '}
                <strong className="text-slate-900">{accountSummary.trackName}</strong> ·{' '}
                {accountSummary.modulesPassed}/{accountSummary.modulesTotal} modul lulus
              </p>
            </div>
            <div className="lg:w-72 space-y-1.5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-600 font-medium">Telah Berjalan</span>
                <span className="font-mono text-base font-bold text-blue-700 tabular-nums">
                  {accountSummary.progressPct}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    accountSummary.progressPct === 100
                      ? 'bg-emerald-600'
                      : 'bg-blue-700'
                  }`}
                  style={{ width: `${accountSummary.progressPct}%` }}
                />
              </div>
            </div>
          </section>
        );
      })()}

      {/* 4-Track Progression Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tracks.map((track) => {
          const summary = getTrackProgressSummary(track.id, progressStore, courses);
          return (
            <div
              key={track.id}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">{track.name}</span>
                <span className="font-mono text-slate-500 tabular-nums">
                  KKM {track.minPassScore}%
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                  {summary.passed} / {summary.total}
                </span>
                <span className="text-xs text-slate-500">modul lulus</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    summary.completed ? 'bg-emerald-600' : 'bg-blue-700'
                  }`}
                  style={{ width: `${summary.pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* Filter Bar + Chart */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Komparasi Skor Pre-Test vs Post-Test
            </h2>
            <p className="text-xs text-slate-500">
              Saring berdasarkan jenjang paket untuk melihat detail per modul.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter Jenjang Paket"
            className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg overflow-x-auto"
          >
            {(['Semua', 'OJT', 'Junior', 'Middle', 'Senior'] as const).map(
              (lvl) => {
                const active = trackFilter === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTrackFilter(lvl)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div className="flex items-center gap-5 text-xs text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-slate-300 inline-block" />
            <span>Pre-Test (Awal)</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-blue-700 inline-block" />
            <span>Post-Test (Akhir)</span>
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} 260`}
            className="w-full min-w-[580px] h-auto"
            role="img"
            aria-label="Grafik batang perbandingan skor Pre-Test dan Post-Test"
          >
            {[0, 25, 50, 75, 100].map((tick) => {
              const y = 210 - (tick / 100) * 170;
              return (
                <g key={tick}>
                  <line
                    x1={48}
                    y1={y}
                    x2={chartWidth - 20}
                    y2={y}
                    stroke={tick === 75 ? '#059669' : '#E2E8F0'}
                    strokeWidth={tick === 75 ? 1.25 : 1}
                    strokeDasharray={tick === 75 ? '5 4' : undefined}
                  />
                  <text
                    x={38}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fontFamily="IBM Plex Mono, monospace"
                    fill={tick === 75 ? '#059669' : '#64748B'}
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {rows.map((r, idx) => {
              const groupCenterX = 115 + idx * 140;
              const barW = 28;
              const preH = r.preScore !== null ? (r.preScore / 100) * 170 : 0;
              const postH = r.postScore !== null ? (r.postScore / 100) * 170 : 0;

              return (
                <g key={r.course.id}>
                  <rect
                    x={groupCenterX - barW - 4}
                    y={210 - preH}
                    width={barW}
                    height={Math.max(2, preH)}
                    rx={4}
                    fill={r.preScore !== null ? '#CBD5E1' : '#F1F5F9'}
                  />
                  <text
                    x={groupCenterX - barW / 2 - 4}
                    y={202 - preH}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="IBM Plex Mono, monospace"
                    fill="#475569"
                  >
                    {r.preScore !== null ? r.preScore : '—'}
                  </text>

                  <rect
                    x={groupCenterX + 4}
                    y={210 - postH}
                    width={barW}
                    height={Math.max(2, postH)}
                    rx={4}
                    fill={r.postScore !== null ? '#1D4ED8' : '#F1F5F9'}
                  />
                  <text
                    x={groupCenterX + barW / 2 + 4}
                    y={202 - postH}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="IBM Plex Mono, monospace"
                    fill={r.postScore !== null ? '#1E3A8A' : '#94A3B8'}
                  >
                    {r.postScore !== null ? r.postScore : '—'}
                  </text>

                  <text
                    x={groupCenterX}
                    y={234}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="IBM Plex Mono, monospace"
                    fill="#0F172A"
                  >
                    {r.course.code}
                  </text>
                  <text
                    x={groupCenterX}
                    y={250}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="DM Sans, sans-serif"
                    fill="#64748B"
                  >
                    {r.course.trackLevel} · KKM {r.course.passingScore}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* High-Density Data Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900">
            Matriks Capaian Modul ({trackFilter})
          </h2>
          <span className="text-xs text-slate-500 tabular-nums">
            {rows.length} modul ditampilkan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-6">Modul Kursus</th>
                <th className="py-3 px-4">Jenjang</th>
                <th className="py-3 px-4 text-right">Pre-Test</th>
                <th className="py-3 px-4 text-right">Video</th>
                <th className="py-3 px-4 text-right">Post-Test</th>
                <th className="py-3 px-4 text-right">Selisih</th>
                <th className="py-3 px-4 text-right">N-Gain</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {rows.map((r) => (
                <tr
                  key={r.course.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-slate-900">
                      {r.course.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span className="font-mono">{r.course.code}</span>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span>KKM {r.course.passingScore}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {r.course.trackLevel}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    {r.preScore !== null ? r.preScore : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    {r.watchPct}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {r.postScore !== null ? r.postScore : '—'}
                  </td>
                  <td
                    className={`py-3.5 px-4 text-right font-mono tabular-nums font-semibold ${
                      r.delta === null
                        ? 'text-slate-400'
                        : r.delta >= 0
                          ? 'text-emerald-700'
                          : 'text-red-700'
                    }`}
                  >
                    {r.delta !== null
                      ? r.delta >= 0
                        ? `+${r.delta}`
                        : r.delta
                      : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-blue-700">
                    {r.nGain !== null ? r.nGain.toFixed(2) : '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    {r.isPassed ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Lulus</span>
                      </span>
                    ) : r.preScore !== null ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Berjalan</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 whitespace-nowrap">
                        <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Belum Mulai</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenCourse(r.course.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
                    >
                      <span>Buka</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
