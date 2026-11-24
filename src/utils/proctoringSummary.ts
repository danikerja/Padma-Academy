import {
  Course,
  CourseStage,
  IntegrityStatus,
  ProctoringEvent,
  ProctoringSessionLog,
  ProctoringSnapshotItem,
  TrackLevel,
} from '../types/lms';

export interface AccountViolationItem {
  id: string;
  time: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  moduleOrder?: number;
  stageLabel: string;
  type: ProctoringEvent['type'] | 'tolerance_exceeded';
  severity: 'pelanggaran' | 'peringatan' | 'info';
  detail: string;
}

export interface AccountSnapshotItem extends ProctoringSnapshotItem {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  moduleOrder?: number;
  stageLabel: string;
}

export interface ModuleProctoringSummary {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  trackLevel?: TrackLevel;
  moduleOrder?: number;
  sessionLogs: ProctoringSessionLog[];
  totalTabSwitches: number;
  totalWindowBlurs: number;
  totalAwaySeconds: number;
  avgFocusScorePct: number;
  cameraActiveNow: boolean;
  screenShareActiveNow: boolean;
  overallIntegrity: IntegrityStatus;
  violations: AccountViolationItem[];
  violationCount: number;
  snapshots: AccountSnapshotItem[];
  stagesLabel: string;
}

export interface AccountProctoringSummary {
  sessionLogs: ProctoringSessionLog[];
  totalTabSwitches: number;
  totalWindowBlurs: number;
  totalAwaySeconds: number;
  avgFocusScorePct: number;
  cameraActiveNow: boolean;
  screenShareActiveNow: boolean;
  latestCameraLabel: string;
  overallIntegrity: IntegrityStatus;
  violations: AccountViolationItem[];
  violationCount: number;
  snapshots: AccountSnapshotItem[];
  moduleSummaries: ModuleProctoringSummary[];
  cheatingModules: ModuleProctoringSummary[];
}

export function formatStageLabel(stage: CourseStage): string {
  if (stage === 'pretest') return 'Pre-Test';
  if (stage === 'posttest') return 'Post-Test';
  if (stage === 'summary') return 'Ringkasan';
  return 'Video Learning';
}

function classifyEventSeverity(
  ev: ProctoringEvent
): 'pelanggaran' | 'peringatan' | 'info' {
  const lower = ev.detail.toLowerCase();
  if (ev.type === 'tab_switch') {
    if (lower.includes('uji suara sirine')) return 'info';
    return 'pelanggaran';
  }
  if (ev.type === 'window_blur') {
    return 'peringatan';
  }
  if (
    ev.type === 'camera' &&
    (lower.includes('dimatikan') || lower.includes('terputus'))
  ) {
    return 'peringatan';
  }
  if (ev.type === 'screen_share' && lower.includes('dihentikan')) {
    return 'peringatan';
  }
  if (ev.type === 'fullscreen' && lower.includes('keluar')) {
    return 'peringatan';
  }
  return 'info';
}

