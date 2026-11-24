import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Lock,
  PlayCircle,
  RotateCcw,
} from 'lucide-react';
import {
  Course,
  LearningTrack,
  LevelFlowMode,
  LMSProgressStore,
  TrackLevel,
} from '../types/lms';
import {
  getBestPostScore,
  getCourseProgressPercentage,
  getNextSequentialCourseId,
  getTrackProgressSummary,
  getWatchPercentage,
  isCoursePassed,
  isCourseUnlockedInTrack,
  isTrackUnlocked,
} from '../data/courses';

interface LearningJourneyMapProps {
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
  onOpenCourse: (courseId: string) => void;
}

type JourneyScope = 'all' | TrackLevel;
type NodeStateKind = 'passed' | 'active' | 'ready' | 'locked';

interface JourneyNodeDatum {
  course: Course;
  track: LearningTrack;
  trackIndex: number;
  moduleIndex: number;
  x: number;
  y: number;
  progressPct: number;
  watchPct: number;
  preScore: number | null;
  postScore: number | null;
  checkpointPassed: boolean;
  unlocked: boolean;
  passed: boolean;
  isCurrentTarget: boolean;
  stateKind: NodeStateKind;
  lockReason: string;
}

interface JourneyEdgeDatum {
  id: string;
  source: JourneyNodeDatum;
  target: JourneyNodeDatum;
  isCrossTrack: boolean;
  edgeState: 'completed' | 'active' | 'locked';
}

const STATE_COLORS: Record<
  NodeStateKind,
  { stroke: string; fill: string; ringBg: string; text: string; label: string }
