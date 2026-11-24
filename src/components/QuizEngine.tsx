import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Flag,
  PlayCircle,
  RotateCcw,
} from 'lucide-react';
import { AttemptResult, CompetencyArea, Course, QuizQuestion } from '../types/lms';
import { computeNGain, formatTime } from '../data/courses';

interface QuizEngineProps {
  mode: 'pretest' | 'posttest';
  course: Course;
  existingResult: AttemptResult | null;
  preTestBaseline: AttemptResult | null;
  onSubmitAttempt: (result: AttemptResult) => void;
  onProceedToVideo: (jumpToChapterIndex?: number) => void;
  onOpenCertificate?: () => void;
}

const COMPETENCY_ORDER: CompetencyArea[] = [
  'Konsep Dasar',
  'Penerapan Kasus',
  'Optimasi & Evaluasi',
];

export const QuizEngine: React.FC<QuizEngineProps> = ({
  mode,
  course,
  existingResult,
  preTestBaseline,
  onSubmitAttempt,
  onProceedToVideo,
  onOpenCertificate,
}) => {
  const questions: QuizQuestion[] = mode === 'pretest' ? course.preTest : course.postTest;

  const [isRetaking, setIsRetaking] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flaggedIds, setFlaggedIds] = useState<Record<string, boolean>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const showResultView = existingResult !== null && !isRetaking;

  useEffect(() => {
    setIsRetaking(false);
    setCurrentIdx(0);
    setAnswers({});
    setFlaggedIds({});
    setElapsedSeconds(0);
  }, [course.id, mode]);

  useEffect(() => {
    if (showResultView) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [showResultView]);

  const currentQuestion = questions[currentIdx];
  const answeredCount = questions.filter((q) => typeof answers[q.id] === 'number').length;
  const allAnswered = answeredCount === questions.length;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedIds((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmit = () => {
    if (!allAnswered) return;

    const breakdown: Record<CompetencyArea, { correct: number; total: number }> = {
      'Konsep Dasar': { correct: 0, total: 0 },
      'Penerapan Kasus': { correct: 0, total: 0 },
      'Optimasi & Evaluasi': { correct: 0, total: 0 },
    };

    let correctCount = 0;
    questions.forEach((q) => {
      breakdown[q.competency].total += 1;
      if (answers[q.id] === q.correctIndex) {
        correctCount += 1;
        breakdown[q.competency].correct += 1;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const result: AttemptResult = {
      score,
      correctCount,
      totalQuestions: questions.length,
      answers,
      elapsedSeconds,
      completedAt: new Date().toISOString(),
      competencyBreakdown: breakdown,
    };

    setIsRetaking(false);
    onSubmitAttempt(result);
  };

  const handleStartRetake = () => {
    setAnswers({});
    setFlaggedIds({});
    setCurrentIdx(0);
    setElapsedSeconds(0);
    setIsRetaking(true);
  };

  if (showResultView && existingResult) {
    const isPassed =
      mode === 'pretest' ? true : existingResult.score >= course.passingScore;
    const preScore = preTestBaseline?.score ?? null;
    const scoreDelta =
      mode === 'posttest' && preScore !== null
        ? existingResult.score - preScore
        : null;
    const nGain =
      mode === 'posttest' && preScore !== null
        ? computeNGain(preScore, existingResult.score)
        : null;

    const weakestCompetency = COMPETENCY_ORDER.map((area) => {
      const stat = existingResult.competencyBreakdown[area];
      const pct = stat.total > 0 ? stat.correct / stat.total : 1;
      return { area, pct };
    }).sort((a, b) => a.pct - b.pct)[0];

    const recommendedChapterIdx =
      questions.find((q) => q.competency === weakestCompetency.area)
        ?.relatedChapterIndex ?? 0;

    return (
      <div className="space-y-8">
        {/* Result Summary Panel */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold">
                {mode === 'pretest' ? (
                  <span className="inline-flex items-center gap-1.5 text-blue-700">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>Pre-Test Diagnostik Selesai</span>
                  </span>
                ) : isPassed ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>Lulus Evaluasi · Memenuhi KKM {course.passingScore}%</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-red-700">
                    <AlertCircle className="w-4 h-4" aria-hidden="true" />
                    <span>Perlu Penguatan · Skor di bawah KKM {course.passingScore}%</span>
                  </span>
                )}
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                {mode === 'pretest'
                  ? 'Peta Kemampuan Awal Anda'
                  : isPassed
                    ? 'Selamat, Kompetensi Modul Tercapai'
                    : 'Ulas Kembali Materi Video Sebelum Mengulang'}
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl">
                {mode === 'pretest'
                  ? `Pre-Test tidak menentukan kelulusan. Gunakan hasil ini untuk fokus pada bab video yang masih lemah (disarankan: ${course.chapters[recommendedChapterIdx]?.title}).`
                  : isPassed
                    ? existingResult.score > 80
                      ? 'Anda telah menuntaskan siklus Pre-Test, Video Learning, dan Post-Test dengan skor di atas 80%. Sertifikat kelulusan siap diunduh.'
                      : `Anda memenuhi KKM ${course.passingScore}%, namun sertifikat kelulusan hanya tersedia jika skor Post-Test di atas 80% (> 80%). Anda dapat mengulang Post-Test untuk membuka sertifikat.`
                    : `Pelajari kembali ${course.chapters[recommendedChapterIdx]?.title}, lalu kerjakan ulang Post-Test hingga mencapai KKM ${course.passingScore}%.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {mode === 'pretest' ? (
                <button
                  type="button"
                  onClick={() => onProceedToVideo(recommendedChapterIdx)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  <PlayCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Lanjut ke Video Learning</span>
                </button>
              ) : (
                <>
                  {isPassed && existingResult.score > 80 && onOpenCertificate && (
                    <button
                      type="button"
                      onClick={onOpenCertificate}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Award className="w-4 h-4" aria-hidden="true" />
                      <span>Lihat Sertifikat Kelulusan</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleStartRetake}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    <span>Kerjakan Ulang Post-Test</span>
                  </button>
                  {!isPassed && (
                    <button
                      type="button"
                      onClick={() => onProceedToVideo(recommendedChapterIdx)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <PlayCircle className="w-4 h-4" aria-hidden="true" />
                      <span>Tonton Ulang Bab Terkait</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Numeric Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-slate-500">
                {mode === 'pretest' ? 'Skor Pre-Test' : 'Skor Post-Test'}
              </div>
              <div className="mt-1 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
                {existingResult.score}
                <span className="text-base text-slate-400 font-normal"> / 100</span>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Jawaban Benar</div>
              <div className="mt-1 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
                {existingResult.correctCount}
                <span className="text-base text-slate-400 font-normal">
                  {' '}
                  / {existingResult.totalQuestions}
                </span>
              </div>
            </div>

            {mode === 'posttest' && preScore !== null && scoreDelta !== null ? (
              <div>
                <div className="text-xs text-slate-500">Kenaikan vs Pre-Test</div>
                <div
                  className={`mt-1 font-mono text-3xl font-semibold tabular-nums ${
                    scoreDelta >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta}
                  <span className="text-sm font-normal text-slate-500 ml-1">poin</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs text-slate-500">Durasi Pengerjaan</div>
                <div className="mt-1 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
                  {formatTime(existingResult.elapsedSeconds)}
                </div>
              </div>
            )}

            {mode === 'posttest' && nGain !== null ? (
              <div>
                <div className="text-xs text-slate-500">Normalized Gain (N-Gain)</div>
                <div className="mt-1 font-mono text-3xl font-semibold text-blue-700 tabular-nums">
                  {nGain.toFixed(2)}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs text-slate-500">Fokus Disarankan</div>
                <div className="mt-1.5 text-sm font-semibold text-slate-900">
                  {weakestCompetency.area}
                </div>
              </div>
            )}
          </div>

          {/* Competency Breakdown */}
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Rincian Penguasaan per Kompetensi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {COMPETENCY_ORDER.map((area) => {
                const stat = existingResult.competencyBreakdown[area];
                const pct =
                  stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                const preStat = preTestBaseline?.competencyBreakdown[area];
                const prePct =
                  preStat && preStat.total > 0
                    ? Math.round((preStat.correct / preStat.total) * 100)
                    : null;

                return (
                  <div
                    key={area}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{area}</span>
                      <span className="font-mono text-slate-600 tabular-nums">
                        {stat.correct}/{stat.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          pct >= 75
                            ? 'bg-emerald-600'
                            : pct >= 50
                              ? 'bg-blue-700'
                              : 'bg-amber-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {mode === 'posttest' && prePct !== null && (
                      <div className="text-xs text-slate-500 font-mono tabular-nums">
                        Pre-Test: {prePct}% → Post-Test: {pct}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Active Quiz Taking View
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Question Stage */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="space-y-0.5">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="font-semibold text-blue-700">
                {mode === 'pretest' ? 'Tahap 1: Pre-Test Diagnostik' : 'Tahap 3: Post-Test Evaluasi'}
              </span>
              <span aria-hidden="true">·</span>
              <span>Kompetensi: {currentQuestion.competency}</span>
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900 tabular-nums">
              Pertanyaan {currentIdx + 1} dari {questions.length}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => handleToggleFlag(currentQuestion.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              flaggedIds[currentQuestion.id]
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{flaggedIds[currentQuestion.id] ? 'Ditandai Ragu' : 'Tandai Ragu-ragu'}</span>
          </button>
        </div>

        <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed max-w-[70ch]">
          {currentQuestion.prompt}
        </p>

        <div role="radiogroup" aria-label="Pilihan Jawaban" className="space-y-3">
          {currentQuestion.options.map((option, optIdx) => {
            const isSelected = answers[currentQuestion.id] === optIdx;
            const letter = String.fromCharCode(65 + optIdx);
            return (
              <button
                key={optIdx}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                className={`w-full min-h-[48px] text-left px-4 py-3.5 rounded-lg border transition-colors duration-150 flex items-start gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600 text-slate-900'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <span
                  className={`font-mono text-xs font-semibold w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {letter}
                </span>
                <span className="text-sm sm:text-base leading-relaxed">{option}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-colors whitespace-nowrap"
          >
            Sebelumnya
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>Berikutnya</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!allAnswered}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-500 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>
                {mode === 'pretest' ? 'Selesaikan Pre-Test' : 'Kumpulkan Post-Test'}
              </span>
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Right Quiz Navigator & Metadata Deck */}
      <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500">Durasi Sesi</div>
            <div className="font-mono text-xl font-semibold text-slate-900 tabular-nums mt-0.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Target Kelulusan</div>
            <div className="font-mono text-sm font-semibold text-slate-900 mt-1 tabular-nums">
              {mode === 'pretest' ? 'Diagnostik' : `KKM ${course.passingScore}%`}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">Navigasi Nomor Soal</span>
            <span className="font-mono text-slate-500 tabular-nums">
              {answeredCount}/{questions.length} Terisi
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIdx;
              const isAnswered = typeof answers[q.id] === 'number';
              const isFlagged = !!flaggedIds[q.id];

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  aria-label={`Soal ${idx + 1}`}
                  className={`h-11 rounded-lg font-mono text-sm font-semibold tabular-nums border transition-colors ${
                    isCurrent
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : isFlagged
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : isAnswered
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-600">
          <p className="leading-relaxed">
            {mode === 'pretest'
              ? 'Jawab sesuai pemahaman Anda saat ini. Skor Pre-Test digunakan untuk mengukur baseline sebelum Anda menonton video.'
              : `Jawab seluruh soal dengan cermat. Nilai minimal kelulusan adalah ${course.passingScore} dari 100.`}
          </p>
          {!allAnswered && (
            <p className="text-amber-700 font-medium">
              Lengkapi seluruh {questions.length} soal untuk mengaktifkan tombol kumpulkan.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
};