export function buildAccountProctoringSummary(
  learnerId: string,
  learnerEmail: string | undefined,
  proctoringLogs: ProctoringSessionLog[],
  maxTabSwitchTolerance: number,
  courses: Course[] = []
): AccountProctoringSummary {
  const normalizedEmail = (learnerEmail ?? '').trim().toLowerCase();
  const sessionLogs = proctoringLogs.filter(
    (log) =>
      log.userId === learnerId ||
      (normalizedEmail !== '' &&
        log.userEmail.trim().toLowerCase() === normalizedEmail)
  );

  const courseById = new Map<string, Course>();
  const courseByCode = new Map<string, Course>();
  courses.forEach((c) => {
    courseById.set(c.id, c);
    courseByCode.set(c.code.toUpperCase(), c);
  });

  const resolveCourseMeta = (log: ProctoringSessionLog) => {
    const matched =
      courseById.get(log.courseId) ??
      courseByCode.get((log.courseCode ?? '').toUpperCase());
    return {
      courseId: matched?.id ?? log.courseId,
      courseCode: matched?.code ?? log.courseCode,
      courseTitle: matched?.title ?? `Modul ${log.courseCode}`,
      trackLevel: matched?.trackLevel,
      moduleOrder: matched?.moduleOrderInTrack,
    };
  };

  const totalTabSwitches = sessionLogs.reduce(
    (sum, l) => sum + l.tabSwitchCount,
    0
  );
  const totalWindowBlurs = sessionLogs.reduce(
    (sum, l) => sum + l.windowBlurCount,
    0
  );
  const totalAwaySeconds = sessionLogs.reduce(
    (sum, l) => sum + l.awaySeconds,
    0
  );
  const avgFocusScorePct =
    sessionLogs.length > 0
      ? Math.round(
          sessionLogs.reduce((sum, l) => sum + l.focusScorePct, 0) /
            sessionLogs.length
        )
      : 100;

  const cameraActiveNow = sessionLogs.some((l) => l.cameraActive);
  const screenShareActiveNow = sessionLogs.some((l) => l.screenShareActive);
  const latestCameraLabel =
    sessionLogs.find((l) => l.cameraLabel)?.cameraLabel ?? 'Belum Ada Aktivitas';

  const violations: AccountViolationItem[] = [];
  const snapshots: AccountSnapshotItem[] = [];
  const moduleGroups = new Map<
    string,
    {
      courseId: string;
      courseCode: string;
      courseTitle: string;
      trackLevel?: TrackLevel;
      moduleOrder?: number;
      logs: ProctoringSessionLog[];
      violations: AccountViolationItem[];
      snapshots: AccountSnapshotItem[];
    }
  >();

  sessionLogs.forEach((log) => {
    const meta = resolveCourseMeta(log);
    const stageLabel = formatStageLabel(log.stage);
    const groupKey = meta.courseId || meta.courseCode;

    if (!moduleGroups.has(groupKey)) {
      moduleGroups.set(groupKey, {
        courseId: meta.courseId,
        courseCode: meta.courseCode,
        courseTitle: meta.courseTitle,
        trackLevel: meta.trackLevel,
        moduleOrder: meta.moduleOrder,
        logs: [],
        violations: [],
        snapshots: [],
      });
    }
    const group = moduleGroups.get(groupKey)!;
    group.logs.push(log);

    if (log.tabSwitchCount > maxTabSwitchTolerance) {
      const item: AccountViolationItem = {
        id: `${log.logId}-tol`,
        time: log.events[0]?.time ?? 'Sesi Aktif',
        courseId: meta.courseId,
        courseCode: meta.courseCode,
        courseTitle: meta.courseTitle,
        moduleOrder: meta.moduleOrder,
        stageLabel,
        type: 'tolerance_exceeded',
        severity: 'pelanggaran',
        detail: `Melebihi batas toleransi pindah tab (${log.tabSwitchCount}x dari batas ${maxTabSwitchTolerance}x)`,
      };
      violations.push(item);
      group.violations.push(item);
    }

    log.events.forEach((ev, idx) => {
      const severity = classifyEventSeverity(ev);
      if (severity !== 'info') {
        const item: AccountViolationItem = {
          id: `${log.logId}-ev-${idx}`,
          time: ev.time,
          courseId: meta.courseId,
          courseCode: meta.courseCode,
          courseTitle: meta.courseTitle,
          moduleOrder: meta.moduleOrder,
          stageLabel,
          type: ev.type,
          severity,
          detail: ev.detail,
        };
        violations.push(item);
        group.violations.push(item);
      }
    });

    (log.snapshots ?? []).forEach((snap) => {
      const snapItem: AccountSnapshotItem = {
        ...snap,
        courseId: meta.courseId,
        courseCode: meta.courseCode,
        courseTitle: meta.courseTitle,
        moduleOrder: meta.moduleOrder,
        stageLabel,
      };
      snapshots.push(snapItem);
      group.snapshots.push(snapItem);
    });
  });

  const trackRank: Record<TrackLevel, number> = {
    OJT: 1,
    Junior: 2,
    Middle: 3,
    Senior: 4,
  };

  const moduleSummaries: ModuleProctoringSummary[] = Array.from(
    moduleGroups.values()
  )
    .map((g) => {
      const modTabSwitches = g.logs.reduce(
        (sum, l) => sum + l.tabSwitchCount,
        0
      );
      const modWindowBlurs = g.logs.reduce(
        (sum, l) => sum + l.windowBlurCount,
        0
      );
      const modAwaySeconds = g.logs.reduce((sum, l) => sum + l.awaySeconds, 0);
      const modAvgFocus =
        g.logs.length > 0
          ? Math.round(
              g.logs.reduce((sum, l) => sum + l.focusScorePct, 0) /
                g.logs.length
            )
          : 100;
      const modHasCritical =
        g.logs.some((l) => l.integrityStatus === 'pelanggaran') ||
        modTabSwitches > maxTabSwitchTolerance ||
        g.violations.some((v) => v.severity === 'pelanggaran');
      const modHasWarning =
        g.logs.some((l) => l.integrityStatus === 'peringatan') ||
        modTabSwitches > 0 ||
        modWindowBlurs > 1 ||
        g.violations.length > 0;
      const modIntegrity: IntegrityStatus = modHasCritical
        ? 'pelanggaran'
        : modHasWarning
          ? 'peringatan'
          : 'aman';

      const uniqueStages = Array.from(
        new Set(g.logs.map((l) => formatStageLabel(l.stage)))
      );

      return {
        courseId: g.courseId,
        courseCode: g.courseCode,
        courseTitle: g.courseTitle,
        trackLevel: g.trackLevel,
        moduleOrder: g.moduleOrder,
        sessionLogs: g.logs,
        totalTabSwitches: modTabSwitches,
        totalWindowBlurs: modWindowBlurs,
        totalAwaySeconds: modAwaySeconds,
        avgFocusScorePct: modAvgFocus,
        cameraActiveNow: g.logs.some((l) => l.cameraActive),
        screenShareActiveNow: g.logs.some((l) => l.screenShareActive),
        overallIntegrity: modIntegrity,
        violations: g.violations,
        violationCount: g.violations.length,
        snapshots: g.snapshots,
        stagesLabel: uniqueStages.join(', '),
      };
    })
    .sort((a, b) => {
      const ta = a.trackLevel ? trackRank[a.trackLevel] : 99;
      const tb = b.trackLevel ? trackRank[b.trackLevel] : 99;
      if (ta !== tb) return ta - tb;
      const ma = a.moduleOrder ?? 99;
      const mb = b.moduleOrder ?? 99;
      if (ma !== mb) return ma - mb;
      return a.courseCode.localeCompare(b.courseCode);
    });

  const cheatingModules = moduleSummaries.filter(
    (m) =>
      m.violationCount > 0 ||
      m.totalTabSwitches > 0 ||
      m.overallIntegrity !== 'aman'
  );

  const hasCritical =
    sessionLogs.some((l) => l.integrityStatus === 'pelanggaran') ||
    totalTabSwitches > maxTabSwitchTolerance ||
    moduleSummaries.some((m) => m.overallIntegrity === 'pelanggaran');
  const hasWarning =
    sessionLogs.some((l) => l.integrityStatus === 'peringatan') ||
    totalTabSwitches > 0 ||
    totalWindowBlurs > 1 ||
    violations.some((v) => v.severity !== 'info');

  const overallIntegrity: IntegrityStatus = hasCritical
    ? 'pelanggaran'
    : hasWarning
      ? 'peringatan'
      : 'aman';

  return {
    sessionLogs,
    totalTabSwitches,
    totalWindowBlurs,
    totalAwaySeconds,
    avgFocusScorePct,
    cameraActiveNow,
    screenShareActiveNow,
    latestCameraLabel,
    overallIntegrity,
    violations,
    violationCount: violations.length,
    snapshots,
    moduleSummaries,
    cheatingModules,
  };
}