> = {
  passed: {
    stroke: '#059669',
    fill: '#ECFDF5',
    ringBg: '#D1FAE5',
    text: '#047857',
    label: 'Lulus KKM',
  },
  active: {
    stroke: '#1D4ED8',
    fill: '#EFF6FF',
    ringBg: '#DBEAFE',
    text: '#1D4ED8',
    label: 'Sedang Aktif',
  },
  ready: {
    stroke: '#0284C7',
    fill: '#F0F9FF',
    ringBg: '#E0F2FE',
    text: '#0369A1',
    label: 'Terbuka',
  },
  locked: {
    stroke: '#CBD5E1',
    fill: '#F8FAFC',
    ringBg: '#E2E8F0',
    text: '#64748B',
    label: 'Terkunci',
  },
};

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trimEnd()}…`;
}

export const LearningJourneyMap: React.FC<LearningJourneyMapProps> = ({
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
  onOpenCourse,
}) => {
  const [scope, setScope] = useState<JourneyScope>('all');
  const nextSequentialCourseId = useMemo(
    () => getNextSequentialCourseId(courses, progressStore, trackSequence),
    [courses, progressStore, trackSequence]
  );

  const [inspectedCourseId, setInspectedCourseId] = useState<string>(
    () => nextSequentialCourseId || activeCourseId
  );
  const [hoveredInfo, setHoveredInfo] = useState<{
    node: JourneyNodeDatum;
    clientX: number;
    clientY: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const orderedTracks = useMemo(() => {
    return [...tracks].sort((a, b) => {
      const idxA = trackSequence.indexOf(a.id);
      const idxB = trackSequence.indexOf(b.id);
      return (idxA >= 0 ? idxA : a.order) - (idxB >= 0 ? idxB : b.order);
    });
  }, [tracks, trackSequence]);

  const visibleTracks = useMemo(
    () =>
      scope === 'all'
        ? orderedTracks
        : orderedTracks.filter((t) => t.id === scope),
    [orderedTracks, scope]
  );

  const graphData = useMemo(() => {
    const laneLeftPad = 215;
    const laneRightPad = 70;
    const nodeSpacingX = 165;
    const rowHeight = 148;
    const topPad = 36;
    const bottomPad = 34;

    const maxModulesInVisible = visibleTracks.reduce((max, tr) => {
      const count = courses.filter((c) => c.trackLevel === tr.id).length;
      return Math.max(max, count);
    }, 1);

    const width = Math.max(
      980,
      laneLeftPad +
        Math.max(0, maxModulesInVisible - 1) * nodeSpacingX +
        laneRightPad +
        60
    );
    const height = topPad + visibleTracks.length * rowHeight + bottomPad;

    const nodes: JourneyNodeDatum[] = [];
    const edges: JourneyEdgeDatum[] = [];
    const lanes: {
      track: LearningTrack;
      seqIndex: number;
      y: number;
      unlocked: boolean;
      summary: { total: number; passed: number; pct: number; completed: boolean };
    }[] = [];

    let previousTrackLastNode: JourneyNodeDatum | null = null;

    visibleTracks.forEach((track, visibleIdx) => {
      const seqIdx = Math.max(0, trackSequence.indexOf(track.id));
      const trackAccess = isTrackUnlocked(
        track.id,
        progressStore,
        placementLevel,
        unlockAllPreview,
        courses,
        levelFlowMode,
        userAssignedTrack,
        trackSequence
      );
      const summary = getTrackProgressSummary(track.id, progressStore, courses);
      const rowCenterY = topPad + visibleIdx * rowHeight + rowHeight * 0.5;

      lanes.push({
        track,
        seqIndex: seqIdx,
        y: rowCenterY,
        unlocked: trackAccess.unlocked,
        summary,
      });

      const trackCourses = courses
        .filter((c) => c.trackLevel === track.id)
        .sort((a, b) => a.moduleOrderInTrack - b.moduleOrderInTrack);

      let prevNodeInTrack: JourneyNodeDatum | null = null;

      trackCourses.forEach((course, modIdx) => {
        const modAccess = isCourseUnlockedInTrack(
          course,
          progressStore,
          courses,
          enforceModuleOrder,
          unlockAllPreview
        );
        const unlocked = trackAccess.unlocked && modAccess.unlocked;
        const p = progressStore[course.id];
        const passed = isCoursePassed(course, progressStore);
        const progressPct = getCourseProgressPercentage(course, p);
        const watchPct = p ? getWatchPercentage(p, course) : 0;
        const preScore = p?.preTestResult?.score ?? null;
        const postScore = p ? getBestPostScore(p) : null;
        const isCurrentTarget =
          course.id === nextSequentialCourseId ||
          (course.id === activeCourseId && unlocked && !passed);

        const stateKind: NodeStateKind = !unlocked
          ? 'locked'
          : passed
            ? 'passed'
            : isCurrentTarget || progressPct > 0
              ? 'active'
              : 'ready';

        const lockReason = !trackAccess.unlocked
          ? trackAccess.reason
          : !modAccess.unlocked
            ? modAccess.reason
            : '';

        const node: JourneyNodeDatum = {
          course,
          track,
          trackIndex: visibleIdx,
          moduleIndex: modIdx,
          x: laneLeftPad + modIdx * nodeSpacingX,
          y: rowCenterY,
          progressPct,
          watchPct,
          preScore,
          postScore,
          checkpointPassed: Boolean(p?.checkpointPassed),
          unlocked,
          passed,
          isCurrentTarget,
          stateKind,
          lockReason,
        };

        nodes.push(node);

        if (prevNodeInTrack) {
          edges.push({
            id: `edge-${prevNodeInTrack.course.id}-${node.course.id}`,
            source: prevNodeInTrack,
            target: node,
            isCrossTrack: false,
            edgeState:
              prevNodeInTrack.passed && node.unlocked
                ? node.passed
                  ? 'completed'
                  : 'active'
                : 'locked',
          });
        } else if (previousTrackLastNode && scope === 'all') {
          edges.push({
            id: `bridge-${previousTrackLastNode.course.id}-${node.course.id}`,
            source: previousTrackLastNode,
            target: node,
            isCrossTrack: true,
            edgeState:
              previousTrackLastNode.passed && node.unlocked
                ? node.passed
                  ? 'completed'
                  : 'active'
                : 'locked',
          });
        }

        prevNodeInTrack = node;
      });

      previousTrackLastNode = prevNodeInTrack;
    });

    return { width, height, rowHeight, nodes, edges, lanes };
  }, [
    visibleTracks,
    courses,
    trackSequence,
    progressStore,
    placementLevel,
    unlockAllPreview,
    levelFlowMode,
    userAssignedTrack,
    enforceModuleOrder,
    nextSequentialCourseId,
    activeCourseId,
    scope,
  ]);

  const inspectedNode = useMemo(() => {
    return (
      graphData.nodes.find((n) => n.course.id === inspectedCourseId) ??
      graphData.nodes.find((n) => n.isCurrentTarget) ??
      graphData.nodes[0] ??
      null
    );
  }, [graphData.nodes, inspectedCourseId]);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const svg = d3
      .select(svgEl)
      .attr('viewBox', `0 0 ${graphData.width} ${graphData.height}`)
      .attr('width', '100%')
      .attr('height', graphData.height);

    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // Arrow markers for path direction
    const markerDefs: { id: string; color: string }[] = [
      { id: 'journey-arrow-completed', color: '#059669' },
      { id: 'journey-arrow-active', color: '#1D4ED8' },
      { id: 'journey-arrow-locked', color: '#CBD5E1' },
    ];
    markerDefs.forEach((m) => {
      defs
        .append('marker')
        .attr('id', m.id)
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 8)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', 'M 0 1.5 L 8.5 5 L 0 8.5 z')
        .attr('fill', m.color);
    });

    // 1. Swimlane Track Rows
    const lanesGroup = svg.append('g').attr('class', 'journey-lanes');

    graphData.lanes.forEach((lane, i) => {
      const bandTop = lane.y - graphData.rowHeight * 0.44;
      const bandHeight = graphData.rowHeight * 0.88;

      lanesGroup
        .append('rect')
        .attr('x', 8)
        .attr('y', bandTop)
        .attr('width', graphData.width - 16)
        .attr('height', bandHeight)
        .attr('rx', 12)
        .attr('fill', i % 2 === 0 ? '#FFFFFF' : '#F8FAFC')
        .attr('stroke', lane.unlocked ? '#E2E8F0' : '#E2E8F0')
        .attr('stroke-width', 1);

      // Left Track Header Box inside Swimlane
      const trackLabelGroup = lanesGroup
        .append('g')
        .attr('transform', `translate(24, ${lane.y - 26})`);

      trackLabelGroup
        .append('text')
        .attr('x', 0)
        .attr('y', 12)
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('fill', lane.unlocked ? '#1D4ED8' : '#64748B')
        .text(
          `LEVEL 0${lane.seqIndex + 1} · ${
            lane.summary.completed
              ? 'LULUS'
              : lane.unlocked
                ? 'TERBUKA'
                : 'TERKUNCI'
          }`
        );

      trackLabelGroup
        .append('text')
        .attr('x', 0)
        .attr('y', 33)
        .attr('font-family', 'var(--font-display)')
        .attr('font-size', '15px')
        .attr('font-weight', '700')
        .attr('fill', '#0F172A')
        .text(lane.track.name);

      trackLabelGroup
        .append('text')
        .attr('x', 0)
        .attr('y', 51)
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', '11px')
        .attr('fill', '#475569')
        .text(
          `${lane.summary.passed}/${lane.summary.total} modul (${lane.summary.pct}%) · KKM ${lane.track.minPassScore}%`
        );
    });

    // 2. Curved & Step Flow Connectors (D3 Path Generator)
    const edgesGroup = svg.append('g').attr('class', 'journey-edges');
    const nodeRadius = 27;

    const buildEdgePath = (edge: JourneyEdgeDatum): string => {
      if (!edge.isCrossTrack) {
        const sx = edge.source.x + nodeRadius + 4;
        const tx = edge.target.x - nodeRadius - 8;
        const y = edge.source.y;
        const midX = (sx + tx) / 2;
        return `M ${sx} ${y} C ${midX} ${y}, ${midX} ${y}, ${tx} ${y}`;
      }

      // Smooth S-curve bridge from end of upper track row to start of next track row
      const sx = edge.source.x;
      const sy = edge.source.y + nodeRadius + 6;
      const tx = edge.target.x;
      const ty = edge.target.y - nodeRadius - 8;
      const midY = (sy + ty) / 2;
      return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;
    };

    const edgePaths = edgesGroup
      .selectAll('path.journey-edge')
      .data(graphData.edges)
      .enter()
      .append('path')
      .attr('class', 'journey-edge')
      .attr('d', buildEdgePath)
      .attr('fill', 'none')
      .attr('stroke', (d) =>
        d.edgeState === 'completed'
          ? '#059669'
          : d.edgeState === 'active'
            ? '#1D4ED8'
            : '#CBD5E1'
      )
      .attr('stroke-width', (d) => (d.edgeState === 'locked' ? 1.75 : 2.5))
      .attr('stroke-dasharray', (d) =>
        d.edgeState === 'locked'
          ? '5,5'
          : d.isCrossTrack
            ? '6,4'
            : 'none'
      )
      .attr('marker-end', (d) =>
        d.edgeState === 'completed'
          ? 'url(#journey-arrow-completed)'
          : d.edgeState === 'active'
            ? 'url(#journey-arrow-active)'
            : 'url(#journey-arrow-locked)'
      );

    if (!prefersReducedMotion) {
      edgePaths
        .filter((d) => d.edgeState === 'completed')
        .each(function () {
          const pathEl = this as SVGPathElement;
          const totalLen = pathEl.getTotalLength();
          d3.select(pathEl)
            .attr('stroke-dasharray', `${totalLen} ${totalLen}`)
            .attr('stroke-dashoffset', totalLen)
            .transition()
            .duration(450)
            .ease(d3.easeCubicOut)
            .attr('stroke-dashoffset', 0)
            .on('end', () => {
              d3.select(pathEl).attr('stroke-dasharray', 'none');
            });
        });
    }

    // 3. Interactive Module Nodes with D3 Arc Progress Rings
    const nodesGroup = svg.append('g').attr('class', 'journey-nodes');

    const ringBgArc = d3
      .arc<JourneyNodeDatum>()
      .innerRadius(nodeRadius - 4)
      .outerRadius(nodeRadius)
      .startAngle(0)
      .endAngle(Math.PI * 2);

    const progressArcGen = d3
      .arc<JourneyNodeDatum>()
      .innerRadius(nodeRadius - 4)
      .outerRadius(nodeRadius)
      .startAngle(0)
      .cornerRadius(3);

    const nodeGroups = nodesGroup
      .selectAll<SVGGElement, JourneyNodeDatum>('g.journey-node')
      .data(graphData.nodes, (d) => d.course.id)
      .enter()
      .append('g')
      .attr('class', 'journey-node')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr(
        'aria-label',
        (d) =>
          `Modul ${d.course.moduleOrderInTrack} ${d.course.code} ${d.course.title}, progres ${d.progressPct}%, status ${STATE_COLORS[d.stateKind].label}`
      )
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setInspectedCourseId(d.course.id);
      })
      .on('keydown', (event: KeyboardEvent, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setInspectedCourseId(d.course.id);
        }
      })
      .on('mouseenter', function (event: MouseEvent, d) {
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          setHoveredInfo({
            node: d,
            clientX: event.clientX - containerRect.left,
            clientY: event.clientY - containerRect.top,
          });
        }
        d3.select(this)
          .select('circle.node-core')
          .transition()
          .duration(prefersReducedMotion ? 0 : 140)
          .attr('r', nodeRadius - 3);
      })
      .on('mousemove', function (event: MouseEvent, d) {
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          setHoveredInfo({
            node: d,
            clientX: event.clientX - containerRect.left,
            clientY: event.clientY - containerRect.top,
          });
        }
      })
      .on('mouseleave', function () {
        setHoveredInfo(null);
        d3.select(this)
          .select('circle.node-core')
          .transition()
          .duration(prefersReducedMotion ? 0 : 140)
          .attr('r', nodeRadius - 5);
      });

    // Selection halo ring
    nodeGroups
      .filter((d) => d.course.id === (inspectedNode?.course.id ?? ''))
      .append('circle')
      .attr('r', nodeRadius + 5)
      .attr('fill', 'none')
      .attr('stroke', '#1D4ED8')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,3');

    // Core inner circle
    nodeGroups
      .append('circle')
      .attr('class', 'node-core')
      .attr('r', nodeRadius - 5)
      .attr('fill', (d) => STATE_COLORS[d.stateKind].fill)
      .attr('stroke', (d) =>
        d.course.id === (inspectedNode?.course.id ?? '')
          ? '#1D4ED8'
          : STATE_COLORS[d.stateKind].stroke
      )
      .attr('stroke-width', 1.5);

    // Track ring background arc
    nodeGroups
      .append('path')
      .attr('d', (d) => ringBgArc(d) ?? '')
      .attr('fill', (d) => STATE_COLORS[d.stateKind].ringBg);

    // Progress arc via D3 arc generator
    const fgArcs = nodeGroups
      .filter((d) => d.progressPct > 0)
      .append('path')
      .attr('fill', (d) => STATE_COLORS[d.stateKind].stroke);

    if (prefersReducedMotion) {
      fgArcs.attr('d', (d) => {
        const angle = (Math.max(0, Math.min(100, d.progressPct)) / 100) * Math.PI * 2;
        return progressArcGen.endAngle(angle)(d) ?? '';
      });
    } else {
      fgArcs
        .transition()
        .duration(480)
        .ease(d3.easeCubicOut)
        .attrTween('d', function (d) {
          const targetAngle =
            (Math.max(0, Math.min(100, d.progressPct)) / 100) * Math.PI * 2;
          const interp = d3.interpolateNumber(0, targetAngle);
          return (t) => progressArcGen.endAngle(interp(t))(d) ?? '';
        });
    }

    // Center text inside node (M1 / Check / % / Lock)
    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('y', -2)
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('fill', (d) => STATE_COLORS[d.stateKind].text)
      .text((d) =>
        d.passed
          ? 'LULUS'
          : d.unlocked
            ? `${d.progressPct}%`
            : `M${d.course.moduleOrderInTrack}`
      );

    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 12)
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '9px')
      .attr('font-weight', '600')
      .attr('fill', (d) => STATE_COLORS[d.stateKind].text)
      .text((d) =>
        d.unlocked ? `M${d.course.moduleOrderInTrack}` : 'KUNCI'
      );

    // Above-node module code label
    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -nodeRadius - 9)
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', (d) =>
        d.course.id === (inspectedNode?.course.id ?? '')
          ? '#1D4ED8'
          : d.unlocked
            ? '#0F172A'
            : '#64748B'
      )
      .text((d) => d.course.code);

    // Below-node module title & status line
    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', nodeRadius + 16)
      .attr('font-family', 'var(--font-sans)')
      .attr('font-size', '11.5px')
      .attr('font-weight', '600')
      .attr('fill', (d) => (d.unlocked ? '#0F172A' : '#64748B'))
      .text((d) => truncateText(d.course.title, 20));

    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', nodeRadius + 31)
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '10px')
      .attr('fill', (d) => STATE_COLORS[d.stateKind].text)
      .text((d) =>
        d.passed
          ? `Skor ${d.postScore}/100`
          : d.isCurrentTarget
            ? 'Target Aktif'
            : d.unlocked
              ? `KKM ${d.course.passingScore}%`
              : 'Selesaikan modul sblm'
      );
  }, [graphData, inspectedNode]);

  return (
    <section
      aria-label="Visualisasi Learning Journey Map"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 space-y-6"
    >
      {/* Header & Interactive Scope Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <Compass className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Alur Grafis Interaktif</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 text-balance">
            Learning Journey Map
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Visualisasi progres per modul dari Paket OJT hingga Senior. Arahkan kursor atau klik node modul untuk meninjau capaian nilai dan membuka modul yang sudah terbuka.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            role="tablist"
            aria-label="Filter Jenjang Peta Belajar"
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={scope === 'all'}
              onClick={() => setScope('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                scope === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Jenjang
            </button>
            {orderedTracks.map((tr) => (
              <button
                key={`scope-${tr.id}`}
                type="button"
                role="tab"
                aria-selected={scope === tr.id}
                onClick={() => setScope(tr.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  scope === tr.id
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tr.id}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setScope('all');
              setInspectedCourseId(nextSequentialCourseId || activeCourseId);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Fokus Target Aktif</span>
          </button>
        </div>
      </div>

      {/* State Legend (Accessible Dual-Coded Labels, Zero Pills) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Lulus KKM (Selesai)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-blue-700">
            <PlayCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Aktif / Siap Dikerjakan</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
            <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Terkunci (Prasyarat Urutan)</span>
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-500 tabular-nums">
          Total {graphData.nodes.filter((n) => n.passed).length}/
          {graphData.nodes.length} modul lulus pada tampilan ini
        </div>
      </div>

      {/* D3.js Interactive Canvas */}
      <div
        ref={containerRef}
        className="relative bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-3 overflow-x-auto"
      >
        <div className="min-w-[960px]">
          <svg
            ref={svgRef}
            className="block select-none"
            role="img"
            aria-label="Diagram alur progres pembelajaran per modul"
          />
        </div>

        {/* Hover Floating Inspector Tooltip */}
        {hoveredInfo && (
          <div
            role="tooltip"
            style={{
              left: Math.min(
                Math.max(12, hoveredInfo.clientX + 16),
                Math.max(12, (containerRef.current?.clientWidth ?? 600) - 250)
              ),
              top: Math.max(12, hoveredInfo.clientY - 12),
            }}
            className="pointer-events-none absolute z-20 w-60 bg-slate-900 text-white rounded-lg p-3 shadow-lg text-xs space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-slate-300 tabular-nums">
              <span>
                {hoveredInfo.node.course.trackLevel} · M
                {hoveredInfo.node.course.moduleOrderInTrack} (
                {hoveredInfo.node.course.code})
              </span>
              <span className="font-semibold text-white">
                {hoveredInfo.node.progressPct}%
              </span>
            </div>
            <div className="font-semibold text-white leading-snug">
              {hoveredInfo.node.course.title}
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-700 font-mono text-[10px] tabular-nums text-slate-300">
              <div>
                Pre:{' '}
                <strong className="text-white">
                  {hoveredInfo.node.preScore ?? '—'}
                </strong>
              </div>
              <div>
                Video:{' '}
                <strong className="text-white">
                  {hoveredInfo.node.watchPct}%
                </strong>
              </div>
              <div>
                Post:{' '}
                <strong className="text-white">
                  {hoveredInfo.node.postScore ?? '—'}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Selected Module Deck */}
      {inspectedNode && (
        <div className="border-t border-slate-200 pt-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-semibold text-blue-700">
                {inspectedNode.track.name} · Modul{' '}
                {inspectedNode.course.moduleOrderInTrack}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-700">
                {inspectedNode.course.code}
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={`font-semibold inline-flex items-center gap-1 ${
                  inspectedNode.passed
                    ? 'text-emerald-700'
                    : inspectedNode.unlocked
                      ? 'text-blue-700'
                      : 'text-slate-500'
                }`}
              >
                {inspectedNode.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                ) : inspectedNode.unlocked ? (
                  <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{STATE_COLORS[inspectedNode.stateKind].label}</span>
              </span>
            </div>

            <h3 className="font-display text-lg font-bold text-slate-900">
              {inspectedNode.course.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {!inspectedNode.unlocked && inspectedNode.lockReason
                ? inspectedNode.lockReason
                : inspectedNode.course.description}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 pt-1 text-xs font-mono tabular-nums text-slate-600">
              <span>
                Progres:{' '}
                <strong className="text-slate-900">
                  {inspectedNode.progressPct}%
                </strong>
              </span>
              <span>
                Pre-Test:{' '}
                <strong className="text-slate-900">
                  {inspectedNode.preScore !== null
                    ? `${inspectedNode.preScore}/100`
                    : 'Belum'}
                </strong>
              </span>
              <span>
                Video:{' '}
                <strong className="text-slate-900">
                  {inspectedNode.watchPct}%
                </strong>
              </span>
              <span>
                Post-Test:{' '}
                <strong className="text-slate-900">
                  {inspectedNode.postScore !== null
                    ? `${inspectedNode.postScore}/100`
                    : 'Belum'}
                </strong>
              </span>
              <span>
                KKM:{' '}
                <strong className="text-slate-900">
                  {inspectedNode.course.passingScore}%
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={!inspectedNode.unlocked}
              onClick={() => onOpenCourse(inspectedNode.course.id)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                inspectedNode.unlocked
                  ? 'bg-blue-700 hover:bg-blue-800 text-white'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {!inspectedNode.unlocked ? (
                <>
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  <span>Modul Terkunci</span>
                </>
              ) : (
                <>
                  <span>
                    {inspectedNode.passed
                      ? 'Tinjau Modul Ini'
                      : inspectedNode.preScore !== null
                        ? 'Lanjutkan Modul'
                        : 'Mulai Modul Ini'}
                  </span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
