import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  Camera,
  CameraOff,
  CheckCircle2,
  Eye,
  Maximize2,
  Minimize2,
  Monitor,
  MonitorOff,
  RefreshCw,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  CameraResolution,
  Course,
  CourseStage,
  IntegrityStatus,
  ProctoringEvent,
  ProctoringSnapshotItem,
  WorkspacePolicy,
} from '../types/lms';
import {
  isSirenAudioReady,
  startSecuritySiren,
  stopSecuritySiren,
  unlockSirenAudio,
} from '../utils/sirenAudio';

export interface CameraScreenSnapshot {
  cameraActive: boolean;
  cameraLabel: string;
  cameraMirror: boolean;
  cameraResolution: CameraResolution;
  screenShareActive: boolean;
  fullscreenActive: boolean;
  tabSwitchCount: number;
  windowBlurCount: number;
  focusScorePct: number;
  awaySeconds: number;
  integrityStatus: IntegrityStatus;
  sirenActive: boolean;
  sirenTriggerCount: number;
  snapshots: ProctoringSnapshotItem[];
  events: ProctoringEvent[];
}

interface CameraScreenMonitorProps {
  policy: WorkspacePolicy;
  activeCourse: Course;
  activeStage: CourseStage;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
  onSnapshotChange: (snapshot: CameraScreenSnapshot) => void;
  requestStartCameraSignal: number;
  stealthMode?: boolean;
}

const RESOLUTION_CONSTRAINTS: Record<
  CameraResolution,
  { width: number; height: number; label: string }
> = {
  '480p': { width: 640, height: 480, label: '480p (Hemat Bandwidth)' },
  '720p': { width: 1280, height: 720, label: '720p (HD Standar)' },
  '1080p': { width: 1920, height: 1080, label: '1080p (Tinggi)' },
};

function formatEventTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const CameraScreenMonitor: React.FC<CameraScreenMonitorProps> = ({
  policy,
  activeCourse,
  activeStage,
  isPanelOpen,
  onTogglePanel,
  onSnapshotChange,
  requestStartCameraSignal,
  stealthMode = false,
}) => {
  const isExamStage = activeStage === 'pretest' || activeStage === 'posttest';
  // Camera Hardware State
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraResolution, setCameraResolution] = useState<CameraResolution>('720p');
  const [cameraMirror, setCameraMirror] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraLabel, setCameraLabel] = useState<string>('Kamera Belum Aktif');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [snapshotTime, setSnapshotTime] = useState<string | null>(null);

  // Screen Share & Tracking State
  const [screenShareActive, setScreenShareActive] = useState<boolean>(false);
  const [screenSurfaceLabel, setScreenSurfaceLabel] = useState<string>('Tidak Aktif');
  const [screenError, setScreenError] = useState<string | null>(null);
  const [fullscreenActive, setFullscreenActive] = useState<boolean>(
    Boolean(typeof document !== 'undefined' && document.fullscreenElement)
  );
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [windowBlurCount, setWindowBlurCount] = useState<number>(0);
  const [awaySeconds, setAwaySeconds] = useState<number>(0);
  const [sirenActive, setSirenActive] = useState<boolean>(false);
  const [sirenTriggerCount, setSirenTriggerCount] = useState<number>(0);
  const [sirenAudioReady, setSirenAudioReady] = useState<boolean>(() =>
    isSirenAudioReady()
  );
  const [sirenBlockedNotice, setSirenBlockedNotice] = useState<string | null>(
    null
  );
  const [snapshots, setSnapshots] = useState<ProctoringSnapshotItem[]>([]);
  const [nextSnapshotInSec, setNextSnapshotInSec] = useState<number>(10);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const bgCameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const bgScreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const awayStartedAtRef = useRef<number | null>(null);
  const lastFocusEventAtRef = useRef<number>(0);
  const isAwayFromTabRef = useRef<boolean>(false);

  const appendEvent = useCallback(
    (type: ProctoringEvent['type'], detail: string) => {
      const entry: ProctoringEvent = {
        time: formatEventTime(),
        type,
        detail: detail.slice(0, 120),
      };
      setEvents((prev) => [entry, ...prev].slice(0, 30));
    },
    []
  );

  const refreshCameraDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter((d) => d.kind === 'videoinput');
      setDevices(cams);
      if (cams.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(cams[0].deviceId);
      }
    } catch {
      // Ignore enumeration failure until permission granted
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    void refreshCameraDevices();
  }, [refreshCameraDevices]);

  const stopCamera = useCallback(
    (silent = false) => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (bgCameraVideoRef.current) {
        bgCameraVideoRef.current.srcObject = null;
      }
      if (!silent) {
        setCameraActive(false);
        setCameraLabel('Kamera Nonaktif');
        appendEvent('camera', 'Kamera dimatikan oleh peserta');
      }
    },
    [appendEvent]
  );

  const startCamera = useCallback(
    async (overrideDeviceId?: string, overrideRes?: CameraResolution) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          'Browser atau perangkat ini tidak mendukung akses kamera WebRTC.'
        );
        return;
      }
      setCameraLoading(true);
      setCameraError(null);

      // Clean up existing stream first
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }

      const targetDevice = overrideDeviceId ?? selectedDeviceId;
      const targetRes = RESOLUTION_CONSTRAINTS[overrideRes ?? cameraResolution];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            ...(targetDevice ? { deviceId: { exact: targetDevice } } : {}),
            width: { ideal: targetRes.width },
            height: { ideal: targetRes.height },
            facingMode: 'user',
          },
          audio: false,
        });

        cameraStreamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        const label = (track?.label || 'Kamera Terhubung').slice(0, 120);
        setCameraLabel(label);
        setCameraActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        if (bgCameraVideoRef.current) {
          bgCameraVideoRef.current.srcObject = stream;
          await bgCameraVideoRef.current.play().catch(() => undefined);
        }

        track.onended = () => {
          setCameraActive(false);
          setCameraLabel('Kamera Terputus');
          appendEvent('camera', 'Aliran kamera terputus dari perangkat');
        };

        await refreshCameraDevices();
        appendEvent('camera', `Kamera aktif (${label})`);
      } catch (err) {
        setCameraActive(false);
        setCameraLabel('Kamera Gagal Terhubung');
        const name = err instanceof DOMException ? err.name : '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setCameraError(
            'Izin kamera ditolak browser. Klik ikon gembok/kamera di bilah alamat browser lalu pilih Izinkan.'
          );
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setCameraError(
            'Tidak ditemukan perangkat kamera yang terpasang pada komputer/laptop ini.'
          );
        } else if (name === 'NotReadableError' || name === 'TrackStartError') {
          setCameraError(
            'Kamera sedang dipakai aplikasi lain (Zoom/Meet/Teams). Tutup aplikasi tersebut lalu coba lagi.'
          );
        } else {
          setCameraError(
            err instanceof Error
              ? err.message
              : 'Tidak dapat mengaktifkan kamera saat ini.'
          );
        }
      } finally {
        setCameraLoading(false);
      }
    },
    [selectedDeviceId, cameraResolution, refreshCameraDevices, appendEvent]
  );

  // Allow external trigger (e.g., from Test Verification Gate) to start camera
  const prevSignalRef = useRef<number>(requestStartCameraSignal);
  useEffect(() => {
    if (requestStartCameraSignal > prevSignalRef.current) {
      prevSignalRef.current = requestStartCameraSignal;
      void startCamera();
    }
  }, [requestStartCameraSignal, startCamera]);

  // In stealth mode, silently attach camera only during exam stages (Pre-Test / Post-Test)
  useEffect(() => {
    if (!stealthMode || !policy.enableCameraMonitoring || cameraActive || !isExamStage) return;
    let cancelled = false;
    const trySilentCamera = async () => {
      try {
        if (!navigator.permissions?.query) return;
        const status = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        });
        if (!cancelled && status.state === 'granted') {
          void startCamera();
        }
      } catch {
        // Permissions API for camera may be unavailable in some browsers
      }
    };
    void trySilentCamera();
    return () => {
      cancelled = true;
    };
  }, [stealthMode, policy.enableCameraMonitoring, cameraActive, isExamStage, startCamera]);

  // Attach active stream whenever panel opens or video element remounts
  useEffect(() => {
    if (isPanelOpen && cameraActive && videoRef.current && cameraStreamRef.current) {
      if (videoRef.current.srcObject !== cameraStreamRef.current) {
        videoRef.current.srcObject = cameraStreamRef.current;
        void videoRef.current.play().catch(() => undefined);
      }
    }
    if (isPanelOpen && screenShareActive && screenVideoRef.current && screenStreamRef.current) {
      if (screenVideoRef.current.srcObject !== screenStreamRef.current) {
        screenVideoRef.current.srcObject = screenStreamRef.current;
        void screenVideoRef.current.play().catch(() => undefined);
      }
    }
  }, [isPanelOpen, cameraActive, screenShareActive]);

  const stopScreenShare = useCallback(
    (silent = false) => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
      }
      if (bgScreenVideoRef.current) {
        bgScreenVideoRef.current.srcObject = null;
      }
      if (!silent) {
        setScreenShareActive(false);
        setScreenSurfaceLabel('Tidak Aktif');
        appendEvent('screen_share', 'Berbagi layar dihentikan');
      }
    },
    [appendEvent]
  );

  const startScreenShare = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setScreenError(
        'Browser atau iframe ini tidak mendukung fitur tangkapan layar (getDisplayMedia).'
      );
      return;
    }
    setScreenError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: false,
      });

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      screenStreamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      const surface =
        settings.displaySurface === 'monitor'
          ? 'Seluruh Layar'
          : settings.displaySurface === 'window'
            ? 'Jendela Aplikasi'
            : settings.displaySurface === 'browser'
              ? 'Tab Browser'
              : 'Layar Terverifikasi';
      setScreenSurfaceLabel(surface);
      setScreenShareActive(true);

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        await screenVideoRef.current.play().catch(() => undefined);
      }
      if (bgScreenVideoRef.current) {
        bgScreenVideoRef.current.srcObject = stream;
        await bgScreenVideoRef.current.play().catch(() => undefined);
      }

      track.onended = () => {
        setScreenShareActive(false);
        setScreenSurfaceLabel('Dihentikan Peserta');
        appendEvent('screen_share', 'Berbagi layar dihentikan oleh peserta');
      };

      appendEvent('screen_share', `Berbagi layar aktif (${surface})`);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError') {
        setScreenError(
          'Permintaan berbagi layar dibatalkan atau dibatasi kebijakan browser.'
        );
      } else {
        setScreenError(
          err instanceof Error ? err.message : 'Gagal memulai berbagi layar.'
        );
      }
    }
  }, [appendEvent]);

  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setScreenError('Browser memblokir mode layar penuh otomatis.');
    }
  }, []);

  const handleTakeTestSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video || !cameraActive || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 320) || 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (cameraMirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setSnapshotUrl(canvas.toDataURL('image/jpeg', 0.8));
    setSnapshotTime(formatEventTime());
  }, [cameraActive, cameraMirror]);

  // Unlock Web Audio API on first user gesture during exam stages so siren plays reliably when switching tabs
  useEffect(() => {
    if (!isExamStage || !policy.enableScreenTracking || !policy.enableTabSwitchSiren) return;
    const handleUnlock = async () => {
      const ready = await unlockSirenAudio();
      if (ready) {
        setSirenAudioReady(true);
        setSirenBlockedNotice(null);
      }
    };
    window.addEventListener('pointerdown', handleUnlock, { passive: true });
    window.addEventListener('keydown', handleUnlock, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
    };
  }, [isExamStage, policy.enableScreenTracking, policy.enableTabSwitchSiren]);

  const handleStopSiren = useCallback(() => {
    stopSecuritySiren();
    setSirenActive(false);
  }, []);

  const triggerTabSwitchSiren = useCallback(
    async (detail: string, durationMs = 60000) => {
      setSirenTriggerCount((c) => c + 1);
      setSirenActive(true);
      const started = await startSecuritySiren({
        durationMs,
        onStop: () => setSirenActive(false),
      });
      if (!isAwayFromTabRef.current) {
        stopSecuritySiren();
        setSirenActive(false);
      }
      if (started) {
        setSirenAudioReady(true);
        setSirenBlockedNotice(null);
      } else {
        setSirenBlockedNotice(
          'Audio sirine ditahan browser karena belum ada klik di halaman. Klik "Uji Sirine" sekali agar suara sirine aktif otomatis saat pindah tab.'
        );
      }
      appendEvent('tab_switch', detail);
    },
    [appendEvent]
  );

  const handleTestSiren = useCallback(async () => {
    if (sirenActive) {
      handleStopSiren();
      return;
    }
    const ready = await unlockSirenAudio();
    setSirenAudioReady(ready);
    setSirenActive(true);
    const started = await startSecuritySiren({
      durationMs: 4000,
      onStop: () => setSirenActive(false),
    });
    if (started) {
      setSirenBlockedNotice(null);
      appendEvent('tab_switch', 'Uji suara sirine keamanan dijalankan');
    } else {
      setSirenActive(false);
      setSirenBlockedNotice(
        'Browser tidak mendukung atau memblokir pemutaran Web Audio.'
      );
    }
  }, [sirenActive, handleStopSiren, appendEvent]);

  const capturePeriodicSnapshot = useCallback(() => {
    const camEl =
      videoRef.current && videoRef.current.videoWidth > 0
        ? videoRef.current
        : bgCameraVideoRef.current && bgCameraVideoRef.current.videoWidth > 0
          ? bgCameraVideoRef.current
          : null;
    const scrEl =
      screenVideoRef.current && screenVideoRef.current.videoWidth > 0
        ? screenVideoRef.current
        : bgScreenVideoRef.current && bgScreenVideoRef.current.videoWidth > 0
          ? bgScreenVideoRef.current
          : null;

    const source: 'camera' | 'screen' | null =
      cameraActive && camEl
        ? 'camera'
        : screenShareActive && scrEl
          ? 'screen'
          : null;
    const targetVideo = source === 'camera' ? camEl : source === 'screen' ? scrEl : null;
    if (!source || !targetVideo || targetVideo.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = 208;
    canvas.height =
      Math.round((targetVideo.videoHeight / targetVideo.videoWidth) * 208) || 117;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (source === 'camera' && cameraMirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(targetVideo, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.52);
    if (dataUrl.length > 45000) return;

    const entry: ProctoringSnapshotItem = {
      time: formatEventTime(),
      source,
      dataUrl,
    };
    setSnapshots((prev) => [entry, ...prev].slice(0, 10));
  }, [cameraActive, screenShareActive, cameraMirror]);

  // Periodic automatic snapshot every 10 seconds during exam stages only
  useEffect(() => {
    const canCapture = (cameraActive || screenShareActive) && isExamStage;
    if (!canCapture) {
      setNextSnapshotInSec(10);
      return;
    }

    // Take an initial snapshot shortly after stream starts so Admin immediately sees a preview
    const initialTimer = window.setTimeout(() => {
      capturePeriodicSnapshot();
    }, 750);

    let secondsLeft = 10;
    setNextSnapshotInSec(secondsLeft);
    const interval = window.setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        capturePeriodicSnapshot();
        secondsLeft = 10;
      }
      setNextSnapshotInSec(secondsLeft);
    }, 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [cameraActive, screenShareActive, isExamStage, capturePeriodicSnapshot]);

  // Reset per-course/stage tracking counters when switching module or stage, and stop hardware monitors outside exam stages
  useEffect(() => {
    setTabSwitchCount(0);
    setWindowBlurCount(0);
    setAwaySeconds(0);
    setSirenTriggerCount(0);
    setSnapshots([]);
    setNextSnapshotInSec(10);
    setEvents([]);
    awayStartedAtRef.current = null;
    stopSecuritySiren();
    setSirenActive(false);
    if (!isExamStage) {
      stopCamera(true);
      setCameraActive(false);
      setCameraLabel('Kamera Nonaktif');
      stopScreenShare(true);
      setScreenShareActive(false);
      setScreenSurfaceLabel('Tidak Aktif');
    }
  }, [activeCourse.id, activeStage, isExamStage, stopCamera, stopScreenShare]);

  // Stop active siren if admin disables screen tracking or siren policy
  useEffect(() => {
    if (!policy.enableScreenTracking || !policy.enableTabSwitchSiren || !isExamStage) {
      stopSecuritySiren();
      setSirenActive(false);
    }
  }, [policy.enableScreenTracking, policy.enableTabSwitchSiren, isExamStage]);

  // Track Page Visibility, Window Focus/Blur, and Fullscreen changes (active only during exam stages)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setFullscreenActive(isFull);
      if (isExamStage) {
        appendEvent(
          'fullscreen',
          isFull ? 'Masuk mode layar penuh' : 'Keluar dari mode layar penuh'
        );
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    if (!policy.enableScreenTracking || !isExamStage) {
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }

    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.hidden) {
        isAwayFromTabRef.current = true;
        awayStartedAtRef.current = now;
        lastFocusEventAtRef.current = now;
        setTabSwitchCount((c) => c + 1);
        const stageLabel =
          activeStage === 'posttest'
            ? 'Post-Test'
            : activeStage === 'pretest'
              ? 'Pre-Test'
              : 'Video';
        if (policy.enableTabSwitchSiren) {
          void triggerTabSwitchSiren(
            `Meninggalkan tab LMS saat ${stageLabel} — sirine berbunyi`,
            60000
          );
        } else {
          appendEvent('tab_switch', `Meninggalkan tab LMS saat ${stageLabel}`);
        }
      } else {
        // User kembali ke halaman/tab training -> matikan sirine otomatis
        isAwayFromTabRef.current = false;
        stopSecuritySiren();
        setSirenActive(false);
        if (awayStartedAtRef.current !== null) {
          const deltaSec = Math.max(
            1,
            Math.round((now - awayStartedAtRef.current) / 1000)
          );
          awayStartedAtRef.current = null;
          setAwaySeconds((prev) => prev + deltaSec);
        }
      }
    };

    const handleWindowBlur = () => {
      const now = Date.now();
      if (document.hidden || now - lastFocusEventAtRef.current < 1500) return;
      lastFocusEventAtRef.current = now;
      awayStartedAtRef.current = awayStartedAtRef.current ?? now;
      setWindowBlurCount((c) => c + 1);
      appendEvent('window_blur', 'Fokus jendela berpindah ke aplikasi lain');
    };

    const handleWindowFocus = () => {
      const now = Date.now();
      // Jika halaman training kembali aktif/fokus, pastikan sirine otomatis berhenti
      if (!document.hidden) {
        isAwayFromTabRef.current = false;
        stopSecuritySiren();
        setSirenActive(false);
      }
      if (awayStartedAtRef.current !== null) {
        const deltaSec = Math.max(
          1,
          Math.round((now - awayStartedAtRef.current) / 1000)
        );
        awayStartedAtRef.current = null;
        setAwaySeconds((prev) => prev + deltaSec);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [
    policy.enableScreenTracking,
    policy.enableTabSwitchSiren,
    activeStage,
    isExamStage,
    appendEvent,
    triggerTabSwitchSiren,
  ]);

  // Clean up hardware streams & siren audio when component unmounts
  useEffect(() => {
    return () => {
      stopCamera(true);
      stopScreenShare(true);
      stopSecuritySiren();
    };
  }, [stopCamera, stopScreenShare]);

  // Compute focus score & integrity classification and notify parent
  const focusScorePct = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 - tabSwitchCount * 10 - windowBlurCount * 4 - awaySeconds * 0.5
      )
    )
  );
  const integrityStatus: IntegrityStatus =
    tabSwitchCount > policy.maxTabSwitchTolerance
      ? 'pelanggaran'
      : tabSwitchCount > 0 || windowBlurCount > 1
        ? 'peringatan'
        : 'aman';

  useEffect(() => {
    onSnapshotChange({
      cameraActive,
      cameraLabel,
      cameraMirror,
      cameraResolution,
      screenShareActive,
      fullscreenActive,
      tabSwitchCount,
      windowBlurCount,
      focusScorePct,
      awaySeconds,
      integrityStatus,
      sirenActive,
      sirenTriggerCount,
      snapshots,
      events,
    });
  }, [
    cameraActive,
    cameraLabel,
    cameraMirror,
    cameraResolution,
    screenShareActive,
    fullscreenActive,
    tabSwitchCount,
    windowBlurCount,
    focusScorePct,
    awaySeconds,
    integrityStatus,
    sirenActive,
    sirenTriggerCount,
    snapshots,
    events,
    onSnapshotChange,
  ]);

  if (!policy.enableCameraMonitoring && !policy.enableScreenTracking) {
    return null;
  }

  if (stealthMode) {
    if (!isExamStage) {
      return null;
    }
    return (
      <>
        <video
          ref={bgCameraVideoRef}
          autoPlay
          muted
          playsInline
          className="hidden"
          aria-hidden="true"
        />
        <video
          ref={bgScreenVideoRef}
          autoPlay
          muted
          playsInline
          className="hidden"
          aria-hidden="true"
        />
      </>
    );
  }

  if (!isExamStage) {
    return (
      <section
        aria-label="Status Pengawasan Fase Belajar"
        className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 flex items-center justify-between gap-3 text-xs text-slate-600"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
          <span>
            {activeStage === 'video'
              ? 'Pengawasan kamera, tracking pindah tab, dan sirine dinonaktifkan pada fase menonton video (aktif pada Pre-Test dan Post-Test).'
              : 'Pengawasan sesi tidak aktif pada halaman sertifikat kelulusan.'}
          </span>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Monitor Kamera dan Tracking Layar"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Persistent offscreen video elements so 10s snapshots continue even when panel is collapsed */}
      <video
        ref={bgCameraVideoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
        aria-hidden="true"
      />
      <video
        ref={bgScreenVideoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
        aria-hidden="true"
      />

      {/* Compact Always-Visible Telemetry Strip */}
      <div className="px-5 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          {policy.enableCameraMonitoring && (
            <div className="flex items-center gap-2">
              {cameraActive ? (
                <Camera className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              ) : (
                <CameraOff className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              )}
              <span className="font-semibold text-slate-800">
                Kamera:
              </span>
              <span
                className={
                  cameraActive
                    ? 'font-semibold text-emerald-700'
                    : policy.requireCameraForTests
                      ? 'font-semibold text-amber-700'
                      : 'text-slate-600'
                }
              >
                {cameraActive
                  ? `Aktif (${cameraResolution}) · Snapshot 10 dtk (${nextSnapshotInSec}s)`
                  : policy.requireCameraForTests
                    ? 'Wajib untuk Ujian'
                    : 'Nonaktif'}
              </span>
            </div>
          )}

          {policy.enableScreenTracking && (
            <>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                |
              </span>
              <div className="flex items-center gap-2">
                {integrityStatus === 'aman' ? (
                  <ShieldCheck
                    className="w-4 h-4 text-emerald-700 shrink-0"
                    aria-hidden="true"
                  />
                ) : integrityStatus === 'peringatan' ? (
                  <AlertTriangle
                    className="w-4 h-4 text-amber-700 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <ShieldAlert
                    className="w-4 h-4 text-red-700 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span className="font-semibold text-slate-800">
                  Tracking Layar:
                </span>
                <span className="font-mono tabular-nums text-slate-700">
                  Fokus {focusScorePct}% · Pindah Tab {tabSwitchCount}/
                  {policy.maxTabSwitchTolerance}
                </span>
              </div>

              <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                |
              </span>
              <div className="flex items-center gap-1.5">
                {screenShareActive ? (
                  <Monitor className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />
                ) : (
                  <MonitorOff className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                )}
                <span
                  className={
                    screenShareActive ? 'font-semibold text-blue-700' : 'text-slate-600'
                  }
                >
                  {screenShareActive
                    ? `Berbagi Layar (${screenSurfaceLabel})`
                    : 'Berbagi Layar Mati'}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {policy.enableCameraMonitoring && (
            <button
              type="button"
              disabled={cameraLoading}
              onClick={() =>
                cameraActive ? stopCamera() : void startCamera()
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                cameraActive
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cameraActive ? (
                <Camera className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <CameraOff className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>
                {cameraLoading
                  ? 'Menghubungkan...'
                  : cameraActive
                    ? 'Matikan Kamera'
                    : 'Aktifkan Kamera'}
              </span>
            </button>
          )}

          {policy.enableScreenTracking && policy.enableTabSwitchSiren && (
            <button
              type="button"
              onClick={() => void handleTestSiren()}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                sirenActive
                  ? 'bg-red-600 border-red-700 text-white hover:bg-red-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {sirenActive ? (
                <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{sirenActive ? 'Matikan Sirine' : 'Uji Sirine'}</span>
            </button>
          )}

          {policy.enableScreenTracking && (
            <button
              type="button"
              onClick={() => void handleToggleFullscreen()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              {fullscreenActive ? (
                <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{fullscreenActive ? 'Keluar Layar Penuh' : 'Layar Penuh'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onTogglePanel}
            aria-expanded={isPanelOpen}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
              isPanelOpen
                ? 'bg-blue-700 border-blue-700 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {isPanelOpen ? 'Tutup Pengaturan' : 'Pengaturan Kamera & Layar'}
            </span>
          </button>
        </div>
      </div>

      {/* Active Siren Warning Banner */}
      {sirenActive && (
        <div
          role="alert"
          className="px-5 py-3 bg-red-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-red-700"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <BellRing className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              PERINGATAN KEAMANAN: Perpindahan tab terdeteksi! Suara sirine aktif (otomatis mati dalam beberapa detik atau klik Matikan Sirine).
            </span>
          </div>
          <button
            type="button"
            onClick={handleStopSiren}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-white text-red-700 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Matikan Sirine</span>
          </button>
        </div>
      )}

      {/* Expanded Camera & Screen Tracking Settings Panel */}
      {isPanelOpen && (
        <div className="p-5 sm:p-6 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Camera Settings & Live Feed */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-700" aria-hidden="true" />
                <h3 className="font-display text-sm sm:text-base font-bold text-slate-900">
                  Pengaturan Kamera Peserta
                </h3>
              </div>
              <button
                type="button"
                onClick={() => void refreshCameraDevices()}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
              >
                <RefreshCw className="w-3 h-3" aria-hidden="true" />
                <span>Muat Ulang Perangkat</span>
              </button>
            </div>

            <div className="aspect-video w-full bg-slate-900 rounded-lg overflow-hidden relative flex items-center justify-center border border-slate-200">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${
                  cameraActive ? 'block' : 'hidden'
                } ${cameraMirror ? '-scale-x-100' : ''}`}
              />
              {!cameraActive && (
                <div className="text-center px-6 space-y-2">
                  <CameraOff
                    className="w-8 h-8 text-slate-500 mx-auto"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-slate-300">
                    Pratinjau kamera nonaktif. Klik{' '}
                    <strong className="text-white">Aktifkan Kamera</strong> untuk memverifikasi kamera dan pencahayaan.
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="camera-device-select"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Perangkat Kamera
                </label>
                <select
                  id="camera-device-select"
                  value={selectedDeviceId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedDeviceId(nextId);
                    if (cameraActive) {
                      void startCamera(nextId, cameraResolution);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {devices.length === 0 ? (
                    <option value="">Kamera Default Sistem</option>
                  ) : (
                    devices.map((dev, idx) => (
                      <option key={dev.deviceId || idx} value={dev.deviceId}>
                        {dev.label || `Kamera ${idx + 1}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="camera-resolution-select"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Resolusi Video Kamera
                </label>
                <select
                  id="camera-resolution-select"
                  value={cameraResolution}
                  onChange={(e) => {
                    const nextRes = e.target.value as CameraResolution;
                    setCameraResolution(nextRes);
                    if (cameraActive) {
                      void startCamera(selectedDeviceId, nextRes);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {(Object.keys(RESOLUTION_CONSTRAINTS) as CameraResolution[]).map(
                    (res) => (
                      <option key={res} value={res}>
                        {RESOLUTION_CONSTRAINTS[res].label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cameraMirror}
                  onChange={(e) => setCameraMirror(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                />
                <span>Mode Cermin (Mirror Pratinjau)</span>
              </label>

              <button
                type="button"
                disabled={!cameraActive}
                onClick={handleTakeTestSnapshot}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors"
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ambil Uji Framing</span>
              </button>
            </div>

            {snapshotUrl && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
                <img
                  src={snapshotUrl}
                  alt="Hasil uji framing kamera"
                  className="w-20 h-12 object-cover rounded border border-slate-200 shrink-0"
                />
                <div className="text-xs text-slate-600">
                  <div className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Framing Wajah Terverifikasi</span>
                  </div>
                  <div className="text-slate-500 mt-0.5 font-mono tabular-nums">
                    Diambil pukul {snapshotTime}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Screen Tracking, Display Capture & Focus Log */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-700" aria-hidden="true" />
                <h3 className="font-display text-sm sm:text-base font-bold text-slate-900">
                  Tracking Fokus &amp; Berbagi Layar
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                Toleransi Pindah Tab: {policy.maxTabSwitchTolerance}x
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <div className="text-[11px] text-slate-500">Skor Fokus Layar</div>
                <div className="font-mono text-lg font-semibold text-slate-900 tabular-nums mt-0.5">
                  {focusScorePct}%
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Pindah Tab / Blur</div>
                <div className="font-mono text-lg font-semibold text-slate-900 tabular-nums mt-0.5">
                  {tabSwitchCount} / {windowBlurCount}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Durasi Keluar</div>
                <div className="font-mono text-lg font-semibold text-slate-900 tabular-nums mt-0.5">
                  {awaySeconds} dtk
                </div>
              </div>
            </div>

            {policy.enableScreenTracking && policy.enableTabSwitchSiren && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <BellRing className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
                    <span>Sirine Keamanan Anti Pindah Tab</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {sirenAudioReady
                      ? `Audio browser siap. Sirine otomatis berbunyi jika Anda berpindah tab (Dipicu ${sirenTriggerCount}x).`
                      : 'Klik "Uji Sirine" atau area halaman untuk mengaktifkan izin audio browser.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleTestSiren()}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    sirenActive
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {sirenActive ? (
                    <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{sirenActive ? 'Hentikan' : 'Uji Sirine'}</span>
                </button>
              </div>
            )}

            {sirenBlockedNotice && (
              <div
                role="alert"
                className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800"
              >
                {sirenBlockedNotice}
              </div>
            )}

            <div className="p-4 border border-slate-200 rounded-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Verifikasi Layar Aktif (Screen Share)
                  </div>
                  <p className="text-xs text-slate-500">
                    Bagikan layar kerja Anda untuk memastikan hanya jendela LMS yang aktif saat evaluasi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    screenShareActive
                      ? stopScreenShare()
                      : void startScreenShare()
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    screenShareActive
                      ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                  }`}
                >
                  {screenShareActive ? (
                    <MonitorOff className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>
                    {screenShareActive ? 'Hentikan Berbagi Layar' : 'Bagikan Layar'}
                  </span>
                </button>
              </div>

              {screenShareActive && (
                <div className="aspect-video w-full max-h-40 bg-slate-900 rounded-md overflow-hidden border border-slate-200">
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {screenError && (
                <div
                  role="alert"
                  className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800"
                >
                  {screenError}
                </div>
              )}
            </div>

            {/* Live Activity Log */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                Log Aktivitas Layar &amp; Kamera Sesi Ini
              </div>
              {events.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  Belum ada perpindahan tab atau perubahan status kamera pada sesi ini.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-36 overflow-y-auto">
                  {events.slice(0, 8).map((ev, idx) => (
                    <li
                      key={`${ev.time}-${idx}`}
                      className="px-3 py-2 text-xs flex items-center justify-between gap-3"
                    >
                      <span className="text-slate-700 truncate">{ev.detail}</span>
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                        {ev.time}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
