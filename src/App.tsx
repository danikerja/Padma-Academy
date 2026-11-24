/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import {
  AppTab,
  AttemptResult,
  CohortLearner,
  Course,
  CourseProgress,
  CourseStage,
  LevelFlowMode,
  LMSProgressStore,
  ParticipantRegistration,
  ProctoringEvent,
  ProctoringSessionLog,
  ProctoringSnapshotItem,
  StudentNote,
  TrackLevel,
  UserProfile,
  UserRole,
  WorkspacePolicy,
} from './types/lms';
import {
  COMPANY_DEPARTMENTS,
  COURSES,
  createCourseFromAdminInput,
  createInitialProgressStore,
  getBestPostScore,
  getNextSequentialCourseId,
  getWatchPercentage,
  INITIAL_COHORT_LEARNERS,
  isCoursePassed,
  isCourseUnlockedInTrack,
  isTrackUnlocked,
  LEARNING_TRACKS,
} from './data/courses';
import {
  auth,
  BOOTSTRAP_ADMIN_EMAIL,
  createGoogleProvider,
  db,
  emailToInviteId,
  extractEmailDomain,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import { TopBar } from './components/TopBar';
import { CourseCatalog } from './components/CourseCatalog';
import { LearningWorkspace } from './components/LearningWorkspace';
import { ScoreAnalytics } from './components/ScoreAnalytics';
import { AdminDashboard } from './components/AdminDashboard';
import { ArchitectureBlueprint } from './components/ArchitectureBlueprint';
import { PlacementTestModal } from './components/PlacementTestModal';
import { LoginPage } from './components/LoginPage';
import { CameraScreenSnapshot } from './components/CameraScreenMonitor';
import { DualRoleVerificationView } from './components/DualRoleVerificationView';

const STORAGE_KEY_PREFIX = 'lentera_lms_progress_v4_';
const COURSES_STORAGE_KEY = 'lentera_lms_courses_v4';

const VALID_TRACKS: TrackLevel[] = ['OJT', 'Junior', 'Middle', 'Senior'];

function parseTrackSequence(raw: unknown): TrackLevel[] {
  if (!Array.isArray(raw)) return VALID_TRACKS;
  const filtered = raw.filter(
    (item): item is TrackLevel =>
      item === 'OJT' || item === 'Junior' || item === 'Middle' || item === 'Senior'
  );
  const missing = VALID_TRACKS.filter((t) => !filtered.includes(t));
  const combined = [...filtered, ...missing];
  return combined.length === 4 ? combined : VALID_TRACKS;
}

const OPEN_CATALOG_MIGRATION_UTC_MS = Date.UTC(2026, 10, 24, 8, 2, 0);

function getPolicyUpdatedAtMs(rawUpdatedAt: unknown): number {
  if (
    rawUpdatedAt &&
    typeof rawUpdatedAt === 'object' &&
    'toMillis' in rawUpdatedAt &&
    typeof (rawUpdatedAt as { toMillis?: unknown }).toMillis === 'function'
  ) {
    return (rawUpdatedAt as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function parseLevelFlowMode(raw: unknown): LevelFlowMode {
  return raw === 'admin_assigned' ||
    raw === 'linear_sequential' ||
    raw === 'open_catalog'
    ? raw
    : 'open_catalog';
}

const DEFAULT_POLICY: WorkspacePolicy = {
  companyName: 'Lentera Akademi',
  enforceCorporateDomain: false,
  allowedDomains: ['perusahaan.co.id', 'lentera.id'],
  requireRegisteredInvite: false,
  levelFlowMode: 'open_catalog',
  enforceModuleOrder: false,
  trackSequence: ['OJT', 'Junior', 'Middle', 'Senior'],
  enableCameraMonitoring: true,
  requireCameraForTests: false,
  enableScreenTracking: true,
  enableTabSwitchSiren: true,
  requireFullscreenForPostTest: false,
  maxTabSwitchTolerance: 3,
};

function parseWorkspacePolicyDoc(d: Record<string, unknown>): {
  policy: WorkspacePolicy;
  migratedLegacyLock: boolean;
} {
  const updatedMs = getPolicyUpdatedAtMs(d.updatedAt);
  const rawMode = parseLevelFlowMode(d.levelFlowMode);
  const rawEnforce =
    typeof d.enforceModuleOrder === 'boolean'
      ? d.enforceModuleOrder
      : DEFAULT_POLICY.enforceModuleOrder;
  const isLegacyLockedDoc =
    updatedMs < OPEN_CATALOG_MIGRATION_UTC_MS &&
    (rawMode !== 'open_catalog' || rawEnforce);

  const policy: WorkspacePolicy = {
    companyName: String(d.companyName ?? DEFAULT_POLICY.companyName),
    enforceCorporateDomain: Boolean(d.enforceCorporateDomain),
    allowedDomains: Array.isArray(d.allowedDomains)
      ? d.allowedDomains.map(String)
      : DEFAULT_POLICY.allowedDomains,
    requireRegisteredInvite: Boolean(d.requireRegisteredInvite),
    levelFlowMode: isLegacyLockedDoc ? 'open_catalog' : rawMode,
    enforceModuleOrder: isLegacyLockedDoc ? false : rawEnforce,
    trackSequence: parseTrackSequence(d.trackSequence),
    enableCameraMonitoring:
      typeof d.enableCameraMonitoring === 'boolean'
        ? d.enableCameraMonitoring
        : DEFAULT_POLICY.enableCameraMonitoring,
    requireCameraForTests:
      typeof d.requireCameraForTests === 'boolean'
        ? d.requireCameraForTests
        : DEFAULT_POLICY.requireCameraForTests,
    enableScreenTracking:
      typeof d.enableScreenTracking === 'boolean'
        ? d.enableScreenTracking
        : DEFAULT_POLICY.enableScreenTracking,
    enableTabSwitchSiren:
      typeof d.enableTabSwitchSiren === 'boolean'
        ? d.enableTabSwitchSiren
        : DEFAULT_POLICY.enableTabSwitchSiren,
    requireFullscreenForPostTest:
      typeof d.requireFullscreenForPostTest === 'boolean'
        ? d.requireFullscreenForPostTest
        : DEFAULT_POLICY.requireFullscreenForPostTest,
    maxTabSwitchTolerance:
      typeof d.maxTabSwitchTolerance === 'number' &&
      d.maxTabSwitchTolerance >= 1 &&
      d.maxTabSwitchTolerance <= 50
        ? d.maxTabSwitchTolerance
        : DEFAULT_POLICY.maxTabSwitchTolerance,
  };

  return { policy, migratedLegacyLock: isLegacyLockedDoc };
}

function loadProgressForUser(uid: string): LMSProgressStore {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${uid}`);
    if (!raw) return createInitialProgressStore();
    const parsed = JSON.parse(raw) as LMSProgressStore;
    const base = createInitialProgressStore();
    return { ...base, ...parsed };
  } catch {
    return createInitialProgressStore();
  }
}

function loadCoursesFallback(): Course[] {
  try {
    const raw = window.localStorage.getItem(COURSES_STORAGE_KEY);
    if (!raw) return COURSES;
    const parsed = JSON.parse(raw) as Course[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : COURSES;
  } catch {
    return COURSES;
  }
}

export default function App() {
  // Authentication & User Profile State
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const pendingDivisionRef = useRef<string>(COMPANY_DEPARTMENTS[0]);

  // Workspace Policy & Admin Cohort State
  const [workspacePolicy, setWorkspacePolicy] =
    useState<WorkspacePolicy>(DEFAULT_POLICY);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [participantRegistrations, setParticipantRegistrations] = useState<
    ParticipantRegistration[]
  >([]);
  const [proctoringLogs, setProctoringLogs] = useState<ProctoringSessionLog[]>(
    []
  );
  const [userProgressMap, setUserProgressMap] = useState<
    Record<string, LMSProgressStore>
  >({});

  // LMS Core State
  const [activeTab, setActiveTab] = useState<AppTab>('catalog');
  const [adminViewMode, setAdminViewMode] = useState<'dual' | 'learner' | 'admin'>(
    'dual'
  );
  const [courses, setCourses] = useState<Course[]>(() => loadCoursesFallback());
  const [cohortLearners, setCohortLearners] = useState<CohortLearner[]>(
    INITIAL_COHORT_LEARNERS
  );
  const [activeCourseId, setActiveCourseId] = useState<string>(
    'ojt-profil-perusahaan'
  );
  const [activeStage, setActiveStage] = useState<CourseStage>('pretest');
  const [unlockAllPreview, setUnlockAllPreview] = useState<boolean>(true);
  const [showPlacementModal, setShowPlacementModal] = useState<boolean>(false);
  const [placementLevel, setPlacementLevel] = useState<TrackLevel | null>(null);
  const [progressStore, setProgressStore] = useState<LMSProgressStore>(() =>
    createInitialProgressStore()
  );

  // Persist user progress locally as fast cache scoped to UID
  useEffect(() => {
    if (!firebaseUser) return;
    try {
      window.localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${firebaseUser.uid}`,
        JSON.stringify(progressStore)
      );
    } catch {
      // Ignore storage errors
    }
  }, [progressStore, firebaseUser]);

  useEffect(() => {
    try {
      window.localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
    } catch {
      // Ignore storage errors
    }
  }, [courses]);

  // Listen to Firebase Auth state and hydrate/enforce corporate domain policy + Firestore user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseUser(null);
        setUserProfile(null);
        setRegisteredUsers([]);
        setParticipantRegistrations([]);
        setProctoringLogs([]);
        setAuthReady(true);
        return;
      }

      const rawEmail = user.email ?? '';
      const email = rawEmail.toLowerCase();
      const emailDomain = extractEmailDomain(email);

      try {
        // 1. Check corporate email domain policy & invite policy if configured
        const policyPath = 'workspaceSettings/policy';
        let activePolicy = DEFAULT_POLICY;
        let shouldPersistMigratedPolicy = false;
        try {
          const policySnap = await getDoc(doc(db, 'workspaceSettings', 'policy'));
          if (policySnap.exists()) {
            const parsed = parseWorkspacePolicyDoc(policySnap.data());
            activePolicy = parsed.policy;
            shouldPersistMigratedPolicy = parsed.migratedLegacyLock;
            setWorkspacePolicy(activePolicy);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, policyPath);
        }

        const isBootAdmin = email === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
        let hasAdminDoc = false;
        if (!isBootAdmin) {
          try {
            const adminSnap = await getDoc(doc(db, 'admins', user.uid));
            hasAdminDoc = adminSnap.exists();
          } catch {
            hasAdminDoc = false;
          }
        }
        const userHasAdminPrivilege = isBootAdmin || hasAdminDoc;

        if (userHasAdminPrivilege && shouldPersistMigratedPolicy) {
          try {
            await setDoc(doc(db, 'workspaceSettings', 'policy'), {
              ...activePolicy,
              updatedAt: serverTimestamp(),
              updatedBy: user.uid,
            });
          } catch {
            // Non-blocking migration write
          }
        }

        if (
          activePolicy.enforceCorporateDomain &&
          !userHasAdminPrivilege &&
          !activePolicy.allowedDomains.includes(emailDomain)
        ) {
          await signOut(auth);
          setAuthError(
            `Domain email @${emailDomain} tidak terdaftar dalam kebijakan email kantor. Gunakan email berdomain: ${activePolicy.allowedDomains.map((d) => `@${d}`).join(', ')}.`
          );
          setFirebaseUser(null);
          setUserProfile(null);
          setAuthReady(true);
          return;
        }

        // 1b. Look up pre-registered participant email invitation
        let matchedInvite: {
          docId: string;
          displayName: string;
          division: string;
          assignedTrack: TrackLevel;
          wasPending: boolean;
        } | null = null;

        try {
          const inviteSnap = await getDocs(
            query(
              collection(db, 'participantRegistrations'),
              where('email', '==', email)
            )
          );
          if (!inviteSnap.empty) {
            const invDoc = inviteSnap.docs[0];
            const invData = invDoc.data();
            const invTrack: TrackLevel =
              invData.assignedTrack === 'OJT' ||
              invData.assignedTrack === 'Junior' ||
              invData.assignedTrack === 'Middle' ||
              invData.assignedTrack === 'Senior'
                ? invData.assignedTrack
                : 'OJT';
            matchedInvite = {
              docId: invDoc.id,
              displayName: String(invData.displayName ?? ''),
              division: String(invData.division ?? ''),
              assignedTrack: invTrack,
              wasPending: invData.status === 'pending',
            };
          }
        } catch (err) {
          handleFirestoreError(
            err,
            OperationType.LIST,
            'participantRegistrations'
          );
        }

        if (
          activePolicy.requireRegisteredInvite &&
          !userHasAdminPrivilege &&
          !matchedInvite
        ) {
          await signOut(auth);
          setAuthError(
            `Email ${rawEmail} belum didaftarkan oleh Admin L&D untuk mengikuti training. Hubungi Admin L&D agar email Anda didaftarkan terlebih dahulu.`
          );
          setFirebaseUser(null);
          setUserProfile(null);
          setAuthReady(true);
          return;
        }

        // Activate pending participant registration on login
        if (matchedInvite?.wasPending) {
          try {
            await updateDoc(
              doc(db, 'participantRegistrations', matchedInvite.docId),
              {
                status: 'active',
                activatedUid: user.uid,
                updatedAt: serverTimestamp(),
              }
            );
          } catch (err) {
            handleFirestoreError(
              err,
              OperationType.UPDATE,
              `participantRegistrations/${matchedInvite.docId}`
            );
          }
        }

        // 2. Load or initialize user profile in Firestore
        const userRef = doc(db, 'users', user.uid);
        let profileSnap;
        try {
          profileSnap = await getDoc(userRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        }

        const initialLocalProgress = loadProgressForUser(user.uid);
        setProgressStore(initialLocalProgress);

        if (profileSnap && profileSnap.exists()) {
          const d = profileSnap.data();
          const currentTrackFromDoc: TrackLevel =
            d.currentTrack === 'OJT' ||
            d.currentTrack === 'Junior' ||
            d.currentTrack === 'Middle' ||
            d.currentTrack === 'Senior'
              ? d.currentTrack
              : 'OJT';
          const effectiveTrack =
            matchedInvite?.wasPending
              ? matchedInvite.assignedTrack
              : currentTrackFromDoc;
          const effectiveDivision =
            matchedInvite?.wasPending && matchedInvite.division
              ? matchedInvite.division
              : String(d.division ?? COMPANY_DEPARTMENTS[0]);

          if (matchedInvite?.wasPending) {
            try {
              await updateDoc(userRef, {
                currentTrack: effectiveTrack,
                placementLevel: effectiveTrack,
                division: effectiveDivision,
                updatedAt: serverTimestamp(),
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
            }
          }

          const loadedProfile: UserProfile = {
            uid: user.uid,
            email: String(d.email ?? email),
            emailDomain: String(d.emailDomain ?? emailDomain),
            displayName: String(
              d.displayName ?? user.displayName ?? matchedInvite?.displayName ?? 'Peserta'
            ),
            division: effectiveDivision,
            role: d.role === 'admin' || userHasAdminPrivilege ? 'admin' : 'learner',
            currentTrack: effectiveTrack,
            placementLevel:
              matchedInvite?.wasPending
                ? effectiveTrack
                : d.placementLevel === 'OJT' ||
                    d.placementLevel === 'Junior' ||
                    d.placementLevel === 'Middle' ||
                    d.placementLevel === 'Senior'
                  ? d.placementLevel
                  : 'unset',
            avgPreScore: Number(d.avgPreScore ?? 0),
            avgVideoPct: Number(d.avgVideoPct ?? 0),
            bestPostScore: Number(d.bestPostScore ?? -1),
            modulesPassed: Number(d.modulesPassed ?? 0),
            modulesTotal: Number(d.modulesTotal ?? COURSES.length),
            interventionSent: Boolean(d.interventionSent),
          };
          setUserProfile(loadedProfile);
          setPlacementLevel(
            loadedProfile.placementLevel === 'unset'
              ? null
              : loadedProfile.placementLevel
          );
        } else {
          const safeDisplayName = (
            user.displayName ||
            matchedInvite?.displayName ||
            email.split('@')[0] ||
            'Peserta Kantor'
          ).slice(0, 100);
          const safeDivision = (
            matchedInvite?.division ||
            pendingDivisionRef.current ||
            COMPANY_DEPARTMENTS[0]
          ).slice(0, 100);
          const startingTrack = matchedInvite?.assignedTrack ?? 'OJT';
          const newProfile: UserProfile = {
            uid: user.uid,
            email: rawEmail,
            emailDomain: emailDomain || 'kantor.local',
            displayName: safeDisplayName,
            division: safeDivision,
            role: userHasAdminPrivilege ? 'admin' : 'learner',
            currentTrack: startingTrack,
            placementLevel: matchedInvite ? startingTrack : 'unset',
            avgPreScore: 0,
            avgVideoPct: 0,
            bestPostScore: -1,
            modulesPassed: 0,
            modulesTotal: COURSES.length,
            interventionSent: false,
          };

          try {
            await setDoc(userRef, {
              ...newProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
          }
          setUserProfile(newProfile);
          setPlacementLevel(matchedInvite ? startingTrack : null);
        }

        setFirebaseUser(user);
        setAuthError(null);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to Firestore course overrides & custom modules when authenticated
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubCourses = onSnapshot(
      collection(db, 'courses'),
      (snapshot) => {
        const overrideMap = new Map<string, Record<string, unknown>>();
        snapshot.docs.forEach((docSnap) => {
          overrideMap.set(docSnap.id, docSnap.data());
        });

        const merged: Course[] = COURSES.map((seed) => {
          const d = overrideMap.get(seed.id);
          if (!d) return seed;
          const parsedTrack: TrackLevel =
            d.trackLevel === 'OJT' ||
            d.trackLevel === 'Junior' ||
            d.trackLevel === 'Middle' ||
            d.trackLevel === 'Senior'
              ? d.trackLevel
              : seed.trackLevel;
          const overrideVideoUrl =
            typeof d.videoUrl === 'string' && d.videoUrl.trim()
              ? d.videoUrl.trim()
              : seed.videoUrl;
          const overrideDuration =
            typeof d.videoDurationSec === 'number' &&
            Number.isFinite(d.videoDurationSec)
              ? d.videoDurationSec
              : seed.videoDurationSec;
          return {
            ...seed,
            code:
              typeof d.code === 'string' && d.code.trim()
                ? d.code
                : seed.code,
            title:
              typeof d.title === 'string' && d.title.trim()
                ? d.title
                : seed.title,
            category:
              typeof d.category === 'string' && d.category.trim()
                ? d.category
                : seed.category,
            trackLevel: parsedTrack,
            instructorName:
              typeof d.instructorName === 'string' && d.instructorName.trim()
                ? d.instructorName
                : seed.instructorName,
            syllabusDurationLabel:
              typeof d.syllabusDurationLabel === 'string' &&
              d.syllabusDurationLabel.trim()
                ? d.syllabusDurationLabel
                : seed.syllabusDurationLabel,
            description:
              typeof d.description === 'string'
                ? d.description
                : seed.description,
            ...(overrideVideoUrl ? { videoUrl: overrideVideoUrl } : {}),
            videoDurationSec: overrideDuration,
            passingScore: Number(d.passingScore ?? seed.passingScore),
            minWatchPercent: Number(d.minWatchPercent ?? seed.minWatchPercent),
            moduleOrderInTrack: Number(
              d.moduleOrderInTrack ?? seed.moduleOrderInTrack
            ),
          };
        });

        snapshot.docs.forEach((docSnap) => {
          const d = docSnap.data();
          if (!d.isCustom || merged.some((c) => c.id === docSnap.id)) return;
          const parsedTrack: TrackLevel =
            d.trackLevel === 'OJT' ||
            d.trackLevel === 'Junior' ||
            d.trackLevel === 'Middle' ||
            d.trackLevel === 'Senior'
              ? d.trackLevel
              : 'Junior';
          const created = createCourseFromAdminInput({
            code: String(d.code ?? 'MOD-NEW'),
            title: String(d.title ?? 'Modul Baru'),
            category: String(d.category ?? 'Pengembangan Profesional'),
            trackLevel: parsedTrack,
            instructorName: String(
              d.instructorName ?? 'Tim Kurikulum Lentera'
            ),
            syllabusDurationLabel: String(
              d.syllabusDurationLabel ?? '30 Menit'
            ),
            passingScore: Number(d.passingScore ?? 75),
            minWatchPercent: Number(d.minWatchPercent ?? 80),
            description: String(d.description ?? ''),
            moduleOrderInTrack: Number(d.moduleOrderInTrack ?? 1),
            videoUrl:
              typeof d.videoUrl === 'string' && d.videoUrl.trim()
                ? d.videoUrl.trim()
                : undefined,
            videoDurationSec:
              typeof d.videoDurationSec === 'number' &&
              Number.isFinite(d.videoDurationSec)
                ? d.videoDurationSec
                : undefined,
            existingCourses: merged,
          });
          merged.push({
            ...created,
            id: docSnap.id,
            moduleOrderInTrack: Number(
              d.moduleOrderInTrack ?? created.moduleOrderInTrack
            ),
          });
        });

        setCourses(merged);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'courses');
      }
    );

    const unsubPolicy = onSnapshot(
      doc(db, 'workspaceSettings', 'policy'),
      (snap) => {
        if (!snap.exists()) return;
        const { policy } = parseWorkspacePolicyDoc(snap.data());
        setWorkspacePolicy(policy);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'workspaceSettings/policy');
      }
    );

    const unsubCurrentUserDoc = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        const nextTrack: TrackLevel =
          d.currentTrack === 'OJT' ||
          d.currentTrack === 'Junior' ||
          d.currentTrack === 'Middle' ||
          d.currentTrack === 'Senior'
            ? d.currentTrack
            : 'OJT';
        const nextPlacement: TrackLevel | 'unset' =
          d.placementLevel === 'OJT' ||
          d.placementLevel === 'Junior' ||
          d.placementLevel === 'Middle' ||
          d.placementLevel === 'Senior'
            ? d.placementLevel
            : 'unset';
        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                currentTrack: nextTrack,
                placementLevel: nextPlacement,
                role: d.role === 'admin' ? 'admin' : prev.role,
                interventionSent: Boolean(d.interventionSent),
              }
            : prev
        );
        setPlacementLevel(nextPlacement === 'unset' ? null : nextPlacement);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.GET,
          `users/${firebaseUser.uid}`
        );
      }
    );

    const unsubUserProgress = onSnapshot(
      collection(db, 'users', firebaseUser.uid, 'courseProgress'),
      (snapshot) => {
        if (snapshot.empty) return;
        setProgressStore((prev) => {
          const next = { ...prev };
          snapshot.docs.forEach((docSnap) => {
            const d = docSnap.data();
            next[docSnap.id] = {
              courseId: docSnap.id,
              preTestResult: (d.preTestResult as AttemptResult | null) ?? null,
              watchedSeconds: Array.isArray(d.watchedSeconds)
                ? (d.watchedSeconds as number[])
                : [],
              lastPositionSec: Number(d.lastPositionSec ?? 0),
              checkpointPassed: Boolean(d.checkpointPassed),
              postTestAttempts: Array.isArray(d.postTestAttempts)
                ? (d.postTestAttempts as AttemptResult[])
                : [],
              notes: Array.isArray(d.notes) ? (d.notes as StudentNote[]) : [],
            };
          });
          return next;
        });
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          `users/${firebaseUser.uid}/courseProgress`
        );
      }
    );

    return () => {
      unsubCourses();
      unsubPolicy();
      unsubCurrentUserDoc();
      unsubUserProgress();
    };
  }, [firebaseUser]);

  // Subscribe to all users & participant registrations ONLY when authenticated user is an Admin
  useEffect(() => {
    if (!firebaseUser || userProfile?.role !== 'admin') {
      setRegisteredUsers([]);
      setParticipantRegistrations([]);
      setProctoringLogs([]);
      return;
    }

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: UserProfile[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            uid: docSnap.id,
            email: String(d.email ?? ''),
            emailDomain: String(d.emailDomain ?? ''),
            displayName: String(d.displayName ?? 'Peserta'),
            division: String(d.division ?? COMPANY_DEPARTMENTS[0]),
            role: d.role === 'admin' ? 'admin' : 'learner',
            currentTrack:
              d.currentTrack === 'OJT' ||
              d.currentTrack === 'Junior' ||
              d.currentTrack === 'Middle' ||
              d.currentTrack === 'Senior'
                ? d.currentTrack
                : 'OJT',
            placementLevel:
              d.placementLevel === 'OJT' ||
              d.placementLevel === 'Junior' ||
              d.placementLevel === 'Middle' ||
              d.placementLevel === 'Senior'
                ? d.placementLevel
                : 'unset',
            avgPreScore: Number(d.avgPreScore ?? 0),
            avgVideoPct: Number(d.avgVideoPct ?? 0),
            bestPostScore: Number(d.bestPostScore ?? -1),
            modulesPassed: Number(d.modulesPassed ?? 0),
            modulesTotal: Number(d.modulesTotal ?? courses.length),
            interventionSent: Boolean(d.interventionSent),
          };
        });
        setRegisteredUsers(list);

        // Fetch per-account courseProgress subcollections for registered accounts
        void (async () => {
          const entries = await Promise.all(
            list
              .filter((u) => u.uid !== firebaseUser.uid)
              .map(async (u) => {
                try {
                  const snap = await getDocs(
                    query(
                      collection(db, 'users', u.uid, 'courseProgress'),
                      where('userId', '==', u.uid)
                    )
                  );
                  const store: LMSProgressStore = {};
                  snap.docs.forEach((pDoc) => {
                    const pd = pDoc.data();
                    store[pDoc.id] = {
                      courseId: pDoc.id,
                      preTestResult:
                        (pd.preTestResult as AttemptResult | null) ?? null,
                      watchedSeconds: Array.isArray(pd.watchedSeconds)
                        ? (pd.watchedSeconds as number[])
                        : [],
                      lastPositionSec: Number(pd.lastPositionSec ?? 0),
                      checkpointPassed: Boolean(pd.checkpointPassed),
                      postTestAttempts: Array.isArray(pd.postTestAttempts)
                        ? (pd.postTestAttempts as AttemptResult[])
                        : [],
                      notes: Array.isArray(pd.notes)
                        ? (pd.notes as StudentNote[])
                        : [],
                    };
                  });
                  return [u.uid, store] as const;
                } catch {
                  return [u.uid, {}] as const;
                }
              })
          );
          const nextMap: Record<string, LMSProgressStore> = {};
          entries.forEach(([uid, store]) => {
            nextMap[uid] = store;
          });
          setUserProgressMap(nextMap);
        })();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    );

    const unsubRegistrations = onSnapshot(
      collection(db, 'participantRegistrations'),
      (snapshot) => {
        const list: ParticipantRegistration[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const createdTs = d.createdAt as { toDate?: () => Date } | undefined;
          return {
            inviteId: docSnap.id,
            email: String(d.email ?? ''),
            displayName: String(d.displayName ?? ''),
            division: String(d.division ?? COMPANY_DEPARTMENTS[0]),
            assignedTrack:
              d.assignedTrack === 'OJT' ||
              d.assignedTrack === 'Junior' ||
              d.assignedTrack === 'Middle' ||
              d.assignedTrack === 'Senior'
                ? d.assignedTrack
                : 'OJT',
            status: d.status === 'active' ? 'active' : 'pending',
            registeredBy: String(d.registeredBy ?? ''),
            activatedUid: String(d.activatedUid ?? ''),
            createdAt: createdTs?.toDate
              ? createdTs.toDate().toISOString()
              : undefined,
          };
        });
        list.sort((a, b) => {
          if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
          return a.email.localeCompare(b.email);
        });
        setParticipantRegistrations(list);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          'participantRegistrations'
        );
      }
    );

    const unsubProctoring = onSnapshot(
      collection(db, 'proctoringLogs'),
      (snapshot) => {
        const list: ProctoringSessionLog[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const updatedTs = d.updatedAt as { toDate?: () => Date } | undefined;
          return {
            logId: docSnap.id,
            userId: String(d.userId ?? ''),
            userName: String(d.userName ?? 'Peserta'),
            userEmail: String(d.userEmail ?? ''),
            division: String(d.division ?? COMPANY_DEPARTMENTS[0]),
            courseId: String(d.courseId ?? ''),
            courseCode: String(d.courseCode ?? 'MOD'),
            stage:
              d.stage === 'pretest' ||
              d.stage === 'video' ||
              d.stage === 'posttest'
                ? d.stage
                : 'video',
            cameraActive: Boolean(d.cameraActive),
            cameraLabel: String(d.cameraLabel ?? ''),
            cameraMirror: Boolean(d.cameraMirror),
            screenShareActive: Boolean(d.screenShareActive),
            fullscreenActive: Boolean(d.fullscreenActive),
            tabSwitchCount: Number(d.tabSwitchCount ?? 0),
            windowBlurCount: Number(d.windowBlurCount ?? 0),
            focusScorePct: Number(d.focusScorePct ?? 100),
            awaySeconds: Number(d.awaySeconds ?? 0),
            integrityStatus:
              d.integrityStatus === 'pelanggaran' ||
              d.integrityStatus === 'peringatan'
                ? d.integrityStatus
                : 'aman',
            events: Array.isArray(d.events)
              ? (d.events as ProctoringEvent[])
              : [],
            snapshots: Array.isArray(d.snapshots)
              ? (d.snapshots as ProctoringSnapshotItem[])
              : [],
            updatedAt: updatedTs?.toDate
              ? updatedTs.toDate().toISOString()
              : undefined,
          };
        });
        list.sort((a, b) =>
          (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')
        );
        setProctoringLogs(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'proctoringLogs');
      }
    );

    return () => {
      unsubUsers();
      unsubRegistrations();
      unsubProctoring();
    };
  }, [firebaseUser, userProfile?.role, courses.length]);

  // Sync user's aggregate stats + individual course progress doc to Firestore
  const syncCourseProgressToFirestore = useCallback(
    async (
      course: Course,
      nextCourseProgress: CourseProgress,
      nextFullStore: LMSProgressStore
    ) => {
      if (!firebaseUser) return;
      const preScore = nextCourseProgress.preTestResult?.score ?? -1;
      const bestPost = getBestPostScore(nextCourseProgress) ?? -1;
      const watchedPct = getWatchPercentage(nextCourseProgress, course);

      const progressPath = `users/${firebaseUser.uid}/courseProgress/${course.id}`;
      try {
        await setDoc(
          doc(db, 'users', firebaseUser.uid, 'courseProgress', course.id),
          {
            userId: firebaseUser.uid,
            courseId: course.id,
            preScore,
            bestPostScore: bestPost,
            watchedPct,
            lastPositionSec: nextCourseProgress.lastPositionSec,
            checkpointPassed: nextCourseProgress.checkpointPassed,
            watchedSeconds: nextCourseProgress.watchedSeconds.slice(0, 5000),
            postTestAttempts: nextCourseProgress.postTestAttempts.slice(-50),
            notes: nextCourseProgress.notes.slice(0, 100),
            preTestResult: nextCourseProgress.preTestResult,
            updatedAt: serverTimestamp(),
          }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, progressPath);
      }

      // Recompute user summary aggregates for Admin Dashboard monitoring
      const preScores = courses
        .map((c) => nextFullStore[c.id]?.preTestResult?.score)
        .filter((s): s is number => typeof s === 'number');
      const postScores = courses
        .map((c) => {
          const p = nextFullStore[c.id];
          return p ? getBestPostScore(p) : null;
        })
        .filter((s): s is number => typeof s === 'number');

      const avgPreScore =
        preScores.length > 0
          ? Math.round(preScores.reduce((a, b) => a + b, 0) / preScores.length)
          : 0;
      const avgVideoPct = Math.round(
        courses.reduce((acc, c) => {
          const p = nextFullStore[c.id];
          return acc + (p ? getWatchPercentage(p, c) : 0);
        }, 0) / Math.max(1, courses.length)
      );
      const userBestPost =
        postScores.length > 0 ? Math.max(...postScores) : -1;
      const modulesPassed = courses.filter((c) =>
        isCoursePassed(c, nextFullStore)
      ).length;

      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          avgPreScore,
          avgVideoPct,
          bestPostScore: userBestPost,
          modulesPassed,
          modulesTotal: courses.length,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `users/${firebaseUser.uid}`
        );
      }
    },
    [firebaseUser, courses]
  );

  // Login & Logout handlers
  const handleLoginWithGoogle = useCallback(
    async (workEmailHint: string, division: string) => {
      setIsSigningIn(true);
      setAuthError(null);
      pendingDivisionRef.current = division;
      try {
        const provider = createGoogleProvider(workEmailHint);
        await signInWithPopup(auth, provider);
      } catch (err: unknown) {
        const code =
          typeof err === 'object' && err !== null && 'code' in err
            ? String((err as { code: string }).code)
            : '';
        if (code === 'auth/popup-closed-by-user') {
          setAuthError('Jendela login Google ditutup sebelum selesai.');
        } else if (code === 'auth/popup-blocked') {
          setAuthError(
            'Popup login diblokir browser. Izinkan popup untuk situs ini lalu coba lagi.'
          );
        } else {
          setAuthError(
            err instanceof Error
              ? err.message
              : 'Gagal masuk menggunakan akun Google.'
          );
        }
      } finally {
        setIsSigningIn(false);
      }
    },
    []
  );

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    setActiveTab('catalog');
  }, []);

  const activeCourse = courses.find((c) => c.id === activeCourseId) ?? courses[0];
  const activeProgress = progressStore[activeCourse.id] ?? {
    courseId: activeCourse.id,
    preTestResult: null,
    watchedSeconds: [],
    lastPositionSec: 0,
    checkpointPassed: false,
    postTestAttempts: [],
    notes: [],
  };

  const lastWatchSyncAtRef = useRef<number>(0);
  const progressStoreRef = useRef<LMSProgressStore>(progressStore);
  useEffect(() => {
    progressStoreRef.current = progressStore;
  }, [progressStore]);

  const resolveRecommendedStage = useCallback(
    (courseId: string, store: LMSProgressStore): CourseStage => {
      const course = courses.find((c) => c.id === courseId) ?? courses[0];
      const p = store[courseId];
      if (!p || !p.preTestResult) return 'pretest';
      const bestPost = getBestPostScore(p);
      if (bestPost !== null && bestPost >= course.passingScore && bestPost > 80) {
        return 'summary';
      }
      if (bestPost !== null && bestPost >= course.passingScore) {
        return 'posttest';
      }
      const watchPct = getWatchPercentage(p, course);
      if (watchPct >= course.minWatchPercent) {
        return 'posttest';
      }
      return 'video';
    },
    [courses]
  );

  const handleOpenCourse = useCallback(
    (courseId: string) => {
      const canPreviewBypass = userProfile?.role === 'admin';
      const target = courses.find((c) => c.id === courseId);
      if (target && !canPreviewBypass) {
        const trackAccess = isTrackUnlocked(
          target.trackLevel,
          progressStore,
          placementLevel,
          false,
          courses,
          workspacePolicy.levelFlowMode,
          placementLevel ?? userProfile?.currentTrack ?? 'OJT',
          workspacePolicy.trackSequence
        );
        const modAccess = isCourseUnlockedInTrack(
          target,
          progressStore,
          courses,
          workspacePolicy.enforceModuleOrder,
          false
        );
        if (!trackAccess.unlocked || !modAccess.unlocked) {
          const nextId = getNextSequentialCourseId(
            courses,
            progressStore,
            workspacePolicy.trackSequence
          );
          setActiveCourseId(nextId);
          setActiveStage(resolveRecommendedStage(nextId, progressStore));
          setActiveTab('workspace');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
      setActiveCourseId(courseId);
      setActiveStage(resolveRecommendedStage(courseId, progressStore));
      setActiveTab('workspace');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [
      courses,
      placementLevel,
      progressStore,
      resolveRecommendedStage,
      unlockAllPreview,
      userProfile?.currentTrack,
      userProfile?.role,
      workspacePolicy.enforceModuleOrder,
      workspacePolicy.levelFlowMode,
      workspacePolicy.trackSequence,
    ]
  );

  const handleSelectCourseInWorkspace = useCallback(
    (courseId: string) => {
      setActiveCourseId(courseId);
      setActiveStage(resolveRecommendedStage(courseId, progressStore));
    },
    [progressStore, resolveRecommendedStage]
  );

  const handleSubmitPreTest = useCallback(
    (result: AttemptResult) => {
      const nextCourseProgress: CourseProgress = {
        ...activeProgress,
        preTestResult: result,
      };
      const nextStore = {
        ...progressStore,
        [activeCourse.id]: nextCourseProgress,
      };
      setProgressStore(nextStore);
      void syncCourseProgressToFirestore(
        activeCourse,
        nextCourseProgress,
        nextStore
      );
    },
    [activeCourse, activeProgress, progressStore, syncCourseProgressToFirestore]
  );

  const handleRecordWatchedSecond = useCallback(
    (second: number, currentPos: number) => {
      const current =
        progressStoreRef.current[activeCourse.id] ?? activeProgress;
      const hasSecond = current.watchedSeconds.includes(second);
      const nextWatched = hasSecond
        ? current.watchedSeconds
        : [...current.watchedSeconds, second];
      const nextCourseProgress: CourseProgress = {
        ...current,
        watchedSeconds: nextWatched,
        lastPositionSec: currentPos,
      };
      const nextStore = {
        ...progressStoreRef.current,
        [activeCourse.id]: nextCourseProgress,
      };
      progressStoreRef.current = nextStore;
      setProgressStore(nextStore);

      const now = Date.now();
      if (now - lastWatchSyncAtRef.current > 8000) {
        lastWatchSyncAtRef.current = now;
        void syncCourseProgressToFirestore(
          activeCourse,
          nextCourseProgress,
          nextStore
        );
      }
    },
    [activeCourse, activeProgress, syncCourseProgressToFirestore]
  );

  const handlePassCheckpoint = useCallback(() => {
    const nextCourseProgress: CourseProgress = {
      ...activeProgress,
      checkpointPassed: true,
    };
    const nextStore = {
      ...progressStore,
      [activeCourse.id]: nextCourseProgress,
    };
    setProgressStore(nextStore);
    void syncCourseProgressToFirestore(
      activeCourse,
      nextCourseProgress,
      nextStore
    );
  }, [activeCourse, activeProgress, progressStore, syncCourseProgressToFirestore]);

  const handleAddNote = useCallback(
    (note: StudentNote) => {
      const nextCourseProgress: CourseProgress = {
        ...activeProgress,
        notes: [note, ...(activeProgress.notes ?? [])],
      };
      const nextStore = {
        ...progressStore,
        [activeCourse.id]: nextCourseProgress,
      };
      setProgressStore(nextStore);
      void syncCourseProgressToFirestore(
        activeCourse,
        nextCourseProgress,
        nextStore
      );
    },
    [activeCourse, activeProgress, progressStore, syncCourseProgressToFirestore]
  );

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      const nextCourseProgress: CourseProgress = {
        ...activeProgress,
        notes: activeProgress.notes.filter((n) => n.id !== noteId),
      };
      const nextStore = {
        ...progressStore,
        [activeCourse.id]: nextCourseProgress,
      };
      setProgressStore(nextStore);
      void syncCourseProgressToFirestore(
        activeCourse,
        nextCourseProgress,
        nextStore
      );
    },
    [activeCourse, activeProgress, progressStore, syncCourseProgressToFirestore]
  );

  const handleSubmitPostTest = useCallback(
    (result: AttemptResult) => {
      const nextCourseProgress: CourseProgress = {
        ...activeProgress,
        postTestAttempts: [...activeProgress.postTestAttempts, result],
      };
      const nextStore = {
        ...progressStore,
        [activeCourse.id]: nextCourseProgress,
      };
      setProgressStore(nextStore);
      void syncCourseProgressToFirestore(
        activeCourse,
        nextCourseProgress,
        nextStore
      );
    },
    [activeCourse, activeProgress, progressStore, syncCourseProgressToFirestore]
  );

  const handleApplyPlacement = useCallback(
    async (lvl: TrackLevel) => {
      setPlacementLevel(lvl);
      if (!firebaseUser) return;
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          placementLevel: lvl,
          currentTrack: lvl,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `users/${firebaseUser.uid}`
        );
      }
    },
    [firebaseUser]
  );

  const handleResetDemo = useCallback(() => {
    const fresh = createInitialProgressStore();
    const firstCourseId = COURSES[0]?.id ?? 'ojt-profil-perusahaan';
    setCourses(COURSES);
    setCohortLearners(INITIAL_COHORT_LEARNERS);
    setProgressStore(fresh);
    setPlacementLevel(null);
    setActiveCourseId(firstCourseId);
    setActiveStage(resolveRecommendedStage(firstCourseId, fresh));
  }, [resolveRecommendedStage]);

  // Admin handlers
  const handleOverrideLearnerTrack = useCallback(
    async (learnerId: string, track: TrackLevel) => {
      if (learnerId === userProfile?.uid) {
        setPlacementLevel(track);
        setUserProfile((prev) =>
          prev ? { ...prev, currentTrack: track, placementLevel: track } : prev
        );
      }
      const isFirestoreUser =
        learnerId === userProfile?.uid ||
        registeredUsers.some((u) => u.uid === learnerId);

      if (isFirestoreUser) {
        try {
          await updateDoc(doc(db, 'users', learnerId), {
            currentTrack: track,
            placementLevel: track,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${learnerId}`);
        }
        return;
      }

      setCohortLearners((prev) =>
        prev.map((l) => (l.id === learnerId ? { ...l, currentTrack: track } : l))
      );
    },
    [userProfile?.uid, registeredUsers]
  );

  const handleChangeUserRole = useCallback(
    async (uid: string, role: UserRole) => {
      if (!firebaseUser) return;
      const targetUser = registeredUsers.find((u) => u.uid === uid);
      try {
        await updateDoc(doc(db, 'users', uid), {
          role,
          updatedAt: serverTimestamp(),
        });
        if (role === 'admin' && targetUser) {
          await setDoc(doc(db, 'admins', uid), {
            uid,
            email: targetUser.email,
            grantedBy: firebaseUser.uid,
            createdAt: serverTimestamp(),
          });
        } else if (role === 'learner') {
          await deleteDoc(doc(db, 'admins', uid));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      }
    },
    [firebaseUser, registeredUsers]
  );

  const handleSendIntervention = useCallback(
    async (learnerId: string) => {
      const isFirestoreUser =
        learnerId === userProfile?.uid ||
        registeredUsers.some((u) => u.uid === learnerId);

      if (isFirestoreUser) {
        try {
          await updateDoc(doc(db, 'users', learnerId), {
            interventionSent: true,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${learnerId}`);
        }
        return;
      }

      setCohortLearners((prev) =>
        prev.map((l) =>
          l.id === learnerId ? { ...l, interventionSent: true } : l
        )
      );
    },
    [userProfile?.uid, registeredUsers]
  );

  const buildCourseFirestorePayload = useCallback(
    (
      course: Course,
      uid: string,
      overrides?: Partial<{
        passingScore: number;
        minWatchPercent: number;
        moduleOrderInTrack: number;
        trackLevel: TrackLevel;
        videoUrl: string;
        videoDurationSec: number;
      }>
    ) => {
      const effectiveVideoUrl =
        overrides?.videoUrl !== undefined ? overrides.videoUrl : course.videoUrl;
      const effectiveDuration =
        overrides?.videoDurationSec !== undefined
          ? overrides.videoDurationSec
          : course.videoDurationSec;

      return {
        courseId: course.id,
        visibility: 'active',
        code: course.code.slice(0, 32),
        title: course.title.slice(0, 140),
        category: course.category.slice(0, 80),
        trackLevel: overrides?.trackLevel ?? course.trackLevel,
        instructorName: course.instructorName.slice(0, 100),
        syllabusDurationLabel: course.syllabusDurationLabel.slice(0, 40),
        passingScore: overrides?.passingScore ?? course.passingScore,
        minWatchPercent: overrides?.minWatchPercent ?? course.minWatchPercent,
        description: course.description.slice(0, 500),
        moduleOrderInTrack:
          overrides?.moduleOrderInTrack ?? course.moduleOrderInTrack,
        isCustom: course.id.startsWith('custom-'),
        ...(typeof effectiveVideoUrl === 'string' && effectiveVideoUrl.trim()
          ? { videoUrl: effectiveVideoUrl.trim().slice(0, 1500) }
          : {}),
        ...(typeof effectiveDuration === 'number' &&
        Number.isFinite(effectiveDuration)
          ? {
              videoDurationSec: Math.max(
                10,
                Math.min(36000, Math.round(effectiveDuration))
              ),
            }
          : {}),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      };
    },
    []
  );

  const handleUpdateCourseThresholds = useCallback(
    async (courseId: string, passingScore: number, minWatchPercent: number) => {
      const target = courses.find((c) => c.id === courseId);
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, passingScore, minWatchPercent } : c
        )
      );
      if (!firebaseUser || !target) return;
      try {
        await setDoc(
          doc(db, 'courses', courseId),
          buildCourseFirestorePayload(target, firebaseUser.uid, {
            passingScore,
            minWatchPercent,
          })
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `courses/${courseId}`);
      }
    },
    [courses, firebaseUser, buildCourseFirestorePayload]
  );

  const handleMoveCourseOrder = useCallback(
    async (courseId: string, direction: 'up' | 'down') => {
      const target = courses.find((c) => c.id === courseId);
      if (!target) return;

      const sameTrack = courses
        .filter((c) => c.trackLevel === target.trackLevel)
        .sort((a, b) => a.moduleOrderInTrack - b.moduleOrderInTrack);

      const idx = sameTrack.findIndex((c) => c.id === courseId);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (idx < 0 || swapIdx < 0 || swapIdx >= sameTrack.length) return;

      const reordered = [...sameTrack];
      const [moved] = reordered.splice(idx, 1);
      reordered.splice(swapIdx, 0, moved);

      const orderMap = new Map<string, number>();
      reordered.forEach((c, i) => orderMap.set(c.id, i + 1));

      const updatedCourses = courses.map((c) =>
        orderMap.has(c.id)
          ? { ...c, moduleOrderInTrack: orderMap.get(c.id)! }
          : c
      );
      setCourses(updatedCourses);

      if (!firebaseUser) return;
      const affected = [reordered[idx], reordered[swapIdx]];
      for (const item of affected) {
        const nextOrder = orderMap.get(item.id) ?? item.moduleOrderInTrack;
        try {
          await setDoc(
            doc(db, 'courses', item.id),
            buildCourseFirestorePayload(item, firebaseUser.uid, {
              moduleOrderInTrack: nextOrder,
            })
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `courses/${item.id}`);
        }
      }
    },
    [courses, firebaseUser, buildCourseFirestorePayload]
  );

  const handleAddNewCourse = useCallback(
    async (input: {
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
    }): Promise<Course[]> => {
      const rawTracks =
        Array.isArray(input.trackLevels) && input.trackLevels.length > 0
          ? input.trackLevels
          : [input.trackLevel];
      const targetTracks = Array.from(new Set(rawTracks));

      const baseNormalized = {
        code: input.code.trim().slice(0, 32).toUpperCase(),
        title: input.title.trim().slice(0, 140),
        category: (input.category.trim() || 'Pengembangan Profesional').slice(0, 80),
        instructorName: (input.instructorName.trim() || 'Tim Kurikulum Lentera').slice(0, 100),
        syllabusDurationLabel: (input.syllabusDurationLabel.trim() || '30 Menit').slice(0, 40),
        passingScore: Math.max(50, Math.min(95, Math.round(input.passingScore))),
        minWatchPercent: Math.max(50, Math.min(100, Math.round(input.minWatchPercent))),
        description: input.description.trim().slice(0, 500),
        videoUrl: input.videoUrl?.trim() ? input.videoUrl.trim().slice(0, 1500) : undefined,
        videoDurationSec:
          typeof input.videoDurationSec === 'number' &&
          Number.isFinite(input.videoDurationSec)
            ? Math.max(10, Math.min(36000, Math.round(input.videoDurationSec)))
            : undefined,
      };

      let workingCourses = [...courses];
      const createdList: Course[] = [];
      const orderUpdates = new Map<string, { course: Course; nextOrder: number }>();

      targetTracks.forEach((track, trackIdx) => {
        const sameTrackExisting = workingCourses
          .filter((c) => c.trackLevel === track)
          .sort((a, b) => a.moduleOrderInTrack - b.moduleOrderInTrack);

        const insertOrder =
          targetTracks.length === 1 && typeof input.moduleOrderInTrack === 'number'
            ? Math.max(
                1,
                Math.min(
                  sameTrackExisting.length + 1,
                  Math.round(input.moduleOrderInTrack)
                )
              )
            : input.moduleOrderInTrack === 1
              ? 1
              : sameTrackExisting.length + 1;

        const created = createCourseFromAdminInput({
          ...baseNormalized,
          trackLevel: track,
          moduleOrderInTrack: insertOrder,
          idSuffix: targetTracks.length > 1 ? `p${trackIdx + 1}` : undefined,
          existingCourses: workingCourses,
        });

        sameTrackExisting.forEach((c, idx) => {
          const currentPos = idx + 1;
          const newPos = currentPos >= insertOrder ? currentPos + 1 : currentPos;
          if (newPos !== c.moduleOrderInTrack) {
            orderUpdates.set(c.id, { course: c, nextOrder: newPos });
          }
        });

        workingCourses = [
          ...workingCourses.map((c) => {
            const upd = orderUpdates.get(c.id);
            return upd ? { ...c, moduleOrderInTrack: upd.nextOrder } : c;
          }),
          created,
        ];
        createdList.push(created);
      });

      setCourses(workingCourses);

      setProgressStore((storePrev) => {
        const nextStore = { ...storePrev };
        createdList.forEach((created) => {
          nextStore[created.id] = {
            courseId: created.id,
            preTestResult: null,
            watchedSeconds: [],
            lastPositionSec: 0,
            checkpointPassed: false,
            postTestAttempts: [],
            notes: [],
          };
        });
        return nextStore;
      });

      if (!firebaseUser) return createdList;

      for (const { course, nextOrder } of orderUpdates.values()) {
        try {
          await setDoc(
            doc(db, 'courses', course.id),
            buildCourseFirestorePayload(course, firebaseUser.uid, {
              moduleOrderInTrack: nextOrder,
            })
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `courses/${course.id}`);
        }
      }

      for (const created of createdList) {
        try {
          await setDoc(
            doc(db, 'courses', created.id),
            buildCourseFirestorePayload(created, firebaseUser.uid)
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `courses/${created.id}`);
        }
      }

      return createdList;
    },
    [courses, firebaseUser, buildCourseFirestorePayload]
  );

  const handleDistributeCourseToTracks = useCallback(
    async (courseId: string, targetTracks: TrackLevel[]): Promise<Course[]> => {
      const source = courses.find((c) => c.id === courseId);
      if (!source || targetTracks.length === 0) return [];

      const uniqueTracks = Array.from(new Set(targetTracks));
      const tracksToAdd = uniqueTracks.filter(
        (t) =>
          t !== source.trackLevel &&
          !courses.some(
            (c) =>
              c.trackLevel === t &&
              c.code.toUpperCase() === source.code.toUpperCase() &&
              c.title.trim().toLowerCase() === source.title.trim().toLowerCase()
          )
      );
      if (tracksToAdd.length === 0) return [];

      return handleAddNewCourse({
        code: source.code,
        title: source.title,
        category: source.category,
        trackLevel: tracksToAdd[0],
        trackLevels: tracksToAdd,
        instructorName: source.instructorName,
        syllabusDurationLabel: source.syllabusDurationLabel,
        passingScore: source.passingScore,
        minWatchPercent: source.minWatchPercent,
        description: source.description,
        videoUrl: source.videoUrl,
        videoDurationSec: source.videoDurationSec,
      });
    },
    [courses, handleAddNewCourse]
  );

  const handleChangeCourseTrack = useCallback(
    async (courseId: string, nextTrack: TrackLevel) => {
      const target = courses.find((c) => c.id === courseId);
      if (!target || target.trackLevel === nextTrack) return;

      const sourceRemaining = courses
        .filter((c) => c.trackLevel === target.trackLevel && c.id !== courseId)
        .sort((a, b) => a.moduleOrderInTrack - b.moduleOrderInTrack);
      const targetExisting = courses
        .filter((c) => c.trackLevel === nextTrack)
        .sort((a, b) => a.moduleOrderInTrack - b.moduleOrderInTrack);

      const newOrderInTarget = targetExisting.length + 1;
      const sourceOrderMap = new Map<string, number>();
      sourceRemaining.forEach((c, idx) => sourceOrderMap.set(c.id, idx + 1));

      setCourses((prev) =>
        prev.map((c) => {
          if (c.id === courseId) {
            return {
              ...c,
              trackLevel: nextTrack,
              moduleOrderInTrack: newOrderInTarget,
            };
          }
          if (sourceOrderMap.has(c.id)) {
            return { ...c, moduleOrderInTrack: sourceOrderMap.get(c.id)! };
          }
          return c;
        })
      );

      if (!firebaseUser) return;
      try {
        await setDoc(
          doc(db, 'courses', target.id),
          buildCourseFirestorePayload(target, firebaseUser.uid, {
            trackLevel: nextTrack,
            moduleOrderInTrack: newOrderInTarget,
          })
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `courses/${target.id}`);
      }

      for (const item of sourceRemaining) {
        const nextOrder = sourceOrderMap.get(item.id) ?? item.moduleOrderInTrack;
        if (nextOrder === item.moduleOrderInTrack) continue;
        try {
          await setDoc(
            doc(db, 'courses', item.id),
            buildCourseFirestorePayload(item, firebaseUser.uid, {
              moduleOrderInTrack: nextOrder,
            })
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `courses/${item.id}`);
        }
      }
    },
    [courses, firebaseUser, buildCourseFirestorePayload]
  );

  const handleDeleteCustomCourse = useCallback(
    async (courseId: string) => {
      if (!courseId.startsWith('custom-')) return;
      const target = courses.find((c) => c.id === courseId);
      const remaining = courses.filter((c) => c.id !== courseId);
      setCourses(remaining);
      if (activeCourseId === courseId && remaining.length > 0) {
        setActiveCourseId(remaining[0].id);
      }
      if (!firebaseUser) return;
      try {
        await deleteDoc(doc(db, 'courses', courseId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `courses/${courseId}`);
      }
      if (target) {
        const sameTrackRemaining = remaining
          .filter((c) => c.trackLevel === target.trackLevel)
          .sort((a, b) => a.moduleOrderInTrack - b.moduleOrderInTrack);
        for (let idx = 0; idx < sameTrackRemaining.length; idx++) {
          const item = sameTrackRemaining[idx];
          const nextOrder = idx + 1;
          if (item.moduleOrderInTrack === nextOrder) continue;
          try {
            await setDoc(
              doc(db, 'courses', item.id),
              buildCourseFirestorePayload(item, firebaseUser.uid, {
                moduleOrderInTrack: nextOrder,
              })
            );
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `courses/${item.id}`);
          }
        }
      }
    },
    [courses, activeCourseId, firebaseUser, buildCourseFirestorePayload]
  );

  const handleUpdateWorkspacePolicy = useCallback(
    async (policy: WorkspacePolicy) => {
      setWorkspacePolicy(policy);
      if (!firebaseUser) return;
      try {
        await setDoc(doc(db, 'workspaceSettings', 'policy'), {
          ...policy,
          updatedAt: serverTimestamp(),
          updatedBy: firebaseUser.uid,
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.WRITE,
          'workspaceSettings/policy'
        );
      }
    },
    [firebaseUser]
  );

  const handleRegisterParticipant = useCallback(
    async (input: {
      email: string;
      displayName: string;
      division: string;
      assignedTrack: TrackLevel;
    }): Promise<{ ok: boolean; error?: string }> => {
      if (!firebaseUser) {
        return { ok: false, error: 'Sesi Admin tidak aktif.' };
      }
      const normalizedEmail = input.email.trim().toLowerCase();
      if (
        normalizedEmail.length < 3 ||
        normalizedEmail.length > 160 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
      ) {
        return { ok: false, error: 'Format email peserta tidak valid.' };
      }

      const inviteId = emailToInviteId(normalizedEmail);
      const alreadyExists = participantRegistrations.some(
        (item) => item.inviteId === inviteId || item.email === normalizedEmail
      );
      if (alreadyExists) {
        return {
          ok: false,
          error: `Email ${normalizedEmail} sudah terdaftar di daftar peserta training.`,
        };
      }

      const safeName = (
        input.displayName.trim() || normalizedEmail.split('@')[0]
      ).slice(0, 100);
      const safeDivision = (
        input.division.trim() || COMPANY_DEPARTMENTS[0]
      ).slice(0, 100);

      try {
        await setDoc(doc(db, 'participantRegistrations', inviteId), {
          inviteId,
          email: normalizedEmail,
          displayName: safeName,
          division: safeDivision,
          assignedTrack: input.assignedTrack,
          status: 'pending',
          registeredBy: firebaseUser.uid,
          activatedUid: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return { ok: true };
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.CREATE,
          `participantRegistrations/${inviteId}`
        );
      }
    },
    [firebaseUser, participantRegistrations]
  );

  const handleBulkRegisterParticipants = useCallback(
    async (
      entries: Array<{
        email: string;
        displayName: string;
        division: string;
        assignedTrack: TrackLevel;
      }>
    ): Promise<{ added: number; skipped: number }> => {
      if (!firebaseUser) return { added: 0, skipped: entries.length };
      const existingSet = new Set(
        participantRegistrations.map((p) => p.email.toLowerCase())
      );
      let added = 0;
      let skipped = 0;

      for (const entry of entries) {
        const normalizedEmail = entry.email.trim().toLowerCase();
        if (
          normalizedEmail.length < 3 ||
          normalizedEmail.length > 160 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
          existingSet.has(normalizedEmail)
        ) {
          skipped += 1;
          continue;
        }
        existingSet.add(normalizedEmail);
        const inviteId = emailToInviteId(normalizedEmail);
        const safeName = (
          entry.displayName.trim() || normalizedEmail.split('@')[0]
        ).slice(0, 100);
        const safeDivision = (
          entry.division.trim() || COMPANY_DEPARTMENTS[0]
        ).slice(0, 100);

        try {
          await setDoc(doc(db, 'participantRegistrations', inviteId), {
            inviteId,
            email: normalizedEmail,
            displayName: safeName,
            division: safeDivision,
            assignedTrack: entry.assignedTrack,
            status: 'pending',
            registeredBy: firebaseUser.uid,
            activatedUid: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          added += 1;
        } catch (err) {
          handleFirestoreError(
            err,
            OperationType.CREATE,
            `participantRegistrations/${inviteId}`
          );
        }
      }

      return { added, skipped };
    },
    [firebaseUser, participantRegistrations]
  );

  const handleUpdateRegistrationTrack = useCallback(
    async (inviteId: string, assignedTrack: TrackLevel) => {
      const target = participantRegistrations.find(
        (p) => p.inviteId === inviteId
      );
      try {
        await updateDoc(doc(db, 'participantRegistrations', inviteId), {
          assignedTrack,
          updatedAt: serverTimestamp(),
        });
        if (target?.activatedUid) {
          await updateDoc(doc(db, 'users', target.activatedUid), {
            currentTrack: assignedTrack,
            placementLevel: assignedTrack,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `participantRegistrations/${inviteId}`
        );
      }
    },
    [participantRegistrations]
  );

  const handleDeleteRegistration = useCallback(async (inviteId: string) => {
    try {
      await deleteDoc(doc(db, 'participantRegistrations', inviteId));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `participantRegistrations/${inviteId}`
      );
    }
  }, []);

  const lastProctorSyncRef = useRef<{ key: string; at: number }>({
    key: '',
    at: 0,
  });

  const handleSyncProctoringSnapshot = useCallback(
    async (
      courseId: string,
      courseCode: string,
      stage: 'pretest' | 'video' | 'posttest',
      snapshot: CameraScreenSnapshot
    ) => {
      if (!firebaseUser || !userProfile) return;
      if (
        !workspacePolicy.enableCameraMonitoring &&
        !workspacePolicy.enableScreenTracking
      ) {
        return;
      }
      const latestSnapTime = snapshot.snapshots[0]?.time ?? '';
      const sig = `${courseId}:${stage}:${snapshot.cameraActive}:${snapshot.cameraLabel}:${snapshot.screenShareActive}:${snapshot.fullscreenActive}:${snapshot.tabSwitchCount}:${snapshot.windowBlurCount}:${snapshot.awaySeconds}:${snapshot.snapshots.length}:${latestSnapTime}`;
      const now = Date.now();
      if (
        lastProctorSyncRef.current.key === sig &&
        now - lastProctorSyncRef.current.at < 2000
      ) {
        return;
      }
      lastProctorSyncRef.current = { key: sig, at: now };

      const rawId = `${firebaseUser.uid}_${courseId}_${stage}`;
      const logId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
      const safeCourseId = courseId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
      const safeEmail = (
        userProfile.email ||
        firebaseUser.email ||
        'peserta@kantor.local'
      ).slice(0, 160);
      const sanitizedSnapshots = snapshot.snapshots
        .slice(0, 10)
        .filter(
          (item) =>
            typeof item?.dataUrl === 'string' && item.dataUrl.length <= 45000
        )
        .map((item) => ({
          time: String(item.time || '').slice(0, 32),
          source: item.source === 'screen' ? 'screen' : 'camera',
          dataUrl: item.dataUrl,
        }));

      try {
        await setDoc(doc(db, 'proctoringLogs', logId), {
          logId,
          userId: firebaseUser.uid,
          userName: (userProfile.displayName || 'Peserta').slice(0, 100),
          userEmail: safeEmail,
          division: (userProfile.division || COMPANY_DEPARTMENTS[0]).slice(
            0,
            100
          ),
          courseId: safeCourseId,
          courseCode: (courseCode || 'MOD').slice(0, 32),
          stage,
          cameraActive: Boolean(snapshot.cameraActive),
          cameraLabel: (snapshot.cameraLabel || '').slice(0, 120),
          cameraMirror: Boolean(snapshot.cameraMirror),
          screenShareActive: Boolean(snapshot.screenShareActive),
          fullscreenActive: Boolean(snapshot.fullscreenActive),
          tabSwitchCount: Math.max(0, Math.min(1000, snapshot.tabSwitchCount)),
          windowBlurCount: Math.max(0, Math.min(1000, snapshot.windowBlurCount)),
          focusScorePct: Math.max(0, Math.min(100, snapshot.focusScorePct)),
          awaySeconds: Math.max(0, Math.min(36000, snapshot.awaySeconds)),
          integrityStatus: snapshot.integrityStatus,
          events: snapshot.events.slice(0, 30),
          snapshots: sanitizedSnapshots,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `proctoringLogs/${logId}`);
      }
    },
    [
      firebaseUser,
      userProfile,
      workspacePolicy.enableCameraMonitoring,
      workspacePolicy.enableScreenTracking,
    ]
  );

  const handleDeleteProctoringLog = useCallback(async (logId: string) => {
    try {
      await deleteDoc(doc(db, 'proctoringLogs', logId));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `proctoringLogs/${logId}`
      );
    }
  }, []);

  // Loading state while verifying Firebase session
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl px-8 py-6 text-center space-y-2">
          <div className="font-display text-lg font-bold text-slate-900">
            Lentera Akademi
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Memeriksa sesi akun kantor Anda...
          </p>
        </div>
      </div>
    );
  }

  // Dedicated Login Page Gate when unauthenticated
  if (!firebaseUser || !userProfile) {
    return (
      <LoginPage
        onLoginWithGoogle={handleLoginWithGoogle}
        authError={authError}
        isSigningIn={isSigningIn}
      />
    );
  }

  const isAdmin = userProfile.role === 'admin';
  const effectiveIsAdminNav = isAdmin && adminViewMode === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <TopBar
        activeTab={activeTab}
        isAdmin={effectiveIsAdminNav}
        onSelectTab={(tab) => {
          if (isAdmin && adminViewMode === 'dual') {
            setAdminViewMode('admin');
          }
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onPrimaryAction={() => {
          if (isAdmin && adminViewMode === 'dual') {
            setAdminViewMode('learner');
          }
          handleOpenCourse(activeCourseId);
        }}
        primaryActionLabel={
          activeTab === 'workspace' ? 'Kursus Aktif' : 'Lanjutkan Belajar'
        }
      />

      {/* Signed-in Corporate Account Strip */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            {isAdmin ? (
              <ShieldCheck
                className="w-3.5 h-3.5 text-blue-700 shrink-0"
                aria-hidden="true"
              />
            ) : (
              <UserIcon
                className="w-3.5 h-3.5 text-slate-500 shrink-0"
                aria-hidden="true"
              />
            )}
            <span className="font-semibold text-slate-900">
              {userProfile.displayName}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-700">{userProfile.email}</span>
            <span aria-hidden="true">·</span>
            <span>{userProfile.division}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                isAdmin ? 'font-semibold text-blue-700' : 'text-slate-600'
              }
            >
              {isAdmin ? 'Admin L&D' : 'Peserta'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            {isAdmin && (
              <div
                role="tablist"
                aria-label="Pilih mode tampilan User atau Admin"
                className="inline-flex items-center gap-1 p-0.5 bg-slate-100 border border-slate-200 rounded-lg"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={adminViewMode === 'dual'}
                  onClick={() => setAdminViewMode('dual')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    adminViewMode === 'dual'
                      ? 'bg-white text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2 Tampilan: User &amp; Admin
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={adminViewMode === 'learner'}
                  onClick={() => {
                    setAdminViewMode('learner');
                    if (activeTab === 'admin') {
                      setActiveTab('workspace');
                    }
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    adminViewMode === 'learner'
                      ? 'bg-white text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Halaman User
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={adminViewMode === 'admin'}
                  onClick={() => {
                    setAdminViewMode('admin');
                    setActiveTab('admin');
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    adminViewMode === 'admin'
                      ? 'bg-white text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Halaman Admin
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {isAdmin && adminViewMode === 'dual' ? (
          <DualRoleVerificationView
            currentUser={userProfile}
            courses={courses}
            progressStore={progressStore}
            activeCourse={activeCourse}
            activeProgress={activeProgress}
            activeStage={activeStage}
            placementLevel={placementLevel}
            unlockAllPreview={unlockAllPreview}
            workspacePolicy={workspacePolicy}
            proctoringLogs={proctoringLogs}
            onToggleUnlockPreview={() => setUnlockAllPreview((v) => !v)}
            onOpenPlacementModal={() => setShowPlacementModal(true)}
            onSelectCourse={handleSelectCourseInWorkspace}
            onSelectStage={setActiveStage}
            onSubmitPreTest={handleSubmitPreTest}
            onRecordWatchedSecond={handleRecordWatchedSecond}
            onPassCheckpoint={handlePassCheckpoint}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onSubmitPostTest={handleSubmitPostTest}
            onSyncProctoringSnapshot={(cId, cCode, stg, snap) =>
              void handleSyncProctoringSnapshot(cId, cCode, stg, snap)
            }
            onUpdateWorkspacePolicy={handleUpdateWorkspacePolicy}
            onDeleteProctoringLog={handleDeleteProctoringLog}
            onSwitchToFullUserView={() => {
              setAdminViewMode('learner');
              setActiveTab('workspace');
            }}
            onSwitchToFullAdminView={() => {
              setAdminViewMode('admin');
              setActiveTab('admin');
            }}
          />
        ) : (
          <>
            {activeTab === 'catalog' && (
              <CourseCatalog
                tracks={LEARNING_TRACKS}
                courses={courses}
                progressStore={progressStore}
                activeCourseId={activeCourseId}
                placementLevel={placementLevel}
                unlockAllPreview={unlockAllPreview}
                levelFlowMode={workspacePolicy.levelFlowMode}
                enforceModuleOrder={workspacePolicy.enforceModuleOrder}
                trackSequence={workspacePolicy.trackSequence}
                userAssignedTrack={placementLevel ?? userProfile.currentTrack}
                userProfile={userProfile}
                onOpenCourse={handleOpenCourse}
                onOpenPlacementModal={() => setShowPlacementModal(true)}
                onOpenArchitecture={() => setActiveTab('architecture')}
                onResetDemo={handleResetDemo}
              />
            )}

            {activeTab === 'workspace' && (
              <LearningWorkspace
                courses={courses}
                progressStore={progressStore}
                activeCourse={activeCourse}
                progress={activeProgress}
                activeStage={activeStage}
                placementLevel={placementLevel}
                unlockAllPreview={unlockAllPreview}
                isAdmin={userProfile.role === 'admin'}
                levelFlowMode={workspacePolicy.levelFlowMode}
                enforceModuleOrder={workspacePolicy.enforceModuleOrder}
                trackSequence={workspacePolicy.trackSequence}
                userAssignedTrack={placementLevel ?? userProfile.currentTrack}
                onToggleUnlockPreview={() => setUnlockAllPreview((v) => !v)}
                onOpenPlacementModal={() => setShowPlacementModal(true)}
                onSelectCourse={handleSelectCourseInWorkspace}
                onSelectStage={setActiveStage}
                onSubmitPreTest={handleSubmitPreTest}
                onRecordWatchedSecond={handleRecordWatchedSecond}
                onPassCheckpoint={handlePassCheckpoint}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                onSubmitPostTest={handleSubmitPostTest}
                defaultRecipientName={userProfile.displayName}
                workspacePolicy={workspacePolicy}
                onSyncProctoringSnapshot={(cId, cCode, stg, snap) =>
                  void handleSyncProctoringSnapshot(cId, cCode, stg, snap)
                }
              />
            )}

            {activeTab === 'analytics' && (
              <ScoreAnalytics
                tracks={LEARNING_TRACKS}
                courses={courses}
                progressStore={progressStore}
                userProfile={userProfile}
                userAssignedTrack={placementLevel ?? userProfile.currentTrack}
                onOpenCourse={handleOpenCourse}
              />
            )}

            {activeTab === 'admin' &&
              (effectiveIsAdminNav ? (
                <AdminDashboard
                  tracks={LEARNING_TRACKS}
                  courses={courses}
                  progressStore={progressStore}
                  placementLevel={placementLevel}
                  currentUser={userProfile}
                  registeredUsers={registeredUsers}
                  userProgressMap={userProgressMap}
                  participantRegistrations={participantRegistrations}
                  cohortLearners={cohortLearners}
                  proctoringLogs={proctoringLogs}
                  onDeleteProctoringLog={handleDeleteProctoringLog}
                  onOpenDualVerificationView={() => setAdminViewMode('dual')}
                  workspacePolicy={workspacePolicy}
                  onUpdateWorkspacePolicy={handleUpdateWorkspacePolicy}
                  onRegisterParticipant={handleRegisterParticipant}
                  onBulkRegisterParticipants={handleBulkRegisterParticipants}
                  onUpdateRegistrationTrack={handleUpdateRegistrationTrack}
                  onDeleteRegistration={handleDeleteRegistration}
                  onChangeUserRole={handleChangeUserRole}
                  onOverrideLearnerTrack={handleOverrideLearnerTrack}
                  onSendIntervention={handleSendIntervention}
                  onUpdateCourseThresholds={handleUpdateCourseThresholds}
                  onMoveCourseOrder={handleMoveCourseOrder}
                  onAddNewCourse={handleAddNewCourse}
                  onDistributeCourseToTracks={handleDistributeCourseToTracks}
                  onChangeCourseTrack={handleChangeCourseTrack}
                  onDeleteCustomCourse={handleDeleteCustomCourse}
                  onOpenCourseInWorkspace={handleOpenCourse}
                />
              ) : (
                <div className="max-w-[760px] mx-auto px-4 py-16">
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
                    <h2 className="font-display text-xl font-bold text-slate-900">
                      Akses Dibatasi untuk Admin L&amp;D
                    </h2>
                    <p className="text-sm text-slate-600">
                      {isAdmin
                        ? 'Anda sedang berada di pratinjau Halaman User. Pilih tab Halaman Admin di bilah atas untuk kembali ke Dashboard Admin.'
                        : 'Akun Anda saat ini terdaftar sebagai Peserta. Hubungi pengelola L&D perusahaan jika memerlukan akses Dashboard Admin.'}
                    </p>
                  </div>
                </div>
              ))}

            {activeTab === 'architecture' && (
              <ArchitectureBlueprint
                onTryWorkspace={() => handleOpenCourse(activeCourseId)}
                onOpenPlacementModal={() => setShowPlacementModal(true)}
              />
            )}
          </>
        )}
      </main>

      {showPlacementModal && (
        <PlacementTestModal
          currentPlacement={placementLevel}
          onClose={() => setShowPlacementModal(false)}
          onApplyPlacement={(lvl) => void handleApplyPlacement(lvl)}
        />
      )}

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            {workspacePolicy.companyName} — LMS Berjenjang (OJT, Junior, Middle, Senior)
          </span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className="hover:text-slate-900 transition-colors"
            >
              Paket &amp; Katalog
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className="hover:text-slate-900 transition-colors"
              >
                Dashboard Admin
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('architecture')}
              className="hover:text-slate-900 transition-colors"
            >
              Arsitektur Sistem
            </button>
            <button
              type="button"
              onClick={handleResetDemo}
              className="hover:text-slate-900 transition-colors"
            >
              Reset Data Demo
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
