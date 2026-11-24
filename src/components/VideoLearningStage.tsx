import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  StickyNote,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AttemptResult,
  Course,
  CourseProgress,
  StudentNote,
} from '../types/lms';
import { formatTime, getWatchPercentage } from '../data/courses';

interface VideoLearningStageProps {
  course: Course;
  progress: CourseProgress;
  preTestResult: AttemptResult | null;
  initialChapterIndex?: number | null;
  unlockAllPreview: boolean;
  onRecordWatchedSecond: (second: number, currentPos: number) => void;
  onPassCheckpoint: () => void;
  onAddNote: (note: StudentNote) => void;
  onDeleteNote: (noteId: string) => void;
  onProceedToPostTest: () => void;
}

type SideTab = 'chapters' | 'transcript' | 'notes';

export const VideoLearningStage: React.FC<VideoLearningStageProps> = ({
  course,
  progress,
  preTestResult,
  initialChapterIndex,
  unlockAllPreview,
  onRecordWatchedSecond,
  onPassCheckpoint: _onPassCheckpoint,
  onAddNote,
  onDeleteNote,
  onProceedToPostTest,
}) => {
  void _onPassCheckpoint;
  const [currentTime, setCurrentTime] = useState<number>(() => {
    if (
      typeof initialChapterIndex === 'number' &&
      course.chapters[initialChapterIndex]
    ) {
      return course.chapters[initialChapterIndex].startSec;
    }
    return Math.min(progress.lastPositionSec || 0, course.videoDurationSec - 1);
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [sideTab, setSideTab] = useState<SideTab>('chapters');
  const [noteInput, setNoteInput] = useState('');
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isExpandedFallback, setIsExpandedFallback] = useState(false);
  const [mp4DurationSec, setMp4DurationSec] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [mp4LoadError, setMp4LoadError] = useState<string | null>(null);

  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mp4VideoRef = useRef<HTMLVideoElement | null>(null);
  const lastRecordedSecRef = useRef<number>(-1);

  const hasMp4Video = Boolean(course.videoUrl && course.videoUrl.trim());
  const effectiveDurationSec =
    hasMp4Video && mp4DurationSec && mp4DurationSec > 0
      ? Math.max(1, Math.round(mp4DurationSec))
      : course.videoDurationSec;

  const isFullscreen = isNativeFullscreen || isExpandedFallback;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsNativeFullscreen(
        document.fullscreenElement === playerContainerRef.current
      );
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpandedFallback) {
        setIsExpandedFallback(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpandedFallback]);

  const handleToggleFullscreen = async () => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (document.fullscreenElement === container) {
      try {
        await document.exitFullscreen();
      } catch {
        setIsNativeFullscreen(false);
      }
      return;
    }

    if (isExpandedFallback) {
      setIsExpandedFallback(false);
      return;
    }

    if (typeof container.requestFullscreen === 'function') {
      try {
        await container.requestFullscreen();
        return;
      } catch {
        // Fallback when iframe blocks native Fullscreen API
      }
    }
    setIsExpandedFallback(true);
  };

  const watchPct = getWatchPercentage(progress, course);
  void unlockAllPreview;

  const maxWatchedSecond = useMemo(() => {
    if (progress.watchedSeconds.length === 0) return 0;
    return Math.max(...progress.watchedSeconds);
  }, [progress.watchedSeconds]);

  // Jump to chapter when requested from Pre/Post test review
  useEffect(() => {
    if (
      typeof initialChapterIndex === 'number' &&
      course.chapters[initialChapterIndex]
    ) {
      setCurrentTime(course.chapters[initialChapterIndex].startSec);
    }
  }, [initialChapterIndex, course.chapters]);

  // Reset local playback states on course change
  useEffect(() => {
    setIsPlaying(false);
    setMp4DurationSec(null);
    setMp4LoadError(null);
    lastRecordedSecRef.current = -1;
    setCurrentTime(
      Math.min(progress.lastPositionSec || 0, Math.max(1, course.videoDurationSec - 1))
    );
  }, [course.id]);

  // Keep HTML5 <video> playback rate & mute synced when MP4 mode is active
  useEffect(() => {
    const el = mp4VideoRef.current;
    if (!el || !hasMp4Video) return;
    el.playbackRate = playbackRate;
    el.muted = isMuted;
  }, [hasMp4Video, playbackRate, isMuted]);

  const currentChapterIdx = useMemo(() => {
    const idx = course.chapters.findIndex(
      (ch) => currentTime >= ch.startSec && currentTime < ch.endSec
    );
    return idx >= 0 ? idx : course.chapters.length - 1;
  }, [course.chapters, currentTime]);

  const currentChapter = course.chapters[currentChapterIdx];

  const activeCaption = useMemo(() => {
    return (
      currentChapter.captions.find(
        (cap) => currentTime >= cap.startSec && currentTime < cap.endSec
      )?.text ?? currentChapter.summary
    );
  }, [currentChapter, currentTime]);

  // Weak competencies from Pre-Test to guide chapter priority
  const weakCompetencies = useMemo(() => {
    if (!preTestResult) return new Set<string>();
    const set = new Set<string>();
    (
      Object.keys(preTestResult.competencyBreakdown) as Array<
        keyof typeof preTestResult.competencyBreakdown
      >
    ).forEach((area) => {
      const stat = preTestResult.competencyBreakdown[area];
      if (stat.total > 0 && stat.correct / stat.total < 0.75) {
        set.add(area);
      }
    });
    return set;
  }, [preTestResult]);

  // Canvas simulation playback loop (only used when module has no MP4 videoUrl)
  useEffect(() => {
    if (hasMp4Video || !isPlaying) return;

    let lastFrame = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const dt = (now - lastFrame) / 1000;
      lastFrame = now;

      setCurrentTime((prev) => {
        const next = Math.min(effectiveDurationSec, prev + dt * playbackRate);
        const wholeSec = Math.floor(next);
        if (
          wholeSec < effectiveDurationSec &&
          wholeSec !== lastRecordedSecRef.current
        ) {
          lastRecordedSecRef.current = wholeSec;
          onRecordWatchedSecond(wholeSec, next);
        }

        if (next >= effectiveDurationSec) {
          setIsPlaying(false);
          return effectiveDurationSec;
        }
        return next;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    hasMp4Video,
    isPlaying,
    playbackRate,
    effectiveDurationSec,
    onRecordWatchedSecond,
  ]);

  // Animated educational lesson diagram renderer on Canvas (fallback when no MP4 video)
  useEffect(() => {
    if (hasMp4Video) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clean dark slate studio canvas background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    // Subtle architectural coordinate grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const chDuration = Math.max(1, currentChapter.endSec - currentChapter.startSec);
    const localProgress = Math.max(
      0,
      Math.min(1, (currentTime - currentChapter.startSec) / chDuration)
    );
    const nodes = currentChapter.diagramNodes;
    const activeNodeIndex = Math.min(
      nodes.length - 1,
      Math.floor(localProgress * nodes.length)
    );

    // Header label inside stage
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 13px "IBM Plex Mono", monospace';
    ctx.fillText(
      `${course.code} · BAB 0${currentChapterIdx + 1} / 0${course.chapters.length}`,
      48,
      54
    );

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(currentChapter.title, 48, 92);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '400 15px "DM Sans", sans-serif';
    ctx.fillText(currentChapter.summary, 48, 122);

    // Draw interactive domain diagram based on diagramType
    const stageTop = 176;
    const stageHeight = 220;

    if (
      currentChapter.diagramType === 'pipeline' ||
      currentChapter.diagramType === 'cycle'
    ) {
      const gap = 24;
      const boxW = (width - 96 - gap * (nodes.length - 1)) / nodes.length;
      const boxH = 104;
      const boxY = stageTop + 44;

      nodes.forEach((label, idx) => {
        const boxX = 48 + idx * (boxW + gap);
        const isActive = idx === activeNodeIndex;
        const isDone = idx < activeNodeIndex;

        // Connector arrow
        if (idx < nodes.length - 1) {
          const arrowStartX = boxX + boxW + 2;
          const arrowEndX = boxX + boxW + gap - 2;
          const arrowY = boxY + boxH / 2;
          ctx.strokeStyle = isDone ? '#38BDF8' : '#334155';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(arrowStartX, arrowY);
          ctx.lineTo(arrowEndX, arrowY);
          ctx.stroke();

          // Signal pulse dot along connector when active
          if (isActive && isPlaying) {
            const pulseT = (localProgress * nodes.length) % 1;
            const px = arrowStartX + (arrowEndX - arrowStartX) * pulseT;
            ctx.fillStyle = '#38BDF8';
            ctx.beginPath();
            ctx.arc(px, arrowY, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Node Box
        ctx.fillStyle = isActive
          ? '#1E3A8A'
          : isDone
            ? '#0F2942'
            : '#1E293B';
        ctx.strokeStyle = isActive
          ? '#38BDF8'
          : isDone
            ? '#0284C7'
            : '#334155';
        ctx.lineWidth = isActive ? 2 : 1;

        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isActive ? '#38BDF8' : '#94A3B8';
        ctx.font = '600 12px "IBM Plex Mono", monospace';
        ctx.fillText(`0${idx + 1}`, boxX + 16, boxY + 28);

        ctx.fillStyle = '#F8FAFC';
        ctx.font = '600 15px "DM Sans", sans-serif';
        const words = label.split(' ');
        let line = '';
        let lineY = boxY + 56;
        words.forEach((word) => {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > boxW - 32) {
            ctx.fillText(line, boxX + 16, lineY);
            line = word;
            lineY += 20;
          } else {
            line = test;
          }
        });
        if (line) ctx.fillText(line, boxX + 16, lineY);
      });
    } else if (currentChapter.diagramType === 'hierarchy') {
      const rowH = 44;
      const gapY = 12;
      nodes.forEach((label, idx) => {
        const y = stageTop + idx * (rowH + gapY);
        const w = width - 96 - idx * 44;
        const x = 48 + idx * 22;
        const isActive = idx === activeNodeIndex;

        ctx.fillStyle = isActive ? '#1E3A8A' : '#1E293B';
        ctx.strokeStyle = isActive ? '#38BDF8' : '#334155';
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(x, y, w, rowH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isActive ? '#38BDF8' : '#94A3B8';
        ctx.font = '600 12px "IBM Plex Mono", monospace';
        ctx.fillText(`LAPISAN ${idx + 1}`, x + 16, y + 26);

        ctx.fillStyle = '#F8FAFC';
        ctx.font = '600 15px "DM Sans", sans-serif';
        ctx.fillText(label, x + 116, y + 26);
      });
    } else {
      // Bar/Chart visual comparison
      const maxBarW = width - 300;
      nodes.forEach((label, idx) => {
        const y = stageTop + 14 + idx * 60;
        const isActive = idx === activeNodeIndex;
        const targetRatio = 0.85 - idx * 0.22;
        const animatedRatio =
          targetRatio * Math.min(1, localProgress * 1.4 + 0.25);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = '500 14px "DM Sans", sans-serif';
        ctx.fillText(label, 48, y + 20);

        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.roundRect(330, y + 2, maxBarW, 24, 6);
        ctx.fill();

        ctx.fillStyle = isActive ? '#38BDF8' : '#2563EB';
        ctx.beginPath();
        ctx.roundRect(330, y + 2, Math.max(24, maxBarW * animatedRatio), 24, 6);
        ctx.fill();
      });
    }

    // Key takeaway ticker line at bottom of visual stage
    const activeTakeaway =
      currentChapter.keyTakeaways[
        activeNodeIndex % currentChapter.keyTakeaways.length
      ];
    ctx.fillStyle = '#0B1222';
    ctx.beginPath();
    ctx.roundRect(48, stageTop + stageHeight - 10, width - 96, 44, 8);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#38BDF8';
    ctx.font = '600 12px "IBM Plex Mono", monospace';
    ctx.fillText('POIN INTI:', 64, stageTop + stageHeight + 17);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '400 14px "DM Sans", sans-serif';
    ctx.fillText(activeTakeaway, 146, stageTop + stageHeight + 17);
  }, [
    currentTime,
    currentChapter,
    currentChapterIdx,
    course.code,
    course.chapters.length,
    isPlaying,
    hasMp4Video,
  ]);

  const handleSeek = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(Math.max(1, effectiveDurationSec - 1), targetSec));
    if (hasMp4Video && mp4VideoRef.current) {
      mp4VideoRef.current.currentTime = clamped;
    }
    setCurrentTime(clamped);
  };

  const handleTogglePlayPause = () => {
    if (hasMp4Video && mp4VideoRef.current) {
      const el = mp4VideoRef.current;
      if (el.paused) {
        if (el.currentTime >= effectiveDurationSec) {
          el.currentTime = 0;
        }
        void el.play().catch(() => {
          setMp4LoadError('Browser menahan pemutaran otomatis. Klik Putar kembali.');
        });
      } else {
        el.pause();
      }
      return;
    }

    if (currentTime >= effectiveDurationSec) {
      setCurrentTime(0);
    }
    setIsPlaying((p) => !p);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    onAddNote({
      id: `note-${Date.now()}`,
      timestampSec: Math.floor(currentTime),
      chapterTitle: currentChapter.title,
      content: trimmed,
      createdAt: new Date().toISOString(),
    });
    setNoteInput('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main 16:9 Video Stage & Integrity Bar */}
        <div className="lg:col-span-8 space-y-4">
          <div
            ref={playerContainerRef}
            className={
              isExpandedFallback
                ? 'fixed inset-0 z-50 bg-slate-950 flex items-center justify-center overflow-hidden'
                : isNativeFullscreen
                  ? 'relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden'
                  : 'relative aspect-[16/9] bg-slate-950 rounded-xl overflow-hidden border border-slate-800'
            }
          >
            {hasMp4Video ? (
              <video
                ref={mp4VideoRef}
                src={course.videoUrl}
                playsInline
                preload="metadata"
                onClick={handleTogglePlayPause}
                onLoadedMetadata={(e) => {
                  const vid = e.currentTarget;
                  if (Number.isFinite(vid.duration) && vid.duration > 0) {
                    setMp4DurationSec(vid.duration);
                    if (currentTime > 0 && currentTime < vid.duration) {
                      vid.currentTime = currentTime;
                    }
                  }
                  setMp4LoadError(null);
                }}
                onTimeUpdate={(e) => {
                  const sec = e.currentTarget.currentTime;
                  setCurrentTime(sec);
                  const wholeSec = Math.floor(sec);
                  if (
                    wholeSec < effectiveDurationSec &&
                    wholeSec !== lastRecordedSecRef.current
                  ) {
                    lastRecordedSecRef.current = wholeSec;
                    onRecordWatchedSecond(wholeSec, sec);
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onError={() =>
                  setMp4LoadError(
                    'Video MP4 gagal dimuat. Pastikan tautan atau file MP4 masih tersedia dan dapat diputar browser.'
                  )
                }
                className={
                  isFullscreen
                    ? 'w-full h-full max-w-full max-h-full aspect-[16/9] object-contain block cursor-pointer'
                    : 'w-full h-full object-contain block cursor-pointer'
                }
                aria-label={`Video pembelajaran MP4 ${course.title}`}
              />
            ) : (
              <canvas
                ref={canvasRef}
                width={960}
                height={540}
                className={
                  isFullscreen
                    ? 'w-full h-full max-w-full max-h-full aspect-[16/9] object-contain block'
                    : 'w-full h-full block'
                }
                aria-label={`Panggung video interaktif ${currentChapter.title}`}
              />
            )}

            {mp4LoadError && (
              <div
                role="alert"
                className="absolute inset-x-4 top-4 bg-red-950/90 border border-red-700 text-red-100 text-xs px-4 py-2.5 rounded-lg"
              >
                {mp4LoadError}
              </div>
            )}

            {/* Measured contrast scrim for captions and controls */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent pt-10 pb-3 px-4 sm:px-5 space-y-2.5">
              {/* Synchronized Caption */}
              {!hasMp4Video && (
                <div className="text-center">
                  <span className="inline-block bg-black/70 text-slate-100 text-xs sm:text-sm px-3 py-1 rounded">
                    {activeCaption}
                  </span>
                </div>
              )}

              {/* Scrubber Bar */}
              <div className="relative h-3 flex items-center group">
                <div className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-blue-400/50 absolute left-0 top-0"
                    style={{
                      width: `${Math.min(
                        100,
                        ((maxWatchedSecond + 1) / Math.max(1, effectiveDurationSec)) * 100
                      )}%`,
                    }}
                  />
                  <div
                    className="h-full bg-blue-500 relative"
                    style={{
                      width: `${Math.min(
                        100,
                        (currentTime / Math.max(1, effectiveDurationSec)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <input
                  type="range"
                  aria-label="Posisi Waktu Video"
                  min={0}
                  max={Math.max(1, effectiveDurationSec - 1)}
                  step={1}
                  value={Math.min(Math.max(1, effectiveDurationSec - 1), Math.floor(currentTime))}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTogglePlayPause}
                    aria-label={isPlaying ? 'Jeda Video' : 'Putar Video'}
                    className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" aria-hidden="true" />
                    )}
                  </button>

                  {hasMp4Video && (
                    <button
                      type="button"
                      onClick={() => setIsMuted((m) => !m)}
                      aria-label={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Volume2 className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  )}

                  <span className="font-mono text-xs tabular-nums text-slate-200">
                    {formatTime(currentTime)} / {formatTime(effectiveDurationSec)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {[1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setPlaybackRate(rate)}
                      className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                        playbackRate === rate
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-slate-200 hover:bg-white/20'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => void handleToggleFullscreen()}
                    aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                    title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                    className="ml-1 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-slate-100 transition-colors"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Maximize2 className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Video Progress & Next Stage Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">
                  Progres Menonton Video
                </span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {watchPct}% ditonton
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className="h-full transition-all duration-200 bg-blue-700"
                  style={{ width: `${watchPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Anda bebas memutar ulang atau melompat ke bab mana saja sebelum melanjutkan ke Post-Test Evaluasi.
              </p>
            </div>

            <button
              type="button"
              onClick={onProceedToPostTest}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <span>Lanjut ke Post-Test</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Right Concept, Transcript & Notes Deck */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div
            role="tablist"
            aria-label="Panel Pendukung Video"
            className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 p-1 gap-1"
          >
            {[
              { id: 'chapters' as SideTab, label: 'Daftar Bab' },
              { id: 'transcript' as SideTab, label: 'Ringkasan' },
              { id: 'notes' as SideTab, label: `Catatan (${progress.notes.length})` },
            ].map((tab) => {
              const active = sideTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSideTab(tab.id)}
                  className={`py-2 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
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

          <div className="p-5 max-h-[540px] overflow-y-auto">
            {sideTab === 'chapters' && (
              <div className="space-y-2.5">
                {course.chapters.map((ch, idx) => {
                  const isCurrent = idx === currentChapterIdx;
                  const isRecommended = weakCompetencies.has(ch.competency);

                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => handleSeek(ch.startSec)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-colors space-y-1.5 ${
                        isCurrent
                          ? 'bg-blue-50/70 border-blue-600'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono text-slate-500 tabular-nums">
                          {formatTime(ch.startSec)} – {formatTime(ch.endSec)}
                        </span>
                        {isCurrent ? (
                          <span className="font-semibold text-blue-700">
                            Sedang diputar
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                            <span>Tersedia</span>
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-semibold text-slate-900 leading-snug">
                        {ch.title}
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                        <span>{ch.competency}</span>
                        {isRecommended && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-700 font-medium">
                              Prioritas dari Pre-Test
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {sideTab === 'transcript' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <BookOpen className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                    <span>Poin Utama {currentChapter.title.split(':')[0]}</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 leading-relaxed list-disc pl-4">
                    {currentChapter.keyTakeaways.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-2.5">
                  <div className="text-xs font-semibold text-slate-700">
                    Transkrip Tersinkronisasi
                  </div>
                  <div className="space-y-2">
                    {currentChapter.captions.map((cap, i) => {
                      const isLineActive =
                        currentTime >= cap.startSec && currentTime < cap.endSec;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSeek(cap.startSec)}
                          className={`w-full text-left p-2.5 rounded-lg text-xs leading-relaxed transition-colors ${
                            isLineActive
                              ? 'bg-blue-50 text-slate-900 font-medium'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-mono text-blue-700 mr-2 tabular-nums">
                            {formatTime(cap.startSec)}
                          </span>
                          {cap.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {sideTab === 'notes' && (
              <div className="space-y-4">
                <form onSubmit={handleCreateNote} className="space-y-2.5">
                  <label
                    htmlFor="lesson-note-input"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Catat poin penting di menit{' '}
                    <span className="font-mono text-blue-700 tabular-nums">
                      {formatTime(currentTime)}
                    </span>
                  </label>
                  <textarea
                    id="lesson-note-input"
                    rows={3}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Tulis ringkasan konsep atau pertanyaan..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="submit"
                    disabled={!noteInput.trim()}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-500 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Simpan Catatan Berstempel Waktu</span>
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-200 space-y-2.5">
                  {progress.notes.length === 0 ? (
                    <div className="py-6 text-center space-y-1.5">
                      <StickyNote
                        className="w-5 h-5 text-slate-400 mx-auto"
                        aria-hidden="true"
                      />
                      <p className="text-xs text-slate-500">
                        Belum ada catatan. Simpan catatan saat video berjalan agar mudah diulang.
                      </p>
                    </div>
                  ) : (
                    progress.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleSeek(note.timestampSec)}
                            className="font-mono text-xs font-semibold text-blue-700 hover:underline tabular-nums"
                          >
                            Lompat ke {formatTime(note.timestampSec)}
                          </button>
                          <button
                            type="button"
                            aria-label="Hapus catatan"
                            onClick={() => onDeleteNote(note.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
